# Sol-Flow Features

Detailed documentation of Sol-Flow's features and functionality.

## Table of Contents

- [Contract Visualization](#contract-visualization)
- [Function Flow Diagrams](#function-flow-diagrams)
- [Proxy Pattern Detection](#proxy-pattern-detection)
- [Smart Search](#smart-search)
- [Edit Mode](#edit-mode)
- [Source Code Viewer](#source-code-viewer)
- [Project Management](#project-management)
- [Export Options](#export-options)

---

## Contract Visualization

### Overview

Sol-Flow visualizes Solidity smart contracts as an interactive graph using React Flow. Each contract is represented as a node, and relationships between contracts are shown as edges.

### Node Types

| Type | Description |
|------|-------------|
| `contractNode` | Individual contract with expandable details |
| `categoryGroupNode` | Groups contracts by category (Access, Token, etc.) |
| `proxyPatternGroupNode` | Groups proxy-related contracts (ERC-7546, UUPS, etc.) |

### Contract Node Features

- **Collapsed view**: Shows contract name and kind (contract/interface/library)
- **Expanded view**: Displays functions, events, and state variables
- **Color coding**: Different colors for contract kinds
- **Click to expand**: Click on a node to show/hide details

### Edge Types

| Type | Color | Style | Description |
|------|-------|-------|-------------|
| `inherits` | Blue | Solid | Inheritance relationship (`is`) |
| `implements` | Purple | Solid | Interface implementation |
| `uses` | Yellow | Dashed | Library usage (`using X for Y`) |
| `delegatecall` | Pink | Dashed | Delegatecall relationship |
| `registers` | Violet | Dashed | Dictionary registration (ERC-7546) |
| `imports` | Gray | Dashed | Import dependency |

### Layout Algorithm

Sol-Flow uses the dagre algorithm for hierarchical layout:
- Parent contracts are positioned above child contracts
- Contracts in the same category are grouped together
- Proxy patterns are grouped into dedicated sections

---

## Function Flow Diagrams

### Overview

Click on any function within an expanded contract node to view its call flow diagram.

### Function Categories

| Icon | Visibility | State Mutability |
|------|------------|------------------|
| Green | external/public | view/pure |
| Orange | external/public | nonpayable/payable |
| Purple | internal/private | any |

### Call Flow Information

The function flow diagram shows:
- **Internal calls**: Functions called within the same contract
- **Library calls**: Library function invocations
- **External calls**: Calls to other contracts
- **Super calls**: Calls to parent contract functions
- **Delegatecalls**: Low-level delegatecall operations
- **Events emitted**: Events triggered by the function
- **Modifiers**: Access control and other modifiers

### Source Code Display

Each function displays its source code with:
- Solidity syntax highlighting
- Line numbers
- Copy to clipboard button

---

## Proxy Pattern Detection

Sol-Flow automatically detects the following proxy patterns:

### ERC-7546 (Meta Contract / Borderless)

Detection criteria:
- Directory structure: `/functions/`, `/dictionary/`
- Contract names: `Dictionary`, `DictionaryCore`, `BorderlessProxy`
- Events: `DictionaryUpgraded`
- Functions: `getDictionary`, `bulkSetImplementation`

Roles:
- **dictionary**: Central registry contract
- **proxy**: User-facing proxy contract
- **implementation**: Function contracts in `/functions/`

### UUPS (EIP-1822)

Detection criteria:
- Functions: `upgradeTo`, `upgradeToAndCall`, `proxiableUUID`, `_authorizeUpgrade`
- Inheritance: `UUPSUpgradeable`

### Transparent Proxy

Detection criteria:
- Inheritance: `TransparentUpgradeableProxy`
- Functions: `admin`

### Diamond (EIP-2535)

Detection criteria:
- Functions: `diamondCut`, `facets`, `facetAddress`
- Events: `DiamondCut`
- Directory: `/facets/`

### Beacon Proxy

Detection criteria:
- Inheritance: `UpgradeableBeacon`, `BeaconProxy`
- Contract names containing `beacon`

---

## Smart Search

### Features

- Search by contract name
- Search by function name
- Search by event name
- Real-time filtering
- Auto-zoom to selected contract

### Usage

1. Click the search icon in the header
2. Type your search query
3. Click on a result to navigate to that contract

---

## Edit Mode

### Overview

Edit Mode allows you to add custom relationship edges between contracts that aren't captured by static analysis.

### Use Cases

- Document proxy relationships not detected automatically
- Add cross-contract interaction documentation
- Visualize runtime relationships

### Types of Edges

1. **Temporary Edges**: Disappear on page reload
   - Red dashed line
   - Hover to show delete button (X icon)

2. **User Edges**: Saved with project
   - Cyan color
   - Persistent across sessions

### How to Use

1. Enable Edit Mode using the toggle in the header
2. Click on a source contract
3. Click on a target contract
4. Select the relationship type
5. The edge is added to the diagram

---

## Source Code Viewer

### Overview

View complete contract source code with Solidity syntax highlighting.

### Features

- **Full source display**: Shows entire file including imports, comments, and pragmas
- **Syntax highlighting**: Proper color coding for Solidity keywords, types, and constructs
- **Multi-line comment support**: Correctly handles `/* */` and `/** */` comments
- **NatSpec support**: Highlights `///` documentation comments
- **Line numbers**: Easy code reference
- **Copy button**: One-click copy to clipboard

### Accessing Source Code

1. Click on a contract node to expand it
2. Click "View Details" button
3. Switch to the "Source" tab

Or:
- Hover over a contract in the sidebar
- Click the code icon to open the detail modal directly

---

## Project Management

### Features

- **Save projects**: Store parsed contract data locally
- **Load projects**: Resume work on saved projects
- **Rename projects**: Update project names
- **Delete projects**: Remove unwanted projects
- **Switch libraries**: Toggle between built-in libraries

### Storage

Projects are stored in browser localStorage:
- `sol-flow-projects`: List of saved projects
- `sol-flow-project-{id}`: Individual project CallGraph data
- `sol-flow-current-project`: Currently active project ID
- `sol-flow-current-library`: Currently active library ID

---

## Export Options

### Available Formats

- **PNG**: High-resolution image export
- **SVG**: Scalable vector graphics

### How to Export

1. Click the export button in the header
2. Select format (PNG or SVG)
3. The diagram is downloaded to your device

### Export Notes

- Exports the current viewport
- Zoom level affects PNG resolution
- SVG exports are resolution-independent
