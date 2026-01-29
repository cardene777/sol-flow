# Sol-Flow Parser

Technical documentation of how Sol-Flow parses Solidity source code.

## Table of Contents

- [Overview](#overview)
- [Parser Library](#parser-library)
- [Parsing Process](#parsing-process)
- [Contract Extraction](#contract-extraction)
- [Function Analysis](#function-analysis)
- [Call Graph Building](#call-graph-building)
- [Category Classification](#category-classification)

---

## Overview

Sol-Flow uses the `@solidity-parser/parser` library to parse Solidity source files into Abstract Syntax Trees (ASTs), then extracts structured data for visualization.

### Data Flow

```
Solidity Files (.sol)
        │
        ▼
┌───────────────────┐
│ @solidity-parser  │  AST Generation
│     /parser       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ solidityParser.ts │  Contract/Function Extraction
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│callGraphBuilder.ts│  Dependency Detection
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    CallGraph      │  Final Data Structure
└───────────────────┘
```

---

## Parser Library

Sol-Flow uses `@solidity-parser/parser` with the following options:

```typescript
const ast = parse(content, {
  tolerant: true,  // Continue parsing despite errors
  loc: true,       // Include line/column locations
  range: true,     // Include character ranges
});
```

### Tolerant Mode

Tolerant mode allows parsing of incomplete or syntactically incorrect files, which is useful for:
- Work-in-progress contracts
- Files with minor syntax errors
- Partial contract analysis

---

## Parsing Process

### Entry Point

```typescript
function parseSolidityFile(filePath: string, content: string): ParsedFile {
  const contracts: Contract[] = [];

  const ast = parse(content, { tolerant: true, loc: true, range: true });

  // Parse file-level imports
  const fileImports = parseImports(ast, filePath);

  // Process each contract definition
  for (const node of ast.children) {
    if (node.type === 'ContractDefinition') {
      const contract = parseContractDefinition(node, content, filePath, fileImports);
      contracts.push(contract);
    }
  }

  return { contracts, sourceCode: content };
}
```

### Import Parsing

Handles multiple import styles:

```solidity
// Named imports
import {Name} from "path";
import {Name as Alias} from "path";

// Namespace imports
import * as Name from "path";

// Bare imports
import "path";
```

```typescript
interface ImportInfo {
  name: string;        // Imported symbol name
  alias?: string;      // Optional alias
  path: string;        // Import path
  isExternal: boolean; // External dependency (@openzeppelin, etc.)
}
```

---

## Contract Extraction

### Contract Definition Processing

For each `ContractDefinition` node, the parser extracts:

1. **Basic Information**
   - Name, kind (contract/interface/library/abstract)
   - File path

2. **Inheritance**
   - Parent contracts (`inherits`)
   - Implemented interfaces (`implements`)
   - Heuristic: Names starting with 'I' followed by uppercase are interfaces

3. **Contract Body**
   - Functions (external, internal)
   - Events
   - Errors
   - Structs
   - State variables
   - Using directives (library usage)

### State Variable Processing

State variables are parsed with:
- Type resolution (including mappings, arrays)
- Visibility (public/private/internal)
- Constant/immutable flags

```typescript
interface StateVariable {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'internal';
  isConstant?: boolean;
  isImmutable?: boolean;
}
```

Variable types are used to resolve external call targets.

---

## Function Analysis

### Function Extraction

For each function:

```typescript
function parseFunctionDefinition(
  node: FunctionDefinition,
  sourceCode: string,
  variableTypeMap: Map<string, string>
): ExternalFunction | InternalFunction | null
```

**Skipped Functions:**
- Constructors
- Fallback functions
- Receive functions

### Call Extraction

The parser walks the function body AST to extract calls:

```typescript
function extractCallsAndEmits(
  node: any,
  calls: FunctionCall[],
  emits: string[],
  variableTypeMap: Map<string, string>
)
```

### Call Types

| Type | Pattern | Example |
|------|---------|---------|
| `internal` | Direct call | `_transfer(...)` |
| `library` | Qualified call | `SafeMath.add(...)` |
| `external` | Member access | `token.transfer(...)` |
| `super` | Super call | `super.initialize(...)` |
| `delegatecall` | Low-level | `addr.delegatecall(...)` |

### Type Resolution

Variable types are tracked to resolve external call targets:

```typescript
// State variable
IERC20 public token;

// Function call
token.transfer(to, amount);
// → targetType: "IERC20"
```

---

## Call Graph Building

### buildCallGraph Function

```typescript
function buildCallGraph(
  projectName: string,
  contracts: Contract[]
): CallGraph
```

### Process Steps

1. **Proxy Detection**
   - Identify proxy patterns (ERC-7546, UUPS, Diamond, etc.)
   - Group related contracts
   - Set `proxyPattern`, `proxyRole`, `proxyGroupId`

2. **Inherited Function Resolution**
   - Traverse inheritance hierarchy
   - Add inherited functions to child contracts
   - Mark `inheritedFrom` field

3. **Dependency Detection**
   - Inheritance relationships
   - Interface implementations
   - Library usage
   - Delegatecall relationships

4. **Statistics Calculation**
   - Count contracts, libraries, interfaces
   - Count total functions

---

## Category Classification

### Dynamic Category Assignment

Categories are determined from file paths:

```typescript
function determineCategory(
  name: string,
  inherits: string[],
  kind: ContractKind,
  filePath: string
): ContractCategory
```

### Category Patterns

| Path Pattern | Category |
|-------------|----------|
| `@openzeppelin/contracts/.../access/` | `OpenZeppelin/access` |
| `@openzeppelin/contracts-upgradeable/.../proxy/` | `OZ-Upgradeable/proxy` |
| `solady/src/auth/` | `Solady/auth` |
| `@teleporter/...` | `teleporter` |
| (interface kind) | `interface` |
| (library kind) | `library` |
| (unknown) | `other` |

### Avalanche ICM Remappings

Special handling for Avalanche ICM paths:

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

## Selector Computation

Function selectors are computed for external/public functions:

```typescript
function computeSelector(signature: string): string {
  // Simple hash-based computation for display purposes
  // Not cryptographically correct (uses simple hash, not keccak256)
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
}
```

Note: This is for display purposes only, not actual ABI computation.

---

## Filter Options

### Available Filters

```typescript
interface FilterOptions {
  excludeInterfaces?: boolean;  // Default: false
  excludeLibraries?: boolean;   // Default: false
  excludeMocks?: boolean;       // Default: true
  excludeStorages?: boolean;    // Default: false
}
```

### Exclusion Rules

- **Mock contracts**: Names containing "mock"
- **Storage contracts**: Names ending with "storage" or in `/storage/` paths
