# Contributing to Sol-Flow

We welcome contributions to Sol-Flow! This document explains how to contribute to the project.

[日本語版](ja/CONTRIBUTING.md)

## Development Environment Setup

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/cardene777/sol-flow.git
cd sol-flow

# Install dependencies
cd app
pnpm install

# Start development server
pnpm dev
```

## How to Contribute

### Issues

- Report bugs or request features via [Issues](https://github.com/cardene777/sol-flow/issues)
- Check existing issues to avoid duplicates
- Follow the issue templates

### Issue-Driven Development

All work starts with an Issue:

1. **Create an Issue** - Use the appropriate template
   - `[Feature]` - New features or enhancements
   - `[Bug]` - Bug reports and fixes

2. **Document in the Issue**
   - Clear description of the work
   - Design/implementation notes
   - Acceptance criteria
   - Affected components

### Branch Naming Convention

Create branches from `main` with the following format:

```
<type>/#<issue-number>-<short-description>
```

**Types:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

**Examples:**
```bash
git checkout -b feature/#42-add-search-filter
git checkout -b fix/#15-zoom-calculation
git checkout -b docs/#23-update-readme
```

### Pull Requests

1. Update your branch with the latest `main`
2. Create a PR with a clear title and description
3. Link the related Issue (`Fixes #<number>`)
4. Complete the PR template checklist
5. Request review if needed

### Commit Messages

Write commit messages in the following format:

```
<type>: <description>

[optional body]

Fixes #<issue-number>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect code meaning (whitespace, formatting)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Build process or tool changes

#### Example

```
feat: Add proxy pattern detection for ERC-7546

- Detect ERC-7546 proxy pattern in contracts
- Group related contracts in the diagram
- Add visual indicator for proxy relationships

Fixes #42
```

## Code Style

### TypeScript

- Follow ESLint configuration
- Define types explicitly
- Avoid using `any` type

### React

- Use functional components
- Use Hooks appropriately
- Follow single responsibility principle for components

### CSS

- Use Tailwind CSS
- Minimize custom CSS
- Consider responsive design

## Directory Structure

```
app/src/
├── app/            # Next.js App Router
├── components/     # React components
│   ├── Canvas/     # Diagram-related
│   ├── Layout/     # Layout (Header, Sidebar, etc.)
│   ├── FunctionFlow/  # Function flow display
│   └── ...
├── lib/            # Utilities, parsers
├── types/          # Type definitions
└── utils/          # Helper functions
```

## Testing

Tests are not yet implemented but planned for the future.

## Release Process

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes

### Release Steps

1. Update `CHANGELOG.md`
2. Create a git tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```
3. Create a GitHub Release from the tag
4. Copy release notes from CHANGELOG

## License

Contributions are licensed under the [Sol-Flow Non-Commercial Open Source License](LICENSE).

## Questions

If you have questions, feel free to ask in [Discussions](https://github.com/cardene777/sol-flow/discussions) or [Issues](https://github.com/cardene777/sol-flow/issues).

---

Thank you for contributing to Sol-Flow!
