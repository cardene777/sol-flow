# Sol-Flow パーサー

Sol-FlowがSolidityソースコードをパースする方法の技術ドキュメント。

## 目次

- [概要](#概要)
- [パーサーライブラリ](#パーサーライブラリ)
- [パース処理](#パース処理)
- [コントラクト抽出](#コントラクト抽出)
- [関数解析](#関数解析)
- [コールグラフ構築](#コールグラフ構築)
- [カテゴリ分類](#カテゴリ分類)

---

## 概要

Sol-Flowは`@solidity-parser/parser`ライブラリを使用してSolidityソースファイルを抽象構文木（AST）にパースし、可視化のための構造化データを抽出します。

### データフロー

```
Solidityファイル（.sol）
        │
        ▼
┌───────────────────┐
│ @solidity-parser  │  AST生成
│     /parser       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ solidityParser.ts │  Contract/Function抽出
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│callGraphBuilder.ts│  依存関係検出
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    CallGraph      │  最終データ構造
└───────────────────┘
```

---

## パーサーライブラリ

Sol-Flowは`@solidity-parser/parser`を以下のオプションで使用:

```typescript
const ast = parse(content, {
  tolerant: true,  // エラーがあっても解析を続行
  loc: true,       // 行/列の位置情報を含む
  range: true,     // 文字範囲を含む
});
```

### トレラントモード

トレラントモードにより、不完全または構文的に正しくないファイルのパースが可能:
- 作成中のコントラクト
- 軽微な構文エラーを含むファイル
- 部分的なコントラクト解析

---

## パース処理

### エントリポイント

```typescript
function parseSolidityFile(filePath: string, content: string): ParsedFile {
  const contracts: Contract[] = [];

  const ast = parse(content, { tolerant: true, loc: true, range: true });

  // ファイルレベルのインポートを解析
  const fileImports = parseImports(ast, filePath);

  // 各コントラクト定義を処理
  for (const node of ast.children) {
    if (node.type === 'ContractDefinition') {
      const contract = parseContractDefinition(node, content, filePath, fileImports);
      contracts.push(contract);
    }
  }

  return { contracts, sourceCode: content };
}
```

### インポート解析

複数のインポートスタイルに対応:

```solidity
// 名前付きインポート
import {Name} from "path";
import {Name as Alias} from "path";

// 名前空間インポート
import * as Name from "path";

// ベアインポート
import "path";
```

```typescript
interface ImportInfo {
  name: string;        // インポートされるシンボル名
  alias?: string;      // オプションのエイリアス
  path: string;        // インポートパス
  isExternal: boolean; // 外部依存（@openzeppelin等）
}
```

---

## コントラクト抽出

### コントラクト定義の処理

各`ContractDefinition`ノードから以下を抽出:

1. **基本情報**
   - 名前、種類（contract/interface/library/abstract）
   - ファイルパス

2. **継承**
   - 親コントラクト（`inherits`）
   - 実装インターフェース（`implements`）
   - ヒューリスティック: 'I'で始まり2文字目が大文字の名前はインターフェース

3. **コントラクト本体**
   - 関数（external、internal）
   - イベント
   - エラー
   - 構造体
   - 状態変数
   - using宣言（ライブラリ使用）

### 状態変数の処理

状態変数は以下の情報と共にパース:
- 型解決（mapping、配列を含む）
- 可視性（public/private/internal）
- constant/immutableフラグ

```typescript
interface StateVariable {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'internal';
  isConstant?: boolean;
  isImmutable?: boolean;
}
```

変数の型は外部呼び出しターゲットの解決に使用されます。

---

## 関数解析

### 関数抽出

各関数に対して:

```typescript
function parseFunctionDefinition(
  node: FunctionDefinition,
  sourceCode: string,
  variableTypeMap: Map<string, string>
): ExternalFunction | InternalFunction | null
```

**スキップされる関数:**
- コンストラクタ
- フォールバック関数
- receive関数

### 呼び出し抽出

パーサーは関数本体のASTを走査して呼び出しを抽出:

```typescript
function extractCallsAndEmits(
  node: any,
  calls: FunctionCall[],
  emits: string[],
  variableTypeMap: Map<string, string>
)
```

### 呼び出しタイプ

| タイプ | パターン | 例 |
|--------|---------|-----|
| `internal` | 直接呼び出し | `_transfer(...)` |
| `library` | 修飾付き呼び出し | `SafeMath.add(...)` |
| `external` | メンバーアクセス | `token.transfer(...)` |
| `super` | super呼び出し | `super.initialize(...)` |
| `delegatecall` | 低レベル | `addr.delegatecall(...)` |

### 型解決

変数の型を追跡して外部呼び出しターゲットを解決:

```typescript
// 状態変数
IERC20 public token;

// 関数呼び出し
token.transfer(to, amount);
// → targetType: "IERC20"
```

---

## コールグラフ構築

### buildCallGraph関数

```typescript
function buildCallGraph(
  projectName: string,
  contracts: Contract[]
): CallGraph
```

### 処理ステップ

1. **プロキシ検出**
   - プロキシパターンを識別（ERC-7546、UUPS、Diamond等）
   - 関連コントラクトをグループ化
   - `proxyPattern`、`proxyRole`、`proxyGroupId`を設定

2. **継承関数の解決**
   - 継承階層を走査
   - 継承関数を子コントラクトに追加
   - `inheritedFrom`フィールドをマーク

3. **依存関係検出**
   - 継承関係
   - インターフェース実装
   - ライブラリ使用
   - delegatecall関係

4. **統計計算**
   - コントラクト、ライブラリ、インターフェースをカウント
   - 総関数数をカウント

---

## カテゴリ分類

### 動的カテゴリ割り当て

カテゴリはファイルパスから決定:

```typescript
function determineCategory(
  name: string,
  inherits: string[],
  kind: ContractKind,
  filePath: string
): ContractCategory
```

### カテゴリパターン

| パスパターン | カテゴリ |
|-------------|---------|
| `@openzeppelin/contracts/.../access/` | `OpenZeppelin/access` |
| `@openzeppelin/contracts-upgradeable/.../proxy/` | `OZ-Upgradeable/proxy` |
| `solady/src/auth/` | `Solady/auth` |
| `@teleporter/...` | `teleporter` |
| （interface種類） | `interface` |
| （library種類） | `library` |
| （不明） | `other` |

### Avalanche ICMリマッピング

Avalanche ICMパスの特別処理:

```typescript
const avalancheRemappings = {
  '@teleporter': 'teleporter',
  '@utilities': 'utilities',
  '@subnet-evm': 'subnet-evm',
  '@ictt': 'ictt',
  '@validator-manager': 'validator-manager',
};
```

---

## セレクタ計算

external/public関数のセレクタを計算:

```typescript
function computeSelector(signature: string): string {
  // 表示用の単純なハッシュベース計算
  // 暗号学的に正しくない（keccak256ではなく単純なハッシュを使用）
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
}
```

注: これは表示目的のみで、実際のABI計算ではありません。

---

## フィルターオプション

### 利用可能なフィルター

```typescript
interface FilterOptions {
  excludeInterfaces?: boolean;  // デフォルト: false
  excludeLibraries?: boolean;   // デフォルト: false
  excludeMocks?: boolean;       // デフォルト: true
  excludeStorages?: boolean;    // デフォルト: false
}
```

### 除外ルール

- **Mockコントラクト**: 名前に"mock"を含む
- **Storageコントラクト**: 名前が"storage"で終わるか`/storage/`パス内
