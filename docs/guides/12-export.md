# Export

This guide explains how to export diagrams created in Sol-Flow as images. Exported images can be used in documentation, presentations, audit reports, and more.

## Export Feature

In Sol-Flow, you can export the currently displayed diagram as a PNG image.

![Export Button](./images/export/export-button.png)

## Export Steps

### 1. Prepare the Diagram

Before exporting, organize the diagram for readability.

| Preparation Item | Description |
|------------------|-------------|
| Node placement | Place related nodes nearby for a readable layout |
| Zoom level | Adjust zoom so the whole is visible (Fit View is convenient) |
| Collapse sections | Collapse unnecessary details to emphasize important parts |

### 2. Execute Export

1. Click the export button (arrow-down icon) in the header
2. Export options are displayed

![Export Menu](./images/export/export-menu.png)

3. Select "Export as PNG" or "Export as SVG"
4. The image file downloads automatically

## Export Settings

You can change several settings when exporting.

| Setting | Options | Description |
|---------|---------|-------------|
| Background Color | Transparent, White, Dark | Select background color based on usage |
| Quality | Standard, High | Select image resolution |
| Range | All, Visible only | Select range to export |

### Choosing Background Color

| Background | Recommended Usage |
|------------|-------------------|
| Transparent | When overlaying on other images or documents |
| White | For print materials or light-mode documents |
| Dark | For presentations or dark-mode documents |

## Image Resolution

The resolution of exported images is based on the current view.

| Factor | Impact on Resolution |
|--------|---------------------|
| Zoom level | Exporting at higher zoom makes details more visible |
| Visible range | Image size varies based on number of displayed nodes |

If you need high-resolution images, zoom in before exporting.

## File Naming

Exported file names are auto-generated in this pattern:

```
sol-flow-[project-name]-[date].png
```

Example: `sol-flow-my-protocol-2024-01-15.png`

## Use Cases

### Technical Documentation

Include exported images in README files or Wikis to visually explain contract structure.

| Purpose | Description |
|---------|-------------|
| README | Show project architecture overview |
| Technical Specification | Explain inter-contract relationships in detail |
| API Documentation | Show system structure for external developers |

### Presentations

Use in team meetings or code review presentations.

| Scene | Usage |
|-------|-------|
| Design Review | Explain new feature architecture |
| Code Review | Visually show scope of impact from changes |
| Team Meetings | Share project progress and structure |

### Audit Reports

Document contract structure during security audits.

| Purpose | Description |
|---------|-------------|
| Scope Definition | Clearly show contracts under audit |
| Dependency Explanation | Visually show inter-contract relationships |
| Proxy Structure | Explain upgradeable contract structure |

### Social Sharing

Share created diagrams to promote projects or contribute to the community.

| Platform | Usage Example |
|----------|---------------|
| Twitter/X | Introduce new feature architecture |
| Blog Posts | Include diagrams in technical articles |
| Discord/Telegram | Use in community discussions |

## Pre-Export Checklist

A checklist for exporting high-quality images.

| Check Item | Verification |
|------------|--------------|
| Layout | Are nodes arranged for visibility? |
| Zoom | Is the zoom level appropriate to see necessary details? |
| Focus | Is the important part centered on screen? |
| Filters | Are unnecessary categories hidden? |

## For Large Diagrams

Tips when exporting diagrams with very many contracts.

| Challenge | Solution |
|-----------|----------|
| Can't see everything | Export in sections |
| Can't see details | Zoom in and export detail areas |
| File size too large | Export only the necessary range |

## Privacy Notes

Exported images contain the following information:

| Included Information | Example |
|----------------------|---------|
| Contract names | `MyToken`, `Treasury` |
| Function names | `transfer`, `withdraw` |
| Relationships | Inheritance, usage, delegatecall |

Please note the following when sharing diagrams of confidential projects:

| Consideration | Response |
|---------------|----------|
| Confidential contract names | Check names before sharing, edit image if needed |
| Internal structure | Consider audience when deciding sharing scope |

## Keyboard Shortcut

| Shortcut | Function |
|----------|----------|
| `Ctrl/Cmd + E` | Open export dialog |

## Next Steps

- [Getting Started](./01-getting-started.md) - Review the basics
- [Project Management](./11-project-management.md) - Save and manage your work
