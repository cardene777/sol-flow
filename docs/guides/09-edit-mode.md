# Edit Mode

Sol-Flow automatically detects relationships between contracts through static code analysis. However, there are relationships that cannot be detected by static analysis, such as dynamic calls or relationships defined in configuration files. Edit Mode lets you manually add such relationships.

## What is Edit Mode?

Edit Mode is a feature for adding custom edges (relationship lines) between contracts. It's useful in situations like:

| Use Case | Description |
|----------|-------------|
| Documenting proxy relationships | When proxy and implementation contract relationships aren't auto-detected |
| Showing dynamic interactions | When addresses are set in constructors or configuration functions |
| Architecture explanation | Complementing diagrams for technical documentation or audit reports |

## Enabling Edit Mode

Edit Mode is only available for saved projects. It cannot be used when viewing built-in libraries.

![Edit Button](./images/edit-mode/edit-button.png)

### How to Enable

1. Import contracts or open a saved project
2. Click the "Edit" button on the right side of the header
3. When the button turns orange and shows "Editing", Edit Mode is active

![Edit Mode Active](./images/edit-mode/edit-mode-active.png)

### How to Disable

To exit Edit Mode, click the "Edit" button again.

## Edge Types

Sol-Flow allows you to add two types of custom edges.

### Temporary Edge

| Property | Description |
|----------|-------------|
| Color | Red dashed line |
| Saved | Not saved (disappears on page reload) |
| Creation condition | When Edit Mode is off, or when viewing built-in libraries |
| Purpose | Temporary notes or checking relationships experimentally |

### User Edge

| Property | Description |
|----------|-------------|
| Color | Cyan (light blue) |
| Saved | Saved with the project |
| Creation condition | When Edit Mode is on |
| Purpose | Relationships you want to record permanently |

## How to Add Edges

![Adding Edge](./images/edit-mode/add-edge.gif)

### Basic Operation

1. Find the source contract node (starting point of the relationship)
2. Click and hold on that node, then drag to the target contract node (endpoint of the relationship)
3. Release the mouse button over the target node to create the edge

### Creating Temporary Edges

Performing the drag operation with Edit Mode off or while viewing built-in libraries creates a temporary edge. Temporary edges are useful for exploration and verification but disappear when you refresh the page.

### Creating User Edges

Performing the drag operation with Edit Mode on creates a user edge. User edges are saved with the project and will be displayed when you open the project next time.

## Deleting Edges

### Deleting Temporary Edges

Hovering over a temporary edge shows a delete button (X icon). Click this button to delete the edge.

Also, reloading the page deletes all temporary edges at once.

### Deleting User Edges

User edges can similarly be deleted by hovering and clicking the delete button. Deletion is immediately saved to the project.

## Use Cases

### Documenting Proxy Patterns

When proxy contract and implementation contract relationships aren't auto-detected, you can manually add delegatecall relationships.

```
MyProxy ──delegatecall──> MyImplementationV1
```

### DeFi Protocol Architecture

You can express relationships where a router contract calls multiple token contracts.

```
Router ──uses──> TokenA
Router ──uses──> TokenB
Router ──uses──> LiquidityPool
```

### Audit Documentation

During security audits, you can explicitly show important interactions between contracts.

## Best Practices

### Use Sparingly

We recommend using custom edges only for relationships that cannot be detected by static analysis. Adding edges that duplicate auto-detected relationships clutters the diagram.

### Review Regularly

When code changes, manually added edges may no longer match actual relationships. Review custom edges when you update project code.

### Be Clear About Intent

When adding edges, understand why that relationship exists before adding. Leaving supplementary explanations in technical documentation or comments helps when reviewing later.

## About Saving

User edges are automatically saved as part of the project. No explicit save operation is required.

## Next Steps

- [Proxy Patterns](./10-proxy-patterns.md) - Learn about auto-detected proxy patterns
- [Export](./12-export.md) - Export your edited diagram as an image
