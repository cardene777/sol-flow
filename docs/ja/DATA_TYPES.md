# Sol-Flow データ型

Sol-FlowのTypeScript型定義の完全リファレンス。

## 目次

- [CallGraph](#callgraph)
- [Contract](#contract)
- [関数](#関数)
- [Dependency](#dependency)
- [プロキシ型](#プロキシ型)
- [補助型](#補助型)

---

## CallGraph

パースされたSolidityプロジェクトを表すルートデータ構造。

```typescript
interface CallGraph {
  version: string;           // スキーマバージョン（例: "1.0.0"）
  generatedAt: string;       // ISOタイムスタンプ
  projectName: string;       // プロジェクト名
  structure: DirectoryNode;  // ファイル/ディレクトリツリー
  contracts: Contract[];     // パース済みコントラクト一覧
  dependencies: Dependency[]; // コントラクト間の関係
  proxyGroups: ProxyGroup[]; // 検出されたプロキシパターン
  stats: Stats;              // 統計サマリー
  userEdges?: UserEdge[];    // ユーザー追加エッジ（編集モード）
  deletedEdgeIds?: string[]; // 削除されたエッジID
}
```

### Stats

```typescript
interface Stats {
  totalContracts: number;   // Contract + abstract数
  totalLibraries: number;   // ライブラリ数
  totalInterfaces: number;  // インターフェース数
  totalFunctions: number;   // 総関数数
}
```

---

## Contract

単一のSolidityコントラクト、インターフェース、またはライブラリを表します。

```typescript
interface Contract {
  name: string;                        // コントラクト名
  kind: ContractKind;                  // コントラクトの種類
  category: ContractCategory;          // 分類カテゴリ
  filePath: string;                    // ソースファイルパス
  inherits: string[];                  // 親コントラクト
  implements: string[];                // 実装インターフェース
  usesLibraries: string[];             // 使用ライブラリ
  imports: ImportInfo[];               // import文
  externalFunctions: ExternalFunction[];
  internalFunctions: InternalFunction[];
  events: EventDefinition[];
  errors: ErrorDefinition[];
  structs?: StructDefinition[];
  stateVariables?: StateVariable[];

  // プロキシパターンフィールド
  proxyPattern?: ProxyPatternType;
  proxyRole?: ProxyRole;
  proxyGroupId?: string;

  // 外部ライブラリフィールド
  isExternalLibrary?: boolean;
  librarySource?: 'openzeppelin' | 'openzeppelin-upgradeable' | 'solady' | 'avalanche-icm';

  // ソースコード
  sourceCode?: string;                 // 完全なファイル内容
}
```

### ContractKind

```typescript
type ContractKind = 'contract' | 'library' | 'interface' | 'abstract';
```

### ContractCategory

ディレクトリ構造から動的に決定:

```typescript
type ContractCategory = string;

// 一般的なカテゴリ:
// - 'OpenZeppelin/access'
// - 'OpenZeppelin/token'
// - 'OZ-Upgradeable/proxy'
// - 'Solady/auth'
// - 'teleporter'
// - 'interface'
// - 'library'
// - 'other'
```

---

## 関数

### ExternalFunction

`external`または`public`可視性を持つ関数。

```typescript
interface ExternalFunction {
  name: string;
  signature: string;         // 例: "transfer(address,uint256)"
  selector: string;          // 4バイトセレクタ（例: "0xa9059cbb"）
  visibility: 'external' | 'public';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  parameters: Parameter[];
  returnValues: ReturnValue[];
  calls: FunctionCall[];     // 呼び出す関数
  emits: string[];           // 発行イベント
  modifiers: string[];       // 適用モディファイア
  overrides?: string[];      // オーバーライド対象コントラクト
  isVirtual: boolean;
  sourceCode?: string;       // 関数ソースコード
  startLine?: number;
  inheritedFrom?: string;    // 継承元の親コントラクト名
}
```

### InternalFunction

`internal`または`private`可視性を持つ関数。

```typescript
interface InternalFunction {
  name: string;
  visibility: 'internal' | 'private';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  parameters: Parameter[];
  returnValues: ReturnValue[];
  calls: FunctionCall[];
  emits: string[];
  isVirtual: boolean;
  sourceCode?: string;
  startLine?: number;
  inheritedFrom?: string;
}
```

### FunctionCall

別の関数への呼び出しを表します。

```typescript
interface FunctionCall {
  target: string;            // 関数/コントラクト名
  type: 'internal' | 'library' | 'external' | 'modifier' | 'super' | 'delegatecall';
  targetType?: string;       // ターゲット変数の解決済み型
  argCount?: number;         // オーバーロードマッチング用の引数数
  condition?: string;        // if/else内の条件
  sourceLocation?: {
    start: number;
    end: number;
  };
}
```

---

## Dependency

2つのコントラクト間の関係を表します。

```typescript
interface Dependency {
  from: string;              // ソースコントラクト名
  to: string;                // ターゲットコントラクト名
  type: DependencyType;
  functions?: string[];      // 使用される特定の関数
}

type DependencyType =
  | 'uses'        // ライブラリ使用
  | 'inherits'    // 継承
  | 'implements'  // インターフェース実装
  | 'imports'     // インポート依存
  | 'delegatecall' // delegatecall関係
  | 'registers';  // ディクショナリ登録（ERC-7546）
```

---

## プロキシ型

### ProxyPatternType

```typescript
type ProxyPatternType =
  | 'eip7546'      // Meta Contract / Borderless
  | 'uups'         // UUPS Upgradeable
  | 'transparent'  // Transparent Proxy
  | 'diamond'      // EIP-2535 Diamond
  | 'beacon';      // Beacon Proxy
```

### ProxyRole

```typescript
type ProxyRole =
  | 'proxy'          // ユーザー向けプロキシ
  | 'dictionary'     // レジストリ（ERC-7546）
  | 'implementation' // ロジックコントラクト
  | 'beacon'         // ビーコンコントラクト
  | 'facet';         // Diamondファセット
```

### ProxyGroup

関連するプロキシコントラクトをグループ化。

```typescript
interface ProxyGroup {
  id: string;
  name: string;
  patternType: ProxyPatternType;
  proxy?: string;            // プロキシコントラクト名
  dictionary?: string;       // ディクショナリコントラクト（ERC-7546）
  implementations: string[]; // 実装コントラクト
  beacon?: string;           // ビーコンコントラクト
}
```

---

## 補助型

### Parameter

```typescript
interface Parameter {
  name: string;
  type: string;
  indexed?: boolean;         // イベントパラメータ用
}
```

### ReturnValue

```typescript
interface ReturnValue {
  name: string;
  type: string;
}
```

### EventDefinition

```typescript
interface EventDefinition {
  name: string;
  parameters: Parameter[];
  startLine?: number;
}
```

### ErrorDefinition

```typescript
interface ErrorDefinition {
  name: string;
  parameters: Parameter[];
  startLine?: number;
}
```

### StructDefinition

```typescript
interface StructDefinition {
  name: string;
  members: Parameter[];
  startLine?: number;
}
```

### StateVariable

```typescript
interface StateVariable {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'internal';
  isConstant?: boolean;
  isImmutable?: boolean;
  startLine?: number;
}
```

### ImportInfo

```typescript
interface ImportInfo {
  name: string;        // インポート名（例: "StorageSlot"）
  alias?: string;      // エイリアス（例: "ERC721Storage"としてインポート）
  path: string;        // インポートパス
  isExternal: boolean; // @で始まるか外部依存かどうか
}
```

### DirectoryNode

```typescript
interface DirectoryNode {
  name: string;
  type: 'directory' | 'file';
  path: string;
  children?: DirectoryNode[];
  contractName?: string;     // ファイルノード用
}
```

### UserEdge

編集モードでのユーザー追加エッジ。

```typescript
interface UserEdge {
  id: string;
  from: string;
  to: string;
  type: DependencyType;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
  createdAt: string;        // ISOタイムスタンプ
}
```
