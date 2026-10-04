import type { PropsWithChildren } from "hono/jsx";
import type { DemoItem } from "../demo/data.js";

export function Icon({ name, class: className = "" }: { name: string; class?: string }) {
  return <svg class={`icon ${className}`} aria-hidden="true" focusable="false"><use href={`/assets/icons.svg#${name}`} /></svg>;
}

export function ThemeSwitch({ labeled = false }: { labeled?: boolean }) {
  return <div class={`theme-switch ${labeled ? "theme-switch-wide" : ""}`} role="radiogroup" aria-label="表示テーマ">
    <span class="theme-switch-thumb" aria-hidden="true"></span>
    {[
      ["system", "monitor", "システム"], ["light", "sun", "ライト"], ["dark", "moon", "ダーク"]
    ].map(([mode, icon, label]) => <button type="button" class="theme-dot" role="radio" data-theme-opt={mode} aria-label={label} title={label} aria-checked="false" tabindex={-1} disabled><Icon name={icon} />{labeled && <span>{label}</span>}</button>)}
  </div>;
}

export function Panel({ title, children, action, class: className = "" }: PropsWithChildren<{ title: string; action?: unknown; class?: string }>) {
  return <section class={`panel ${className}`}><div class="panel-header"><h2>{title}</h2>{action}</div>{children}</section>;
}

export function StatusBadge({ status }: { status: DemoItem["status"] }) {
  return <span class={status === "ready" ? "badge-ready" : "badge"}><span aria-hidden="true">●</span><span>{status === "ready" ? "準備完了" : "下書き"}</span></span>;
}

export function ItemRows({ items }: { items: readonly DemoItem[] }) {
  return <>{items.length ? items.map(item => <tr key={item.id}>
    <td><a class="link" href={`/examples/${item.id}`}>{item.name}</a><p class="max-w-sm text-sm text-muted">{item.description}</p></td>
    <td class="text-muted">{item.category}</td>
    <td><StatusBadge status={item.status} /></td>
    <td class="text-sm tabular-nums text-muted">{item.updatedAt}</td>
  </tr>) : <tr><td colspan={4} class="empty-state">一致するサンプルがありません。検索条件を変更してください。</td></tr>}</>;
}

export function ItemsList({ items }: { items: readonly DemoItem[] }) {
  return <><div class="table-region hidden overflow-x-auto md:block" tabindex={0} role="region" aria-label="サンプル一覧の表"><table class="data-table"><caption class="sr-only">固定デモデータのサンプル一覧</caption>
    <thead><tr><th scope="col">名前</th><th scope="col">カテゴリ</th><th scope="col">状態</th><th scope="col">更新日</th></tr></thead>
    <tbody id="items-body"><ItemRows items={items} /></tbody>
  </table></div><ul id="items-cards" class="md:hidden" aria-label="サンプル一覧">{items.length ? items.map(item => <li class="item-card" key={item.id}>
    <div class="item-card-heading"><h3><a class="link" href={`/examples/${item.id}`}>{item.name}</a></h3><div class="item-card-status"><span class="sr-only">状態：</span><StatusBadge status={item.status} /></div></div>
    <p class="mt-1 text-sm text-muted">{item.description}</p>
    <dl class="item-card-meta"><div><dt class="sr-only">カテゴリ</dt><dd>{item.category}</dd></div><div><dt class="sr-only">更新日</dt><dd class="tabular-nums"><time datetime={item.updatedAt}>{item.updatedAt}</time></dd></div></dl>
  </li>) : <li class="empty-state">一致するサンプルがありません。検索条件を変更してください。</li>}</ul></>;
}
