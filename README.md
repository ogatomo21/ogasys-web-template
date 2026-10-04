# OgaTomo Systems Webアプリテンプレート

Hono + Tailwind CSS **v3.4** + Cloudflare Workersで作る、軽量なWebアプリの土台です。
サーバーでHono JSXからHTMLを生成し、必要な操作だけVanilla JavaScriptで処理します。

管理画面、3種類のテーマ、一覧・詳細、API通信、入力検証、テスト、GitHub Actionsを収録しています。
DB・ログインは含まれません。すべて固定のデモデータで、フォームを送っても保存されません。

## 起動

前提：**Node.js 24** と npm。CloudflareアカウントやAPIキーはローカル開発には不要です。

PowerShellでプロジェクトのルートに移動して実行します。

```powershell
Set-Location C:\ogatomo\codex_temp\ogasys-web-template
npm ci
npm run dev
```

[http://127.0.0.1:8787](http://127.0.0.1:8787) を開きます。停止は `Ctrl+C`。
CSSは起動時とソース変更時に再生成されます。ブラウザーを再読み込みして確認してください。
`public/assets/app.css` は生成物なので直接編集しません。

## GitHub Templateとして使う

1. この内容を自分のGitHubリポジトリに登録します。初回公開時の候補名は `ogatomo21/ogasys-web-template` です。
2. リポジトリの **Settings → General → Template repository** を有効にします。
3. 新しいアプリを作るときは **Use this template → Create a new repository** で複製します。
4. 複製したプロジェクトで以下を変更します。

| 設定 | 変更する内容 |
|---|---|
| `package.json` の `name` | npmのプロジェクト名 |
| `wrangler.jsonc` の `name` | 公開するWorker名。他のアプリと重複させない |
| `src/config.ts` | アプリ名（`site.name`）、説明文、著作権名、フッターのリンク先（`homepageUrl`・`aboutUrl`・`githubUrl`） |
| `wrangler.jsonc` の `vars.APP_NAME`（任意） | 環境ごとに画面タイトル・ヘッダーの名前を上書きする場合だけ追加 |
| `public/assets/favicon.svg` | アプリのアイコン |
| READMEとLICENSE | プロジェクトの説明・必要な著作権表示 |

プロジェクト名の変更後は `npm install --package-lock-only` でlockfileも更新します。
共通npmパッケージへの依存はなく、複製後は個別に変更できます。

## 開発コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | Wranglerのローカルサーバー。CSSも生成・監視 |
| `npm run build:css` | Tailwind CSSを単独で生成 |
| `npm run check` | TypeScriptの型検査 |
| `npm test` | テスト用にコンパイルし、Node標準の `node:test` を実行 |
| `npm run test:ui` | 専用のローカルWorkerとChromiumでUI回帰テスト |
| `npm run build` | CSS生成とWorkerのdry-run。リモートへの変更なし |
| `npm run release:check` | 型検査・テスト・本番ビルド |
| `npm run deploy` | `release:check`・UIテスト成功後、明示的にCloudflareへデプロイ |

`dist/` はWorkerのdry-run出力、`.test-build/` はテスト用の生成物です。
WranglerがWorkerのバンドルを担当するので、Viteや別のバンドラーは必要ありません。

### ブラウザーテスト

初回だけブラウザーを取得し、プロジェクトルートで実行します。

```powershell
npx playwright install chromium
npm run test:ui
```

`tests/ui.test.mjs` はNode標準の `node:test` と開発依存のPlaywrightを使用します。
8788ポートにテスト専用のWranglerを起動し、終了時にそのプロセスを停止します。ポートが使用中の場合は失敗します。
通常開発用の8787ポートとは分けています。スクリーンショットとサーバーログはGit管理対象外の `output/ui-tests/` に保存します。
スクロールバーを表示するChromiumで、ページ間の幅ずれ・320〜1440pxのグリッド・検索と再取得・スマホカード・フォーカス・テーマ・メニュー・フォーム・JavaScript無効時の検索を検証します。
外部フォント配信の障害にCIを依存させないよう、テストではGoogle Fontsへの通信を遮断します。実際のNoto Sans JPでの見た目は開発ブラウザーでも確認してください。
`release:check` はブラウザーの事前取得が不要な検証を維持し、UIテストは別コマンド・別CIジョブで実行します。

取得したChromiumが環境の制限等で起動できない場合は、インストール済みのChromeを指定できます。

```powershell
$env:UI_BROWSER_CHANNEL = 'chrome'
npm run test:ui
Remove-Item Env:UI_BROWSER_CHANNEL
```

このWindows環境では同梱Chromiumの起動が `spawn UNKNOWN` で失敗したため、Chromeで7件のUIテストを確認しています。
CIはUbuntu上の同梱Chromiumを使用します。参考：[Playwright Library](https://playwright.dev/docs/library)。

## ディレクトリ構成

```text
src/
  index.ts               Workerのエントリーポイント
  app.tsx                middleware・エラー処理・ルートの組み立て
  config.ts              サイトの既定表示設定
  types.ts               HonoのBindingsとVariables
  routes/                ページ・APIのルート
  views/                 各画面のHono JSX
  components/            共通レイアウト・UI
  demo/                  削除・差し替え可能なデモデータと入力検証
  styles.css             CSS変数・Tailwind・共通部品
public/
  assets/js/             Vanilla JavaScript
  assets/icons.svg       必要なアイコンだけのSVGスプライト
  assets/favicon.svg     アプリアイコン
  _headers               静的アセット用のヘッダー
tests/                   node:testのテスト
.github/workflows/       CIと手動デプロイ
```

HTMLはHonoが返し、CSS・JS・SVGはWorkers Static Assetsが配信します。
`/api` と `/api/*` は必ずWorkerを通ります。その他のURLはアセットに一致しなければWorkerへ渡されます。
SPAフォールバックは使わず、存在しないページ・API・アセットは404を返します。

## ページとAPI

| URL | 内容 |
|---|---|
| `/` | サンプルと各機能への入口（デモ） |
| `/examples?q=API` | 検索できる一覧とフォーム例 |
| `/examples/brand` | サンプルの詳細 |
| `/settings` | テーマ・カラー・共通UIの見本 |
| `GET /api/health` | `{ "status": "ok" }` |
| `GET /api/demo/items?q=API` | `{ "data": [...] }` |
| `POST /api/demo/validate` | 名前と説明を検証。保存しない |

### APIを試す

ローカルサーバーが起動している状態で、別のPowerShellから実行できます。

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/health

$body = @{ name = '新しいアプリ'; description = 'プロジェクトの概要' } | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:8787/api/demo/validate `
  -Method Post -ContentType 'application/json; charset=utf-8' `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

検証APIは、前後の空白を除いて名前1〜80文字、説明0〜500文字を受け付けます。
説明は省略できます。文字数はJavaScriptの `length`（UTF-16コード単位）で数え、本文上限は8KiBです。
成功時は `{ "data": { "name": "...", "description": "..." }, "persisted": false }` を返します。

エラー形式は次のとおりです。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容を確認してください。",
    "fields": { "name": "名前は1〜80文字で入力してください。" }
  }
}
```

不正JSONは400、サイズ超過は413、Content-Type不正は415、項目エラーは422、未定義APIは404です。
予期しない例外は500と共通メッセージに変換し、スタックや内部メッセージは返しません。
Workerの応答には `X-Request-Id` を付け、内部例外のサーバーログとの照合に使います。

### ページを追加する

`src/views/` にHono JSXの画面を追加し、`src/routes/pages.tsx` に登録します。

```tsx
pages.get('/about', c => c.html(
  <Layout title="このアプリについて" appName={c.env?.APP_NAME}>
    <h1>このアプリについて</h1>
    <p class="mt-4 text-muted">アプリの説明文です。</p>
  </Layout>
));
```

メニュー項目は `src/components/layout.tsx` の `navigation` へ追加し、`current` の型も更新します。
画面専用のブラウザーJSは `public/assets/js/` に置き、必要なページだけで読み込みます。
JSX設定の `react-jsx` はコンパイル方式の名称です。Reactの依存はなく、`hono/jsx` を使います。

### APIを追加する

`src/routes/api.ts` に追加します。このルーターは `/api` にマウントされています。

```ts
api.get('/version', c => c.json({ version: '1.0.0' }));
```

ブラウザーからは `public/assets/js/api.js` の `requestJSON()` を使えます。
APIエラーと項目エラーを保持し、通信失敗・不正応答・10秒のタイムアウトを処理します。
送信中はボタンを無効化し、失敗時は入力と再取得前の一覧を維持します。

### デモを削除する

`src/demo/`、デモ用views、`demo.js`、関連するテストを削除・差し替えし、ページとAPIのルートを更新します。
ホームのサンプル・「デモ」表示・詳細画面もアプリの実態に合わせて変更してください。
レイアウト、テーマ、CSS、API通信ヘルパー、エラー処理、CIはそのまま再利用できます。

## カラー・テーマ・フォント

ブランドカラーは `tailwind.config.js` でsemantic名を定義しています。

| 名前 | 値 |
|---|---|
| `primary` | `#7086BD` |
| `secondary` | `#435071` |
| `tertiary` | `#E2E6F1` |
| `danger` | `#EB2323` |
| `info` | `#237AEB` |
| `success` | `#28B84A` |
| `text` | `#333333` |
| `white` | `#FFFFFF` |

背景・カード・通常文字は `bg-background`、`bg-surface`、`text-foreground`、`text-muted`、`border-border` を使用します。
入力欄と副ボタンの境界には `border-control-border` を使用し、カードの境界線と区別します。
リンクの文字色は `text-link`、リンク部品は `link`。固定の `text-text` はライト専用色なので通常本文には使いません。
ライト／ダークの値は `src/styles.css` の `:root` と `:root.dark` で変更できます。
Tailwindクラスは完全な文字列で書き、`'bg-' + color` のような動的生成を避けます。

Primary（#7086BD）背景の文字・アイコンは、基本 #FFFFFF（`text-on-primary`）を使用します。
この組み合わせは約3.60:1で、ブランド指定として通常文字の4.5:1基準の例外です。
本文・補助文字・リンク・Dangerボタンは通常状態で4.5:1以上をテストします。
入力欄の境界色はライト・ダークとも背景との3:1以上をテストします。
テーマ設定のlocalStorageキーは `ogasys-theme`。変更する場合は `theme.js` と関連テストを揃えます。
localStorageが拒否された場合はページ内で切り替えでき、システム変更と他タブの設定変更にも追従します。

UIフォントは **Noto Sans JP** に統一しています。Google Fontsから400・500・600・700の太さを読み込みます。
読み込みURLとpreconnectは `src/components/layout.tsx`、フォント指定は `tailwind.config.js` の `fontFamily.sans` にあります。
`display=swap` を指定し、読み込み中や通信失敗時はsans-serifで表示します。コード・JSON・カラー値等は等幅フォントです。
CSPは `src/app.tsx` で、CSS用に `fonts.googleapis.com`、フォント用に `fonts.gstatic.com` を許可しています。
preconnect用にもこの2つの接続先を許可しています。フォントを変更する場合は読み込みURL・Tailwind設定・CSPを揃えます。
フォントファイルの同梱やnpm依存の追加は不要です。[Google Fonts CSS API](https://developers.google.com/fonts/docs/css2)を使用しています。
同梱SVGはこのテンプレート用に作成したものです。MIT Licenseに含まれます。

## 環境変数・DB・認証の追加

公開してよい値は `wrangler.jsonc` の `vars`、ローカル秘密情報は `.dev.vars` に置きます。

```powershell
Copy-Item .dev.vars.example .dev.vars
```

`.dev.vars` はGit管理対象外です。本番の秘密情報は `npx wrangler secret put SECRET_NAME` で登録します。
Workerコードでは `process.env` ではなく `c.env` を使用します。

### D1を追加する場合

実際にDBが必要になった段階で、以下を行います。

1. `npx wrangler d1 create my-app-db` でD1を作成し、返された設定を `wrangler.jsonc` に追加します。このコマンドはリモートにDBを作成します。
2. bindingを `DB`、`migrations_dir` を `migrations` に設定します。
3. `npx wrangler types --env-interface CloudflareBindings` を実行し、生成した型ファイルをtsconfigのincludeへ追加します。`src/types.ts` のBindingsを `CloudflareBindings` に変更します。
4. `npx wrangler d1 migrations create DB initial` でSQLを作成します。
5. `npx wrangler d1 migrations apply DB --local` でローカルDBに適用し、まずローカルで検証します。
6. APIから `c.env.DB.prepare('SELECT ... WHERE id = ?').bind(id)` のようにバインド変数で操作します。

リモートへのマイグレーションはデプロイとは別に管理し、既存DBは変更前にバックアップします。
生成した型をプロジェクトのincludeへ追加すると、`check` とテスト用コンパイルの両方で使用できます。

### 認証を追加する場合

プロバイダーを要件に合わせて選び、認証ルートと保護対象のmiddlewareを追加します。
OAuthではstate・PKCE・コールバックの検証、セッションではHttpOnly / Secure / SameSite属性と失効を実装します。
Cookieで認証する更新APIにはCSRF対策と権限確認を追加し、ログイン・ログアウト・未認証・権限不足をテストします。
初期テンプレートのデモ画面・APIは公開状態です。

## GitHub Actions・デプロイ

CIはpush・PR・手動実行に対応し、WindowsとUbuntuのNode.js 24で `release:check` を実行します。
別のUbuntuジョブでChromiumと必要なOS依存を取得し、`test:ui` を実行します。失敗時はスクリーンショットとログを7日間保存します。
本番デプロイは別workflowの手動実行だけで行い、mainブランチとGitHub Environmentの `production` を使用します。
デプロイworkflowでも `release:check` → ChromiumとOS依存の取得 → `test:ui` を実行し、すべて成功した場合だけデプロイします。失敗時のUI診断は7日間保存します。

事前にWorker名を変更し、GitHubのSecretsに以下を登録します。

- `CLOUDFLARE_API_TOKEN`：対象アカウントのWorkersを書き込める、必要な範囲に限定したトークン。
- `CLOUDFLARE_ACCOUNT_ID`：CloudflareアカウントID。

必要に応じてEnvironmentの承認者を設定します。main以外からの実行はスキップされます。
pushだけでは公開されません。DBのリモートマイグレーションやアプリ固有Secretsの登録も自動では行いません。

ローカルから公開する場合は、プロジェクトルートで実行します。

```powershell
npx playwright install chromium
npx wrangler login
npm run deploy
```

ローカルの `deploy` も `release:check` とUIテストを必須にします。ブラウザーが起動できない場合は上記の `UI_BROWSER_CHANNEL` 設定を使用できます。

このコマンドは本番を変更します。公開後は返されたURLでページ・API・アセット・テーマを確認してください。
Workersの過去のデプロイへ戻す場合は `npx wrangler deployments list` で確認し、`npx wrangler rollback` を実行します。
DBや外部ストレージの変更はWorkerのrollbackでは元に戻りません。

## 共通レイアウト

ヘッダー・本文・フッターは `app-container` で左右位置を揃え、中央寄せの最大幅1280pxにしています。
ルートに `overflow-y: scroll` を指定し、ページの長さによる縦スクロールバーの有無で横幅・中央位置がずれないようにしています。
ナビゲーションはヘッダーに配置しています。
カードの角丸は8px、ボタン・フォーム・通知は6px、バッジは4pxです。
ナビゲーションは44pxのクリック領域を保ち、現在位置は太字と細い下線で表示します。
ページ間の移動なので、ARIAタブではなく通常のリンクと `aria-current="page"` を使用します。
幅768px未満では、ハンバーガーアイコンと「メニュー」を表示したボタンからページ一覧を開きます。共通ヘッダー・フッターは `src/components/layout.tsx`、余白・文字・部品のスタイルは `src/styles.css` で変更できます。
メニューを開いている間は「×」アイコンと「閉じる」に切り替えます。切り替え時もボタン幅を維持します。
フッターはページ最下部に配置し、スマホではコピーライトの下に改行して「View on GitHub」を中央揃えで表示します。PCでは横並びです。
メニューは高さと透明度を200msで切り替えます。連打した場合は途中位置から反転し、
動きを減らすOS設定やアニメーションAPI非対応のブラウザーでは即座に開閉します。
PCのヘッダーと設定画面は、システム・ライト・ダークの3段階スイッチです。
幅768px未満ではヘッダーのスイッチを隠し、開閉メニュー内に表示します。
ヘッダー・メニューのスイッチは132×44pxで、各項目のクリック領域は44×44pxです。
選択を示す丸は32px、背景の見た目は120×32pxに抑えています。設定画面のスイッチは最大幅384pxで、スマホでは各項目のアイコンを文字の上に配置します。
選択位置を240msで横にスライドし、配色も短くアニメーションします。
矢印キー・Home・Endで選択でき、Tabは選択中の項目に止まります。
各スイッチは同期し、動きを減らすOS設定ではアニメーションを省略します。

### 4／8／12列のレスポンシブグリッド

`src/styles.css` の `layout-grid` は `grid-cols-4 md:grid-cols-8 lg:grid-cols-12` を共通化しています。
直接の子要素は `min-width: 0` とし、長い文字列がカラム幅を押し広げないようにします。

| 画面幅 | 列数 | 列・行の間隔 | コンテナ左右の余白 |
|---|---:|---:|---:|
| 768px未満 | 4 | 16px | 16px |
| 768〜1023px | 8 | 16px | 24px |
| 1024px以上 | 12 | 24px | 24px |

ページは `Layout` の中に置き、コンテナを重ねて左右の余白を増やさないでください。
全幅・PCで8＋4・PCで6＋6の追加例です。`Panel` にも `class` を渡せます。

```tsx
<div class="layout-grid">
  <section class="panel panel-body col-span-full">全幅の内容</section>
</div>

<div class="layout-grid">
  <section class="panel panel-body col-span-full lg:col-span-8">主情報</section>
  <aside class="panel panel-body col-span-full lg:col-span-4">補助情報</aside>
</div>

<div class="layout-grid">
  <section class="panel panel-body col-span-full md:col-span-4 lg:col-span-6">前半</section>
  <section class="panel panel-body col-span-full md:col-span-4 lg:col-span-6">後半</section>
</div>
```

HTMLは主情報→補助情報の順に書き、CSSの `order` で入れ替えません。
カラム数は画面の分割単位で、スマホに4つのパネルを並べる意味ではありません。
ホームはPCで一覧8列＋入口4列、タブレットで一覧の下に入口2枚、スマホで縦並びです。
設定画面はテーマ4＋カラー8、ボタン6＋フォーム部品6。タブレットは各組4＋4です。
サンプル一覧のフォームはPCで入力8＋結果4、タブレットで4＋4、スマホで縦並びです。

サンプル一覧の `ItemsList` は同じデータから表とカードを描画し、768px未満でカードへ切り替えます。
名前・説明・カテゴリ・状態・更新日は両表示に含め、`display: none` の側をフォーカス・読み上げ対象から外します。
カードは名前と状態、説明、カテゴリと更新日の順に表示し、カテゴリ・更新日には読み上げ用ラベルを残します。
`demo.js` は1回のAPI応答で表・カード・件数を更新し、幅変更だけでは通信しません。
通信失敗時は両方の直前の結果を保持します。JavaScript無効時もGET検索で両表示を更新できます。
検索条件の変更は「検索」、全件に戻す操作は「検索解除」で行います。「再読み込み」は入力中の文字列ではなく、サーバー描画時の検索条件を使用します。
ページと `GET /api/demo/items` は `src/demo/data.ts` の `normalizeSearchQuery()` で検索条件を先頭200文字に揃えます。
「表示中」の条件を画面に明示し、URL・表示結果・再取得する条件を揃えます。
ホームの行リンクと表のスクロール領域はフォーカス枠を内側に表示し、カード端で枠が切れるのを防ぎます。
フォーム成功時は、幅768px未満で結果が画面外にある場合だけ結果見出しまで移動します。動きを減らすOS設定では即時移動し、項目エラーでは不正入力へのフォーカスを維持します。
通常の文章は単語・自然な区切りで折り返し、収まらない英数字は折り返します。コード・JSONは改行を保持しつつ長いURLも折り返します。

参考：[Tailwind CSS v3 Grid](https://v3.tailwindcss.com/docs/grid-template-columns)。

### デジタル庁デザインシステムを参考にしたルール

OgaTomo Systemsの配色を維持し、次の考え方を取り入れています。デザインシステム全体への準拠を示すものではありません。

- 本文・入力欄・ボタンは16px、補助情報・バッジ・コードは14px。本文の行間は1.625です。
- 主要な余白は8・16・24・32pxを基準にし、同じグループの中よりセクション間を広くします。
- リンクは通常時も下線を表示。キーボードのfocus表示はテーマごとのリンク色を使い、古いSafariにもフォールバックします。
- 入力例・条件はプレースホルダーではなく、常に見える説明文に記載し、`aria-describedby` で入力欄と関連付けます。
- 検証フォームは `maxlength` で入力を切り詰めません。サーバーで最大文字数を検証し、超過文字数を表示します。本文上限8KiBは維持します。
- 項目エラーは入力欄の近くに表示し、`aria-invalid` を付与。送信時は最初の不正項目へフォーカスを移します。

参考：[タイポグラフィ](https://design.digital.go.jp/dads/foundations/typography/)、[余白](https://design.digital.go.jp/dads/foundations/spacing/)、[カラー](https://design.digital.go.jp/dads/foundations/color/)、[水平メニュー](https://design.digital.go.jp/dads/components/horizontal-menu/)、[ボタン](https://design.digital.go.jp/dads/components/button/)、[入力欄のアクセシビリティ](https://design.digital.go.jp/dads/components/input-text/accessibility/)、[リンクテキスト](https://design.digital.go.jp/dads/foundations/link-text/)。

## 検証・ブラウザー互換性

`npm test` はHTML/API応答、404、入力境界、不正JSON、本文上限、内部例外の非公開、JSXエスケープ、テーマ、通信ヘルパー、コントラストを確認します。
実際のWorkerランタイムとStatic Assetsの配信は `npm run dev` でも確認してください。

UI変更時の確認項目：

- 320・375・640・767・768・1023・1024・1440pxで列数・配置の切り替えとページ全体の横はみ出しを確認。表内は必要な場合に横スクロール可。
- 長い日本語・空白のない英数字・URL・JSON、文字200%拡大時の折り返しと操作部品の表示。
- ライト／ダーク／システム追従、再読込後の設定保持。
- モバイルメニューの開閉、Esc、Tab移動、閉じた後のフォーカス復帰。
- 検索、空結果、一覧再取得、フォームの成功・項目エラー。幅変更後も表・カードの内容と件数が一致すること。
- 通信切断時のエラー表示と、復帰後の再試行。
- キーボードのフォーカス表示、ラベル、通知の読み上げ。

iOS 15 / Android 9を基準に、通常のCSS Grid・メディアクエリ、ES modules・fetch・matchMedia等を使用します。
`:focus-visible` 非対応時のfocus表示、古いSafariの `matchMedia.addListener` にフォールバックしています。
`<dialog>`、`inert`、`color-mix()`、`AbortSignal.timeout()` 等は使用しません。
モバイルメニューはヘッダー内に展開します。Tabで本文へ移動でき、Escで閉じるとボタンへフォーカスが戻ります。
`prefers-reduced-motion` を尊重し、JavaScript無効でもページ遷移とGET検索は使えます。
実機iOS / Androidおよび本番環境での受け入れ確認は、ローカルの検証とは分けて行ってください。

### ローカル確認結果（2026-10-04）

Windows上のChromium 154で、320・375・640・767・768・1023・1024・1440pxと3テーマを確認しました。
4／8／12列、ホームとフォームの配置切り替え、表・カードの切り替え、横はみ出しのない表示を確認しています。
長い日本語名・空白のない英数字・URL・JSONを使い、ルートの文字サイズを16px→32pxに変更して200%拡大相当の収まりも検証しました。
色見本とカード内の項目は、利用できる幅が狭い場合に折り返します。表の最小幅は40remとし、文字拡大時は表内でスクロールできます。
検索・空結果・再取得・通信失敗時の内容保持と復帰、フォームの成功・項目エラー、テーマ保存・横スライド、メニューとキーボード操作、JavaScript無効時のGET検索を確認しました。
`release:check` は型検査・53件のテスト・Workerのdry-runビルドが成功しています。
追加のUI回帰テスト7件はWindowsのChromeで成功しています。GitHub Actions上での実行結果は公開・push後に確認してください。
iOS 15／Android 9の実機と本番環境は未確認です。この結果はそれらの確認を代替しません。

### 開発依存の監査状況（2026-10-04）

`npm audit` はTailwind v3のビルド依存経路にHighを5件報告しています。
原因のアドバイザリーは[bracesの深いパターンによるスタック枯渇](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)で、braces・micromatch・fast-glob・chokidar・tailwindcssの依存経路に波及しています。
今回追加したPlaywrightに関する警告ではありません。npmが提示する修正にはTailwind v4へのメジャー更新を含むため、v3指定を維持して記録しています。

## 公式ドキュメント

- [Hono / Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Hono JSX](https://hono.dev/docs/guides/jsx)
- [Tailwind CSS v3](https://v3.tailwindcss.com/docs/installation)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Wrangler custom builds](https://developers.cloudflare.com/workers/wrangler/custom-builds/)

MIT License · Copyright © 2026 Tomoya Ogawa
