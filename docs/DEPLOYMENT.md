# Sol-Flow デプロイメントガイド

## Vercelへのデプロイ

### 前提条件

- GitHubアカウント
- Vercelアカウント
- Node.js 18+

### 手順

#### 1. GitHubリポジトリの準備

```bash
cd /path/to/sol-flow
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### 2. Vercelプロジェクト設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. "New Project" をクリック
3. GitHubリポジトリを選択
4. 以下の設定を行う:

| 設定項目 | 値 |
|---------|-----|
| Framework Preset | Next.js |
| Root Directory | `app` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

#### 3. 環境変数 (オプション)

現在、環境変数は必要ありません。
将来的に追加する場合:

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_API_URL` | API URLのオーバーライド |

#### 4. デプロイ

"Deploy" ボタンをクリックしてデプロイを開始。

---

## ビルド設定

### package.json スクリプト

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Next.js設定 (next.config.ts)

```typescript
const nextConfig: NextConfig = {
  // 必要に応じて設定を追加
};
```

---

## ファイルサイズ最適化

### 現在のサイズ

| ディレクトリ | サイズ | 説明 |
|-------------|--------|------|
| app/src/data/libraries/ | ~2.8MB | 事前パースJSONファイル |
| library/ | ~5.7MB | Solidityソースコード |

### 注意点

- `library/` ディレクトリはVercelにはデプロイされません（ビルド時に使用されないため）
- 事前パースJSONはバンドルに含まれます
- node_modulesは`.gitignore`で除外されています

---

## ローカル開発

```bash
cd app
npm install
npm run dev
```

http://localhost:3000 でアクセス可能。

---

## トラブルシューティング

### ビルドエラー: メモリ不足

Vercelの無料プランではメモリ制限があります。
大きなJSONファイルが原因の場合:

```bash
# ビルド時のメモリ増加
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### APIタイムアウト

Vercelの無料プランではAPI実行時間が10秒に制限されています。
大きなファイルのパースでタイムアウトする場合:
- ファイル数を制限
- チャンク分割を検討

### 静的ファイルが見つからない

`public/` ディレクトリのファイルパスを確認してください。

---

## 推奨設定

### Vercel.json (オプション)

プロジェクトルートに配置:

```json
{
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/.next",
  "installCommand": "cd app && npm install",
  "framework": "nextjs"
}
```

### カスタムドメイン

1. Vercel Dashboard → Project Settings → Domains
2. ドメインを追加
3. DNSレコードを設定

---

## 本番環境チェックリスト

- [ ] `.gitignore`が正しく設定されている
- [ ] 不要なファイル/ディレクトリが削除されている
- [ ] ビルドがローカルで成功する (`npm run build`)
- [ ] 環境変数が設定されている (必要な場合)
- [ ] Root Directoryが`app`に設定されている
