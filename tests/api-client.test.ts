import test from "node:test";
import assert from "node:assert/strict";

const { requestJSON, ApiError } = await import(new URL("../../public/assets/js/api.js", import.meta.url).href);

test("JSON応答とヘッダー", async t => {
  t.mock.method(globalThis, "fetch", async (_url: string, options: RequestInit) => {
    assert.equal(new Headers(options.headers).get("accept"), "application/json");
    assert.equal(new Headers(options.headers).get("content-type"), "application/json");
    return Response.json({ data: "ok" });
  });
  assert.deepEqual(await requestJSON("/api/demo/validate", { headers: { "Content-Type": "application/json" } }), { data: "ok" });
});
test("APIの項目エラーを保持", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: { code: "VALIDATION_ERROR", message: "入力不正", fields: { name: "必須" } } }, { status: 422 }));
  await assert.rejects(requestJSON("/api/demo/validate"), (error: any) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 422);
    assert.equal(error.fields.name, "必須");
    return true;
  });
});
test("JSON以外のエラー応答で内部HTMLを露出しない", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response("<html>PRIVATE</html>", { status: 502 }));
  await assert.rejects(requestJSON("/api/demo/items"), (error: any) => {
    assert.equal(error.code, "INVALID_RESPONSE");
    assert.doesNotMatch(error.message, /PRIVATE/);
    return true;
  });
});
test("ネットワーク切断を再試行可能なエラーに変換", async t => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  await assert.rejects(requestJSON("/api/demo/items"), /通信に失敗しました/);
});
test("10秒で通信を中断", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis, "fetch", (_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
    options.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  }));
  const pending = requestJSON("/api/demo/items");
  const assertion = assert.rejects(pending, /タイムアウト/);
  t.mock.timers.tick(10000);
  await assertion;
});
