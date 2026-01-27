# Sol-Flow アーキテクチャ

## 概要

Sol-Flowは、Solidityスマートコントラクトの依存関係を可視化するWebアプリケーションです。
コントラクト間の継承、実装、利用関係をインタラクティブなグラフとして表示します。

## ディレクトリ構成

```
sol-flow/
├── app/                          # Next.js アプリケーション
│   ├── src/
│   │   ├── app/                  # App Router (Next.js 14+)
│   │   │   ├── api/              # API Routes
│   │   │   │   ├── libraries/    # ライブラリ取得API
│   │   │   │   └── parse/        # Solidityパース API
│   │   │   └── page.tsx          # メインページ
│   │   ├── components/           # React コンポーネント
│   │   │   ├── Canvas/           # React Flow キャンバス
│   │   │   ├── Layout/           # レイアウト
│   │   │   ├── Projects/         # プロジェクト管理
│   │   │   ├── Sidebar/          # サイドバー
│   │   │   └── Upload/           # アップロード
│   │   ├── data/
│   │   │   └── libraries/        # 事前パース済みライブラリJSON
│   │   ├── lib/                  # ユーティリティ
│   │   │   ├── callGraphBuilder.ts  # グラフ構築
│   │   │   ├── parser.ts         # Solidityパーサー
│   │   │   └── storage.ts        # localStorage管理
│   │   ├── types/                # TypeScript型定義
│   │   └── utils/
│   │       └── transformToReactFlow.ts  # React Flow変換
│   └── public/                   # 静的ファイル
├── contracts/                    # サンプルコントラクト (ERC-7546)
├── library/                      # ライブラリソースコード
│   ├── openzeppelin-contracts/
│   ├── openzeppelin-contracts-upgradeable/
│   └── solady/
└── docs/                         # ドキュメント
```

## データフロー

```
┌─────────────────┐
│ Solidityファイル │
│  (.sol files)   │
└────────┬────────┘
         │ アップロード
         ▼
┌─────────────────┐
│   /api/parse    │ Solidityパーサー
│   parser.ts     │ (正規表現ベース)
└────────┬────────┘
         │ Contract[]
         ▼
┌─────────────────┐
│ callGraphBuilder│ 依存関係検出
│      .ts        │ プロキシパターン検出
└────────┬────────┘
         │ CallGraph
         ▼
┌─────────────────┐
│ transformTo     │ React Flow形式に変換
│ ReactFlow.ts    │ ノード/エッジ生成
└────────┬────────┘
         │ nodes[], edges[]
         ▼
┌─────────────────┐
│  React Flow     │ インタラクティブ表示
│  DiagramCanvas  │
└─────────────────┘
```

## 主要コンポーネント

### 1. Solidityパーサー (`lib/parser.ts`)

正規表現を使用してSolidityファイルを解析:
- コントラクト/インターフェース/ライブラリの検出
- 継承関係 (`is`)
- 実装関係 (`implements`)
- import文の解析
- 関数シグネチャの抽出

### 2. CallGraphBuilder (`lib/callGraphBuilder.ts`)

コントラクト間の依存関係を構築:
- 継承グラフの構築
- プロキシパターンの検出 (ERC-7546, UUPS, Diamond, Beacon, Transparent)
- `delegatecall`関係の検出
- カテゴリ分類 (access, token, proxy, etc.)

**検出されるプロキシパターン:**
- **ERC-7546**: Dictionary + Proxy + Implementation
- **UUPS**: UUPSUpgradeable継承
- **Transparent**: TransparentUpgradeableProxy
- **Diamond**: EIP-2535
- **Beacon**: BeaconProxy

### 3. React Flow変換 (`utils/transformToReactFlow.ts`)

CallGraphをReact Flowのノード/エッジに変換:
- カテゴリグループノードの生成
- プロキシパターングループの生成
- エッジの重複防止
- ハンドル位置のオフセット計算

### 4. ノードタイプ

| タイプ | 説明 |
|--------|------|
| `contractNode` | コントラクトノード |
| `categoryGroupNode` | カテゴリグループ (Access, Token等) |
| `proxyPatternGroupNode` | プロキシパターングループ (ERC-7546等) |

### 5. エッジタイプ

| タイプ | 色 | 説明 |
|--------|-----|------|
| `inherits` | 青 | 継承関係 |
| `implements` | 紫 | インターフェース実装 |
| `uses` | 黄 (破線) | ライブラリ使用 |
| `delegatecall` | ピンク (破線) | delegatecall |
| `registers` | 紫 (破線) | Dictionary登録 |

## 状態管理

- **React State**: コンポーネント状態
- **localStorage**: プロジェクト保存
  - `sol-flow-projects`: 保存済みプロジェクト一覧
  - `sol-flow-project-{id}`: 各プロジェクトのCallGraph
  - `sol-flow-current-project`: 現在のプロジェクトID
  - `sol-flow-current-library`: 現在のライブラリID

## 事前パース済みライブラリ

`/app/src/data/libraries/` に以下のJSONファイル:
- `openzeppelin-parsed.json` (919KB)
- `openzeppelin-upgradeable-parsed.json` (1.1MB)
- `solady-parsed.json` (764KB)

これらはビルド時にバンドルされ、APIから提供されます。
