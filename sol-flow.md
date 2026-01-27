# Sol-Flow

Solidity スマートコントラクトの構造と関数の処理フローをインタラクティブに可視化する Web アプリケーション。

## 概要

### 主要機能

1. **ディレクトリ/ファイルアップロード**: contracts/ と artifacts/ ディレクトリをドラッグ&ドロップで解析
2. **コントラクト間の依存関係グラフ表示**: 継承、ライブラリ使用、インポート関係を可視化
3. **各コントラクトの関数一覧表示**: Read/Write関数を分類表示
4. **関数クリックで内部処理フローを表示**: 呼び出しチェーンを可視化
5. **大規模プロジェクト対応**: 検索、フィルタリング、仮想化表示
6. **ズーム/パン/ドラッグによるインタラクション**

### 入力データ

| 入力タイプ | ファイル形式 | 用途 |
|-----------|-------------|------|
| Solidityソース | `*.sol` | AST解析で関数呼び出しチェーンを抽出 |
| Hardhat Artifacts | `*.json` | ABI情報（関数シグネチャ、イベント、エラー） |
| Foundry Out | `*.json` | ABI情報（Foundryビルド出力） |

### UI イメージ

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Sol-Flow    [検索: ________]  [フィルタ▼]  [レイアウト▼]  [ズーム] [リセット]        │
├────────────────────┬────────────────────────────────────────────────────────────────┤
│ プロジェクト        │                                                                │
│ ├─ core/           │   ┌─────────────────┐       ┌─────────────────┐               │
│ │  ├─ Ownable      │   │     ERC721      │──────▶│   ERC721Lib     │               │
│ │  └─ AccessCtrl   │   │  (継承:Ownable) │       │   (library)     │               │
│ ├─ sc/             │   ├─────────────────┤       ├─────────────────┤               │
│ │  ├─ ERC721    ◀──│   │ ○ balanceOf()   │       │ ○ balanceOf()   │               │
│ │  ├─ SCT          │   │ ○ ownerOf()     │       │ ○ ownerOf()     │               │
│ │  └─ Services/    │   │ ● transferFrom()│       │ ○ update()      │               │
│ │     └─ Token/    │   │ ● approve()     │       │ ○ mint()        │               │
│ └─ scr/            │   └────────┬────────┘       └─────────────────┘               │
│                    │            │ inherits                                          │
│ ── 凡例 ──         │            ▼                                                   │
│ ○ view/pure        │   ┌─────────────────┐                                          │
│ ● write            │   │    Ownable      │                                          │
│ ─▶ uses            │   ├─────────────────┤                                          │
│ ─▷ inherits        │   │ ○ owner()       │                                          │
│                    │   │ ● transferOwner │                                          │
│                    │   └─────────────────┘                                          │
└────────────────────┴────────────────────────────────────────────────────────────────┘
```

### 関数フロー表示（関数クリック時）

```
┌─────────────────────────────────────────────────────────────────┐
│  ERC721.transferFrom() 処理フロー                       [閉じる] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [transferFrom(from, to, tokenId)]                             │
│         │                                                       │
│         ├─ require: to != address(0)                            │
│         │                                                       │
│         ▼                                                       │
│   ┌─────────────────────┐                                       │
│   │ _update(to, tokenId,│ ← internal                            │
│   │         msg.sender) │                                       │
│   │   │                 │                                       │
│   │   └─▶ ERC721Lib.update()                                    │
│   │         │                                                   │
│   │         ├─ checkAuthorized()                                │
│   │         ├─ decreaseBalance()                                │
│   │         ├─ increaseBalance()                                │
│   │         └─ emit Transfer()                                  │
│   └─────────────────────┘                                       │
│         │                                                       │
│         ├─ require: previousOwner == from                       │
│         │                                                       │
│         ▼                                                       │
│   [return / revert ERC721IncorrectOwner]                        │
│                                                                 │
│ ── 凡例 ──                                                       │
│ 🔵 External  🟣 Internal  🟢 Library  🟡 Event  🔴 Error         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 技術スタック

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| ビルドツール | Vite | ^5.x | 高速ビルド |
| フレームワーク | React | ^18.x | UI構築 |
| 言語 | TypeScript | ^5.x | 型安全性 |
| ダイアグラム | React Flow | ^11.x | ノードベースグラフ |
| スタイリング | Tailwind CSS | ^3.x | ユーティリティCSS |
| 状態管理 | Zustand | ^4.x | 軽量状態管理 |
| アニメーション | Framer Motion | ^10.x | トランジション |
| AST解析 | @solidity-parser/parser | ^0.18.x | Solidity解析 |
| 仮想化 | @tanstack/react-virtual | ^3.x | 大規模リスト対応 |
| アイコン | Lucide React | latest | アイコンセット |
| ファイルシステム | Browser File System Access API | - | ディレクトリ読み込み |

---

## ディレクトリ構造

```
sol-flow/
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/
│   └── sample-data/
│       └── call-graph.json          # サンプルデータ
├── src/
│   ├── main.tsx                      # エントリーポイント
│   ├── App.tsx                       # ルートコンポーネント
│   ├── index.css                     # グローバルスタイル
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── index.tsx             # レイアウト
│   │   │   ├── Header.tsx            # ヘッダー
│   │   │   └── Sidebar.tsx           # サイドバー（ツリービュー）
│   │   │
│   │   ├── Upload/
│   │   │   ├── index.tsx             # アップロード画面
│   │   │   ├── DropZone.tsx          # ドラッグ&ドロップエリア
│   │   │   ├── DirectoryPicker.tsx   # ディレクトリ選択
│   │   │   └── ProgressIndicator.tsx # 解析進捗表示
│   │   │
│   │   ├── DiagramCanvas/
│   │   │   ├── index.tsx             # React Flowキャンバス
│   │   │   ├── ContractNode.tsx      # コントラクトノード
│   │   │   ├── LibraryNode.tsx       # ライブラリノード
│   │   │   ├── InterfaceNode.tsx     # インターフェースノード
│   │   │   ├── FunctionHandle.tsx    # 関数ハンドル
│   │   │   ├── DependencyEdge.tsx    # 依存関係エッジ
│   │   │   └── InheritanceEdge.tsx   # 継承エッジ
│   │   │
│   │   ├── FunctionFlow/
│   │   │   ├── index.tsx             # 関数フローモーダル
│   │   │   ├── FlowCanvas.tsx        # フロー用キャンバス
│   │   │   ├── FlowStepNode.tsx      # フローステップノード
│   │   │   ├── ConditionNode.tsx     # 条件分岐ノード
│   │   │   ├── ErrorNode.tsx         # エラー/リバートノード
│   │   │   └── CallEdge.tsx          # 呼び出しエッジ
│   │   │
│   │   ├── ContractDetail/
│   │   │   ├── index.tsx             # コントラクト詳細パネル
│   │   │   ├── FunctionList.tsx      # 関数一覧
│   │   │   ├── FunctionItem.tsx      # 関数アイテム
│   │   │   ├── EventList.tsx         # イベント一覧
│   │   │   └── ErrorList.tsx         # エラー一覧
│   │   │
│   │   ├── Search/
│   │   │   ├── SearchBar.tsx         # 検索バー
│   │   │   ├── FilterDropdown.tsx    # フィルタードロップダウン
│   │   │   └── SearchResults.tsx     # 検索結果
│   │   │
│   │   ├── Toolbar/
│   │   │   ├── index.tsx             # ツールバー
│   │   │   ├── ZoomControls.tsx      # ズームコントロール
│   │   │   ├── LayoutSelector.tsx    # レイアウト選択
│   │   │   └── ExportButton.tsx      # エクスポートボタン
│   │   │
│   │   └── common/
│   │       ├── Modal.tsx             # モーダル
│   │       ├── Tooltip.tsx           # ツールチップ
│   │       ├── Badge.tsx             # バッジ
│   │       ├── TreeView.tsx          # ツリービュー
│   │       └── VirtualList.tsx       # 仮想化リスト
│   │
│   ├── hooks/
│   │   ├── useCallGraph.ts           # データ取得・変換
│   │   ├── useDiagramLayout.ts       # レイアウト計算
│   │   ├── useSelectedContract.ts    # 選択状態
│   │   ├── useSearch.ts              # 検索機能
│   │   ├── useFileSystem.ts          # ファイルシステムアクセス
│   │   └── useTheme.ts               # テーマ切替
│   │
│   ├── stores/
│   │   ├── diagramStore.ts           # ダイアグラム状態
│   │   ├── projectStore.ts           # プロジェクト状態
│   │   └── uiStore.ts                # UI状態
│   │
│   ├── types/
│   │   ├── callGraph.ts              # 入力データ型
│   │   ├── diagram.ts                # ダイアグラム型
│   │   ├── flow.ts                   # フロー型
│   │   ├── hardhat.ts                # Hardhat ABI型
│   │   └── solidity.ts               # Solidity AST型
│   │
│   ├── parsers/
│   │   ├── index.ts                  # パーサーエントリー
│   │   ├── solidityParser.ts         # Solidityソース解析
│   │   ├── abiParser.ts              # ABI JSON解析
│   │   ├── inheritanceResolver.ts    # 継承関係解決
│   │   ├── callGraphBuilder.ts       # コールグラフ構築
│   │   └── categoryClassifier.ts     # カテゴリ自動分類
│   │
│   ├── utils/
│   │   ├── layoutEngine.ts           # レイアウト計算
│   │   ├── graphTransform.ts         # データ変換
│   │   ├── colorUtils.ts             # カラー生成
│   │   ├── exportUtils.ts            # エクスポート処理
│   │   └── fileUtils.ts              # ファイル操作
│   │
│   └── constants/
│       ├── nodeStyles.ts             # ノードスタイル定義
│       └── categories.ts             # カテゴリ定義
│
└── docs/
    └── data-schema.md                # データスキーマ仕様
```

---

## データスキーマ

### 入力データ: `call-graph.json`

```typescript
// src/types/callGraph.ts

/** パラメータ */
interface Parameter {
  name: string;
  type: string;
  indexed?: boolean;  // イベントパラメータ用
}

/** 戻り値 */
interface ReturnValue {
  name: string;
  type: string;
}

/** エラー定義 */
interface ErrorDefinition {
  name: string;
  parameters: Parameter[];
}

/** イベント定義 */
interface EventDefinition {
  name: string;
  parameters: Parameter[];
}

/** コントラクト情報 */
interface Contract {
  name: string;
  kind: 'contract' | 'library' | 'interface' | 'abstract';
  category: ContractCategory;
  filePath: string;

  // 依存関係
  inherits: string[];           // 継承元コントラクト
  implements: string[];         // 実装インターフェース
  usesLibraries: string[];      // using LibName for Type
  imports: string[];            // インポートパス

  // 定義
  externalFunctions: ExternalFunction[];
  internalFunctions: InternalFunction[];
  events: EventDefinition[];
  errors: ErrorDefinition[];

  // ABI情報（artifactから取得）
  abi?: ABIItem[];
}

/** カテゴリ（ディレクトリ構造から自動分類） */
type ContractCategory =
  | 'core'           // core/ 配下
  | 'token'          // ERC20, ERC721, ERC1155
  | 'access'         // AccessControl, Ownable
  | 'storage'        // Storage, Schema
  | 'service'        // Services/ 配下
  | 'proxy'          // Proxy, Diamond
  | 'interface'      // インターフェース
  | 'library'        // ライブラリ
  | 'test'           // テストコントラクト
  | 'other';

/** 外部関数 */
interface ExternalFunction {
  name: string;
  signature: string;           // "transfer(address,uint256)"
  selector: string;            // "0xa9059cbb"
  visibility: 'external' | 'public';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  parameters: Parameter[];
  returnValues: ReturnValue[];
  calls: FunctionCall[];
  emits: string[];
  modifiers: string[];
  overrides?: string[];        // オーバーライド元
  isVirtual: boolean;
}

/** 内部関数 */
interface InternalFunction {
  name: string;
  visibility: 'internal' | 'private';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  parameters: Parameter[];
  returnValues: ReturnValue[];
  calls: FunctionCall[];
  emits: string[];
  isVirtual: boolean;
}

/** 関数呼び出し */
interface FunctionCall {
  target: string;              // "ERC721Lib.update" or "_beforeTransfer"
  type: 'internal' | 'library' | 'external' | 'modifier' | 'super';
  condition?: string;          // if文内の場合の条件
  sourceLocation?: {           // ソースコード位置
    start: number;
    end: number;
  };
}

/** 依存関係 */
interface Dependency {
  from: string;
  to: string;
  type: 'uses' | 'inherits' | 'implements' | 'imports';
  functions?: string[];        // 使用している関数（uses の場合）
}

/** ルートスキーマ */
interface CallGraph {
  version: string;
  generatedAt: string;
  projectName: string;

  // ディレクトリ構造
  structure: DirectoryNode;

  // エンティティ
  contracts: Contract[];

  // 関係
  dependencies: Dependency[];

  // 統計
  stats: {
    totalContracts: number;
    totalLibraries: number;
    totalInterfaces: number;
    totalFunctions: number;
  };
}

/** ディレクトリ構造 */
interface DirectoryNode {
  name: string;
  type: 'directory' | 'file';
  path: string;
  children?: DirectoryNode[];
  contractName?: string;       // ファイルの場合
}
```

### Hardhat Artifact 型

```typescript
// src/types/hardhat.ts

/** Hardhat Artifact Format */
interface HardhatArtifact {
  _format: 'hh-sol-artifact-1';
  contractName: string;
  sourceName: string;
  abi: ABIItem[];
  bytecode: string;
  deployedBytecode: string;
  linkReferences: Record<string, any>;
  deployedLinkReferences: Record<string, any>;
}

/** ABI Item */
type ABIItem =
  | ABIFunction
  | ABIEvent
  | ABIError
  | ABIConstructor
  | ABIFallback
  | ABIReceive;

interface ABIFunction {
  type: 'function';
  name: string;
  inputs: ABIParameter[];
  outputs: ABIParameter[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
}

interface ABIEvent {
  type: 'event';
  name: string;
  inputs: ABIParameter[];
  anonymous?: boolean;
}

interface ABIError {
  type: 'error';
  name: string;
  inputs: ABIParameter[];
}

interface ABIParameter {
  name: string;
  type: string;
  indexed?: boolean;
  internalType?: string;
  components?: ABIParameter[];  // tuple型の場合
}
```

### サンプルデータ（テストプロジェクト基準）

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-01-26T00:00:00Z",
  "projectName": "SC Protocol",
  "structure": {
    "name": "contracts",
    "type": "directory",
    "path": "contracts",
    "children": [
      {
        "name": "core",
        "type": "directory",
        "path": "contracts/core",
        "children": [
          {
            "name": "Ownable",
            "type": "directory",
            "path": "contracts/core/Ownable",
            "children": [
              {
                "name": "Ownable.sol",
                "type": "file",
                "path": "contracts/core/Ownable/functions/Ownable.sol",
                "contractName": "Ownable"
              }
            ]
          }
        ]
      },
      {
        "name": "sc",
        "type": "directory",
        "path": "contracts/sc",
        "children": [
          {
            "name": "ERC721",
            "type": "directory",
            "path": "contracts/sc/ERC721",
            "children": [
              {
                "name": "ERC721.sol",
                "type": "file",
                "path": "contracts/sc/ERC721/functions/ERC721.sol",
                "contractName": "ERC721"
              },
              {
                "name": "ERC721Lib.sol",
                "type": "file",
                "path": "contracts/sc/ERC721/libs/ERC721Lib.sol",
                "contractName": "ERC721Lib"
              }
            ]
          }
        ]
      }
    ]
  },
  "contracts": [
    {
      "name": "ERC721",
      "kind": "contract",
      "category": "token",
      "filePath": "contracts/sc/ERC721/functions/ERC721.sol",
      "inherits": ["IERC721", "Ownable"],
      "implements": [],
      "usesLibraries": ["LibString"],
      "imports": [
        "../storages/Storage.sol",
        "../libs/ERC721Lib.sol",
        "../../../core/Ownable/functions/Ownable.sol"
      ],
      "externalFunctions": [
        {
          "name": "transferFrom",
          "signature": "transferFrom(address,address,uint256)",
          "selector": "0x23b872dd",
          "visibility": "public",
          "stateMutability": "nonpayable",
          "parameters": [
            { "name": "from", "type": "address" },
            { "name": "to", "type": "address" },
            { "name": "tokenId", "type": "uint256" }
          ],
          "returnValues": [],
          "calls": [
            { "target": "_update", "type": "internal" }
          ],
          "emits": [],
          "modifiers": [],
          "isVirtual": false
        },
        {
          "name": "balanceOf",
          "signature": "balanceOf(address)",
          "selector": "0x70a08231",
          "visibility": "public",
          "stateMutability": "view",
          "parameters": [
            { "name": "owner", "type": "address" }
          ],
          "returnValues": [
            { "name": "", "type": "uint256" }
          ],
          "calls": [
            { "target": "ERC721Lib.balanceOf", "type": "library" }
          ],
          "emits": [],
          "modifiers": [],
          "isVirtual": false
        }
      ],
      "internalFunctions": [
        {
          "name": "_update",
          "visibility": "internal",
          "stateMutability": "nonpayable",
          "parameters": [
            { "name": "to", "type": "address" },
            { "name": "tokenId", "type": "uint256" },
            { "name": "auth", "type": "address" }
          ],
          "returnValues": [
            { "name": "", "type": "address" }
          ],
          "calls": [
            { "target": "ERC721Lib.update", "type": "library" }
          ],
          "emits": [],
          "isVirtual": true
        }
      ],
      "events": [
        {
          "name": "Transfer",
          "parameters": [
            { "name": "from", "type": "address", "indexed": true },
            { "name": "to", "type": "address", "indexed": true },
            { "name": "tokenId", "type": "uint256", "indexed": true }
          ]
        }
      ],
      "errors": [
        {
          "name": "ERC721InvalidReceiver",
          "parameters": [
            { "name": "receiver", "type": "address" }
          ]
        },
        {
          "name": "ERC721IncorrectOwner",
          "parameters": [
            { "name": "sender", "type": "address" },
            { "name": "tokenId", "type": "uint256" },
            { "name": "owner", "type": "address" }
          ]
        }
      ]
    },
    {
      "name": "ERC721Lib",
      "kind": "library",
      "category": "library",
      "filePath": "contracts/sc/ERC721/libs/ERC721Lib.sol",
      "inherits": [],
      "implements": [],
      "usesLibraries": [],
      "imports": [
        "../storages/Storage.sol",
        "@openzeppelin/contracts/token/ERC721/IERC721.sol"
      ],
      "externalFunctions": [],
      "internalFunctions": [
        {
          "name": "balanceOf",
          "visibility": "internal",
          "stateMutability": "view",
          "parameters": [
            { "name": "owner", "type": "address" }
          ],
          "returnValues": [
            { "name": "", "type": "uint256" }
          ],
          "calls": [],
          "emits": [],
          "isVirtual": false
        },
        {
          "name": "update",
          "visibility": "internal",
          "stateMutability": "nonpayable",
          "parameters": [
            { "name": "to", "type": "address" },
            { "name": "tokenId", "type": "uint256" },
            { "name": "auth", "type": "address" }
          ],
          "returnValues": [
            { "name": "", "type": "address" }
          ],
          "calls": [
            { "target": "_update", "type": "internal" },
            { "target": "addTokenToAllTokensEnumeration", "type": "internal" },
            { "target": "removeTokenFromOwnerEnumeration", "type": "internal" }
          ],
          "emits": ["Transfer"],
          "isVirtual": false
        }
      ],
      "events": [],
      "errors": []
    }
  ],
  "dependencies": [
    { "from": "ERC721", "to": "IERC721", "type": "inherits" },
    { "from": "ERC721", "to": "Ownable", "type": "inherits" },
    { "from": "ERC721", "to": "ERC721Lib", "type": "uses", "functions": ["balanceOf", "update"] },
    { "from": "ERC721", "to": "LibString", "type": "uses" }
  ],
  "stats": {
    "totalContracts": 45,
    "totalLibraries": 23,
    "totalInterfaces": 18,
    "totalFunctions": 342
  }
}
```

---

## パーサー実装

### Solidityソース解析

```typescript
// src/parsers/solidityParser.ts

import { parse, visit } from '@solidity-parser/parser';
import type { Contract, FunctionCall, Parameter } from '@/types/callGraph';

interface ParseResult {
  contracts: Contract[];
  errors: string[];
}

export class SolidityParser {
  private contracts: Map<string, Contract> = new Map();
  private currentContract: string | null = null;

  async parseDirectory(files: File[]): Promise<ParseResult> {
    const errors: string[] = [];

    for (const file of files) {
      if (!file.name.endsWith('.sol')) continue;

      try {
        const content = await file.text();
        const relativePath = file.webkitRelativePath || file.name;
        this.parseFile(content, relativePath);
      } catch (e) {
        errors.push(`Failed to parse ${file.name}: ${e}`);
      }
    }

    return {
      contracts: Array.from(this.contracts.values()),
      errors,
    };
  }

  private parseFile(content: string, filePath: string): void {
    try {
      const ast = parse(content, { tolerant: true, loc: true });

      visit(ast, {
        ContractDefinition: (node) => {
          this.currentContract = node.name;
          const contract = this.processContract(node, filePath);
          this.contracts.set(node.name, contract);
        },

        FunctionDefinition: (node) => {
          if (!this.currentContract) return;
          const contract = this.contracts.get(this.currentContract);
          if (!contract) return;

          const fn = this.processFunction(node);
          if (fn.visibility === 'external' || fn.visibility === 'public') {
            contract.externalFunctions.push(fn as any);
          } else {
            contract.internalFunctions.push(fn as any);
          }
        },
      });
    } catch (e) {
      console.error(`Parse error in ${filePath}:`, e);
    }
  }

  private processContract(node: any, filePath: string): Contract {
    const inherits: string[] = [];
    const implements: string[] = [];

    for (const base of node.baseContracts || []) {
      const baseName = base.baseName.namePath;
      if (baseName.startsWith('I')) {
        implements.push(baseName);
      } else {
        inherits.push(baseName);
      }
    }

    return {
      name: node.name,
      kind: node.kind || 'contract',
      category: this.classifyCategory(filePath, node.kind),
      filePath,
      inherits,
      implements,
      usesLibraries: this.extractUsingDirectives(node),
      imports: [],  // 別途ImportDirectiveから取得
      externalFunctions: [],
      internalFunctions: [],
      events: this.extractEvents(node),
      errors: this.extractErrors(node),
    };
  }

  private processFunction(node: any): {
    name: string;
    visibility: string;
    stateMutability: string;
    parameters: Parameter[];
    returnValues: Parameter[];
    calls: FunctionCall[];
    emits: string[];
    modifiers: string[];
    isVirtual: boolean;
  } {
    const calls: FunctionCall[] = [];
    const emits: string[] = [];

    // 関数本体を走査
    this.walkNode(node.body, (child) => {
      if (child.type === 'FunctionCall') {
        const call = this.extractFunctionCall(child);
        if (call) calls.push(call);
      }
      if (child.type === 'EmitStatement') {
        const eventName = child.eventCall?.expression?.name;
        if (eventName) emits.push(eventName);
      }
    });

    return {
      name: node.name || (node.isConstructor ? 'constructor' :
                          node.isReceiveEther ? 'receive' : 'fallback'),
      visibility: node.visibility || 'public',
      stateMutability: node.stateMutability || 'nonpayable',
      parameters: (node.parameters || []).map((p: any) => ({
        name: p.name || '',
        type: this.getTypeName(p.typeName),
      })),
      returnValues: (node.returnParameters || []).map((p: any) => ({
        name: p.name || '',
        type: this.getTypeName(p.typeName),
      })),
      calls,
      emits,
      modifiers: (node.modifiers || []).map((m: any) => m.name),
      isVirtual: node.isVirtual || false,
    };
  }

  private extractFunctionCall(node: any): FunctionCall | null {
    const expr = node.expression;
    if (!expr) return null;

    // LibraryName.functionName() パターン
    if (expr.type === 'MemberAccess' && expr.expression?.type === 'Identifier') {
      return {
        target: `${expr.expression.name}.${expr.memberName}`,
        type: 'library',
      };
    }

    // this.functionName() パターン
    if (expr.type === 'MemberAccess' && expr.expression?.type === 'Identifier'
        && expr.expression.name === 'this') {
      return {
        target: expr.memberName,
        type: 'external',
      };
    }

    // super.functionName() パターン
    if (expr.type === 'MemberAccess' && expr.expression?.type === 'Identifier'
        && expr.expression.name === 'super') {
      return {
        target: `super.${expr.memberName}`,
        type: 'super',
      };
    }

    // 単純な関数呼び出し
    if (expr.type === 'Identifier') {
      return {
        target: expr.name,
        type: expr.name.startsWith('_') ? 'internal' : 'external',
      };
    }

    return null;
  }

  private extractUsingDirectives(node: any): string[] {
    const libs: string[] = [];
    for (const subNode of node.subNodes || []) {
      if (subNode.type === 'UsingForDeclaration') {
        libs.push(subNode.libraryName);
      }
    }
    return libs;
  }

  private extractEvents(node: any): Array<{ name: string; parameters: Parameter[] }> {
    const events: Array<{ name: string; parameters: Parameter[] }> = [];
    for (const subNode of node.subNodes || []) {
      if (subNode.type === 'EventDefinition') {
        events.push({
          name: subNode.name,
          parameters: (subNode.parameters || []).map((p: any) => ({
            name: p.name || '',
            type: this.getTypeName(p.typeName),
            indexed: p.isIndexed || false,
          })),
        });
      }
    }
    return events;
  }

  private extractErrors(node: any): Array<{ name: string; parameters: Parameter[] }> {
    const errors: Array<{ name: string; parameters: Parameter[] }> = [];
    for (const subNode of node.subNodes || []) {
      if (subNode.type === 'CustomErrorDefinition') {
        errors.push({
          name: subNode.name,
          parameters: (subNode.parameters || []).map((p: any) => ({
            name: p.name || '',
            type: this.getTypeName(p.typeName),
          })),
        });
      }
    }
    return errors;
  }

  private classifyCategory(filePath: string, kind: string): string {
    if (kind === 'library') return 'library';
    if (kind === 'interface') return 'interface';

    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes('/test')) return 'test';
    if (lowerPath.includes('/core/')) return 'core';
    if (lowerPath.includes('/storage')) return 'storage';
    if (lowerPath.includes('/service')) return 'service';
    if (lowerPath.includes('/proxy') || lowerPath.includes('diamond')) return 'proxy';
    if (lowerPath.includes('erc20') || lowerPath.includes('erc721') ||
        lowerPath.includes('erc1155') || lowerPath.includes('token')) return 'token';
    if (lowerPath.includes('access') || lowerPath.includes('ownable') ||
        lowerPath.includes('role')) return 'access';

    return 'other';
  }

  private getTypeName(typeNode: any): string {
    if (!typeNode) return 'unknown';
    if (typeNode.type === 'ElementaryTypeName') return typeNode.name;
    if (typeNode.type === 'UserDefinedTypeName') return typeNode.namePath;
    if (typeNode.type === 'ArrayTypeName') {
      return `${this.getTypeName(typeNode.baseTypeName)}[]`;
    }
    if (typeNode.type === 'Mapping') {
      return `mapping(${this.getTypeName(typeNode.keyType)} => ${this.getTypeName(typeNode.valueType)})`;
    }
    return 'unknown';
  }

  private walkNode(node: any, callback: (node: any) => void): void {
    if (!node) return;
    callback(node);

    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (typeof item === 'object' && item !== null) {
            this.walkNode(item, callback);
          }
        }
      } else if (typeof child === 'object' && child !== null) {
        this.walkNode(child, callback);
      }
    }
  }
}
```

### ABI パーサー

```typescript
// src/parsers/abiParser.ts

import type { HardhatArtifact, ABIItem, ABIFunction, ABIEvent, ABIError } from '@/types/hardhat';
import type { Contract, ExternalFunction, EventDefinition, ErrorDefinition } from '@/types/callGraph';

export class ABIParser {
  async parseArtifacts(files: File[]): Promise<Map<string, HardhatArtifact>> {
    const artifacts = new Map<string, HardhatArtifact>();

    for (const file of files) {
      if (!file.name.endsWith('.json') || file.name.endsWith('.dbg.json')) continue;

      try {
        const content = await file.text();
        const artifact = JSON.parse(content) as HardhatArtifact;

        if (artifact._format === 'hh-sol-artifact-1' && artifact.abi) {
          artifacts.set(artifact.contractName, artifact);
        }
      } catch (e) {
        // JSON parse error - skip
      }
    }

    return artifacts;
  }

  enrichContractWithABI(contract: Contract, artifact: HardhatArtifact): void {
    contract.abi = artifact.abi;

    // ABIからセレクタを抽出
    for (const item of artifact.abi) {
      if (item.type === 'function') {
        const fn = contract.externalFunctions.find(f => f.name === item.name);
        if (fn) {
          fn.selector = this.computeSelector(item);
        }
      }
    }

    // ABIからエラーを補完
    const abiErrors = artifact.abi.filter((item): item is ABIError => item.type === 'error');
    for (const error of abiErrors) {
      if (!contract.errors.find(e => e.name === error.name)) {
        contract.errors.push({
          name: error.name,
          parameters: error.inputs.map(p => ({
            name: p.name,
            type: p.type,
          })),
        });
      }
    }

    // ABIからイベントを補完
    const abiEvents = artifact.abi.filter((item): item is ABIEvent => item.type === 'event');
    for (const event of abiEvents) {
      if (!contract.events.find(e => e.name === event.name)) {
        contract.events.push({
          name: event.name,
          parameters: event.inputs.map(p => ({
            name: p.name,
            type: p.type,
            indexed: p.indexed,
          })),
        });
      }
    }
  }

  private computeSelector(fn: ABIFunction): string {
    const signature = `${fn.name}(${fn.inputs.map(i => i.type).join(',')})`;
    // Note: 実際の実装では keccak256 を使用
    return '0x' + signature.slice(0, 8);
  }
}
```

### 依存関係解決

```typescript
// src/parsers/inheritanceResolver.ts

import type { Contract, Dependency } from '@/types/callGraph';

export class InheritanceResolver {
  private contracts: Map<string, Contract>;

  constructor(contracts: Contract[]) {
    this.contracts = new Map(contracts.map(c => [c.name, c]));
  }

  resolve(): Dependency[] {
    const deps: Dependency[] = [];

    for (const [name, contract] of this.contracts) {
      // 継承関係
      for (const parent of contract.inherits) {
        deps.push({
          from: name,
          to: parent,
          type: 'inherits',
        });
      }

      // インターフェース実装
      for (const iface of contract.implements) {
        deps.push({
          from: name,
          to: iface,
          type: 'implements',
        });
      }

      // ライブラリ使用
      for (const lib of contract.usesLibraries) {
        deps.push({
          from: name,
          to: lib,
          type: 'uses',
        });
      }

      // 関数呼び出しからライブラリ使用を検出
      const libCalls = this.extractLibraryCalls(contract);
      for (const [lib, functions] of libCalls) {
        if (!deps.find(d => d.from === name && d.to === lib && d.type === 'uses')) {
          deps.push({
            from: name,
            to: lib,
            type: 'uses',
            functions,
          });
        }
      }
    }

    return deps;
  }

  private extractLibraryCalls(contract: Contract): Map<string, string[]> {
    const libCalls = new Map<string, string[]>();

    const allFunctions = [...contract.externalFunctions, ...contract.internalFunctions];

    for (const fn of allFunctions) {
      for (const call of fn.calls) {
        if (call.type === 'library' && call.target.includes('.')) {
          const [lib, funcName] = call.target.split('.');
          const existing = libCalls.get(lib) || [];
          if (!existing.includes(funcName)) {
            existing.push(funcName);
            libCalls.set(lib, existing);
          }
        }
      }
    }

    return libCalls;
  }

  /**
   * 継承チェーンを解決し、オーバーライド情報を付与
   */
  resolveOverrides(): void {
    for (const [name, contract] of this.contracts) {
      for (const fn of contract.externalFunctions) {
        fn.overrides = this.findOverriddenFunctions(contract, fn.name);
      }
    }
  }

  private findOverriddenFunctions(contract: Contract, fnName: string): string[] {
    const overrides: string[] = [];

    const visitParent = (parentName: string) => {
      const parent = this.contracts.get(parentName);
      if (!parent) return;

      const parentFn = parent.externalFunctions.find(f => f.name === fnName);
      if (parentFn?.isVirtual) {
        overrides.push(parentName);
      }

      for (const grandparent of parent.inherits) {
        visitParent(grandparent);
      }
    };

    for (const parent of contract.inherits) {
      visitParent(parent);
    }

    return overrides;
  }
}
```

---

## コンポーネント実装

### ディレクトリアップロード

```tsx
// src/components/Upload/DirectoryPicker.tsx

import { useCallback, useState } from 'react';
import { FolderOpen, Upload, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { SolidityParser } from '@/parsers/solidityParser';
import { ABIParser } from '@/parsers/abiParser';
import { InheritanceResolver } from '@/parsers/inheritanceResolver';

export function DirectoryPicker() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, file: '' });
  const [error, setError] = useState<string | null>(null);
  const { setCallGraph } = useProjectStore();

  const handleDirectorySelect = useCallback(async () => {
    try {
      // File System Access API
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
      });

      setIsLoading(true);
      setError(null);

      const files = await collectFiles(dirHandle);
      setProgress({ current: 0, total: files.length, file: '' });

      // Solidityファイルを解析
      const solParser = new SolidityParser();
      const solFiles = files.filter(f => f.name.endsWith('.sol'));
      const { contracts, errors } = await solParser.parseDirectory(solFiles);

      if (errors.length > 0) {
        console.warn('Parse errors:', errors);
      }

      // ABIファイルを解析
      const abiParser = new ABIParser();
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      const artifacts = await abiParser.parseArtifacts(jsonFiles);

      // ABIでコントラクト情報を補完
      for (const contract of contracts) {
        const artifact = artifacts.get(contract.name);
        if (artifact) {
          abiParser.enrichContractWithABI(contract, artifact);
        }
      }

      // 依存関係を解決
      const resolver = new InheritanceResolver(contracts);
      const dependencies = resolver.resolve();
      resolver.resolveOverrides();

      // ディレクトリ構造を構築
      const structure = buildDirectoryStructure(files, contracts);

      const callGraph = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        projectName: dirHandle.name,
        structure,
        contracts,
        dependencies,
        stats: {
          totalContracts: contracts.filter(c => c.kind === 'contract').length,
          totalLibraries: contracts.filter(c => c.kind === 'library').length,
          totalInterfaces: contracts.filter(c => c.kind === 'interface').length,
          totalFunctions: contracts.reduce(
            (sum, c) => sum + c.externalFunctions.length + c.internalFunctions.length,
            0
          ),
        },
      };

      setCallGraph(callGraph);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [setCallGraph]);

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-600 rounded-xl bg-gray-900/50">
      <FolderOpen className="w-16 h-16 text-gray-500 mb-4" />

      <h2 className="text-xl font-bold text-white mb-2">
        プロジェクトを選択
      </h2>

      <p className="text-gray-400 text-center mb-6 max-w-md">
        contracts/ と artifacts/ ディレクトリを含むプロジェクトフォルダを選択してください。
        Solidityソースコードから関数呼び出しグラフを自動生成します。
      </p>

      <button
        onClick={handleDirectorySelect}
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700
                   text-white rounded-lg font-medium transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            解析中... ({progress.current}/{progress.total})
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            フォルダを選択
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 mt-4 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <p className="text-gray-500 text-sm mt-6">
        対応フレームワーク: Hardhat, Foundry
      </p>
    </div>
  );
}

async function collectFiles(
  dirHandle: FileSystemDirectoryHandle,
  path = ''
): Promise<File[]> {
  const files: File[] = [];

  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;

    if (entry.kind === 'file') {
      const file = await entry.getFile();
      // webkitRelativePath をシミュレート
      Object.defineProperty(file, 'webkitRelativePath', {
        value: entryPath,
        writable: false,
      });
      files.push(file);
    } else if (entry.kind === 'directory') {
      // node_modules と .git をスキップ
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const subFiles = await collectFiles(entry, entryPath);
      files.push(...subFiles);
    }
  }

  return files;
}

function buildDirectoryStructure(files: File[], contracts: Contract[]): DirectoryNode {
  const contractMap = new Map(contracts.map(c => [c.filePath, c.name]));
  const root: DirectoryNode = { name: 'contracts', type: 'directory', path: 'contracts', children: [] };

  for (const file of files) {
    if (!file.webkitRelativePath.includes('contracts/')) continue;

    const parts = file.webkitRelativePath.split('/');
    let current = root;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.children!.push({
          name: part,
          type: 'file',
          path: file.webkitRelativePath,
          contractName: contractMap.get(file.webkitRelativePath),
        });
      } else {
        let child = current.children!.find(c => c.name === part && c.type === 'directory');
        if (!child) {
          child = {
            name: part,
            type: 'directory',
            path: parts.slice(0, i + 1).join('/'),
            children: [],
          };
          current.children!.push(child);
        }
        current = child;
      }
    }
  }

  return root;
}
```

### 検索機能

```tsx
// src/components/Search/SearchBar.tsx

import { useState, useMemo, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useDiagramStore } from '@/stores/diagramStore';
import type { Contract, ExternalFunction } from '@/types/callGraph';

interface SearchResult {
  type: 'contract' | 'function' | 'event' | 'error';
  contract: Contract;
  item?: ExternalFunction;
  name: string;
  path: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'contract' | 'function' | 'event'>('all');

  const { callGraph, selectContract, selectFunction } = useDiagramStore();

  const results = useMemo<SearchResult[]>(() => {
    if (!callGraph || query.length < 2) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const contract of callGraph.contracts) {
      // コントラクト名検索
      if (filter === 'all' || filter === 'contract') {
        if (contract.name.toLowerCase().includes(q)) {
          results.push({
            type: 'contract',
            contract,
            name: contract.name,
            path: contract.filePath,
          });
        }
      }

      // 関数検索
      if (filter === 'all' || filter === 'function') {
        for (const fn of contract.externalFunctions) {
          if (fn.name.toLowerCase().includes(q)) {
            results.push({
              type: 'function',
              contract,
              item: fn,
              name: `${contract.name}.${fn.name}()`,
              path: contract.filePath,
            });
          }
        }
      }

      // イベント検索
      if (filter === 'all' || filter === 'event') {
        for (const event of contract.events) {
          if (event.name.toLowerCase().includes(q)) {
            results.push({
              type: 'event',
              contract,
              name: `${contract.name}.${event.name}`,
              path: contract.filePath,
            });
          }
        }
      }
    }

    return results.slice(0, 20);  // 上位20件
  }, [callGraph, query, filter]);

  const handleSelect = useCallback((result: SearchResult) => {
    selectContract(result.contract.name);
    if (result.item) {
      selectFunction(result.item);
    }
    setQuery('');
    setIsOpen(false);
  }, [selectContract, selectFunction]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="コントラクト、関数を検索..."
          className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-64"
        />
        {query && (
          <button onClick={() => setQuery('')}>
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-h-96 overflow-auto z-50">
          {/* フィルター */}
          <div className="flex gap-2 p-2 border-b border-gray-700">
            {(['all', 'contract', 'function', 'event'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-xs ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f === 'all' ? 'すべて' : f}
              </button>
            ))}
          </div>

          {/* 結果 */}
          {results.map((result, i) => (
            <button
              key={`${result.name}-${i}`}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-3"
            >
              <span className={`text-xs px-2 py-0.5 rounded ${
                result.type === 'contract' ? 'bg-blue-600' :
                result.type === 'function' ? 'bg-green-600' :
                'bg-yellow-600'
              }`}>
                {result.type}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{result.name}</div>
                <div className="text-gray-500 text-xs truncate">{result.path}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 状態管理

```typescript
// src/stores/projectStore.ts

import { create } from 'zustand';
import type { CallGraph } from '@/types/callGraph';

interface ProjectState {
  callGraph: CallGraph | null;
  isLoading: boolean;
  error: string | null;

  setCallGraph: (data: CallGraph) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  callGraph: null,
  isLoading: false,
  error: null,

  setCallGraph: (data) => set({ callGraph: data, error: null }),
  reset: () => set({ callGraph: null, isLoading: false, error: null }),
}));
```

```typescript
// src/stores/diagramStore.ts

import { create } from 'zustand';
import type { Contract, ExternalFunction } from '@/types/callGraph';

interface DiagramState {
  // 選択状態
  selectedContract: string | null;
  selectedFunction: ExternalFunction | null;
  highlightedContracts: Set<string>;

  // 表示設定
  showLibraries: boolean;
  showInterfaces: boolean;
  showTestContracts: boolean;
  layoutMode: 'horizontal' | 'vertical' | 'radial' | 'force';

  // フィルター
  categoryFilter: string[];
  searchQuery: string;

  // アクション
  selectContract: (name: string | null) => void;
  selectFunction: (fn: ExternalFunction | null) => void;
  setHighlightedContracts: (names: string[]) => void;
  toggleLibraries: () => void;
  toggleInterfaces: () => void;
  toggleTestContracts: () => void;
  setLayoutMode: (mode: 'horizontal' | 'vertical' | 'radial' | 'force') => void;
  setCategoryFilter: (categories: string[]) => void;
  setSearchQuery: (query: string) => void;
}

export const useDiagramStore = create<DiagramState>((set) => ({
  selectedContract: null,
  selectedFunction: null,
  highlightedContracts: new Set(),
  showLibraries: true,
  showInterfaces: false,
  showTestContracts: false,
  layoutMode: 'horizontal',
  categoryFilter: [],
  searchQuery: '',

  selectContract: (name) => set({ selectedContract: name, selectedFunction: null }),
  selectFunction: (fn) => set({ selectedFunction: fn }),
  setHighlightedContracts: (names) => set({ highlightedContracts: new Set(names) }),
  toggleLibraries: () => set((s) => ({ showLibraries: !s.showLibraries })),
  toggleInterfaces: () => set((s) => ({ showInterfaces: !s.showInterfaces })),
  toggleTestContracts: () => set((s) => ({ showTestContracts: !s.showTestContracts })),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setCategoryFilter: (categories) => set({ categoryFilter: categories }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
```

---

## 設定ファイル

### package.json

```json
{
  "name": "sol-flow",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "reactflow": "^11.11.4",
    "zustand": "^4.5.5",
    "framer-motion": "^11.11.17",
    "lucide-react": "^0.468.0",
    "clsx": "^2.1.1",
    "@tanstack/react-virtual": "^3.10.8"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "@solidity-parser/parser": "^0.18.0"
  }
}
```

---

## デプロイ

### GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 実装優先順位

| 優先度 | 機能 | 説明 |
|--------|------|------|
| **P0** | ディレクトリアップロード | File System Access APIでディレクトリ選択 |
| **P0** | Solidityパーサー | AST解析で関数・継承関係を抽出 |
| **P0** | ABIパーサー | Hardhat artifacts から関数シグネチャ/イベント/エラー抽出 |
| **P0** | 基本グラフ表示 | React Flowでコントラクト依存関係を表示 |
| **P1** | 継承関係の可視化 | inherits/implements をエッジで表現 |
| **P1** | 関数フローモーダル | 関数クリックで呼び出しチェーン表示 |
| **P1** | サイドバー（ツリービュー） | ディレクトリ構造とコントラクト一覧 |
| **P1** | 検索・フィルター | コントラクト/関数/イベント検索 |
| **P2** | 大規模対応 | 仮想化、遅延ロード、クラスタリング |
| **P2** | エラー/イベント表示 | コントラクト詳細パネル |
| **P2** | レイアウト切替 | horizontal/vertical/radial/force |
| **P3** | PNG/SVGエクスポート | 画像として保存 |
| **P3** | JSON保存/読み込み | call-graph.jsonとして保存 |
| **P3** | ダークモード切替 | テーマ設定 |

---

## 対応フレームワーク

| フレームワーク | ソースパス | アーティファクトパス | 対応状況 |
|---------------|-----------|---------------------|---------|
| Hardhat | `contracts/` | `artifacts/` | 対応予定 |
| Foundry | `src/` or `contracts/` | `out/` | 対応予定 |
| Truffle | `contracts/` | `build/contracts/` | 将来対応 |
