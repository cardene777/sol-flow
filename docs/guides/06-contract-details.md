# Contract Details

In Sol-Flow, clicking the detail button (info icon) on a contract node opens the "Contract Detail modal" which displays complete information about that contract. This guide explains how to use the detail modal.

## Opening the Detail Modal

There are multiple ways to open the Contract Detail modal:

| Method | Operation |
|--------|-----------|
| From canvas node | Click the detail button (info icon) in the node header |
| From sidebar | Hover over a contract name and click the icon that appears |

![Node Detail Button](./images/nodes/detail-button.gif)

You can also access it from the sidebar:

![Sidebar](./images/sidebar/sidebar-overview.gif)

## Modal Structure

The Contract Detail modal consists of multiple tabs. Click tabs to switch between different types of information.

![Contract Detail Overview](./images/contract-detail/detail-overview.png)

### Header Section

The top of the modal displays the following information:

| Display Item | Description |
|--------------|-------------|
| GitHub Link | Click to open the original source code's GitHub page (if available) |
| Contract Type | Badge showing CONTRACT, INTERFACE, LIBRARY, or ABSTRACT |
| Contract Name | The name of the contract |
| File Path | Location of the source file |

## Tab Types

### Variables (State Variables) Tab

Displays a list of state variables defined in the contract.

![Variables Tab](./images/contract-detail/detail-variables.png)

| Display Item | Description |
|--------------|-------------|
| Name | Variable name |
| Type | Variable type (`uint256`, `address`, `mapping(...)`, etc.) |
| Visibility | Visibility (`public`, `private`, `internal`) |
| Source | Definition location in source code (with line number link) |

Variables modified with `constant` or `immutable` display special badges.

### Structs Tab

Displays a list of structs defined in the contract.

![Structs Tab](./images/contract-detail/detail-structs.png)

### Events Tab

Displays a list of events defined in the contract. For each event, you can check parameters, their types, and the presence of `indexed` attributes.

![Events Tab](./images/contract-detail/detail-events.png)

### Errors Tab

Displays a list of custom errors defined in the contract. You can check custom errors introduced in Solidity 0.8.4 and later.

![Errors Tab](./images/contract-detail/detail-errors.png)

### Functions Tab

Lists all functions in the contract. For each function, you can check the following information:

![Functions Tab](./images/contract-detail/detail-functions.png)

| Display Item | Description |
|--------------|-------------|
| Function Name | Function name and signature |
| Visibility | `external`, `public`, `internal`, `private` |
| State Mutability | `view` (read-only), `pure` (computation only), `payable` (accepts ETH), etc. |
| Parameters | Input parameters and types |
| Return Values | Return values and types |
| Modifiers | Applied modifiers (`onlyOwner`, etc.) |

### Source Tab

Displays the complete source code of the contract.

![Source Code View](./images/contract-detail/detail-source.png)

The source code viewer has the following features:

| Feature | Description |
|---------|-------------|
| Syntax Highlighting | Solidity keywords, types, comments, etc. are color-coded |
| Line Numbers | Each line has a line number for easy reference |
| Copy Button | Copy the entire source code to clipboard |

### Syntax Highlighting Colors

Source code is color-coded as follows:

| Element | Color | Example |
|---------|-------|---------|
| Keywords | Purple | `contract`, `function`, `if`, `return` |
| Types | Blue | `uint256`, `address`, `bool`, `string` |
| Built-in Variables/Functions | Cyan | `msg.sender`, `block.timestamp`, `require` |
| Strings | Green | `"Hello World"` |
| Comments | Gray | `// comment`, `/* comment */` |
| NatSpec Documentation | Gray Italic | `/// @notice`, `/** @dev */` |
| Numbers | Orange | `100`, `0x1234` |

## Closing the Modal

Use any of these methods to close the modal:

| Method | Operation |
|--------|-----------|
| X Button | Click the X button in the top right of the modal |
| Escape Key | Press the `Escape` key |
| Click Outside | Click outside the modal (dark background area) |

## Usage Examples

### Code Review

You can check contract details during audits or reviews.

| Purpose | Tab to Check |
|---------|--------------|
| Check state variables | Variables |
| Check function signatures | Functions |
| Check events | Events |
| Check implementation details | Source |

### Contract Comparison

You can open multiple browser tabs to compare details of different contracts side by side. This is useful when comparing OpenZeppelin's ERC20 with Solmate's ERC20, for example.

### Copying Source Code

Use the copy button in the Source tab to copy the complete contract source code to clipboard. This is convenient for documentation creation or report writing.

## Next Steps

- [Function Flow](./07-function-flow.md) - Analyze function call relationships in detail
- [Search](./08-search.md) - Search for specific functions or events
