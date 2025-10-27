# Version Display Customization Guide

Quick reference for customizing version displays in GenArt applications.

## Safe Customization Patterns

### 1. CSS Custom Properties (Recommended)
```css
/* In your app's CSS file */
:root {
  --version-text-color: #your-color;
  --version-border-color: #your-border;
}
```

### 2. Predefined Classes
```html
<div class="version-info version-theme-minimal">v1.0.0</div>
```

### 3. App-Specific Scoping
```css
.app-your-app {
  --version-font-family: 'Your Font', serif;
}
```

## Common Customizations

### Match App Theme Colors
```css
/* Example: Teal theme */
.version-info {
  --version-border-color: teal;
}
```

### Custom Typography
```css
.help-overlay {
  --version-font-family: 'Times New Roman', serif;
  --version-font-size: 0.85em;
}
```

### Minimal Style
```html
<div class="version-info version-theme-minimal">v1.0.0</div>
```

## Accessibility Guidelines

- Maintain 4.5:1 contrast ratio minimum
- Test with system dark mode
- Ensure text remains selectable
- Verify focus indicators work

## What NOT to Override

❌ Don't override base layout properties  
❌ Don't disable accessibility features  
❌ Don't use `!important` unless necessary  
❌ Don't duplicate shared library styles  

## Testing Your Changes

1. Build your app: `nx build your-app`
2. Check for CSS errors in console
3. Test in light and dark modes
4. Verify responsive behavior