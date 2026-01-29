# Navigation

Sol-Flow's canvas can be freely navigated using mouse or trackpad. This guide explains how to efficiently browse diagrams.

## Basic Operations

### Moving the View

You can scroll the diagram up, down, left, and right to view off-screen areas.

![Canvas Operations](./images/canvas/canvas-overview.png)

| Input Device | Method |
|--------------|--------|
| Mouse | Drag on empty canvas area (click and hold, then pull) |
| Trackpad | Two-finger swipe |
| Touch Screen | Single-finger swipe |

### Zoom (In/Out)

Use the following methods to zoom in or out on the diagram.

| Input Device | Method |
|--------------|--------|
| Mouse | Scroll mouse wheel (up to zoom in, down to zoom out) |
| Trackpad | Pinch gesture (spread two fingers to zoom in, pinch to zoom out) |
| Toolbar | Click the "+" or "-" buttons at the bottom left of the screen |

![Zoom Controls](./images/canvas/zoom-controls.png)

The zoom center is at the mouse cursor position. Place the cursor where you want to look, then zoom to center on that area.

### Fit View (Show All)

To fit the entire diagram on screen, click the "Fit" button (square icon) in the toolbar. This automatically adjusts zoom level and position so all nodes are visible.

This feature is useful when you've lost track of the diagram or want to see the overall picture.

## Toolbar Features

The toolbar at the bottom left of the canvas has the following buttons:

| Button | Icon | Function |
|--------|------|----------|
| Zoom In | + | Enlarges the diagram |
| Zoom Out | - | Shrinks the diagram |
| Fit | Square | Adjusts view so all nodes are visible |

## Moving Nodes

### Repositioning Nodes

Individual contract nodes can be dragged to any position.

![Node Drag](./images/nodes/node-drag.gif)

1. Move your mouse cursor over the node you want to move
2. Press and hold the left mouse button
3. Drag to the destination while holding the button
4. Release the button at the desired position

Node positions are automatically saved. Even when you reload the page, the positions you set are maintained.

### Tips for Effective Layout

Tips for organizing diagrams for readability.

| Tip | Description |
|-----|-------------|
| Keep related nodes close | Place contracts with inheritance relationships or frequently used together nearby for better readability |
| Consider hierarchy | Place parent contracts above, child contracts below to clarify inheritance relationships |
| Use space effectively | Leave adequate spacing between nodes to prevent overlap |

## Layout Switching

Sol-Flow allows you to switch between diagram layouts.

### Grid Layout

Arranges nodes in a grid pattern. Useful for getting an overview when there are many contracts.

```
[Contract A] [Contract B] [Contract C]
[Contract D] [Contract E] [Contract F]
[Contract G] [Contract H] [Contract I]
```

### Hierarchical Layout

Arranges based on inheritance relationships, with parent contracts above and child contracts below. Makes inheritance structures easy to understand.

```
        [Base Contract]
             |
    [Intermediate Contract]
         |         |
[Contract A]  [Contract B]
```

### How to Switch

Click the layout toggle button in the header to switch layouts.

![Layout Switch](./images/layout/layout-switch.gif)

The two icons near the center of the header are the layout toggle buttons.

| Icon | Layout | Description |
|------|--------|-------------|
| Grid (4 squares) | Grid | Arranges nodes in a grid pattern |
| Branch lines (tree shape) | Hierarchical | Arranges hierarchically based on inheritance |

## Keyboard Shortcuts

Keyboard shortcuts for efficient navigation.

| Shortcut | Function |
|----------|----------|
| `Cmd + K` (Mac) / `Ctrl + K` (Windows) | Open search bar |
| `Escape` | Close modals and dropdowns |

## Working with Large Diagrams

When there are many contracts, these techniques help.

### Use Search

Instead of scrolling to find a specific contract, use the search function (`Cmd + K`). Just type the contract name to instantly navigate to it.

### Filter by Category

Use the category checkboxes in the sidebar to narrow down which contract types are displayed. For example, checking only the Access Control category shows only access control-related contracts.

### Fit View for Overview

If you get lost while working, click the "Fit" button to show everything and confirm your location.

## Troubleshooting

### Can't Find Nodes

| Symptom | Solution |
|---------|----------|
| Diagram is off-screen | Click the "Fit" button to show all |
| Looking for a specific contract | Use search to find by contract name |
| Filtered by category | Check the category checkboxes in sidebar |

### Zoom Doesn't Work

| Symptom | Solution |
|---------|----------|
| Mouse wheel not responding | Ensure cursor is on the canvas |
| Browser zoom instead | Reset browser zoom to 100% (`Cmd + 0` / `Ctrl + 0`) |

## Next Steps

- [Contract Nodes](./04-contract-nodes.md) - Learn how to read and operate nodes in detail
- [Relationships](./05-relationships.md) - Understand what edges (lines) mean
