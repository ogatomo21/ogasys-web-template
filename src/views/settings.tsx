import { Icon, Panel, StatusBadge, ThemeSwitch } from "../components/ui.js";

const colors = [
  ["primary", "#7086BD", "bg-primary"], ["secondary", "#435071", "bg-secondary"],
  ["tertiary", "#E2E6F1", "bg-tertiary"], ["danger", "#EB2323", "bg-danger"],
  ["info", "#237AEB", "bg-info"], ["success", "#28B84A", "bg-success"],
  ["text", "#333333", "bg-text"], ["white", "#FFFFFF", "bg-white"]
];

export function Settings() {
  return <>
    <div class="page-heading"><h1>設定・UIガイド</h1><p>表示テーマを変更できます。共通UIの見本もまとめています。</p></div>
    <div class="layout-grid">
    <Panel class="col-span-full md:col-span-4" title="表示テーマ"><div class="panel-body"><p class="mb-4 text-muted">このブラウザーに設定を保存します。システム設定にも追従できます。</p><ThemeSwitch labeled /><p id="theme-status" class="mt-4 text-sm text-muted" role="status">テーマ設定を読み込んでいます。</p><noscript><p class="field-help">テーマ変更にはJavaScriptが必要です。</p></noscript></div></Panel>
    <Panel class="col-span-full md:col-span-4 lg:col-span-8" title="ブランドカラー"><div class="panel-body"><div class="color-grid">{colors.map(([name, hex, className]) => <div class="color-sample"><div class={`h-10 w-10 shrink-0 rounded-md border border-border ${className}`} aria-hidden="true"></div><div><p class="font-mono text-sm font-medium">{name}</p><p class="mt-1 font-mono text-sm text-muted">{hex}</p></div></div>)}</div><p class="mt-4 text-sm leading-6 text-muted">背景や文字色はテーマに合わせて変わります。</p></div></Panel>
    <Panel class="col-span-full md:col-span-4 lg:col-span-6" title="ボタンと状態"><div class="panel-body"><div class="flex flex-wrap gap-3"><a href="/examples" class="btn-primary"><Icon name="folder" />一覧を開く</a><a href="/examples" class="btn-secondary">戻る</a><button type="button" class="btn-danger" disabled>削除（無効）</button><button class="btn-secondary" disabled>無効</button></div><div class="mt-6 flex flex-wrap gap-3"><StatusBadge status="ready" /><StatusBadge status="draft" /><span class="badge">デモ環境</span></div></div></Panel>
    <Panel class="col-span-full md:col-span-4 lg:col-span-6" title="フォーム部品"><div class="panel-body space-y-4"><div><label class="field-label" for="preview-input">テキスト入力</label><input class="field" id="preview-input" aria-describedby="preview-input-help" /><p id="preview-input-help" class="field-help">例：新しいプロジェクト。入力中も説明を確認できます。</p></div><div><label class="field-label" for="preview-select">セレクト</label><select class="field" id="preview-select"><option>オプション A</option><option>オプション B</option></select></div><label class="flex min-h-[44px] items-center gap-3"><input type="checkbox" class="h-5 w-5 shrink-0 accent-primary" />チェックボックス</label></div></Panel>
    <Panel class="col-span-full" title="通知・読み込み・空状態"><div class="panel-body grid gap-4"><div class="notice notice-success"><Icon name="check" /><p>入力内容を確認しました。</p></div><div class="notice notice-error"><Icon name="info" /><p>通信に失敗しました。再試行してください。</p></div><div class="notice"><Icon name="refresh" class="spinner" /><p>データを取得しています…</p></div><div class="rounded-md border border-dashed border-border p-8 text-center"><Icon name="folder" class="mb-3 text-muted" /><h3 class="font-medium">データがありません</h3><p class="mt-2 text-sm text-muted">データが追加されると、ここに表示します。</p></div></div></Panel>
    </div>
  </>;
}
