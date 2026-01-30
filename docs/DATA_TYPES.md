# Sol-Flow Data Types

Complete reference for Sol-Flow's TypeScript type definitions.

## Table of Contents

- [CallGraph](#callgraph)
- [Contract](#contract)
- [Functions](#functions)
- [Dependency](#dependency)
- [Proxy Types](#proxy-types)
- [Supporting Types](#supporting-types)

---

## CallGraph

The root data structure representing a parsed Solidity project.

```typescript
interface CallGraph {
  version: string;           // Schema version (e.g., "1.0.0")
  generatedAt: string;       // ISO timestamp
  projectName: string;       // Project name
  structure: DirectoryNode;  // File/directory tree
  contracts: Contract[];     // All parsed contracts
  dependencies: Dependency[]; // Relationships between contracts
  proxyGroups: ProxyGroup[]; // Detected proxy patterns
  stats: Stats;              // Summary statistics
  userEdges?: UserEdge[];    // User-added edges (Edit Mode)
  deletedEdgeIds?: string[]; // Deleted edge IDs
}
```

### Stats

```typescript
interface Stats {
  totalContracts: number;   // Contract + abstract count
  totalLibraries: number;   // Library count
  totalInterfaces: number;  // Interface count
  totalFunctions: number;   // Total function count
}
```

---

## Contract

Represents a single Solidity contract, interface, or library.

```typescript
interface Contract {
  name: string;                        // Contract name
  kind: ContractKind;                  // Type of contract
  category: ContractCategory;          // Classified category
  filePath: string;                    // Source file path
  inherits: string[];                  // Parent contracts
  implements: string[];                // Implemented interfaces
  usesLibraries: string[];             // Libraries used
  imports: ImportInfo[];               // Import statements
  externalFunctions: ExternalFunction[];
  internalFunctions: InternalFunction[];
  events: EventDefinition[];
  errors: ErrorDefinition[];
  structs?: StructDefinition[];
  stateVariables?: StateVariable[];

  // Proxy pattern fields
  proxyPattern?: ProxyPatternType;
  proxyRole?: ProxyRole;
  proxyGroupId?: string;

  // External library fields
  isExternalLibrary?: boolean;
  librarySource?: 'openzeppelin' | 'openzeppelin-upgradeable' | 'solady';

  // Source code
  sourceCode?: string;                 // Full file content
}
```

### ContractKind

```typescript
type ContractKind = 'contract' | 'library' | 'interface' | 'abstract';
```

### ContractCategory

Dynamically determined from directory structure:

```typescript
type ContractCategory = string;

// Common categories:
// - 'OpenZeppelin/access'
// - 'OpenZeppelin/token'
// - 'OZ-Upgradeable/proxy'
// - 'Solady/auth'
// - 'interface'
// - 'library'
// - 'other'
```

---

## Functions

### ExternalFunction

Functions with `external` or `public` visibility.

```typescript
interface ExternalFunction {
  name: string;
  signature: string;         // e.g., "transfer(address,uint256)"
  selector: string;          // 4-byte selector (e.g., "0xa9059cbb")
  visibility: 'external' | 'public';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  parameters: Parameter[];
  returnValues: ReturnValue[];
  calls: FunctionCall[];     // Functions called
  emits: string[];           // Events emitted
  modifiers: string[];       // Applied modifiers
  overrides?: string[];      // Overridden contracts
  isVirtual: boolean;
  sourceCode?: string;       // Function source code
  startLine?: number;
  inheritedFrom?: string;    // Parent contract name if inherited
}
```

### InternalFunction

Functions with `internal` or `private` visibility.

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

Represents a call to another function.

```typescript
interface FunctionCall {
  target: string;            // Function/contract name
  type: 'internal' | 'library' | 'external' | 'modifier' | 'super' | 'delegatecall';
  targetType?: string;       // Resolved type of target variable
  argCount?: number;         // Argument count for overload matching
  condition?: string;        // Condition if in if/else
  sourceLocation?: {
    start: number;
    end: number;
  };
}
```

---

## Dependency

Represents a relationship between two contracts.

```typescript
interface Dependency {
  from: string;              // Source contract name
  to: string;                // Target contract name
  type: DependencyType;
  functions?: string[];      // Specific functions used
}

type DependencyType =
  | 'uses'        // Library usage
  | 'inherits'    // Inheritance
  | 'implements'  // Interface implementation
  | 'imports'     // Import dependency
  | 'delegatecall' // Delegatecall relationship
  | 'registers';  // Dictionary registration (ERC-7546)
```

---

## Proxy Types

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
  | 'proxy'          // User-facing proxy
  | 'dictionary'     // Registry (ERC-7546)
  | 'implementation' // Logic contract
  | 'beacon'         // Beacon contract
  | 'facet';         // Diamond facet
```

### ProxyGroup

Groups related proxy contracts.

```typescript
interface ProxyGroup {
  id: string;
  name: string;
  patternType: ProxyPatternType;
  proxy?: string;            // Proxy contract name
  dictionary?: string;       // Dictionary contract (ERC-7546)
  implementations: string[]; // Implementation contracts
  beacon?: string;           // Beacon contract
}
```

---

## Supporting Types

### Parameter

```typescript
interface Parameter {
  name: string;
  type: string;
  indexed?: boolean;         // For event parameters
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
  name: string;        // Imported name (e.g., "StorageSlot")
  alias?: string;      // Alias (e.g., imported as "ERC721Storage")
  path: string;        // Import path
  isExternal: boolean; // Starts with @ or is external dependency
}
```

### DirectoryNode

```typescript
interface DirectoryNode {
  name: string;
  type: 'directory' | 'file';
  path: string;
  children?: DirectoryNode[];
  contractName?: string;     // For file nodes
}
```

### UserEdge

User-added edges in Edit Mode.

```typescript
interface UserEdge {
  id: string;
  from: string;
  to: string;
  type: DependencyType;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
  createdAt: string;        // ISO timestamp
}
```
