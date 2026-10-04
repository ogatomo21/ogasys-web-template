export type DemoItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "ready" | "draft";
  updatedAt: string;
};

export const demoItems: readonly DemoItem[] = [
  { id: "brand", name: "ブランドとテーマ", description: "OgaTomo Systemsのカラーと3種類のテーマを確認できます。", category: "デザイン", status: "ready", updatedAt: "2026-10-04" },
  { id: "api", name: "APIとフォーム", description: "同一オリジンのAPI通信と、サーバー側の入力検証を試せます。", category: "開発", status: "ready", updatedAt: "2026-10-04" },
  { id: "next", name: "次のアプリケーション", description: "このデモを差し替えて、プロジェクト固有の機能を追加してください。", category: "プロジェクト", status: "draft", updatedAt: "2026-10-03" }
];

export function normalizeSearchQuery(query = ""): string {
  return query.slice(0, 200);
}

export function findItems(query: string): readonly DemoItem[] {
  const term = query.trim().toLocaleLowerCase("ja-JP");
  return demoItems.filter(item => `${item.name} ${item.description} ${item.category}`.toLocaleLowerCase("ja-JP").includes(term));
}
