# Sol-Flow ドキュメント

Solidityスマートコントラクトのインタラクティブ可視化ツール

[English version](../README.md)

## ドキュメント一覧

| ドキュメント | 説明 |
|-------------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | システムアーキテクチャ、データフロー、コンポーネント構成 |
| [API.md](./API.md) | APIエンドポイントリファレンス |
| [FEATURES.md](./FEATURES.md) | 機能詳細ドキュメント |
| [DATA_TYPES.md](./DATA_TYPES.md) | TypeScript型定義（CallGraph、Contract等） |
| [PARSER.md](./PARSER.md) | Solidityパーサーの実装詳細 |
| [PROXY_PATTERNS.md](./PROXY_PATTERNS.md) | プロキシパターン検出とグループ化 |
| [LIBRARIES.md](./LIBRARIES.md) | 内蔵ライブラリと追加方法 |

## クイックスタート

### ローカル開発

```bash
cd app
pnpm install
pnpm dev
```

### ビルド

```bash
cd app
pnpm build
```

### Vercelデプロイ

1. GitHubにプッシュ
2. Vercelでプロジェクトをインポート
3. Root Directoryを`app`に設定
4. デプロイ

## 主な機能

### 1. コントラクト可視化
- 継承関係（inherits）
- インターフェース実装（implements）
- ライブラリ使用（uses）
- delegatecall関係

### 2. プロキシパターン検出
- ERC-7546（アップグレード可能ディクショナリ）
- UUPS
- Transparent Proxy
- Diamond（EIP-2535）
- Beacon Proxy

### 3. カテゴリ分類
ディレクトリ構造に基づく動的カテゴリ検出：
- OpenZeppelin/access、OpenZeppelin/token等
- Solady/auth、Solady/tokens等

### 4. プロジェクト管理
- プロジェクトの保存/読み込み
- プリパース済みライブラリ（OpenZeppelin、Solady）
- カスタムコントラクトのアップロード

### 5. ソースコードビューア
- シンタックスハイライト付きフルソースコード表示
- 複数行コメント対応
- NatSpecドキュメントハイライト
- 行番号とコピー機能

## 技術スタック

| 技術 | 用途 |
|------|------|
| Next.js 15 | フレームワーク（App Router） |
| React 19 | UI |
| React Flow | グラフ描画 |
| TypeScript | 型安全性 |
| Tailwind CSS | スタイリング |
| @solidity-parser/parser | Solidityパース |

## プロジェクト構造

```
sol-flow/
├── app/               # Next.jsアプリケーション
│   ├── src/
│   │   ├── app/       # App Router（ページ、APIルート）
│   │   ├── components/# Reactコンポーネント
│   │   ├── lib/       # パーサー、ユーティリティ
│   │   ├── data/      # プリパース済みライブラリJSON
│   │   ├── types/     # TypeScript型定義
│   │   └── utils/     # ヘルパー関数
│   └── scripts/       # ビルドスクリプト
├── library/           # ライブラリソースコード（Gitサブモジュール）
│   ├── openzeppelin-contracts/
│   ├── openzeppelin-contracts-upgradeable/
│   ├── solady/
│   └── icm-services/
├── contracts/         # サンプルコントラクト
└── docs/              # ドキュメント
```

## ライセンス

Sol-Flow Non-Commercial Open Source License

詳細は[LICENSE](../../LICENSE)をご覧ください。
