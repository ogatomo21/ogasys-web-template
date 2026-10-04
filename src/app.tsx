import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import type { AppEnv } from "./types.js";
import { api } from "./routes/api.js";
import { pages } from "./routes/pages.js";
import { Layout } from "./components/layout.js";
import { ErrorPage } from "./views/error.js";

export function createApp() {
  const app = new Hono<AppEnv>();
  app.use("*", requestId());
  app.use("*", secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"], connectSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"], baseUri: ["'none'"], formAction: ["'self'"], frameAncestors: ["'none'"]
    },
    referrerPolicy: "strict-origin-when-cross-origin"
  }));
  app.use("*", async (c, next) => {
    c.header("X-Request-Id", c.get("requestId"));
    c.header("Cache-Control", "no-store");
    await next();
  });
  app.route("/api", api);
  app.route("/", pages);
  app.notFound(c => {
    if (c.req.path === "/api" || c.req.path.startsWith("/api/")) {
      return c.json({ error: { code: "NOT_FOUND", message: "APIが見つかりません。" } }, 404);
    }
    // 存在しないアセットにはHTMLを返さず、MIMEの取り違えを防ぎます。
    if (c.req.path.startsWith("/assets/")) return c.text("Not Found", 404);
    return c.html(<Layout title="ページが見つかりません" appName={c.env?.APP_NAME}><ErrorPage status={404} message="ページが見つかりません" /></Layout>, 404);
  });
  app.onError((error, c) => {
    const known = error instanceof HTTPException && error.status < 500;
    const status = known ? error.status : 500;
    const message = known ? error.message : "サーバーでエラーが発生しました。";
    if (!known) console.error(`[${c.get("requestId")}] Unhandled error`, error);
    if (c.req.path === "/api" || c.req.path.startsWith("/api/")) {
      const codes: Record<number, string> = { 400: "INVALID_JSON", 413: "PAYLOAD_TOO_LARGE", 415: "UNSUPPORTED_MEDIA_TYPE" };
      return c.json({ error: { code: known ? codes[status] ?? "REQUEST_ERROR" : "INTERNAL_ERROR", message } }, status);
    }
    return c.html(<Layout title={message} appName={c.env?.APP_NAME}><ErrorPage status={status} message={message} /></Layout>, status);
  });
  return app;
}
