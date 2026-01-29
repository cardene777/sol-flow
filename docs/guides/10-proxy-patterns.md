# Proxy Patterns

Sol-Flow automatically detects and visually represents major proxy patterns used in Ethereum smart contracts. This guide explains an overview of each proxy pattern and how it's displayed in Sol-Flow.

## What are Proxy Patterns?

Proxy patterns are design patterns for making smart contracts upgradeable. Since Ethereum contracts cannot be modified once deployed, proxy patterns enable "logic updates".

The basic mechanism is as follows:

| Component | Role |
|-----------|------|
| Proxy Contract | Receives calls from users and forwards them to the implementation contract. Holds storage (data) |
| Implementation Contract | Contains the actual business logic. Replaced with new implementation during upgrades |

Proxies use `delegatecall` to execute implementation contract code in the proxy's context (storage).

## Supported Proxy Patterns

Sol-Flow auto-detects the following proxy patterns.

### ERC-1967 (Transparent / UUPS)

The most widely used proxy standard. Stores implementation address and admin address in specific storage slots.

- **UUPS**

![UUPS](./images/proxy-patterns/uups.png)

- **Transparent**

![Transparent](./images/proxy-patterns/transparent.png)

```solidity
// Storage slots defined in ERC-1967
bytes32 constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
bytes32 constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
```

| Item | Description |
|------|-------------|
| Detection Method | Detects use of ERC-1967 defined storage slot constants |
| Display Badge | "UUPS" or "Transparent" |
| Role Badge | "Proxy", "Impl" |

### ERC-7546 (Modular Proxy)

A more flexible proxy pattern that can call different implementation contracts for each function.

![ERC-7546 Display Example](./images/proxy-patterns/erc7546-overview.png)

```solidity
interface IDictionary {
    function getImplementation(bytes4 selector) external view returns (address);
}
```

| Component | Role |
|-----------|------|
| Proxy | Receives user calls, queries dictionary, and forwards to appropriate implementation |
| Dictionary | Manages mapping of function selectors to implementation addresses |
| Implementation | Contracts implementing specific function groups (multiple can exist) |

| Item | Description |
|------|-------------|
| Detection Method | Detects IDictionary interface implementation or getImplementation function presence |
| Display Badge | "ERC-7546" |
| Role Badge | "Dict", "Proxy", "Impl" |

### ERC-2535 (Diamond)

A pattern that aggregates functionality from multiple "facet" contracts. Similar to ERC-7546 but with a more complex structure.

![Diamond](./images/proxy-patterns/diamond.png)

```solidity
struct Facet {
    address facetAddress;
    bytes4[] functionSelectors;
}
```

| Item | Description |
|------|-------------|
| Detection Method | Detects Diamond storage pattern or facet structure |
| Display Badge | "Diamond" |
| Role Badge | "Facet" |

### Beacon Proxy

A pattern where multiple proxies reference a common implementation. The Beacon contract manages the implementation address, and all proxies reference it.

```solidity
interface IBeacon {
    function implementation() external view returns (address);
}
```

| Item | Description |
|------|-------------|
| Detection Method | Detects IBeacon interface implementation |
| Display Badge | "Beacon" |
| Role Badge | "Beacon" |

## Display in Sol-Flow

### Node Display

Contracts using proxy patterns display special badges.

![Proxy Node Example](./images/proxy-patterns/erc7546-node.png)

Zooming in on the badge section shows:

![Proxy Badge Enlarged](./images/proxy-patterns/erc7546-badge.png)

| Display Location | Content |
|------------------|---------|
| Node top | Pattern name ("ERC-7546", "UUPS", etc.) |
| Node top (right side) | Role badge ("Proxy", "Impl", etc.) |
| Node border | Color based on pattern (ERC-7546 is green, UUPS is blue, etc.) |

### Edge Display

Proxy-related edges are displayed as pink dashed lines.

| Edge | Display | Meaning |
|------|---------|---------|
| delegatecall | Pink dashed | delegatecall relationship from proxy to implementation |
| registers | Violet dashed | Implementation registration to dictionary (ERC-7546) |

### ERC-7546 Layout Example

For ERC-7546 patterns, the following hierarchical structure is displayed:

```
           +-------------+
           |   Proxy     |  <- Entry point accessed by users
           +------+------+
                  |
           +------v------+
           | Dictionary  |  <- Function selector -> implementation mapping
           +------+------+
                  |
    +-------------+-------------+
    v             v             v
+-------+   +-------+   +-------+
| Impl1 |   | Impl2 |   | Impl3 |  <- Implementation for each feature
+-------+   +-------+   +-------+
```

## Usage Examples

### Upgrade Analysis

Understanding proxy patterns helps analyze:

| Check Item | Description |
|------------|-------------|
| Current implementation | Which contract has the actual logic |
| Storage compatibility | Whether storage layout maintains compatibility during upgrade |
| Admin access | Who can execute upgrades |

### Security Review

Check proxy pattern-related security risks:

| Check Item | Potential Risk |
|------------|----------------|
| Uninitialized proxy | Anyone might be able to call initialize function |
| Lack of access control | Possibility of unauthorized upgrades |
| Storage collision | Possibility of storage being overwritten between different contracts |

### Architecture Documentation

Visualizing proxy architecture can be used for:

| Purpose | Description |
|---------|-------------|
| Developer onboarding | Explain system structure to new team members |
| Audit preparation | Use as materials for security auditors |
| Technical specification | Include in protocol technical documentation |

## Built-in Libraries

Sol-Flow includes reference implementations of proxy patterns.

| Library | Included Patterns |
|---------|-------------------|
| OpenZeppelin | ERC-1967, Beacon, Transparent, UUPS |
| ERC-7546 | Modular proxy reference implementation |

You can view these implementations from the "Libraries" button in the sidebar.

## Next Steps

- [Project Management](./11-project-management.md) - Save proxy analysis results
- [Export](./12-export.md) - Export proxy diagrams as images
