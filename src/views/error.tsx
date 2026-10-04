import { Icon } from "../components/ui.js";

export function ErrorPage({ status, message }: { status: number; message: string }) {
  return <div class="layout-grid"><section class="panel col-span-full px-4 py-16 text-center md:px-6"><p class="eyebrow mb-4">HTTP {status}</p><h1>{message}</h1><p class="mt-4 text-muted">{status === 404 ? "URLを確認するか、ホームから目的のページを開いてください。" : "時間をおいて再試行してください。"}</p><a href="/" class="btn-primary mt-8"><Icon name="back" />ホームへ戻る</a></section></div>;
}
