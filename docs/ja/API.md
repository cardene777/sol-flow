# Sol-Flow APIリファレンス

## エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/parse` | Solidityファイルをパース |
| GET | `/api/libraries` | 利用可能なライブラリ一覧 |
| GET | `/api/libraries/[id]` | 特定ライブラリのCallGraph取得 |
| GET | `/api/libraries/default` | デフォルトライブラリ取得 |

---

## POST /api/parse

Solidityファイルをパースし、CallGraphを生成します。

### リクエスト

```typescript
{
  files: Array<{
    path: string;     // ファイルパス
    content: string;  // ファイル内容
  }>;
  projectName: string;  // プロジェクト名
}
```

### レスポンス

```typescript
{
  callGraph: CallGraph;
}
```

### 使用例

```javascript
const response = await fetch('/api/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: [
      { path: 'contracts/Token.sol', content: 'pragma solidity...' },
      { path: 'contracts/Access.sol', content: 'pragma solidity...' }
    ],
    projectName: 'MyProject'
  })
});

const { callGraph } = await response.json();
```

---

## GET /api/libraries

利用可能なプリパース済みライブラリの一覧を取得します。

### レスポンス

```typescript
{
  libraries: Array<{
    id: string;
    name: string;
    version: string;
  }>;
}
```

### 使用例

```javascript
const response = await fetch('/api/libraries');
const { libraries } = await response.json();
// [
//   { id: 'openzeppelin', name: 'OpenZeppelin Contracts', version: '5.0.0' },
//   { id: 'openzeppelin-upgradeable', name: 'OpenZeppelin Upgradeable', version: '5.0.0' },
//   { id: 'solady', name: 'Solady', version: 'latest' },
//   { id: 'avalanche-teleporter', name: 'Avalanche Teleporter', version: 'latest' },
//   { id: 'avalanche-ictt', name: 'Avalanche ICTT', version: 'latest' },
//   { id: 'avalanche-validator-manager', name: 'Avalanche Validator Manager', version: 'latest' }
// ]
```

---

## GET /api/libraries/[id]

特定のライブラリのCallGraphを取得します。

### パラメータ

| 名前 | 型 | 説明 |
|------|-----|------|
| id | string | ライブラリID |

### 利用可能なライブラリID

| ID | ライブラリ |
|----|----------|
| `openzeppelin` | OpenZeppelin Contracts |
| `openzeppelin-upgradeable` | OpenZeppelin Upgradeable |
| `solady` | Solady |
| `avalanche-teleporter` | Avalanche Teleporter |
| `avalanche-ictt` | Avalanche ICTT |
| `avalanche-validator-manager` | Avalanche Validator Manager |

### レスポンス

```typescript
{
  library: {
    id: string;
    name: string;
    version: string;
  };
  callGraph: CallGraph;
}
```

### 使用例

```javascript
const response = await fetch('/api/libraries/openzeppelin');
const { library, callGraph } = await response.json();
```

---

## GET /api/libraries/default

デフォルトライブラリ（OpenZeppelin）を取得します。

### レスポンス

`GET /api/libraries/openzeppelin`と同じ。

---

## データ型

### CallGraph

完全な型定義は[DATA_TYPES.md](./DATA_TYPES.md)をご覧ください。

```typescript
interface CallGraph {
  version: string;
  generatedAt: string;
  projectName: string;
  structure: DirectoryNode;
  contracts: Contract[];
  dependencies: Dependency[];
  proxyGroups: ProxyGroup[];
  stats: Stats;
  userEdges?: UserEdge[];
  deletedEdgeIds?: string[];
}
```

### Contract

```typescript
interface Contract {
  name: string;
  filePath: string;
  kind: 'contract' | 'interface' | 'library' | 'abstract';
  inherits: string[];
  implements: string[];
  usesLibraries: string[];
  imports: ImportInfo[];
  externalFunctions: ExternalFunction[];
  internalFunctions: InternalFunction[];
  events: EventDefinition[];
  errors: ErrorDefinition[];
  structs?: StructDefinition[];
  stateVariables?: StateVariable[];
  category: ContractCategory;
  proxyPattern?: ProxyPatternType;
  proxyRole?: ProxyRole;
  proxyGroupId?: string;
  isExternalLibrary?: boolean;
  librarySource?: string;
  sourceCode?: string;
}
```

### Dependency

```typescript
interface Dependency {
  from: string;
  to: string;
  type: DependencyType;
  functions?: string[];
}

type DependencyType =
  | 'inherits'
  | 'implements'
  | 'uses'
  | 'delegatecall'
  | 'registers'
  | 'imports';
```

### ProxyPatternType

```typescript
type ProxyPatternType =
  | 'eip7546'
  | 'uups'
  | 'transparent'
  | 'diamond'
  | 'beacon';
```

### ProxyRole

```typescript
type ProxyRole =
  | 'proxy'
  | 'dictionary'
  | 'implementation'
  | 'beacon'
  | 'facet';
```

---

## エラーレスポンス

すべてのエンドポイントは、エラー時に以下の形式でレスポンスを返します:

```typescript
{
  error: string;  // エラーメッセージ
}
```

### HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 400 | リクエスト不正 |
| 404 | リソースが見つからない |
| 500 | サーバーエラー |

### エラー例

**400 Bad Request**
```json
{
  "error": "Missing required field: files"
}
```

**404 Not Found**
```json
{
  "error": "Library not found: invalid-id"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to parse Solidity files"
}
```
