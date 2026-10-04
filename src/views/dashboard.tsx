import { demoItems } from "../demo/data.js";
import { Icon, Panel, StatusBadge } from "../components/ui.js";

export function Dashboard() {
  return <>
    <div class="page-heading"><div class="flex flex-wrap items-center gap-3"><h1>ホーム</h1><span class="badge">デモ</span></div><p>サンプルの一覧、入力フォーム、表示設定を試せます。</p></div>
    <div class="layout-grid"><Panel class="col-span-full lg:col-span-8" title="サンプル" action={<a href="/examples" class="link text-sm">一覧を開く<Icon name="arrow" /></a>}>
      <div class="divide-y divide-border">{demoItems.map(item => <a href={`/examples/${item.id}`} class="row-link group flex items-center gap-4 px-4 py-4 hover:bg-surface-alt md:px-6">
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-alt text-link"><Icon name={item.id === "brand" ? "palette" : item.id === "api" ? "code" : "folder"} /></span>
        <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-x-3 gap-y-1"><h3 class="font-bold group-hover:text-link">{item.name}</h3><StatusBadge status={item.status} /></div><p class="mt-1 text-sm leading-6 text-muted">{item.description}</p></div>
        <Icon name="arrow" class="text-muted" />
      </a>)}</div>
      <p class="border-t border-border px-4 py-4 text-sm text-muted md:px-6">表示している内容は固定のデモデータです。</p>
    </Panel>
    <div class="layout-grid col-span-full lg:col-span-4 lg:grid-cols-4">
      <section class="panel panel-body col-span-full md:col-span-4"><h2 class="flex items-center gap-3"><Icon name="code" class="text-link" />フォームを試す</h2><p class="mt-4 text-sm leading-6 text-muted">入力内容をAPIで検証し、結果を表示します。データは保存されません。</p><a href="/examples#demo-form" class="btn-primary mt-4">入力フォームへ<Icon name="arrow" /></a></section>
      <section class="panel panel-body col-span-full md:col-span-4"><h2 class="flex items-center gap-3"><Icon name="settings" class="text-link" />表示を設定する</h2><p class="mt-4 text-sm leading-6 text-muted">テーマの切り替えと、ボタン・フォーム・通知の見本を確認できます。</p><a href="/settings" class="btn-secondary mt-4">設定・UIガイドへ<Icon name="arrow" /></a></section>
    </div></div>
  </>;
}
