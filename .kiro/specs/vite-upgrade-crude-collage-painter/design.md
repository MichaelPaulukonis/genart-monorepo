# Design Document

## Overview

This design outlines the approach for upgrading crude-collage-painter from Vite 2.7.2 to Vite 5.0. The upgrade involves updating the dependency version, modernizing the configuration file to use ES modules, and ensuring all existing functionality continues to work. The design prioritizes minimal disruption while aligning with monorepo standards.

## Architecture

### Current State
- Vite 2.7.2 with CommonJS configuration
- Custom server configuration for port 5174
- File system access configuration for monorepo structure
- GitHub Pages deployment with custom base path

### Target State
- Vite 5.0 with ES modules configuration
- Maintained server configuration (port 5174)
- Updated file system access configuration (if needed)
- Preserved GitHub Pages deployment functionality

## Components and Interfaces

### 1. Package Configuration (`package.json`)

**Changes Required:**
- Update `vite` dependency from `^2.7.2` to `^5.0.0`
- Remove vite from devDependencies (will use workspace version)

**Rationale:** The monorepo root already has Vite 5.0 as a devDependency, so crude-collage-painter should leverage the workspace version for consistency.

### 2. Vite Configuration (`vite.config.js`)

**Changes Required:**
- Convert from CommonJS (`require`/`module.exports`) to ES modules (`import`/`export`)
- Update to use `import { resolve } from 'path'` and `import { defineConfig } from 'vite'`
- Verify `server.fs.allow` configuration is still valid in Vite 5
- Maintain all existing configuration options

**Configuration Structure:**
```javascript
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: __dirname,
  base: process.env.DEPLOY_ENV === 'GH_PAGES' ? '/crude-collage-painter/' : '',
  server: {
    port: 5174,
    open: true,
    fs: {
      allow: [
        resolve(__dirname, '../..'),
        resolve(__dirname, '../../node_modules')
      ]
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
```

**Rationale:** Vite 5 prefers ES modules and this aligns with modern JavaScript standards. The `__dirname` workaround is needed because ES modules don't have `__dirname` by default.

### 3. Package Type Configuration

**Changes Required:**
- Add `"type": "module"` to package.json to enable ES modules

**Rationale:** This allows the vite.config.js to use ES module syntax without requiring a .mjs extension.

## Data Models

No data model changes required. This is purely a tooling upgrade.

## Error Handling

### Potential Issues and Mitigations

1. **Module Resolution Errors**
   - Issue: ES module syntax may cause import errors
   - Mitigation: Ensure package.json has `"type": "module"` and all imports use proper syntax

2. **File System Access Restrictions**
   - Issue: Vite 5 may have stricter file system access rules
   - Mitigation: Verify `server.fs.allow` configuration works; update if needed

3. **Build Output Changes**
   - Issue: Vite 5 may produce different build output structure
   - Mitigation: Test build output and verify GitHub Pages deployment still works

4. **Dependency Conflicts**
   - Issue: Other dependencies may not be compatible with Vite 5
   - Mitigation: Test all functionality; update dependencies if needed

## Testing Strategy

### Manual Testing Checklist

1. **Development Server**
   - Start dev server with `nx dev crude-collage-painter`
   - Verify application loads on port 5174
   - Test hot module replacement (HMR)
   - Verify all UI controls work (Tweakpane)
   - Test file upload/download functionality
   - Verify p5.js sketch renders correctly

2. **Production Build**
   - Run `nx build crude-collage-painter`
   - Verify build completes without errors
   - Check dist folder structure
   - Test preview with `nx preview crude-collage-painter`
   - Verify all assets load correctly

3. **GitHub Pages Deployment**
   - Run deployment script
   - Verify base path is correctly applied
   - Test deployed application functionality
   - Verify all assets load with correct paths

### Validation Criteria

- No console errors during development
- No build warnings or errors
- All existing features work identically
- Build output size is comparable (Vite 5 should be similar or smaller)
- HMR is as fast or faster than before

## Migration Path

1. Update package.json dependencies
2. Add `"type": "module"` to package.json
3. Convert vite.config.js to ES modules
4. Install dependencies with `pnpm install`
5. Test development server
6. Test production build
7. Test deployment (optional, can be done later)

## Rollback Plan

If issues arise:
1. Revert package.json changes
2. Revert vite.config.js to CommonJS
3. Run `pnpm install` to restore Vite 2.7.2
4. Document issues for future upgrade attempt
