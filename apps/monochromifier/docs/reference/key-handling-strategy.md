# Key Handling Strategy

## Overview

Monochromifier implements selective key event prevention to ensure app-specific shortcuts work while allowing browser shortcuts to function normally. This prevents the common issue where creative coding apps capture all keystrokes and break browser functionality.

## Implementation Pattern

### Core Principle
- **Prevent default behavior ONLY for keys the app actually handles**
- **Allow browser defaults for all unhandled keys**

### Before (Problematic)
```javascript
const handleKeys = () => {
  if (p.key === 'i') {
    // handle invert
  }
  // ... other handlers
  return false // ❌ Blocks ALL browser shortcuts
}
```

### After (Selective)
```javascript
const handleKeys = () => {
  if (p.key === 'i') {
    // handle invert
    return false // ✅ Prevent default only for 'i'
  }
  if (p.key === 'r' && !p.keyIsDown(p.CONTROL) && !p.keyIsDown(91)) {
    // handle reset (but allow CMD+R/Ctrl+R for browser refresh)
    return false // ✅ Selective prevention
  }
  // ... other specific handlers with individual return false
  
  // ✅ Allow browser defaults for unhandled keys
}
```

## Key Categories

### App-Handled Keys (Prevent Default)
- `i` - Invert image
- `t` - Toggle transparency mode
- `r` - Reset (only when pressed alone)
- `p` - Toggle paint mode
- `x` - Toggle erase mode (paint mode only)
- `?` - Show/hide help
- `h`/`H` - Show/hide UI
- `f`/`F` - Toggle fit method
- `s` + Ctrl/Cmd - Save image
- `>`, `<` - Adjust offset
- Arrow keys - Adjust brush size or zoom/threshold
- Backspace/Delete - Clear paint layer

### Browser-Handled Keys (Allow Default)
- `CMD+R`/`Ctrl+R` - Refresh page
- `CMD+T`/`Ctrl+T` - New tab
- `CMD+W`/`Ctrl+W` - Close tab
- `OPT+CMD+I` - Developer tools
- `CMD+L`/`Ctrl+L` - Address bar
- All other unhandled keys and combinations

## Special Cases

### Modifier Key Conflicts
Always check for modifier keys when app uses single letters that might conflict:

```javascript
if (p.key === 'r' && !p.keyIsDown(p.CONTROL) && !p.keyIsDown(91)) {
  // Only handle 'r' alone, not CMD+R or Ctrl+R
  resetImage()
  return false
}
```

### Special Key Handling
For keys like arrows that apps commonly use, use a tracking system:

```javascript
const specialKeys = () => {
  let handledKey = false
  
  if (p.keyIsDown(p.UP_ARROW)) {
    adjustThreshold(1)
    handledKey = true
  }
  
  return handledKey ? false : undefined
}
```

## Benefits

- ✅ **Browser shortcuts work**: CMD+R refreshes, CMD+T opens tabs, etc.
- ✅ **App shortcuts work**: All creative controls function as expected
- ✅ **No conflicts**: Clear separation between app and browser functionality
- ✅ **Predictable**: Users can rely on standard browser behavior

## Future Improvements

A comprehensive, reusable solution is planned (see `/docs/plans/03.reusable-key-handling-library.md`) that would:
- Eliminate repetitive `return false` statements
- Provide declarative key mapping API
- Support context-sensitive handlers
- Include automatic conflict detection
- Work across all monorepo apps

## Implementation Notes

- Keycode 91 = CMD key on Mac
- `p.keyIsDown(p.CONTROL)` = Ctrl key
- Always test on multiple browsers and platforms
- Consider international keyboard layouts for special characters