# Version Display Library

A shared CSS library for consistent version information display across all GenArt applications.

## Quick Start

### 1. Import the CSS

In your application's main JavaScript file:

```javascript
import '../../../libs/version-display/version-display.css'
```

### 2. Use the HTML Structure

```html
<!-- For help overlays and info boxes -->
<div class="version-info">v1.0.0</div>

<!-- For about dialogs -->
<div class="about-dialog-version">
  <div class="version-display">v1.0.0</div>
</div>
```

### 3. That's it!

The version display will automatically have:
- ✅ Good contrast and readability
- ✅ Responsive design
- ✅ Accessibility features
- ✅ Dark mode support (when appropriate)

## Customization

### Basic Color Customization

Override CSS custom properties in your app's CSS:

```css
/* Change version text color */
:root {
  --version-text-color: #2c3e50;
  --version-border-color: #3498db;
}
```

### App-Specific Theming

Use the predefined app classes:

```css
.app-duo-chrome {
  --version-font-family: 'Times New Roman', Times, serif;
}
```

### Quick Theme Variants

Add classes to your HTML:

```html
<!-- Minimal theme -->
<div class="version-info version-theme-minimal">v1.0.0</div>

<!-- Prominent theme -->
<div class="version-display version-theme-prominent">v1.0.0</div>

<!-- Custom color -->
<div class="version-info version-color-primary">v1.0.0</div>
```

## Available Customization Options

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--version-text-color` | `#333` | Text color |
| `--version-bg-color` | `rgba(0, 0, 0, 0.08)` | Background color |
| `--version-border-color` | `#ddd` | Border color |
| `--version-font-family` | `monospace` | Font family |
| `--version-font-size` | `0.8em` | Font size |

### Theme Classes

| Class | Effect |
|-------|--------|
| `.version-theme-minimal` | Transparent, no borders |
| `.version-theme-prominent` | Bold, stronger background |
| `.version-theme-subtle` | Lighter, minimal background |
| `.version-size-small` | Smaller text and spacing |
| `.version-size-large` | Larger text and spacing |
| `.version-color-primary` | Blue theme |
| `.version-color-success` | Green theme |
| `.version-color-warning` | Yellow theme |

## Examples from GenArt Apps

### duo-chrome Style
```css
.help-overlay {
  --version-font-family: 'Times New Roman', Times, serif;
  --version-text-color: #2c3e50;
}
```

### dragline Style
```css
.version-info {
  --version-border-color: teal;
}

#version-display {
  color: teal;
  background-color: rgba(0, 128, 128, 0.1);
}
```

### crude-collage-painter Style
```css
.version-info {
  --version-text-color: #8b4513; /* Saddle brown */
  --version-border-color: #d2691e; /* Chocolate brown */
}
```

## Troubleshooting

### Version text is too light
Make sure you're not overriding with old CSS. The shared library uses `#333` for good contrast.

### Custom colors not working
Ensure your CSS loads after the shared library import, or use `!important` if needed.

### Dark mode issues
The library automatically handles dark mode for appropriate contexts. Use `.dark-background` class if needed.

## File Structure

```
libs/version-display/
├── version-display.css    # Main CSS library
└── (documentation moved to docs/guides/)
```

## Related Documentation

- [Customization Guidelines](../version-display-customization.md)
- [Troubleshooting Guide](../troubleshooting/version-display-issues.md)

## Need Help?

Check the CSS file comments for detailed documentation of all available custom properties and classes.