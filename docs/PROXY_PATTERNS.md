# Proxy Pattern Detection

Technical documentation of how Sol-Flow detects and groups proxy patterns.

## Table of Contents

- [Overview](#overview)
- [Supported Patterns](#supported-patterns)
- [Detection Algorithm](#detection-algorithm)
- [Grouping Logic](#grouping-logic)
- [ERC-7546 Specifics](#erc-7546-specifics)

---

## Overview

Sol-Flow automatically detects proxy patterns by analyzing:
- Contract names
- File paths and directory structure
- Function names
- Event names
- Inheritance relationships

### Pattern Types

```typescript
type ProxyPatternType =
  | 'eip7546'      // Meta Contract / Borderless
  | 'uups'         // UUPS Upgradeable (EIP-1822)
  | 'transparent'  // Transparent Proxy
  | 'diamond'      // Diamond (EIP-2535)
  | 'beacon';      // Beacon Proxy
```

### Roles

```typescript
type ProxyRole =
  | 'proxy'          // User-facing proxy contract
  | 'dictionary'     // Function registry (ERC-7546)
  | 'implementation' // Logic/facet contract
  | 'beacon'         // Beacon holding implementation address
  | 'facet';         // Diamond facet
```

---

## Supported Patterns

### ERC-7546 (Meta Contract / Borderless)

**Architecture:**
```
User → Proxy → Dictionary → Implementation(s)
```

**Detection Criteria:**

| Role | Criteria |
|------|----------|
| Dictionary | Name: `Dictionary`, `DictionaryCore`<br>Path: `/dictionary/`<br>Event: `DictionaryUpgraded`<br>Function: `bulkSetImplementation` |
| Proxy | Function: `getDictionary`<br>Name: `BorderlessProxy` |
| Implementation | Path: `/functions/` directory |

---

### UUPS (EIP-1822)

**Architecture:**
```
User → Proxy (stores data) → Implementation (stores logic)
```

**Detection Criteria:**

| Role | Criteria |
|------|----------|
| Proxy | Functions: `upgradeTo`, `upgradeToAndCall`<br>Inheritance: `ERC1967Proxy` |
| Implementation | Functions: `proxiableUUID`, `_authorizeUpgrade`<br>Inheritance: `UUPSUpgradeable` |

---

### Transparent Proxy

**Architecture:**
```
User → Proxy → Implementation
Admin → Proxy (admin functions)
```

**Detection Criteria:**

| Role | Criteria |
|------|----------|
| Proxy | Inheritance: `TransparentUpgradeableProxy`<br>Functions: `admin` |
| Implementation | (determined by relationship) |

---

### Diamond (EIP-2535)

**Architecture:**
```
User → Diamond → Facet(s)
```

**Detection Criteria:**

| Role | Criteria |
|------|----------|
| Diamond | Functions: `diamondCut`, `facets`, `facetAddress`<br>Events: `DiamondCut`<br>Name contains `diamond` |
| Facet | Path: `/facets/`<br>Name contains `facet` |
| Library | Name: `LibDiamond` |

---

### Beacon Proxy

**Architecture:**
```
User → BeaconProxy → Beacon → Implementation
```

**Detection Criteria:**

| Role | Criteria |
|------|----------|
| Beacon | Inheritance: `UpgradeableBeacon`<br>Functions: `implementation` with beacon name |
| Proxy | Inheritance: `BeaconProxy` |

---

## Detection Algorithm

### Main Detection Function

```typescript
function detectProxyPattern(contract: Contract): {
  pattern?: ProxyPatternType;
  role?: ProxyRole;
}
```

### Detection Order

The algorithm checks patterns in this order (important to avoid false positives):

1. **ERC-7546 Dictionary** - Most specific patterns first
2. **ERC-7546 Proxy**
3. **ERC-7546 Implementation** (directory-based)
4. **UUPS** - Function/inheritance-based
5. **Diamond** - Function/event-based
6. **Beacon** - Name/inheritance-based
7. **Transparent** - Inheritance-based

### False Positive Prevention

ERC-7546 detection is strict to avoid confusion with other patterns:

```typescript
// DO NOT detect ERC-7546 based on common functions like:
// - setImplementation (also in UUPS, Transparent)
// - getImplementation (also in UUPS, Beacon)

// ONLY use ERC-7546 specific indicators:
// - /functions/ directory structure
// - bulkSetImplementation function
// - DictionaryUpgraded event
// - getDictionary function
```

---

## Grouping Logic

### ProxyGroup Structure

```typescript
interface ProxyGroup {
  id: string;
  name: string;
  patternType: ProxyPatternType;
  proxy?: string;
  dictionary?: string;
  implementations: string[];
  beacon?: string;
}
```

### Module Extraction

For ERC-7546, modules are extracted from paths:

```typescript
// Path: "sc/ERC721/functions/ERC721.sol"
// Module: "ERC721"

// Path: "sc/Services/Token/LETS/functions/LETS.sol"
// Module: "LETS"
```

### Group Creation Process

1. **First Pass**: Detect patterns and roles for all contracts

2. **ERC-7546 Core Group**:
   - Create single group for Dictionary + Proxy
   - ID: `proxy-group-core`
   - Name: `ERC7546 Core`

3. **ERC-7546 Module Groups**:
   - Group implementations by base directory
   - Include related libraries
   - Reference core Dictionary/Proxy

4. **Other Patterns**:
   - Create group for each proxy contract
   - Link to detected implementations

---

## ERC-7546 Specifics

### Directory Structure

Expected structure for ERC-7546 projects:

```
project/
├── core/
│   ├── Dictionary.sol
│   └── BorderlessProxy.sol
├── ERC721/
│   ├── functions/
│   │   ├── ERC721.sol
│   │   ├── ERC721Metadata.sol
│   │   └── ERC721Enumerable.sol
│   ├── libs/
│   │   └── ERC721Lib.sol
│   └── interfaces/
│       └── IERC721.sol
└── Token/
    └── functions/
        └── Token.sol
```

### Module Base Directory

```typescript
function getModuleBaseDir(filePath: string): string | null {
  const specialDirs = ['functions', 'libs', 'interfaces', 'storages', 'tests'];

  for (const special of specialDirs) {
    const idx = parts.findIndex(p => p.toLowerCase() === special);
    if (idx > 0) {
      return parts.slice(0, idx).join('/');
    }
  }

  return null;
}
```

### Related Contract Detection

Contracts in the same module are automatically grouped:

| Directory | Included In |
|-----------|-------------|
| `/functions/` | Main implementations |
| `/libs/` | Library implementations |
| `/interfaces/` | Referenced but not implementation |
| `/storages/` | Storage contracts |

---

## Visualization

### Group Nodes

Detected proxy groups are visualized as:
- Dedicated group node containing related contracts
- Visual indicator of pattern type
- Color-coded relationships

### Edge Types

| Relationship | Edge Type |
|-------------|-----------|
| Proxy → Implementation | `delegatecall` |
| Dictionary → Implementation | `registers` |
| Proxy → Dictionary | `uses` |
| Proxy → Beacon | `uses` |
| Beacon → Implementation | `delegatecall` |
