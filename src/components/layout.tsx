import type { PropsWithChildren } from "hono/jsx";
import { raw } from "hono/html";
import { site } from "../config.js";
import { Icon, ThemeSwitch } from "./ui.js";

type LayoutProps = PropsWithChildren<{
  title: string;
  current?: "dashboard" | "examples" | "settings";
  appName?: string;
  description?: string;
  demoScript?: boolean;
  breadcrumb?: string;
}>;

const navigation = [
  { key: "dashboard", href: "/", label: "ホーム" },
  { key: "examples", href: "/examples", label: "サンプル一覧" },
  { key: "settings", href: "/settings", label: "設定・UIガイド" }
] as const;

export function Layout({ title, current, appName = site.name, description = site.description, demoScript, breadcrumb, children }: LayoutProps) {
  const links = navigation.map(item => <a class="nav-link" href={item.href} aria-current={current === item.key ? "page" : undefined}><span>{item.label}</span></a>);
  return <>{raw("<!doctype html>")}<html lang="ja">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#7086BD" />
      <meta name="description" content={description} />
      <title>{title} | {appName}</title>
      <script src="/assets/js/theme.js"></script>
      <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" />
      <link rel="stylesheet" href="/assets/app.css" />
      <script src="/assets/js/shell.js" defer></script>
      {demoScript && <script src="/assets/js/demo.js" type="module"></script>}
    </head>
    <body>
      <a class="fixed -top-24 left-4 z-[60] rounded-md bg-surface p-3 text-link focus:top-4" href="#main-content">本文へ移動</a>
      <header class="border-b border-border bg-surface">
        <div class="app-container flex min-h-[52px] flex-wrap items-center justify-between gap-3">
          <a href="/" class="flex min-h-[44px] min-w-0 items-center gap-3 font-bold" aria-label={`${appName} ホーム`}>
            <span class="truncate">{appName}</span>
          </a>
          <div class="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2 lg:gap-5">
            <nav id="desktop-nav" aria-label="メインナビゲーション" class="hidden min-w-0 flex-wrap items-center gap-1 md:flex">{links}</nav>
            <div id="header-theme" class="hidden md:block"><ThemeSwitch /></div>
            <button class="menu-button md:hidden" type="button" id="menu-toggle" aria-label="メニューを開く" aria-expanded="false" aria-controls="mobile-nav" hidden><Icon name="menu" /><span>メニュー</span></button>
          </div>
        </div>
        <nav id="mobile-nav" aria-label="モバイルナビゲーション" class="overflow-hidden md:hidden" aria-hidden="true" hidden>
          <div class="app-container space-y-1 border-t border-border py-4">
          {links}
          <div id="menu-theme" class="flex items-center justify-between gap-3 border-t border-border px-3 pt-4"><span class="text-sm text-muted">表示テーマ</span><ThemeSwitch /></div>
          </div>
        </nav>
        <noscript><nav aria-label="ページ一覧" class="app-container flex flex-wrap gap-2 pb-3 md:hidden">{links}</nav></noscript>
      </header>
      <div class="app-container">
        <main id="main-content" class="py-8 sm:py-10" tabindex={-1}>
          {(!current || breadcrumb) && <nav aria-label="パンくず" class="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted"><a href="/" class="underline underline-offset-4 hover:text-link">ホーム</a><span aria-hidden="true">/</span>{breadcrumb && <><a href="/examples" class="underline underline-offset-4 hover:text-link">サンプル一覧</a><span aria-hidden="true">/</span></>}<span aria-current="page">{title}</span></nav>}
          {children}
        </main>
        <footer class="flex flex-col items-center gap-2 border-t border-border py-6 text-center text-sm text-muted md:flex-row md:justify-between md:gap-4 md:text-left">
          <span>© 2026 {site.copyrightHolder}</span>
          <div class="flex max-w-full flex-wrap justify-center gap-x-4 gap-y-2 md:flex-nowrap md:justify-end">
            <a href={site.homepageUrl} class="underline underline-offset-4 hover:text-link">Homepage</a>
            <a href={site.aboutUrl} class="underline underline-offset-4 hover:text-link">about.ogatomo</a>
            <a href={site.githubUrl} class="underline underline-offset-4 hover:text-link">View on GitHub</a>
          </div>
        </footer>
      </div>
    </body>
  </html></>;
}
