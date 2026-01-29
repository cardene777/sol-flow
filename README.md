<p align="center">
  <img src="docs/images/logo.png" alt="Sol-Flow Logo" width="120" />
</p>

<h1 align="center">Sol-Flow</h1>

<p align="center">
  <strong>Interactive visualization tool for Solidity smart contracts</strong>
</p>

<p align="center">
  <a href="https://github.com/cardene777/sol-flow/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-Non--Commercial-red.svg" alt="License: Non-Commercial" />
  </a>
  <a href="https://github.com/cardene777/sol-flow">
    <img src="https://img.shields.io/github/stars/cardene777/sol-flow?style=social" alt="GitHub Stars" />
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#built-in-libraries">Built-in Libraries</a> •
  <a href="#contributing">Contributing</a> •
  <a href="README-ja.md">日本語</a>
</p>

---

## Overview

Sol-Flow is a web-based tool that visualizes **dependencies**, **inheritance structures**, and **function call flows** of Solidity smart contracts as interactive diagrams.

It helps developers understand complex codebases and streamlines security reviews.

## Features

### 🔗 Inheritance Visualization
Visualize inheritance and implementation relationships between contracts. Easily understand relationships with libraries like OpenZeppelin.

### 📊 Function Flow Diagrams
Click on a function to see its internal call flow diagram with actual source code.

### 🔍 Proxy Pattern Detection
Automatically detects and groups proxy patterns including ERC-7546, UUPS, Transparent, Diamond, and Beacon.

### 🎯 Smart Search
Quickly search by contract name, function name, or event name. Navigate large codebases efficiently.

### 📁 Easy Import
Simply drag and drop Solidity files. External libraries (OpenZeppelin, Solady, etc.) are resolved automatically.

### 📚 Built-in Libraries
Major libraries like OpenZeppelin, Solady, and Avalanche ICM are preloaded and ready to explore.

### ✏️ Edit Mode
Add custom edges to document relationships not captured by static analysis. Perfect for documenting proxy relationships and cross-contract interactions.

## Demo

🌐 **Live Demo**: [https://sol-flow.vercel.app](https://sol-flow.vercel.app)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/cardene777/sol-flow.git
cd sol-flow

# If you already cloned without submodules:
git submodule update --init --recursive

# Install dependencies
cd app
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Import Contracts

Click the "Import" button and drag & drop your Solidity files (.sol).

```
src/
├── MyToken.sol
├── Governance.sol
└── Treasury.sol
```

### 2. Explore the Diagram

Navigate the auto-generated dependency diagram:

- **Mouse wheel**: Zoom in/out
- **Drag**: Pan the view
- **Click contract**: Expand/collapse details
- **Sidebar**: Filter by category

### 3. View Function Flow

Click on a function name within an expanded contract to see its detailed call flow and source code.

| Icon | Description |
|:---:|---|
| 🟢 | external view/pure |
| 🟠 | external write |
| 🟣 | internal |

### 4. Edit Mode (Projects only)

Enable Edit Mode to add custom relationship edges between contracts. Changes are saved to your project.

## Built-in Libraries

The following libraries are preloaded:

| Library | Description |
|---|---|
| **OpenZeppelin Contracts** | Industry-standard smart contract library |
| **OpenZeppelin Upgradeable** | Upgradeable contracts with proxy patterns |
| **Solady** | Gas-optimized Solidity snippets |
| **Avalanche Teleporter** | Cross-chain messaging for Avalanche |
| **Avalanche ICTT** | Interchain Token Transfer |
| **Avalanche Validator Manager** | Validator management |

Switch between libraries using the "Projects" button in the header.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS |
| Graph | React Flow |
| Parser | @solidity-parser/parser |
| Language | TypeScript |

## Project Structure

```
sol-flow/
├── app/                    # Next.js application
│   ├── src/
│   │   ├── app/            # App Router (pages)
│   │   ├── components/     # React components
│   │   ├── lib/            # Parser, utilities
│   │   ├── constants/      # Application constants
│   │   ├── types/          # Type definitions
│   │   └── utils/          # Helper functions
│   └── package.json
├── library/                # Built-in library sources (Git submodules)
│   ├── openzeppelin-contracts/
│   ├── openzeppelin-contracts-upgradeable/
│   ├── solady/
│   └── icm-services/
├── docs/                   # Documentation
└── README.md
```

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the **Sol-Flow Non-Commercial Open Source License**.

- ❌ Commercial use prohibited
- ✅ Non-commercial use allowed
- ✅ Modification allowed (must share under same license)
- ✅ Network/SaaS use allowed (must disclose source code)

See the [LICENSE](LICENSE) file for details. For commercial licensing inquiries, please contact the author.

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) - Smart contract library
- [Solady](https://github.com/Vectorized/solady) - Gas optimized Solidity snippets
- [React Flow](https://reactflow.dev/) - Graph visualization library
- [Avalanche](https://www.avax.network/) - ICM libraries

---

<p align="center">
  Made with ❤️ for the Solidity community
</p>
