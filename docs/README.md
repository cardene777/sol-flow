# Sol-Flow ドキュメント

Solidityスマートコントラクトの依存関係可視化ツール

## ドキュメント一覧

| ファイル | 説明 |
|---------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | システムアーキテクチャ、データフロー、コンポーネント構成 |
| [API.md](./API.md) | API エンドポイントのリファレンス |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercelデプロイメントガイド |

## クイックスタート

### ローカル開発

```bash
cd app
npm install
npm run dev
```

### ビルド

```bash
cd app
npm run build
```

### Vercelデプロイ

1. GitHubにプッシュ
2. Vercelでプロジェクトをインポート
3. Root Directoryを `app` に設定
4. デプロイ

## 主要機能

### 1. コントラクト可視化
- 継承関係 (inherits)
- インターフェース実装 (implements)
- ライブラリ使用 (uses)
- delegatecall関係

### 2. プロキシパターン検出
- ERC-7546 (Upgradeable Dictionary)
- UUPS
- Transparent Proxy
- Diamond (EIP-2535)
- Beacon Proxy

### 3. カテゴリ分類
- Access Control
- Token (ERC20, ERC721, ERC1155)
- Governance
- Proxy
- Finance
- Utilities

### 4. プロジェクト管理
- プロジェクト保存/読み込み
- 事前パース済みライブラリ (OpenZeppelin, Solady)
- カスタムコントラクトのアップロード

## 技術スタック

| 技術 | 用途 |
|------|------|
| Next.js 14+ | フレームワーク |
| React 19 | UI |
| React Flow | グラフ描画 |
| TypeScript | 型安全性 |
| Tailwind CSS | スタイリング |
| Vercel | ホスティング |

## プロジェクト構成

```
sol-flow/
├── app/           # Next.jsアプリケーション
├── contracts/     # サンプルコントラクト (ERC-7546)
├── library/       # ライブラリソースコード (参照用)
└── docs/          # ドキュメント
```

## ライセンス

MIT
