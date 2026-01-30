# Sol-Flow アーキテクチャ

## 概要

Sol-Flowは、Solidityスマートコントラクトの依存関係を可視化するWebアプリケーションです。
コントラクト間の継承、実装、使用関係をインタラクティブなグラフとして表示します。

## ディレクトリ構成

```
sol-flow/
├── app/                          # Next.jsアプリケーション
│   ├── src/
│   │   ├── app/                  # App Router（Next.js 15）
│   │   │   ├── api/              # APIルート
│   │   │   │   ├── libraries/    # ライブラリ取得API
│   │   │   │   └── parse/        # Solidityパース API
│   │   │   └── page.tsx          # メインページ
│   │   ├── components/           # Reactコンポーネント
│   │   │   ├── Canvas/           # React Flowキャンバス
│   │   │   ├── Layout/           # レイアウトコンポーネント
│   │   │   ├── Projects/         # プロジェクト管理
│   │   │   └── Upload/           # ファイルアップロード
│   │   ├── data/
│   │   │   └── libraries/        # プリパース済みライブラリJSON
│   │   ├── lib/                  # コアユーティリティ
│   │   │   ├── callGraphBuilder.ts  # グラフ構築
│   │   │   ├── solidityParser.ts    # Solidityパーサー
│   │   │   └── storage.ts        # localStorage管理
│   │   ├── types/                # TypeScript型定義
│   │   └── utils/
│   │       └── transformToReactFlow.ts  # React Flow変換
│   └── public/                   # 静的ファイル
├── library/                      # ライブラリソースコード
│   ├── openzeppelin-contracts/
│   ├── openzeppelin-contracts-upgradeable/
│   ├── solady/
│   └── icm-services/
├── contracts/                    # サンプルコントラクト（ERC-7546）
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
│ solidityParser  │ (@solidity-parser/parser)
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

### 1. Solidityパーサー（`lib/solidityParser.ts`）

`@solidity-parser/parser`を使用してSolidityファイルを解析:
- コントラクト/インターフェース/ライブラリの検出
- 継承関係（`is`）の抽出
- 実装（`implements`）の抽出
- import文の解析
- 関数シグネチャと呼び出しの抽出

### 2. CallGraphBuilder（`lib/callGraphBuilder.ts`）

コントラクト間の依存グラフを構築:
- 継承グラフの構築
- プロキシパターンの検出（ERC-7546、UUPS、Diamond、Beacon、Transparent）
- `delegatecall`関係の検出
- カテゴリ分類

**検出されるプロキシパターン:**
- **ERC-7546**: Dictionary + Proxy + Implementation
- **UUPS**: UUPSUpgradeable継承
- **Transparent**: TransparentUpgradeableProxy
- **Diamond**: EIP-2535
- **Beacon**: BeaconProxy

### 3. React Flow変換（`utils/transformToReactFlow.ts`）

CallGraphをReact Flowのノード/エッジに変換:
- カテゴリグループノードの生成
- プロキシパターングループの生成
- エッジの重複防止
- ハンドル位置のオフセット計算
- dagreレイアウトアルゴリズムの適用

### 4. ノードタイプ

| タイプ | 説明 |
|--------|------|
| `contractNode` | コントラクトノード |
| `categoryGroupNode` | カテゴリグループ（Access、Token等） |
| `proxyPatternGroupNode` | プロキシパターングループ（ERC-7546等） |

### 5. エッジタイプ

| タイプ | 色 | 説明 |
|--------|-----|------|
| `inherits` | 青 | 継承 |
| `implements` | 紫 | インターフェース実装 |
| `uses` | 黄（破線） | ライブラリ使用 |
| `delegatecall` | ピンク（破線） | delegatecall |
| `registers` | 紫（破線） | ディクショナリ登録 |

## 状態管理

- **React State**: コンポーネント状態
- **localStorage**: プロジェクト永続化
  - `sol-flow-projects`: 保存済みプロジェクト一覧
  - `sol-flow-project-{id}`: 各プロジェクトのCallGraph
  - `sol-flow-current-project`: 現在のプロジェクトID
  - `sol-flow-current-library`: 現在のライブラリID

## プリパース済みライブラリ

`/app/src/data/libraries/`に配置:
- `openzeppelin-parsed.json`
- `openzeppelin-upgradeable-parsed.json`
- `solady-parsed.json`

これらはビルド時にバンドルされ、API経由で提供されます。

## コンポーネント階層

```
MainLayout
├── Header
│   ├── Search
│   ├── ProjectSelector
│   ├── EditModeToggle
│   └── ExportButton
├── Sidebar
│   ├── CategoryFilter
│   ├── ContractTree
│   │   └── TreeNode（再帰）
│   └── LibraryToggle
└── DiagramCanvas
    ├── ReactFlow
    │   ├── ContractNode
    │   ├── CategoryGroupNode
    │   └── ProxyPatternGroupNode
    ├── DependencyEdge
    ├── FunctionFlowModal
    └── ContractDetailModal
```

## API概要

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/parse` | POST | Solidityファイルをパース |
| `/api/libraries` | GET | 利用可能なライブラリ一覧 |
| `/api/libraries/[id]` | GET | 特定ライブラリのデータ取得 |
| `/api/libraries/default` | GET | デフォルトライブラリ取得 |

詳細は[API.md](./API.md)をご覧ください。
