# @genart/version-utils

Shared version display utilities for the genart monorepo.

## Current Status

All apps now use the simplified version utility code (18 lines vs 105+ lines each):
- `apps/crude-collage-painter/src/utils/version.js` ✅ Simplified 
- `apps/duo-chrome/src/utils/version.js` ✅ Simplified
- `apps/those-shape-things/src/utils/version.js` ✅ Simplified
- `apps/computational-collage/src/utils/version.js` ✅ Simplified

## Usage

```javascript
// Current approach (per-app)
import { getFormattedVersion } from './utils/version.js'

// Future approach (shared library)
import { getFormattedVersion } from '@genart/version-utils'
```

## Migration Plan

1. ✅ Create shared library with simplified implementation
2. ✅ Update crude-collage-painter to use simplified version
3. ✅ Update all remaining apps to use simplified version
4. 🔄 Configure proper module resolution for shared libraries
5. ⏳ Migrate all apps to use shared library (eliminate duplication)
6. ⏳ Remove individual version utilities from apps

## Benefits

- **Consistency**: Same version formatting across all apps
- **Maintainability**: Single source of truth for version utilities  
- **Simplicity**: 18 lines instead of 105+ per app
- **Monorepo Best Practices**: Proper code sharing