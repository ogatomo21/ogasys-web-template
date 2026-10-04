# 開発方針

- Cloudflare Workers + Hono JSX + Vanilla JavaScript + Tailwind CSS v3.4を維持する。
- React、Vite、Tailwind v4、UIライブラリは必要性と依頼がない限り導入しない。
- npmとNode.js 24を使う。Windowsの手順はPowerShellで記載する。
- ページは通常のリンクで遷移する。クライアントJSは操作が必要な画面だけで読み込む。
- HTMLのユーザー入力はJSXでエスケープする。ブラウザー側はtextContentを使う。
- ブランド色とsemantic tokenを使い、ライト・ダークの両方を確認する。
- Primary（#7086BD）背景の文字・アイコンは、基本 #FFFFFF（text-on-primary）を使う。
- UIフォントはGoogle FontsのNoto Sans JP（400/500/600/700）を使用する。コード・JSON等は等幅フォントを維持する。
- iOS 15 / Android 9を基準に機能を選ぶ。focus-visible等にはフォールバックを用意する。
- DB・認証は初期構成にない。デモの検証フォームは保存処理として扱わない。
- APIエラーは `{ error: { code, message, fields? } }` 形式。内部例外や秘密情報を応答に含めない。
- 環境変数はc.envから取得し、秘密情報は.dev.varsまたはWrangler Secretsに置く。
- コメントは非自明な理由だけに付ける。不要な抽象化・依存追加を避ける。
- 入力検証、変換、APIエラー等はnode:testで検証する。
- 変更後は `npm run release:check`。UI変更は375pxとPC、キーボード、3テーマを確認する。
- ローカル検証と実機・本番検証を区別して報告する。
- GitHub公開、Cloudflareの実デプロイ、リモートDBの変更は明示的な依頼がある場合だけ行う。
