import test, { before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "output", "ui-tests");
const baseURL = "http://127.0.0.1:8788";
let server, browser, context, page;
let serverLog = "";

before(async () => {
  await mkdir(output, { recursive: true });
  // 使用中の開発サーバーを誤って検証・停止しないよう、専用ポートを占有済みなら失敗する。
  try {
    await fetch(baseURL + "/api/health", { signal: AbortSignal.timeout(1000) });
    throw new Error("UIテスト用の8788ポートが使用中です。");
  } catch (error) {
    if (error.message.includes("使用中")) throw error;
  }
  server = spawn(process.execPath, [join(root, "node_modules/wrangler/bin/wrangler.js"), "dev", "--local", "--ip", "127.0.0.1", "--port", "8788", "--persist-to", join(output, "state")], {
    cwd: root, windowsHide: true,
    env: { ...process.env, WRANGLER_SEND_METRICS: "false", XDG_CONFIG_HOME: join(output, "config"), WRANGLER_LOG_PATH: join(output, "wrangler-logs") },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const collect = data => { serverLog = (serverLog + data).slice(-20000); };
  server.stdout.on("data", collect);
  server.stderr.on("data", collect);
  const deadline = Date.now() + 45000;
  while (true) {
    if (server.exitCode !== null || Date.now() > deadline) throw new Error("Wranglerの起動に失敗しました。\n" + serverLog);
    try {
      const response = await fetch(baseURL + "/api/health", { signal: AbortSignal.timeout(1000) });
      if (response.ok) break;
    } catch { /* Workerの起動待ち */ }
    await delay(250);
  }
  // 非表示・オーバーレイ式のスクロールバーでは、今回の幅ずれを検出できない。
  browser = await chromium.launch({ channel: process.env.UI_BROWSER_CHANNEL || "chromium", ignoreDefaultArgs: ["--hide-scrollbars"], args: ["--disable-features=OverlayScrollbar"] });
}, { timeout: 60000 });

after(async () => {
  try { await browser?.close(); }
  finally {
    if (server?.pid && server.exitCode === null) {
      if (process.platform === "win32") await promisify(execFile)("taskkill", ["/pid", String(server.pid), "/T", "/F"]).catch(() => {});
      else {
        server.kill("SIGTERM");
        await Promise.race([new Promise(resolve => server.once("exit", resolve)), delay(3000)]);
        if (server.exitCode === null) server.kill("SIGKILL");
      }
    }
    await writeFile(join(output, "server.log"), serverLog);
  }
});

beforeEach(async () => {
  context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light", reducedMotion: "reduce" });
  // CIを外部のフォント配信の稼働状況に依存させない。
  await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
  page = await context.newPage();
  page.setDefaultTimeout(10000);
});

afterEach(async t => {
  try {
    if (page && !page.isClosed()) await page.screenshot({ path: join(output, t.name.replace(/[^a-zA-Z0-9-]/g, "-") + ".png"), fullPage: true });
  } finally { await context?.close(); }
});

async function navigate(path) {
  await page.goto(baseURL + path);
  await page.waitForFunction(() => document.querySelector("#menu-toggle").hidden === false);
}

async function collection() {
  return page.evaluate(() => ({
    table: Array.from(document.querySelectorAll("#items-body tr")).map(row => Array.from(row.querySelectorAll("td")).map(cell => cell.textContent)),
    cards: Array.from(document.querySelectorAll(".item-card")).map(card => [card.querySelector("h3").textContent + card.querySelector("p").textContent, card.querySelector("dd").textContent, card.querySelector(".badge, .badge-ready").textContent, card.querySelector("time").textContent]),
    count: document.querySelector("#items-count").textContent
  }));
}

test("page-width-and-responsive-grid", { timeout: 45000 }, async () => {
  for (const width of [320, 375, 640, 767, 768, 1023, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const positions = [];
    for (const route of ["/", "/examples", "/settings"]) {
      await navigate(route);
      positions.push(await page.evaluate(() => {
        const rect = element => { const { x, width } = element.getBoundingClientRect(); return { x, width }; };
        return {
          main: rect(document.querySelector("main")), header: rect(document.querySelector("header > div")), footer: rect(document.querySelector("footer")),
          columns: getComputedStyle(document.querySelector("main .layout-grid")).gridTemplateColumns.split(" ").length,
          scrollbar: innerWidth - document.documentElement.clientWidth,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      }));
    }
    for (const data of positions) {
      assert.ok(data.scrollbar > 0, "通常のスクロールバーで検証する");
      assert.equal(data.overflow, false, `${width}px はみ出し`);
      assert.equal(data.columns, width < 768 ? 4 : width < 1024 ? 8 : 12);
      assert.deepEqual(data.main, positions[0].main, `${width}px ページ間の幅`);
      assert.deepEqual(data.header, positions[0].header, `${width}px ヘッダー位置`);
      assert.deepEqual(data.footer, data.main);
    }
    if (width < 768) {
      assert.equal(await page.locator(".theme-switch-wide button").first().evaluate(el => getComputedStyle(el).flexDirection), "column");
    }
  }
});

test("search-reload-clear-and-recovery", async () => {
  await page.setViewportSize({ width: 375, height: 900 });
  await navigate("/examples");
  await page.locator("#search").fill("API");
  await page.locator('#search-form button[type="submit"]').click();
  await page.waitForURL("**/examples?q=API");
  const original = await collection();
  assert.equal(original.count, "1件");
  assert.deepEqual(original.table, original.cards);
  await page.locator("#search").fill("デザイン");
  const response = page.waitForResponse(url => url.url().includes("/api/demo/items?"));
  await page.locator("#reload-items").click();
  assert.equal(new URL((await response).url()).searchParams.get("q"), "API");
  await page.waitForFunction(() => !document.querySelector("#reload-items").disabled);
  assert.deepEqual(await collection(), original);
  assert.equal(new URL(page.url()).searchParams.get("q"), "API");
  assert.match(await page.locator("#search-condition").textContent(), /API/);
  await page.setViewportSize({ width: 1440, height: 900 });
  assert.deepEqual(await collection(), original);
  await page.route("**/api/demo/items?*", route => route.abort());
  await page.locator("#reload-items").click();
  await page.locator("#items-error").waitFor({ state: "visible" });
  assert.deepEqual(await collection(), original);
  await page.unroute("**/api/demo/items?*");
  await page.locator("#reload-items").click();
  await page.waitForFunction(() => !document.querySelector("#reload-items").disabled);
  assert.ok(await page.locator("#items-error").isHidden());
  await page.locator("#clear-search").click();
  await page.waitForURL(baseURL + "/examples");
  assert.equal((await collection()).count, "3件");
  assert.equal(await page.locator("#search").inputValue(), "");
  await page.locator("#search").fill("missing-item");
  await page.locator('#search-form button[type="submit"]').click();
  await page.waitForURL("**/examples?q=missing-item");
  assert.equal(await page.locator("#items-count").textContent(), "0件");
  assert.equal(await page.locator("#items-body").textContent(), await page.locator("#items-cards").textContent());
});

test("mobile-cards-preserve-long-content-and-tab-order", async () => {
  await page.setViewportSize({ width: 375, height: 900 });
  await navigate("/examples");
  const normal = await collection();
  assert.deepEqual(normal.cards, normal.table);
  assert.ok(await page.locator("#items-cards").isVisible());
  assert.ok(await page.locator(".data-table").isHidden());
  await page.locator("#search").focus();
  const focus = [];
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    focus.push(await page.evaluate(() => ({ table: !!document.activeElement.closest(".data-table"), cards: !!document.activeElement.closest("#items-cards") })));
  }
  assert.ok(focus.some(state => state.cards));
  assert.ok(focus.every(state => !state.table));
  const item = { id: "long", name: "長い名前".repeat(20) + "UnbrokenASCII".repeat(20), description: "https://example.com/" + "A".repeat(500), category: "Category".repeat(30), status: "ready", updatedAt: "2026-10-04" };
  await page.route("**/api/demo/items?*", route => route.fulfill({ json: { data: [item] } }));
  await page.locator("#reload-items").click();
  await page.waitForFunction(() => document.querySelector("#items-count").textContent === "1件");
  const long = await collection();
  assert.deepEqual(long.cards, long.table);
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
    assert.equal(await page.evaluate(() => Array.from(document.querySelectorAll(".item-card a, .item-card p, .item-card dd, .item-card-status, .data-table a")).filter(el => el.getClientRects().length && el.scrollWidth > el.clientWidth + 2).length), 0);
  }
});

test("focus-rings-remain-inside-clipped-panels", async () => {
  await navigate("/");
  await page.keyboard.press("Tab");
  await page.locator(".row-link").first().focus();
  const row = await page.locator(".row-link").first().evaluate(el => ({ visible: el.matches(":focus-visible"), style: getComputedStyle(el).outlineStyle, offset: getComputedStyle(el).outlineOffset }));
  assert.equal(row.visible, true);
  assert.equal(row.style, "solid");
  assert.equal(row.offset, "-3px");
  await navigate("/examples");
  await page.keyboard.press("Tab");
  await page.locator(".table-region").focus();
  assert.equal(await page.locator(".table-region").evaluate(el => getComputedStyle(el).outlineOffset), "-3px");
});

test("themes-and-mobile-menu-keyboard", async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await navigate("/settings");
  for (const mode of ["system", "light", "dark"]) {
    await page.locator(`main [data-theme-opt="${mode}"]`).click();
    await page.reload();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), mode);
  }
  await page.locator('main [data-theme-opt="dark"]').focus();
  await page.keyboard.press("Home");
  assert.equal(await page.locator('main [data-theme-opt="system"]').getAttribute("aria-checked"), "true");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator('main [data-theme-opt="light"]').getAttribute("aria-checked"), "true");
  await page.locator("#menu-toggle").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#menu-toggle span").textContent(), "閉じる");
  assert.equal(await page.locator("#menu-toggle use").getAttribute("href"), "/assets/icons.svg#close");
  await page.keyboard.press("Escape");
  assert.ok(await page.locator("#mobile-nav").isHidden());
  assert.equal(await page.evaluate(() => document.activeElement.id), "menu-toggle");
});

test("successful-mobile-form-scrolls-only-when-result-is-outside-view", async () => {
  await page.addInitScript(() => {
    window.resultScrolls = [];
    const scroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      if (this.id === "form-result-heading") window.resultScrolls.push(options);
      return scroll.call(this, options);
    };
  });
  await page.setViewportSize({ width: 375, height: 480 });
  await navigate("/examples");
  await page.locator("#name").fill("UI test");
  await page.locator("#description").fill("保存しないフォーム");
  await page.evaluate(() => {
    const button = document.querySelector("#validate-button").getBoundingClientRect();
    window.scrollTo(0, scrollY + button.bottom - innerHeight + 10);
  });
  await page.locator("#validate-button").click();
  await page.waitForFunction(() => window.resultScrolls.length === 1);
  assert.deepEqual(await page.evaluate(() => window.resultScrolls[0]), { block: "start", behavior: "auto" });
  assert.ok(await page.locator("#form-result-heading").evaluate(el => el.getBoundingClientRect().top >= 0));
  await page.setViewportSize({ width: 375, height: 900 });
  await page.evaluate(() => {
    window.resultScrolls = [];
    const button = document.querySelector("#validate-button").getBoundingClientRect();
    window.scrollTo(0, scrollY + button.top - 100);
  });
  await page.locator("#validate-button").click();
  await page.waitForFunction(() => !document.querySelector("#validate-button").disabled);
  assert.equal(await page.evaluate(() => window.resultScrolls.length), 0, "結果が見える場合は移動しない");
  await page.locator("#name").fill("");
  await page.locator("#validate-button").click();
  await page.locator("#name-error").waitFor({ state: "visible" });
  assert.equal(await page.evaluate(() => document.activeElement.id), "name");
  assert.equal(await page.evaluate(() => window.resultScrolls.length), 0, "入力エラーで結果へ移動しない");
  await page.setViewportSize({ width: 1440, height: 900 });
  await navigate("/examples");
  await page.locator("#name").fill("Desktop test");
  await page.locator("#validate-button").click();
  await page.waitForFunction(() => document.querySelector("#form-status").textContent.includes("検証に成功"));
  assert.equal(await page.evaluate(() => window.resultScrolls.length), 0, "PCでは移動しない");
});

test("no-javascript-get-search-and-clear", async () => {
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  try {
    await noJS.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
    const tab = await noJS.newPage();
    await tab.goto(baseURL + "/examples");
    await tab.locator("#search").fill("API");
    await tab.locator('#search-form button[type="submit"]').click();
    await tab.waitForURL("**/examples?q=API");
    assert.equal(await tab.locator("#items-cards a").count(), 1);
    assert.ok(await tab.locator("#reload-items").isHidden());
    await tab.locator("#clear-search").click();
    await tab.waitForURL(baseURL + "/examples");
    assert.equal(await tab.locator("#items-cards a").count(), 3);
  } finally { await noJS.close(); }
});
