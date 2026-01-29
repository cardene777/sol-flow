# Sol-Flow Documentation

Interactive visualization tool for Solidity smart contracts.

[日本語版はこちら](./ja/README.md)

## Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, data flow, component structure |
| [API.md](./API.md) | API endpoint reference |
| [FEATURES.md](./FEATURES.md) | Detailed feature documentation |
| [DATA_TYPES.md](./DATA_TYPES.md) | TypeScript type definitions (CallGraph, Contract, etc.) |
| [PARSER.md](./PARSER.md) | Solidity parser implementation details |
| [PROXY_PATTERNS.md](./PROXY_PATTERNS.md) | Proxy pattern detection and grouping |
| [LIBRARIES.md](./LIBRARIES.md) | Built-in libraries and how to add new ones |

## Quick Start

### Local Development

```bash
cd app
pnpm install
pnpm dev
```

### Build

```bash
cd app
pnpm build
```

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Set Root Directory to `app`
4. Deploy

## Key Features

### 1. Contract Visualization
- Inheritance relationships (inherits)
- Interface implementation (implements)
- Library usage (uses)
- delegatecall relationships

### 2. Proxy Pattern Detection
- ERC-7546 (Upgradeable Dictionary)
- UUPS
- Transparent Proxy
- Diamond (EIP-2535)
- Beacon Proxy

### 3. Category Classification
Dynamic category detection based on directory structure:
- OpenZeppelin/access, OpenZeppelin/token, etc.
- Solady/auth, Solady/tokens, etc.
- Avalanche ICM categories

### 4. Project Management
- Save/load projects
- Pre-parsed libraries (OpenZeppelin, Solady, Avalanche ICM)
- Custom contract upload

### 5. Source Code Viewer
- Full source code display with syntax highlighting
- Multi-line comment support
- NatSpec documentation highlighting
- Line numbers and copy functionality

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 | Framework (App Router) |
| React 19 | UI |
| React Flow | Graph rendering |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| @solidity-parser/parser | Solidity parsing |

## Project Structure

```
sol-flow/
├── app/               # Next.js application
│   ├── src/
│   │   ├── app/       # App Router (pages, API routes)
│   │   ├── components/# React components
│   │   ├── lib/       # Parser, utilities
│   │   ├── data/      # Pre-parsed library JSON
│   │   ├── types/     # TypeScript definitions
│   │   └── utils/     # Helper functions
│   └── scripts/       # Build scripts
├── library/           # Library source code (Git submodules)
│   ├── openzeppelin-contracts/
│   ├── openzeppelin-contracts-upgradeable/
│   ├── solady/
│   └── icm-services/
├── contracts/         # Sample contracts
└── docs/              # Documentation
```

## License

Sol-Flow Non-Commercial Open Source License

See [LICENSE](../LICENSE) for details.
