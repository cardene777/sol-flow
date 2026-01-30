# Sol-Flow API Reference

## Endpoint Overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/parse` | Parse Solidity files |
| GET | `/api/libraries` | List available libraries |
| GET | `/api/libraries/[id]` | Get specific library CallGraph |
| GET | `/api/libraries/default` | Get default library |

---

## POST /api/parse

Parses Solidity files and generates a CallGraph.

### Request

```typescript
{
  files: Array<{
    path: string;     // File path
    content: string;  // File content
  }>;
  projectName: string;  // Project name
}
```

### Response

```typescript
{
  callGraph: CallGraph;
}
```

### Example

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

Retrieves the list of available pre-parsed libraries.

### Response

```typescript
{
  libraries: Array<{
    id: string;
    name: string;
    version: string;
  }>;
}
```

### Example

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

Retrieves the CallGraph for a specific library.

### Parameters

| Name | Type | Description |
|------|------|-------------|
| id | string | Library ID |

### Available Library IDs

| ID | Library |
|----|---------|
| `openzeppelin` | OpenZeppelin Contracts |
| `openzeppelin-upgradeable` | OpenZeppelin Upgradeable |
| `solady` | Solady |

### Response

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
const response = await fetch('/api/libraries/openzeppelin');
const { library, callGraph } = await response.json();
```

---

## GET /api/libraries/default

Retrieves the default library (OpenZeppelin).

### Response

Same as `GET /api/libraries/openzeppelin`.

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

## Error Responses

All endpoints return errors in the following format:

```typescript
{
  error: string;  // Error message
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 404 | Resource Not Found |
| 500 | Internal Server Error |

### Error Examples

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
