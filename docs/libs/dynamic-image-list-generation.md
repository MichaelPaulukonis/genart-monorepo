# Dynamic Image List Generation for Duo-Chrome

This document describes the automatic image list generation system implemented for the duo-chrome application.

## Overview

The duo-chrome app now automatically generates its image list at build time by scanning the `public/images/` directory for PNG files. This eliminates the need to manually maintain the `imagelist.js` file whenever images are added or removed.

## Implementation

### Vite Plugin
- **Location**: `tools/vite-plugin-image-list.js`
- **Purpose**: Scans image directories and generates JavaScript modules with arrays of filenames
- **Features**:
  - Recursive directory scanning
  - Configurable file extensions
  - Hot-reload support in development
  - Cross-platform path handling

### Configuration
In `apps/duo-chrome/vite.config.js`:
```javascript
imageListPlugin({
  scanDir: 'public/images',
  outputFile: 'src/generated/images.js',
  extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  exportName: 'imgs'
})
```

### Generated Output
- **File**: `src/generated/images.js`
- **Exports**: 
  - Named export: `export const imgs = [...]`
  - Default export: `export default imgs`
- **Auto-generated**: Rebuilt on every build and dev server start

## Usage in Duo-Chrome

The app imports from the generated file:
```javascript
import { imgs } from './generated/images.js'
```

## Benefits

1. **Automatic Discovery**: New images are automatically available without code changes
2. **Consistency**: No risk of manually maintained lists getting out of sync
3. **Developer Experience**: Hot-reload updates when images are added/removed in development
4. **Extensibility**: Plugin can be reused by other apps in the monorepo

## Extensibility for Other Apps

The `vite-plugin-image-list.js` plugin is designed to be reusable across the monorepo:

### Configuration Options
- `scanDir`: Directory to scan for images (relative to app root)
- `outputFile`: Where to generate the JavaScript module
- `extensions`: Array of file extensions to include
- `exportName`: Name of the exported constant
- `recursive`: Whether to scan subdirectories (default: true)

### Usage in Other Apps
```javascript
// In another app's vite.config.js
import { imageListPlugin } from '../../tools/vite-plugin-image-list.js'

export default {
  plugins: [
    imageListPlugin({
      scanDir: 'public/assets',
      outputFile: 'src/auto/media.js',
      extensions: ['.png', '.jpg'],
      exportName: 'mediaFiles'
    })
  ]
}
```

### Potential Applications
- **Computational-Collage**: Generate lists of source images
- **Crude-Collage-Painter**: Discover brush textures or templates
- **Those-Shape-Things**: Load SVG or image assets dynamically
- **Any App**: Asset discovery for themes, icons, or content

## Migration Notes

- The original static `imagelist.js` file can be removed
- The generated `images.js` file should not be committed (added to .gitignore)
- Build process now includes image list generation step
- No changes required to application logic beyond import path

## Technical Details

- **Build Integration**: Runs during Vite's `buildStart` hook
- **Development**: Regenerates on file changes in the scan directory
- **Performance**: Minimal overhead, only scans when needed
- **Error Handling**: Graceful fallback if image directory is missing
- **Output**: Clean ES modules with both named and default exports