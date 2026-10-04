import { ApiError, requestJSON } from "./api.js";

const reloadButton = document.getElementById("reload-items");
const loading = document.getElementById("items-loading");
const listError = document.getElementById("items-error");
const tbody = document.getElementById("items-body");
const cards = document.getElementById("items-cards");
const search = document.getElementById("search");
const activeQuery = search.defaultValue;

function renderItems(items) {
  const fragment = document.createDocumentFragment();
  const cardFragment = document.createDocumentFragment();
  if (!items.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "empty-state";
    cell.textContent = "一致するサンプルがありません。検索条件を変更してください。";
    row.append(cell);
    fragment.append(row);
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = cell.textContent;
    cardFragment.append(empty);
  }
  for (const item of items) {
    const row = document.createElement("tr");
    const name = document.createElement("td");
    const link = document.createElement("a");
    link.className = "link";
    link.href = `/examples/${encodeURIComponent(item.id)}`;
    link.textContent = item.name;
    const description = document.createElement("p");
    description.className = "max-w-sm text-sm text-muted";
    description.textContent = item.description;
    name.append(link, description);
    const category = document.createElement("td");
    category.className = "text-muted";
    category.textContent = item.category;
    const status = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = item.status === "ready" ? "badge-ready" : "badge";
    const dot = document.createElement("span");
    dot.setAttribute("aria-hidden", "true");
    dot.textContent = "●";
    const badgeLabel = document.createElement("span");
    badgeLabel.textContent = item.status === "ready" ? "準備完了" : "下書き";
    badge.append(dot, badgeLabel);
    status.append(badge);
    const date = document.createElement("td");
    date.className = "text-sm tabular-nums text-muted";
    date.textContent = item.updatedAt;
    row.append(name, category, status, date);
    fragment.append(row);

    const card = document.createElement("li");
    card.className = "item-card";
    const heading = document.createElement("h3");
    heading.append(link.cloneNode(true));
    const header = document.createElement("div");
    header.className = "item-card-heading";
    const cardStatus = document.createElement("div");
    cardStatus.className = "item-card-status";
    const statusLabel = document.createElement("span");
    statusLabel.className = "sr-only";
    statusLabel.textContent = "状態：";
    cardStatus.append(statusLabel, badge.cloneNode(true));
    header.append(heading, cardStatus);
    const summary = description.cloneNode(true);
    summary.className = "mt-1 text-sm text-muted";
    const metadata = document.createElement("dl");
    metadata.className = "item-card-meta";
    for (const [label, content] of [["カテゴリ", item.category], ["更新日", item.updatedAt]]) {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      term.className = "sr-only";
      term.textContent = label;
      const detail = document.createElement("dd");
      if (label === "更新日") {
        detail.className = "tabular-nums";
        const time = document.createElement("time");
        time.dateTime = content;
        time.textContent = content;
        detail.append(time);
      } else {
        detail.textContent = content;
      }
      group.append(term, detail);
      metadata.append(group);
    }
    card.append(header, summary, metadata);
    cardFragment.append(card);
  }
  tbody.replaceChildren(fragment);
  cards.replaceChildren(cardFragment);
  document.getElementById("items-count").textContent = `${items.length}件`;
}

reloadButton.hidden = false;
reloadButton.addEventListener("click", async () => {
  reloadButton.disabled = true;
  reloadButton.setAttribute("aria-busy", "true");
  loading.hidden = false;
  listError.hidden = true;
  try {
    const body = await requestJSON(`/api/demo/items?q=${encodeURIComponent(activeQuery)}`);
    if (!Array.isArray(body?.data)) throw new ApiError("サーバーの応答形式が正しくありません。");
    renderItems(body.data);
  } catch (error) {
    listError.textContent = `${error.message} 再取得前の一覧を表示しています。`;
    listError.hidden = false;
  } finally {
    loading.hidden = true;
    reloadButton.disabled = false;
    reloadButton.removeAttribute("aria-busy");
  }
});

const form = document.getElementById("demo-form");
const submit = document.getElementById("validate-button");
const status = document.getElementById("form-status");
const result = document.getElementById("form-result");
const resultHeading = document.getElementById("form-result-heading");
submit.disabled = false;
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (submit.disabled) return;
  submit.disabled = true;
  form.setAttribute("aria-busy", "true");
  for (const name of ["name", "description"]) {
    document.getElementById(`${name}-error`).hidden = true;
    form.elements.namedItem(name).removeAttribute("aria-invalid");
  }
  status.className = "notice mb-4";
  status.textContent = "入力内容を検証しています…";
  result.textContent = "処理中…";
  try {
    const data = new FormData(form);
    const body = await requestJSON("/api/demo/validate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.get("name"), description: data.get("description") })
    });
    if (!body?.data || body.persisted !== false) throw new ApiError("サーバーの応答形式が正しくありません。");
    status.className = "notice notice-success mb-4";
    status.textContent = "検証に成功しました。データは保存していません。";
    result.textContent = JSON.stringify(body, null, 2);
    if (!window.matchMedia("(min-width: 768px)").matches &&
        (resultHeading.getBoundingClientRect().top < 0 || status.getBoundingClientRect().bottom > window.innerHeight)) {
      resultHeading.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  } catch (error) {
    status.className = "notice notice-error mb-4";
    status.textContent = error.message;
    result.textContent = JSON.stringify({ error: { code: error.code, message: error.message, fields: error.fields } }, null, 2);
    let firstInvalid;
    for (const name of ["name", "description"]) {
      if (!error.fields?.[name]) continue;
      const input = form.elements.namedItem(name);
      input.setAttribute("aria-invalid", "true");
      const fieldError = document.getElementById(`${name}-error`);
      fieldError.textContent = error.fields[name];
      fieldError.hidden = false;
      firstInvalid ??= input;
    }
    firstInvalid?.focus();
  } finally {
    form.removeAttribute("aria-busy");
    submit.disabled = false;
  }
});
