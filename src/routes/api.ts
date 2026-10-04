import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { bodyLimit } from "hono/body-limit";
import type { AppEnv } from "../types.js";
import { findItems, normalizeSearchQuery } from "../demo/data.js";
import { validateDemoInput } from "../demo/validation.js";

export const api = new Hono<AppEnv>();

api.get("/health", c => c.json({ status: "ok" }));
api.get("/demo/items", c => c.json({ data: findItems(normalizeSearchQuery(c.req.query("q"))) }));
api.use("/demo/validate", bodyLimit({
  maxSize: 8 * 1024,
  onError: () => { throw new HTTPException(413, { message: "入力サイズが大きすぎます。" }); }
}));
api.post("/demo/validate", async c => {
  const contentType = c.req.header("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new HTTPException(415, { message: "Content-Typeにはapplication/jsonを指定してください。" });
  }
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    throw new HTTPException(400, { message: "JSONの形式が正しくありません。" });
  }
  const result = validateDemoInput(input);
  if (!result.ok) {
    return c.json({ error: { code: "VALIDATION_ERROR", message: "入力内容を確認してください。", fields: result.fields } }, 422);
  }
  return c.json({ data: result.data, persisted: false });
});
