# Sol-Flow API リファレンス

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

### CallGraph型

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
}

interface Contract {
  name: string;
  filePath: string;
  kind: 'contract' | 'interface' | 'library' | 'abstract';
  inherits: string[];
  implements: string[];
  imports: string[];
  functions: FunctionInfo[];
  category: ContractCategory;
  proxyPattern?: ProxyPatternType;
  proxyRole?: ProxyRole;
  proxyGroupId?: string;
}

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

type ContractCategory =
  | 'access'
  | 'account'
  | 'finance'
  | 'governance'
  | 'metatx'
  | 'proxy'
  | 'token'
  | 'utils'
  | 'interface'
  | 'library'
  | 'other';

type ProxyPatternType =
  | 'eip7546'
  | 'uups'
  | 'transparent'
  | 'diamond'
  | 'beacon';

type ProxyRole =
  | 'proxy'
  | 'dictionary'
  | 'implementation'
  | 'storage';
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

利用可能な事前パース済みライブラリの一覧を取得します。

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
//   { id: 'solady', name: 'Solady', version: 'latest' }
// ]
```

---

## GET /api/libraries/[id]

特定のライブラリのCallGraphを取得します。

### パラメータ

| 名前 | 型 | 説明 |
|------|-----|------|
| id | string | ライブラリID (`openzeppelin`, `openzeppelin-upgradeable`, `solady`) |

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

デフォルトライブラリ (OpenZeppelin) のCallGraphを取得します。

### レスポンス

`GET /api/libraries/openzeppelin` と同じ。

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
