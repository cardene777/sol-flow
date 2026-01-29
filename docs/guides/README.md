# Sol-Flow Feature Guide

This guide allows you to learn all Sol-Flow features step by step. If you're new to Sol-Flow, we recommend reading through from "Basic Operations" in order.

[日本語版はこちら](../ja/guides/README.md)

## What is Sol-Flow?

Sol-Flow is a tool that visually displays the structure and relationships of Solidity smart contracts. You can intuitively understand inheritance relationships between contracts, library usage, proxy patterns, and more.

### Who This Is For

| Audience | Use Case |
|----------|----------|
| Smart Contract Developers | Get an overview of your project architecture |
| Security Auditors | Quickly understand the structure of contracts under audit |
| Blockchain Learners | Visually learn implementations of famous protocols |
| Technical Documentation Writers | Create diagrams of contract structures |

## Guide List

### Basic Operations

Learn the fundamentals to get started with Sol-Flow.

| # | Guide | Content |
|---|-------|---------|
| 1 | [Getting Started](./01-getting-started.md) | Sol-Flow overview, screen layout, first steps |
| 2 | [Import](./02-import.md) | How to load Solidity files, supported formats |
| 3 | [Navigation](./03-navigation.md) | Canvas movement, zoom, layout switching |

### Contract Visualization

Learn how to read elements displayed on the diagram.

| # | Guide | Content |
|---|-------|---------|
| 4 | [Contract Nodes](./04-contract-nodes.md) | Node types, display content, operations |
| 5 | [Relationships](./05-relationships.md) | Edge (line) types and meanings, reading dependencies |
| 6 | [Contract Details](./06-contract-details.md) | Using the detail modal, source code display |

### Advanced Features

Learn features for deeper analysis.

| # | Guide | Content |
|---|-------|---------|
| 7 | [Function Flow](./07-function-flow.md) | Analyzing internal function call flows |
| 8 | [Search](./08-search.md) | Searching for contracts, functions, events |
| 9 | [Edit Mode](./09-edit-mode.md) | Adding and managing custom edges |

### Special Features

Learn about proxy pattern support and project management.

| # | Guide | Content |
|---|-------|---------|
| 10 | [Proxy Patterns](./10-proxy-patterns.md) | ERC-1967, ERC-7546, Diamond, Beacon detection |
| 11 | [Project Management](./11-project-management.md) | Saving, loading, and managing projects |
| 12 | [Export](./12-export.md) | Exporting diagrams as images |

## Quick Reference

### Keyboard Shortcuts

Shortcut keys for common operations.

| Shortcut | Function | Description |
|----------|----------|-------------|
| `Ctrl/Cmd + K` | Open Search | Search for contracts, functions, events |
| `Ctrl/Cmd + E` | Export | Export diagram as PNG image |
| `Escape` | Close Modal | Close open dialogs or modals |

### Node Types

Nodes (rectangles) displayed on the canvas correspond to Solidity contract types.

| Type | Icon | Description | Examples |
|------|------|-------------|----------|
| Contract | Filled square | Deployable standard contract | `ERC20`, `Vault` |
| Interface | Diamond | Defines only function signatures | `IERC20`, `IUniswapV3Pool` |
| Library | Book | Reusable utility functions | `SafeMath`, `Address` |
| Abstract Contract | Unfilled square | Contract with some unimplemented functions | `Ownable`, `ReentrancyGuard` |

### Edge Types

Lines (edges) connecting nodes represent relationships between contracts.

| Color | Relationship | Description | Example |
|-------|--------------|-------------|---------|
| Blue | Inheritance (inherits) | Inheritance via `is` keyword | `MyToken is ERC20` |
| Purple | Implementation (implements) | Interface implementation | `Vault is IVault` |
| Yellow | Usage (uses) | Library usage via `using` | `using SafeMath for uint256` |
| Pink | Delegatecall | Delegation call from proxy to implementation | Proxy -> Implementation |
| Violet | Registers | Implementation registration in ERC-7546 | Dictionary -> Implementation |

### Proxy Patterns

List of proxy patterns that Sol-Flow auto-detects.

| Pattern | Badge | Characteristics |
|---------|-------|-----------------|
| ERC-1967 (UUPS/Transparent) | `UUPS` / `Transparent` | Most widely used standard proxy |
| ERC-7546 | `ERC-7546` | Modular proxy calling different implementations per function |
| ERC-2535 (Diamond) | `Diamond` | Aggregates functionality from multiple facets |
| Beacon | `Beacon` | Multiple proxies reference a common implementation |

## Learning Path

### For Beginners

1. First read [Getting Started](./01-getting-started.md) to understand the Sol-Flow overview
2. Try actually loading contracts with [Import](./02-import.md)
3. Learn diagram navigation with [Navigation](./03-navigation.md)
4. Check the meaning of displayed nodes and edges in [Contract Nodes](./04-contract-nodes.md) and [Relationships](./05-relationships.md)

### For Deeper Understanding

1. Track internal function processing with [Function Flow](./07-function-flow.md)
2. Learn the structure of upgradeable contracts with [Proxy Patterns](./10-proxy-patterns.md)
3. Enrich your documentation by adding custom relationships with [Edit Mode](./09-edit-mode.md)

## Built-in Libraries

Sol-Flow includes the following libraries for learning and reference. Access them from the "Libraries" button in the sidebar.

| Library | Content |
|---------|---------|
| OpenZeppelin Contracts | Standard implementations of ERC20, ERC721, access control, proxies, etc. |
| ERC-7546 Reference | Modular proxy reference implementation |
| Avalanche ICM | Avalanche cross-chain messaging |

## Help and Support

If you encounter issues or have feature requests, please use the following:

| Resource | URL | Purpose |
|----------|-----|---------|
| GitHub Issues | [github.com/cardene777/sol-flow/issues](https://github.com/cardene777/sol-flow/issues) | Bug reports, feature requests |
| Demo Site | [sol-flow.vercel.app](https://sol-flow.vercel.app) | Try it out |
