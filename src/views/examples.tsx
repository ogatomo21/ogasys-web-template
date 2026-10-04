import type { DemoItem } from "../demo/data.js";
import { Icon, ItemsList, Panel } from "../components/ui.js";

export function Examples({ items, query }: { items: readonly DemoItem[]; query: string }) {
  return <>
    <div class="page-heading"><h1>サンプル一覧</h1><p>検索と入力フォームのサンプルです。データは保存されません。</p></div>
    <div class="layout-grid"><Panel class="col-span-full" title="デモデータ" action={<span class="badge" id="items-count" role="status">{items.length}件</span>}>
      <div class="panel-body">
        <form method="get" action="/examples" class="flex flex-wrap items-end gap-4" id="search-form">
          <div class="w-full min-w-0 md:w-auto md:flex-1"><label class="field-label" for="search">名前・カテゴリで検索</label><input class="field" id="search" name="q" type="search" value={query} aria-describedby="search-help search-condition" /></div>
          <button type="submit" class="btn-secondary"><Icon name="search" />検索</button>
          {query && <a href="/examples" class="btn-secondary" id="clear-search"><Icon name="close" />検索解除</a>}
          <button type="button" class="btn-secondary" id="reload-items" hidden><Icon name="refresh" />再読み込み</button>
        </form>
        <p id="search-help" class="field-help">例：API、デザイン。検索には先頭200文字を使用します。</p>
        <p id="search-condition" class="field-help">表示中：{query ? `「${query}」の検索結果` : "全件"}</p>
        <p id="items-loading" class="mt-4 flex items-center gap-2 text-muted" role="status" hidden><Icon name="refresh" class="spinner" />データを取得しています…</p><div id="items-error" class="notice notice-error mt-4" role="alert" hidden></div>
      </div>
      <ItemsList items={items} />
    </Panel>
    <Panel class="col-span-full" title="入力フォーム" action={<span class="badge">保存なし</span>}><div class="panel-body layout-grid">
      <form id="demo-form" class="col-span-full scroll-mt-6 md:col-span-4 lg:col-span-8" novalidate>
        <div class="mb-6">
          <label for="name" class="field-label">名前 <span class="text-sm text-muted">必須</span></label>
          <input id="name" class="field" name="name" type="text" required autocomplete="off" aria-describedby="name-help name-error" />
          <p id="name-help" class="field-help">1〜80文字。例：新しいプロジェクト</p>
          <p id="name-error" class="field-error" hidden></p>
        </div>
        <div class="mb-6">
          <label for="description" class="field-label">説明 <span class="text-sm text-muted">任意</span></label>
          <textarea id="description" class="field" name="description" rows={4} aria-describedby="description-help description-error"></textarea>
          <p id="description-help" class="field-help">500文字以内。例：プロジェクトの目的や機能</p>
          <p id="description-error" class="field-error" hidden></p>
        </div>
        <button type="submit" id="validate-button" class="btn-primary w-full md:w-auto" disabled><Icon name="check" /><span>入力内容を検証</span></button>
        <p class="field-help">入力内容を確認するだけで、保存はしません。</p>
        <noscript><p class="notice mt-4">このフォーム例にはJavaScriptが必要です。</p></noscript>
      </form>
      <div class="col-span-full md:col-span-4"><h3 id="form-result-heading" class="mb-3 scroll-mt-4 font-medium">APIレスポンス</h3><div id="form-status" class="notice mb-4" role="status" aria-live="polite">フォームを送信すると、検証結果が表示されます。</div><pre class="code-block" id="form-result" tabindex={0} aria-label="APIレスポンスのJSON"><code>POST /api/demo/validate</code></pre></div>
    </div></Panel></div>
  </>;
}
