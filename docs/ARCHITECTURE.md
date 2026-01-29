# Sol-Flow Architecture

## Overview

Sol-Flow is a web application that visualizes dependencies in Solidity smart contracts.
It displays inheritance, implementation, and usage relationships between contracts as an interactive graph.

## Directory Structure

```
sol-flow/
├── app/                          # Next.js Application
│   ├── src/
│   │   ├── app/                  # App Router (Next.js 15)
│   │   │   ├── api/              # API Routes
│   │   │   │   ├── libraries/    # Library fetch API
│   │   │   │   └── parse/        # Solidity parse API
│   │   │   └── page.tsx          # Main page
│   │   ├── components/           # React Components
│   │   │   ├── Canvas/           # React Flow canvas
│   │   │   ├── Layout/           # Layout components
│   │   │   ├── Projects/         # Project management
│   │   │   └── Upload/           # File upload
│   │   ├── data/
│   │   │   └── libraries/        # Pre-parsed library JSON
│   │   ├── lib/                  # Core utilities
│   │   │   ├── callGraphBuilder.ts  # Graph construction
│   │   │   ├── solidityParser.ts    # Solidity parser
│   │   │   └── storage.ts        # localStorage management
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/
│   │       └── transformToReactFlow.ts  # React Flow transformation
│   └── public/                   # Static files
├── library/                      # Library source code
│   ├── openzeppelin-contracts/
│   ├── openzeppelin-contracts-upgradeable/
│   ├── solady/
│   └── icm-services/
├── contracts/                    # Sample contracts (ERC-7546)
└── docs/                         # Documentation
```

## Data Flow

```
┌─────────────────┐
│ Solidity Files  │
│  (.sol files)   │
└────────┬────────┘
         │ Upload
         ▼
┌─────────────────┐
│   /api/parse    │ Solidity Parser
│ solidityParser  │ (@solidity-parser/parser)
└────────┬────────┘
         │ Contract[]
         ▼
┌─────────────────┐
│ callGraphBuilder│ Dependency Detection
│      .ts        │ Proxy Pattern Detection
└────────┬────────┘
         │ CallGraph
         ▼
┌─────────────────┐
│ transformTo     │ Transform to React Flow
│ ReactFlow.ts    │ Generate nodes/edges
└────────┬────────┘
         │ nodes[], edges[]
         ▼
┌─────────────────┐
│  React Flow     │ Interactive Display
│  DiagramCanvas  │
└─────────────────┘
```

## Key Components

### 1. Solidity Parser (`lib/solidityParser.ts`)

Uses `@solidity-parser/parser` to analyze Solidity files:
- Detect contracts/interfaces/libraries
- Extract inheritance relationships (`is`)
- Extract implementations (`implements`)
- Parse import statements
- Extract function signatures and calls

### 2. CallGraphBuilder (`lib/callGraphBuilder.ts`)

Builds dependency graph between contracts:
- Construct inheritance graph
- Detect proxy patterns (ERC-7546, UUPS, Diamond, Beacon, Transparent)
- Detect `delegatecall` relationships
- Category classification

**Detected Proxy Patterns:**
- **ERC-7546**: Dictionary + Proxy + Implementation
- **UUPS**: UUPSUpgradeable inheritance
- **Transparent**: TransparentUpgradeableProxy
- **Diamond**: EIP-2535
- **Beacon**: BeaconProxy

### 3. React Flow Transformation (`utils/transformToReactFlow.ts`)

Transforms CallGraph to React Flow nodes/edges:
- Generate category group nodes
- Generate proxy pattern groups
- Prevent edge duplication
- Calculate handle position offsets
- Apply dagre layout algorithm

### 4. Node Types

| Type | Description |
|------|-------------|
| `contractNode` | Contract node |
| `categoryGroupNode` | Category group (Access, Token, etc.) |
| `proxyPatternGroupNode` | Proxy pattern group (ERC-7546, etc.) |

### 5. Edge Types

| Type | Color | Description |
|------|-------|-------------|
| `inherits` | Blue | Inheritance |
| `implements` | Purple | Interface implementation |
| `uses` | Yellow (dashed) | Library usage |
| `delegatecall` | Pink (dashed) | delegatecall |
| `registers` | Violet (dashed) | Dictionary registration |

## State Management

- **React State**: Component state
- **localStorage**: Project persistence
  - `sol-flow-projects`: List of saved projects
  - `sol-flow-project-{id}`: Each project's CallGraph
  - `sol-flow-current-project`: Current project ID
  - `sol-flow-current-library`: Current library ID

## Pre-parsed Libraries

Located in `/app/src/data/libraries/`:
- `openzeppelin-parsed.json`
- `openzeppelin-upgradeable-parsed.json`
- `solady-parsed.json`
- `avalanche-teleporter-parsed.json`
- `avalanche-ictt-parsed.json`
- `avalanche-validator-manager-parsed.json`

These are bundled at build time and served via API.

## Component Hierarchy

```
MainLayout
├── Header
│   ├── Search
│   ├── ProjectSelector
│   ├── EditModeToggle
│   └── ExportButton
├── Sidebar
│   ├── CategoryFilter
│   ├── ContractTree
│   │   └── TreeNode (recursive)
│   └── LibraryToggle
└── DiagramCanvas
    ├── ReactFlow
    │   ├── ContractNode
    │   ├── CategoryGroupNode
    │   └── ProxyPatternGroupNode
    ├── DependencyEdge
    ├── FunctionFlowModal
    └── ContractDetailModal
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/parse` | POST | Parse Solidity files |
| `/api/libraries` | GET | List available libraries |
| `/api/libraries/[id]` | GET | Get specific library data |
| `/api/libraries/default` | GET | Get default library |

See [API.md](./API.md) for detailed documentation.
