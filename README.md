# nearby-eats

HotPepper グルメサーチAPIを使って、現在地付近の飲食店を探すWebアプリです。このIssueでは開発環境、API連携の土台、バックエンド接続確認画面を用意します。

## 使用技術

- Frontend: React 18, TypeScript, Vite, Tailwind CSS 4, Lucide React
- Backend: Node.js 20+, Express 4, TypeScript, dotenv
- Runtime API: Node.js組み込みの `fetch`

## ディレクトリ構成

```text
nearby-eats/
├── backend/src/
│   ├── routes/shops.ts
│   ├── services/hotpepperService.ts
│   ├── types/hotpepper.ts
│   └── index.ts
├── frontend/src/
│   ├── components/ApiStatus.tsx
│   ├── hooks/useApiHealth.ts
│   ├── pages/HomePage.tsx
│   ├── services/shopApi.ts
│   ├── types/shop.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── .gitignore
└── README.md
```

## 環境変数

ルートの `.env.example` を `.env` にコピーし、新しく取得したAPIキーを設定します。

| 変数 | 説明 | 既定値 |
| --- | --- | --- |
| `HOTPEPPER_API_KEY` | Recruit Web Servicesで取得したキー | なし（店舗検索APIは503） |
| `PORT` | バックエンドのポート | `3001` |
| `HOTPEPPER_API_TIMEOUT_MS` | HotPepper APIのタイムアウト（1000〜30000ms） | `5000` |

`.env` はGit管理対象外です。キーはバックエンドからのみ利用し、フロントエンドに公開しません。

## 環境構築と起動

Node.js 20以上とnpmを用意してください。

```sh
cp .env.example .env
# .env の HOTPEPPER_API_KEY に新しいキーを設定
npm install
npm run dev
```

Viteの画面は `http://localhost:5173`、バックエンドは `http://localhost:3001` で起動します。Vite開発サーバーは `/api` をバックエンドへプロキシします。

## API仕様

HotPepperグルメサーチAPIの公式仕様に合わせて、バックエンドが次のリクエストを行います。

- Upstream: `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/`
- 必須条件: APIキーと検索条件のいずれか。位置検索は `lat` と `lng` の組み合わせで指定
- `range`: 1=300m、2=500m、3=1000m、4=2000m、5=3000m
- `start`: 1始まりの取得開始位置
- `count`: 1〜100件
- `format=json`, `type=lite`

アプリ内API:

- `GET /api/health`: バックエンド生存確認。APIキー不要。
- `GET /api/shops?lat=35.66&lng=139.70&range=3&start=1&count=10`: 店舗検索。成功時は `{ data: { shops, pagination } }` を返します。

HotPepper APIはエラー時もHTTP 200でXML/JSON本文に `results.error` を含める仕様のため、本文のエラーも判定します。アプリ側では入力不正を400、APIキー未設定を503、上流接続失敗を502、タイムアウトを504で返します。

JSON形式の実レスポンスで `results_returned` が数字文字列になるケースを確認したため、この項目のみ数字のみの文字列も受け入れて数値へ正規化します。`results_available` と `results_start` は数値を要求し、その他のレスポンス検証は維持します。

詳細は[HotPepper グルメサーチAPI公式リファレンス](https://webservicestr.hotpepper.jp/doc/hotpepper/reference.html)を参照してください。

## API接続確認

1. `npm run dev` を起動し、画面に「バックエンドに接続しました」と表示されることを確認します。
2. `curl http://localhost:3001/api/health` が `{"status":"ok"}` を返すことを確認します。
3. `.env` に有効なキーを設定した上で、次を実行します。

```sh
curl 'http://localhost:3001/api/shops?lat=35.66&lng=139.70&range=3&start=1&count=10'
```

キー未設定時は `HOTPEPPER_API_KEY_MISSING` が返ります。無効キーや上流障害はHotPepper APIの仕様に基づくエラーとして返されます。

## 既知の依存脆弱性

2026-11-18の `npm audit` では `picomatch@4.0.7` のHigh脆弱性（GHSA-fc5q-39xc-vjpf / CVE-2026-112366、細工したextglobパターンによるReDoS）が報告されています。依存経路は `vite -> tinyglobby/fdir -> picomatch` です。現時点でadvisoryに修正版は掲載されていません。`npm audit fix --dry-run` でも変更案は提示されなかったため、脆弱な版を無理にoverrideしていません。Vite開発サーバーはlocalhostに限定しています。この依存は開発・ビルド用ですが、依存ツリー上の脆弱性は未解消です。picomatchまたは上流依存の修正版が公開されたら更新し、`npm audit` とビルド・テストを再確認してください。

## 品質確認コマンド

```sh
npm run typecheck
npm run build
npm test --workspace @nearby-eats/backend
git check-ignore .env
```

店舗検索画面、現在地取得UI、一覧、詳細、お気に入り、認証は後続Issueで実装します。
