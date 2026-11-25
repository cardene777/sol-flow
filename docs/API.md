# Sol-Flow Data Reference

Sol-Flow runs entirely in the browser.
It is served as static files from GitHub Pages at [https://sol-flow.cardene.dev](https://sol-flow.cardene.dev) and has no server API.

## Overview

| Kind | Path | Description |
|------|------|-------------|
| Static file | `/libraries/<id>.json` | Pre-built CallGraph of one library |
| Web Worker | `app/src/workers/parse.worker.ts` | Parses uploaded Solidity files in the browser |

---

## Library files: `/libraries/<id>.json`

`pnpm build` writes one JSON file per library to `app/out/libraries/`.
The route `app/src/app/libraries/[file]/route.ts` builds each file with `buildLibraryGraph()` from `app/src/lib/libraryGraph.ts`.
Sample libraries include the contracts of the libraries they import, such as OpenZeppelin Upgradeable for `sample-uups`.

### Available Library IDs

| ID | Library |
|----|---------|
| `openzeppelin` | OpenZeppelin Contracts |
| `openzeppelin-upgradeable` | OpenZeppelin Upgradeable |
| `solady` | Solady |
| `sample-uups` | UUPS proxy sample |
| `sample-transparent` | Transparent proxy sample |
| `sample-diamond` | Diamond proxy sample |
| `sample-beacon` | Beacon proxy sample |
| `sample-erc7546` | ERC-7546 proxy sample |

### File content

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

### Example

```javascript
const response = await fetch('/libraries/openzeppelin.json');
const { library, callGraph } = await response.json();
```

---

## Parsing uploaded files in a Web Worker

The upload screen and the reload button call `parseInWorker()` from `app/src/lib/parseInWorker.ts`.
It starts `app/src/workers/parse.worker.ts`, so parsing does not block the screen, and the uploaded files never leave the browser.
The worker loads only the library JSON that the import paths name: a project that imports only `@openzeppelin/contracts/...` does not download Solady.

### Request

```typescript
{
  projectName: string;  // Project name
  files: Array<{
    path: string;     // File path
    content: string;  // File content
  }>;
}
```

### Result

`parseInWorker()` resolves with a `CallGraph`, and rejects with an `Error` whose message is one of the errors below.

### Example

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

## Data Types

### CallGraph

See [DATA_TYPES.md](./DATA_TYPES.md) for complete type definitions.

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

## Parse Errors

| Message | When |
|---------|------|
| `No files provided` | `files` is empty |
| `Too many files. Maximum 500 files allowed` | more than 500 files |
| `File too large: <path>` | a file is larger than 1MB |
| `No contracts found in uploaded files` | no file declares a contract, interface, or library |
| `Failed to parse files` | the parser threw an error |
