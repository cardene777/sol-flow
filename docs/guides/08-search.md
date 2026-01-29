# Search

Sol-Flow's search feature lets you quickly find specific contracts, functions, and events from among many.

## Opening the Search Bar

The search bar is located in the header at the top of the screen.

![Search Bar](./images/search/search-bar.png)

Use either of these methods to open the search bar:

| Method | Operation |
|--------|-----------|
| Click | Click directly on the search bar in the header |
| Keyboard Shortcut | Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux) |

Memorizing the keyboard shortcut is convenient as it lets you start searching quickly without moving your mouse.

## How Search Works

### Real-time Search

Sol-Flow's search displays results in real-time as you type. There's no need to press a search button.

![Search Results](./images/search/search-results.png)

For example, typing "trans" immediately displays all items containing "trans" such as "transfer", "transferFrom", "_transfer", etc.

### Searchable Items

Search can find three types of items:

| Type | Description | Search Examples |
|------|-------------|-----------------|
| Contract Names | Names of imported contracts | `ERC20`, `Ownable`, `AccessControl` |
| Function Names | Names of functions within contracts | `transfer`, `approve`, `balanceOf` |
| Event Names | Names of events defined in contracts | `Transfer`, `Approval`, `OwnershipTransferred` |

### Search Result Grouping

Search results are displayed categorized by type. Each result shows a type indicator icon, and for functions and events, the contract name they belong to.

| Result Type | Displayed Information |
|-------------|----------------------|
| Contract | Contract name and category badge |
| Function | Function name and the contract where it's defined |
| Event | Event name and the contract where it's defined |

## Using Search Results

### Click to Navigate

Clicking an item in the search results performs these actions:

1. The search dropdown closes
2. Automatically navigates to the relevant contract on the canvas
3. Zoom adjusts to center that contract on screen

This feature lets you quickly find target contracts even in large diagrams.

### Canceling Search

Use any of these methods to cancel search and close results:

| Method | Operation |
|--------|-----------|
| Escape Key | Press the `Escape` key |
| Click Outside | Click outside the search dropdown |
| Clear Text | Delete all characters from the search bar |

## Search Tips

### Partial Matching

Search uses partial matching. Just typing part of a name finds all items containing that string.

| Input | Found Examples |
|-------|----------------|
| `trans` | `transfer`, `transferFrom`, `_transfer`, `safeTransferFrom` |
| `ERC` | `ERC20`, `ERC721`, `ERC1155`, `ERC20Burnable` |
| `owner` | `owner`, `onlyOwner`, `_checkOwner`, `OwnershipTransferred` |

### Case Insensitive

Search is case-insensitive. You get the same results regardless of capitalization.

| Input | Result |
|-------|--------|
| `ownable` | Finds `Ownable` |
| `OWNABLE` | Finds `Ownable` |
| `Ownable` | Finds `Ownable` |

### Common Search Keywords

Use these keywords for efficient searching based on your purpose:

**Finding Token-Related Functions**
- `transfer` - Token transfer functions
- `approve` - Approval functions
- `balance` - Balance checking functions
- `mint` - Token minting functions
- `burn` - Token burning functions

**Finding Access Control**
- `owner` - Owner-related functions
- `role` - Role-based access control
- `access` - Access control features

**Finding Interfaces**
- `IERC20` - ERC20 interface
- `IERC721` - ERC721 (NFT) interface
- `IAccess` - Access control interface

## Mobile Search

When using Sol-Flow on smartphones or tablets, the search process is slightly different.

1. Tap the search icon (magnifying glass) in the header
2. Enter search keywords in the displayed search bar
3. When results appear, tap the desired item to navigate

## Efficient Usage Tips

Tips for using the search feature effectively.

| Tip | Description |
|-----|-------------|
| Use as navigation | Instead of scrolling the diagram to find something, just enter a contract name in search to jump directly |
| Enter full names | For specific contracts, entering the complete name narrows down results |
| Combine with sidebar | Use sidebar for rough category filtering, search for finding specific items |
| Combine with zoom | After navigating via search, adjust zoom with mouse wheel for better viewing |

## Next Steps

- [Edit Mode](./09-edit-mode.md) - How to add custom relationships between contracts
- [Project Management](./11-project-management.md) - How to save and manage your work
