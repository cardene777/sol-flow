# Built-in Libraries

Documentation for Sol-Flow's built-in library system and how to add new libraries.

## Table of Contents

- [Overview](#overview)
- [Available Libraries](#available-libraries)
- [Library Structure](#library-structure)
- [Adding a New Library](#adding-a-new-library)
- [Regenerating Library Data](#regenerating-library-data)
- [API Endpoints](#api-endpoints)

---

## Overview

Sol-Flow includes pre-parsed Solidity libraries that can be explored without uploading any files. These libraries are stored as JSON files containing the parsed `CallGraph` data.

### Benefits

- **Instant exploration**: No upload or parsing required
- **Fast loading**: Pre-computed data loads quickly
- **Reference material**: Explore OpenZeppelin and Solady implementations

---

## Available Libraries

| Library | ID | Description |
|---------|------|-------------|
| OpenZeppelin Contracts | `openzeppelin` | Industry-standard smart contract library (v5.0.0) |
| OpenZeppelin Upgradeable | `openzeppelin-upgradeable` | Upgradeable contract variants |
| Solady | `solady` | Gas-optimized Solidity snippets |

---

## Library Structure

### Source Code Location

Library source code is stored in the `library/` directory as Git submodules:

```
library/
├── openzeppelin-contracts/          # OpenZeppelin Contracts
├── openzeppelin-contracts-upgradeable/  # OZ Upgradeable
└── solady/                          # Solady
```

### Pre-parsed Data

Parsed library data is stored in `app/src/data/libraries/`:

```
app/src/data/libraries/
├── openzeppelin-parsed.json         # ~1MB
├── openzeppelin-upgradeable-parsed.json  # ~1.2MB
└── solady-parsed.json               # ~800KB
```

### JSON Structure

Each JSON file contains a complete `CallGraph`:

```typescript
{
  "version": "1.0.0",
  "generatedAt": "2024-01-15T12:00:00.000Z",
  "projectName": "OpenZeppelin Contracts",
  "structure": { /* DirectoryNode tree */ },
  "contracts": [ /* Contract[] */ ],
  "dependencies": [ /* Dependency[] */ ],
  "proxyGroups": [ /* ProxyGroup[] */ ],
  "stats": {
    "totalContracts": 150,
    "totalLibraries": 45,
    "totalInterfaces": 80,
    "totalFunctions": 1200
  }
}
```

---

## Adding a New Library

### Step 1: Add Source Code

Add the library as a Git submodule:

```bash
cd sol-flow/library
git submodule add https://github.com/example/library.git example-library
```

### Step 2: Update Regeneration Script

Edit `app/scripts/regenerate-libraries.mjs`:

```javascript
const LIBRARIES = [
  // ... existing libraries ...
  {
    id: 'example-library',
    name: 'Example Library',
    version: '1.0.0',
    sourcePath: '../library/example-library/contracts',
    outputPath: './src/data/libraries/example-library-parsed.json',
    // Optional: path remappings for imports
    remappings: {
      '@example/': '../library/example-library/',
    },
  },
];
```

### Step 3: Define Library Metadata

Update `app/src/constants/libraries.ts`:

```typescript
export const LIBRARIES = [
  // ... existing libraries ...
  {
    id: 'example-library',
    name: 'Example Library',
    version: '1.0.0',
    description: 'Description of the library',
  },
];
```

### Step 4: Update API Route

Edit `app/src/app/api/libraries/[id]/route.ts`:

```typescript
import exampleLibraryData from '@/data/libraries/example-library-parsed.json';

const LIBRARY_DATA: Record<string, any> = {
  // ... existing libraries ...
  'example-library': exampleLibraryData,
};
```

### Step 5: Regenerate Data

```bash
cd sol-flow/app
pnpm run regenerate-libraries
```

---

## Regenerating Library Data

### When to Regenerate

- After updating library submodules to new versions
- After modifying the parser logic
- After adding new libraries

### Regeneration Command

```bash
cd sol-flow/app
pnpm run regenerate-libraries
```

### Script Details

The regeneration script (`app/scripts/regenerate-libraries.mjs`):

1. Reads all `.sol` files from library source directories
2. Parses each file using the Solidity parser
3. Marks contracts with `isExternalLibrary: true` and `librarySource`
4. Builds the complete CallGraph
5. Writes JSON output with full source code included

### Script Configuration

```javascript
// Configuration per library
{
  id: 'openzeppelin',
  name: 'OpenZeppelin Contracts',
  version: '5.0.0',
  sourcePath: '../library/openzeppelin-contracts/contracts',
  outputPath: './src/data/libraries/openzeppelin-parsed.json',
  librarySource: 'openzeppelin',  // Used for librarySource field
  exclude: [
    'mocks',      // Exclude test mocks
    'test',       // Exclude test utilities
  ],
}
```

---

## API Endpoints

### List Libraries

```
GET /api/libraries
```

Response:
```json
{
  "libraries": [
    { "id": "openzeppelin", "name": "OpenZeppelin Contracts", "version": "5.0.0" },
    { "id": "solady", "name": "Solady", "version": "latest" }
  ]
}
```

### Get Library Data

```
GET /api/libraries/[id]
```

Response:
```json
{
  "library": {
    "id": "openzeppelin",
    "name": "OpenZeppelin Contracts",
    "version": "5.0.0"
  },
  "callGraph": { /* CallGraph data */ }
}
```

### Get Default Library

```
GET /api/libraries/default
```

Returns OpenZeppelin Contracts (the default library).

---

## Library Source Fields

Contracts from libraries have additional fields:

```typescript
interface Contract {
  // ... standard fields ...

  isExternalLibrary?: boolean;  // true for library contracts
  librarySource?: 'openzeppelin' | 'openzeppelin-upgradeable' | 'solady';
}
```

These fields are used to:
- Display library badges on contract nodes
- Enable filtering library contracts in the sidebar
- Distinguish user contracts from library contracts

---

## Submodule Management

### Initialize Submodules

```bash
git submodule update --init --recursive
```

### Update All Submodules

```bash
git submodule update --remote --merge
```

### Update Specific Submodule

```bash
cd library/openzeppelin-contracts
git fetch origin
git checkout v5.0.0  # or specific tag
cd ../..
git add library/openzeppelin-contracts
git commit -m "Update OpenZeppelin to v5.0.0"
```
