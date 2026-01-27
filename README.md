# Sol-Flow

Solidity スマートコントラクトのコールグラフ可視化ツール。コントラクト間の依存関係、関数呼び出し、継承構造を視覚的に確認できます。

## 機能

- コントラクト間の依存関係（継承、ライブラリ使用、インターフェース実装）を可視化
- 関数のコールフロー表示
- カテゴリ別グループ化（Token, Access, Proxy, Governance など）
- Grid / Hierarchy レイアウト切り替え
- ビルトインライブラリ（OpenZeppelin, OpenZeppelin Upgradeable, Solady）
- カスタムコントラクトのインポート

## 必要環境

- Node.js 18+
- pnpm

## 起動方法

```bash
# プロジェクトディレクトリに移動
cd app

# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev
```

ブラウザで http://localhost:3000 を開く

## ビルトインライブラリ

以下のライブラリが最初から利用可能です：

| ライブラリ | 説明 |
|-----------|------|
| OpenZeppelin Contracts | 業界標準のスマートコントラクトライブラリ |
| OpenZeppelin Upgradeable | プロキシパターン対応のアップグレード可能なコントラクト |
| Solady | ガス最適化されたSolidityスニペット |

ヘッダーの「Projects」ボタンから切り替え可能です。

## カスタムコントラクトのインポート

1. ヘッダーの「Import」ボタンをクリック
2. 解析済みJSONファイルをアップロード

## ディレクトリ構成

```
sol-flow/
├── app/                    # Next.js アプリケーション
│   ├── src/
│   │   ├── app/            # App Router
│   │   ├── components/     # React コンポーネント
│   │   ├── data/           # ビルトインライブラリJSON
│   │   ├── lib/            # ユーティリティ
│   │   ├── types/          # 型定義
│   │   └── utils/          # ヘルパー関数
│   └── package.json
├── design.md               # デザインシステム仕様
└── sol-flow.md             # プロジェクト仕様書
```

## 技術スタック

- Next.js 15 (App Router)
- React 19
- React Flow (グラフ可視化)
- Tailwind CSS
- TypeScript
