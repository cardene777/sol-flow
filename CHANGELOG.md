# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-29

### Added

#### Core Features
- **Interactive Contract Visualization**: Drag-and-drop Solidity file import with automatic dependency resolution
- **Inheritance Graph**: Visual representation of contract inheritance and implementation relationships
- **Function Flow Diagrams**: Click on functions to see internal call flows with source code
- **Proxy Pattern Detection**: Automatic detection of ERC-7546, UUPS, Transparent, Diamond, and Beacon patterns
- **Smart Search**: Quick search by contract name, function name, or event name

#### Built-in Libraries
- OpenZeppelin Contracts
- OpenZeppelin Contracts Upgradeable
- Solady
- Avalanche ICM (Teleporter, ICTT, Validator Manager)

#### User Experience
- **Auto-zoom**: Clicking a contract in sidebar automatically centers the view on that contract
- **Onboarding Tour**: Interactive guide for first-time users
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **Edit Mode**: Add custom relationship edges between contracts (for user projects)
- **Library Toggle**: Show/hide Solidity library contracts in the diagram
- **Contract Detail Modal**: View detailed contract information including source code

#### Project Management
- Save and manage multiple projects in browser storage
- Rename and delete projects
- Export diagrams as PNG or SVG

#### Technical
- Category-based grouping with sub-categories for large libraries
- Hierarchical layout using dagre algorithm
- Dynamic node height calculation based on function count
- External library source code resolution

### Changed
- License changed to Sol-Flow Non-Commercial Open Source License

## [0.1.0] - 2026-01-26

### Added
- Initial release with basic contract visualization
- Solidity parser integration
- React Flow-based diagram rendering

---

[Unreleased]: https://github.com/cardene777/sol-flow/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/cardene777/sol-flow/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/cardene777/sol-flow/releases/tag/v0.1.0
