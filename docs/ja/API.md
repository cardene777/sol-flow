# Sol-Flow データリファレンス

Sol-Flowは、全ての処理をブラウザの中で行います。
GitHub Pagesの[https://sol-flow.cardene.dev](https://sol-flow.cardene.dev)から静的なfileとして配られ、サーバーのAPIを持ちません。

## 一覧

| 種類 | パス | 説明 |
|------|------|------|
| 静的なfile | `/libraries/<id>.json` | ライブラリ1つ分の、事前に作ったCallGraph |
| Web Worker | `app/src/workers/parse.worker.ts` | アップロードしたSolidityファイルをブラウザの中で解析する |

---

## ライブラリのfile `/libraries/<id>.json`

`pnpm build`は、ライブラリごとに1つのJSONファイルを`app/out/libraries/`へ書き出します。
各fileは、`app/src/app/libraries/[file]/route.ts`が`app/src/lib/libraryGraph.ts`の`buildLibraryGraph()`で作ります。
サンプルのライブラリは、`import`しているライブラリの契約も含みます。
たとえば`sample-uups`は、OpenZeppelin Upgradeableの契約を含みます。

### 利用可能なライブラリID

| ID | ライブラリ |
|----|-----------|
| `openzeppelin` | OpenZeppelin Contracts |
| `openzeppelin-upgradeable` | OpenZeppelin Upgradeable |
| `solady` | Solady |
| `sample-uups` | UUPSプロキシのサンプル |
| `sample-transparent` | Transparentプロキシのサンプル |
| `sample-diamond` | Diamondプロキシのサンプル |
| `sample-beacon` | Beaconプロキシのサンプル |
| `sample-erc7546` | ERC-7546プロキシのサンプル |

### fileの中身

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

### 例

```javascript
const response = await fetch('/libraries/openzeppelin.json');
const { library, callGraph } = await response.json();
```

---

## アップロードしたfileをWeb Workerで解析する

アップロード画面と再読み込みのボタンは、`app/src/lib/parseInWorker.ts`の`parseInWorker()`を呼びます。
`parseInWorker()`は`app/src/workers/parse.worker.ts`を起動するので、解析の間も画面は止まらず、アップロードしたfileはブラウザの外へ出ません。
Workerは、`import`のpathが指すライブラリのJSONだけを読み込みます。
`@openzeppelin/contracts/...`だけを`import`するプロジェクトでは、SoladyのJSONを読み込みません。

### リクエスト

```typescript
{
  projectName: string;  // プロジェクト名
  files: Array<{
    path: string;     // ファイルパス
    content: string;  // ファイル内容
  }>;
}
```

### 結果

`parseInWorker()`は`CallGraph`を返します。
失敗した時は、下のエラーのどれかを文にした`Error`で失敗します。

### 例

```javascript
import { parseInWorker } from '@/lib/parseInWorker';

const callGraph = await parseInWorker({
  projectName: 'MyProject',
  files: [
    { path: 'contracts/Token.sol', content: 'pragma solidity...' },
    { path: 'contracts/Access.sol', content: 'pragma solidity...' },
  ],
});
```

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

## 解析のエラー

| 文 | 起きる時 |
|----|----------|
| `No files provided` | `files`が空 |
| `Too many files. Maximum 500 files allowed` | fileが500を超える |
| `File too large: <path>` | 1MBを超えるfileがある |
| `No contracts found in uploaded files` | どのfileも契約、インターフェース、ライブラリを宣言していない |
| `Failed to parse files` | 解析器がエラーを投げた |
