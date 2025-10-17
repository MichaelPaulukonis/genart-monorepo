---
description: Vite and Nx integration requirements and best practices
globs: apps/*/vite.config.js, apps/*/project.json, apps/*/tsconfig.json
alwaysApply: true
---

# Vite + Nx Integration Requirements

## Required tsconfig.json for JavaScript Projects

- **All Vite projects MUST have a tsconfig.json file**, even pure JavaScript projects
- **Without tsconfig.json**: Nx Vite executor fails with "Cannot read properties of undefined (reading 'startsWith')" error
- **Minimal configuration for JS projects**:
  ```json
  {
    "compilerOptions": {
      "allowJs": true,
      "checkJs": false
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules"]
  }
  ```

## Vite Configuration for Nx

- **Use outDir and emptyOutDir** in vite.config.js build section:
  ```javascript
  build: {
    outDir: '../../dist/apps/project-name',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
  ```

- **Match outputPath** in project.json:
  ```json
  {
    "build": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/apps/project-name",
        "configFile": "apps/project-name/vite.config.js"
      }
    }
  }
  ```

## Package.json Requirements

- **Remove vite dependency** from individual apps (use workspace version)
- **Correct package name** should match project directory name
- **Example**:
  ```json
  {
    "name": "project-name",
    "version": "0.1.0",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    }
  }
  ```

## Common Issues

- **"startsWith" error**: Missing tsconfig.json file
- **Build output mismatch**: outDir doesn't match project.json outputPath
- **Filter not found**: Package name doesn't match directory name
- **Nx executor fails**: Missing required configuration in vite.config.js

## Verification Steps

1. Check tsconfig.json exists (even for JS projects)
2. Verify outDir matches outputPath in project.json
3. Confirm package name matches project directory
4. Test both `nx build project-name` and direct `vite build`