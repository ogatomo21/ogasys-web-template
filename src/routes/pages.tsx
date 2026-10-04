import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { Layout } from "../components/layout.js";
import { Dashboard } from "../views/dashboard.js";
import { Examples } from "../views/examples.js";
import { Detail } from "../views/detail.js";
import { Settings } from "../views/settings.js";
import { ErrorPage } from "../views/error.js";
import { demoItems, findItems, normalizeSearchQuery } from "../demo/data.js";

export const pages = new Hono<AppEnv>();

pages.get("/", c => c.html(<Layout title="ホーム" current="dashboard" appName={c.env?.APP_NAME}><Dashboard /></Layout>));
pages.get("/examples", c => {
  const query = normalizeSearchQuery(c.req.query("q"));
  return c.html(<Layout title="サンプル一覧" current="examples" appName={c.env?.APP_NAME} demoScript><Examples items={findItems(query)} query={query} /></Layout>);
});
pages.get("/examples/:id", c => {
  const item = demoItems.find(value => value.id === c.req.param("id"));
  if (!item) {
    return c.html(<Layout title="ページが見つかりません" appName={c.env?.APP_NAME}><ErrorPage status={404} message="ページが見つかりません" /></Layout>, 404);
  }
  return c.html(<Layout title={item.name} current="examples" appName={c.env?.APP_NAME} breadcrumb="examples"><Detail item={item} /></Layout>);
});
pages.get("/settings", c => c.html(<Layout title="設定・UIガイド" current="settings" appName={c.env?.APP_NAME}><Settings /></Layout>));
