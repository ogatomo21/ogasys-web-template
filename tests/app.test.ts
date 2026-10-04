import test from "node:test";
import assert from "node:assert/strict";
import { HTTPException } from "hono/http-exception";
import { jsx } from "hono/jsx";
import { createApp } from "../src/app.js";
import { Layout } from "../src/components/layout.js";
import { ItemsList } from "../src/components/ui.js";
import { site } from "../src/config.js";

for (const path of ["/", "/examples", "/examples/brand", "/settings"]) {
  test(`HTML: ${path}`, async () => {
    const response = await createApp().request(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    const html = await response.text();
    assert.match(html, /^<!doctype html>/);
    assert.match(html, /<html lang="ja">/);
    assert.match(html, /デモ/);
    assert.match(html, /\/assets\/app\.css/);
    assert.ok(html.includes(` | ${site.name}</title>`));
    assert.ok(html.includes(`aria-label="${site.name} ホーム"`));
    assert.match(html, /<meta name="theme-color" content="#7086BD"\s*\/>/);
    assert.ok(html.indexOf("/assets/js/theme.js") < html.indexOf("/assets/app.css"));
  });
}

test("APP_NAMEを指定した環境ではアプリ名を上書き", async () => {
  const html = await (await createApp().request("/", {}, { APP_NAME: "環境別アプリ名" })).text();
  assert.match(html, /<title>ホーム \| 環境別アプリ名<\/title>/);
  assert.match(html, /aria-label="環境別アプリ名 ホーム"/);
});

test("Workerの応答にセキュリティヘッダーとリクエストIDを付与", async () => {
  const response = await createApp().request("/api/health");
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.match(response.headers.get("x-request-id") ?? "", /^[\w-]{20,}$/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("content-security-policy") ?? "", /script-src 'self'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /style-src 'self' https:\/\/fonts\.googleapis\.com(?:;|$)/);
  assert.match(response.headers.get("content-security-policy") ?? "", /font-src 'self' https:\/\/fonts\.gstatic\.com(?:;|$)/);
});

test("共通レイアウト内の非同期JSXを描画できる", async () => {
  const app = createApp();
  const AsyncContent = async () => {
    await Promise.resolve();
    return jsx("p", null, "ASYNC_COMPLETE");
  };
  app.get("/__test/async", c => c.html(jsx(Layout, { title: "Async", children: jsx(AsyncContent, {}) }).toString()));
  const response = await app.request("/__test/async");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<p>ASYNC_COMPLETE<\/p>/);
  assert.doesNotMatch(html, /\[object Promise\]/);
});

test("APIの検索と空結果", async () => {
  const app = createApp();
  const all = await (await app.request("/api/demo/items")).json() as { data: unknown[] };
  assert.equal(all.data.length, 3);
  const filtered = await (await app.request("/api/demo/items?q=API")).json() as { data: { id: string }[] };
  assert.deepEqual(filtered.data.map(item => item.id), ["api"]);
  const empty = await (await app.request("/api/demo/items?q=missing-item")).json();
  assert.deepEqual(empty, { data: [] });
});

for (const [query, expectedIds] of [
  ["API".padEnd(199, " ") + "x", []],
  ["API".padEnd(200, " "), ["api"]],
  ["API".padEnd(200, " ") + "brand", ["api"]],
  ["ブランド".padEnd(200, " ") + "API", ["brand"]]
] as const) {
  test(`検索の先頭200文字をHTMLとAPIで共通使用: ${query.length}文字 / ${expectedIds.join(",") || "空結果"}`, async () => {
    const app = createApp();
    const parameter = encodeURIComponent(query);
    const response = await app.request(`/api/demo/items?q=${parameter}`);
    assert.equal(response.status, 200);
    const body = await response.json() as { data: { id: string }[] };
    assert.deepEqual(body.data.map(item => item.id), [...expectedIds]);
    const html = await (await app.request(`/examples?q=${parameter}`)).text();
    assert.ok(html.includes(`value="${query.slice(0, 200)}"`));
    for (const id of ["api", "brand", "next"]) {
      const links = html.match(new RegExp(`href="/examples/${id}"`, "g")) ?? [];
      assert.equal(links.length, expectedIds.some(expected => expected === id) ? 2 : 0);
    }
  });
}

test("HTMLの検索結果も空状態を表示", async () => {
  const html = await (await createApp().request("/examples?q=missing-item")).text();
  assert.equal(html.match(/一致するサンプルがありません/g)?.length, 2);
  assert.doesNotMatch(html, /href="\/examples\/brand"/);
});

test("GET検索の結果を表とカードに同じ内容で描画", async () => {
  const html = await (await createApp().request("/examples?q=API")).text();
  assert.equal(html.match(/href="\/examples\/api"/g)?.length, 2);
  assert.doesNotMatch(html, /href="\/examples\/(brand|next)"/);
  assert.match(html, /id="items-count" role="status">1件/);
  assert.equal(html.match(/>2026-10-04</g)?.length, 2);
});

test("表とカードのデモ文字列をJSXでエスケープ", async () => {
  const payload = '<img src=x onerror="alert(1)">';
  const html = await jsx(ItemsList, { items: [{ id: "safe", name: payload, description: payload, category: payload, status: "draft", updatedAt: "2026-01-01" }] }).toString();
  assert.doesNotMatch(html, /<img|onerror="/);
  assert.equal(html.match(/&lt;img/g)?.length, 6);
});

test("JSXでクエリとアプリ名をエスケープ", async () => {
  const payload = '\"><script>alert("xss")</script>';
  const response = await createApp().request(`/examples?q=${encodeURIComponent(payload)}`, {}, { APP_NAME: payload });
  const html = await response.text();
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&quot;/);
});

for (const path of ["/missing", "/examples/missing"]) {
  test(`HTMLの404: ${path}`, async () => {
    const response = await createApp().request(path);
    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    assert.match(await response.text(), /ページが見つかりません/);
  });
}
for (const path of ["/api", "/api/missing"]) {
  test(`APIの404: ${path}`, async () => {
    const response = await createApp().request(path);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: { code: "NOT_FOUND", message: "APIが見つかりません。" } });
  });
}

test("存在しないアセットにHTMLを返さない", async () => {
  const response = await createApp().request("/assets/missing.js");
  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type") ?? "", /text\/plain/);
});

function post(body: string, contentType = "application/json") {
  return createApp().request("/api/demo/validate", { method: "POST", headers: { "Content-Type": contentType }, body });
}

test("入力を検証・正規化し、非保存を明示", async () => {
  const response = await post(JSON.stringify({ name: "  新しいアプリ  ", description: "  概要  " }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { name: "新しいアプリ", description: "概要" }, persisted: false });
});

test("入力エラーに項目ごとの理由を含める", async () => {
  const response = await post(JSON.stringify({ name: " ", description: 42 }));
  assert.equal(response.status, 422);
  const body = await response.json() as { error: { code: string; fields: Record<string, string> } };
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.deepEqual(Object.keys(body.error.fields), ["name", "description"]);
});

test("不正JSONは400", async () => {
  const response = await post("{");
  assert.equal(response.status, 400);
  assert.equal((await response.json() as { error: { code: string } }).error.code, "INVALID_JSON");
});

test("Content-Type不正は415", async () => {
  const response = await post("name=test", "application/x-www-form-urlencoded");
  assert.equal(response.status, 415);
  assert.equal((await response.json() as { error: { code: string } }).error.code, "UNSUPPORTED_MEDIA_TYPE");
});

test("8KiBを超える本文は413", async () => {
  const response = await post(JSON.stringify({ name: "n", description: "a".repeat(9000) }));
  assert.equal(response.status, 413);
  assert.equal((await response.json() as { error: { code: string } }).error.code, "PAYLOAD_TOO_LARGE");
});

for (const path of ["/__test/throws", "/api/__test/throws"]) {
  test(`内部例外の情報を応答に含めない: ${path}`, async t => {
    t.mock.method(console, "error", () => {});
    const app = createApp();
    app.get(path, () => { throw new Error("TEST_PRIVATE_SECRET"); });
    const response = await app.request(path);
    assert.equal(response.status, 500);
    assert.ok(response.headers.get("x-request-id"));
    const body = await response.text();
    assert.doesNotMatch(body, /TEST_PRIVATE_SECRET|stack|app\.test/);
    if (path.startsWith("/api/")) assert.equal(JSON.parse(body).error.code, "INTERNAL_ERROR");
    else assert.match(body, /サーバーでエラー/);
  });
}

test("HTTPExceptionの500でも内部メッセージを公開しない", async t => {
  t.mock.method(console, "error", () => {});
  const app = createApp();
  app.get("/api/__test/throws", () => { throw new HTTPException(500, { message: "TEST_PRIVATE_SECRET" }); });
  const response = await app.request("/api/__test/throws");
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /TEST_PRIVATE_SECRET/);
});
