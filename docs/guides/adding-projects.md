# Adding New Projects to GenArt Monorepo

This guide walks you through adding new creative coding projects to the monorepo.

## Quick Start

1. **Create project directory**
   ```bash
   mkdir apps/my-new-project
   cd apps/my-new-project
   ```

2. **Set up basic structure**
   ```bash
   # Create basic files
   touch index.html package.json vite.config.js project.json
   mkdir src css public
   ```

3. **Configure as Nx project** (see detailed steps below)

## Detailed Steps

### 1. Project Structure

Create your project in the `apps/` directory:

```
apps/my-new-project/
├── src/
│   ├── sketch.js          # Main p5.js sketch
│   └── utils.js           # Project-specific utilities
├── css/
│   └── style.css          # Project styles
├── public/                # Static assets
├── index.html             # Entry point
├── package.json           # Project dependencies
├── project.json           # Nx configuration
└── vite.config.js         # Vite configuration
```

### 2. Create package.json

```json
{
  "name": "my-new-project",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3. Create project.json (Nx Configuration)

```json
{
  "name": "my-new-project",
  "sourceRoot": "apps/my-new-project/src",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "@nx/vite:dev-server",
      "options": {
        "buildTarget": "my-new-project:build",
        "port": 5175
      }
    },
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/my-new-project",
        "configFile": "apps/my-new-project/vite.config.js"
      }
    },
    "preview": {
      "executor": "@nx/vite:preview-server",
      "options": {
        "buildTarget": "my-new-project:build",
        "port": 4175
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/my-new-project/**/*.{js,jsx}"]
      }
    }
  }
}
```

**Important**: Use a unique port number for each project:
- duo-chrome: 5173
- crude-collage-painter: 5174
- your-project: 5175+ (increment for each new project)

### 4. Create vite.config.js

```javascript
// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  root: __dirname,
  server: {
    port: 5175, // Use unique port
    open: true,
    fs: {
      allow: [
        // Allow serving files from the project root and parent directories
        resolve(__dirname, '../..'),
        // Allow serving from node_modules
        resolve(__dirname, '../../node_modules')
      ]
    }
  },
  build: {
    outDir: '../../dist/apps/my-new-project',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
```

### 5. Create index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My New Project</title>
  </head>
  <body>
    <script type="module" src="/src/sketch.js"></script>
  </body>
</html>
```

### 6. Create Basic p5.js Sketch

```javascript
// src/sketch.js
import { p5 } from 'p5js-wrapper'
import { getRandomColor, RISOCOLORS } from '@genart/color-palettes'
import { getRandomItem } from '@genart/p5-utils'
import '../css/style.css'

const sketch = function (p) {
  p.setup = function () {
    p.createCanvas(800, 600)
    p.background(240)
    
    // Use shared libraries
    const randomColor = getRandomColor(RISOCOLORS)
    p.fill(randomColor.color)
    p.ellipse(p.width/2, p.height/2, 200, 200)
  }
  
  p.draw = function () {
    // Your drawing code here
  }
}

new p5(sketch)
```

### 7. Add Dependencies (if needed)

If your project needs additional dependencies:

```bash
# From monorepo root
pnpm add -w your-dependency

# Or project-specific dependencies
cd apps/my-new-project
pnpm add your-dependency
```

### 8. Test Your Project

```bash
# From monorepo root
nx dev my-new-project

# Or from project directory
cd apps/my-new-project
npm run dev
```

## Using Shared Libraries

### @genart/p5-utils

```javascript
import { 
  getRandomUniqueItem, 
  getRandomItem, 
  datestring, 
  createFilenamer,
  mapRange,
  constrain 
} from '@genart/p5-utils'

// Example usage
const items = ['a', 'b', 'c', 'd']
const randomItem = getRandomItem(items)
const uniqueItem = getRandomUniqueItem(items, ['a', 'b'])

const namer = createFilenamer('my-sketch')
const filename = namer() // 'my-sketch-000000'
```

### @genart/color-palettes

```javascript
import { 
  RISOCOLORS, 
  PALETTE, 
  PALETTE_TWO,
  getRandomColor,
  hexToRgb,
  rgbToHex,
  createCustomPalette 
} from '@genart/color-palettes'

// Example usage
const randomRiso = getRandomColor(RISOCOLORS)
p.fill(randomRiso.color) // [r, g, b] array

const customPalette = createCustomPalette('my-colors', [
  { name: 'red', color: '#ff0000' },
  { name: 'blue', color: '#0000ff' }
])
```

## Common Patterns

### File Saving
```javascript
import { saveAs } from 'file-saver'
import { createFilenamer, datestring } from '@genart/p5-utils'

const namer = createFilenamer(`my-project-${datestring()}`)

function saveImage() {
  p.saveCanvas(namer(), 'png')
}
```

### Keyboard Controls
```javascript
p.keyPressed = function() {
  switch (p.key) {
    case 's':
    case 'S':
      saveImage()
      break
    case ' ':
      // Regenerate or pause
      break
  }
}
```

## Deployment

Each project can be deployed independently:

```bash
# Build specific project
nx build my-new-project

# Output will be in dist/apps/my-new-project/
```

## Tips

1. **Port Management**: Keep track of used ports in the main README
2. **Shared Code**: If you find yourself copying code between projects, consider adding it to the shared libraries
3. **Naming**: Use kebab-case for project names (my-new-project)
4. **Documentation**: Add a README.md to your project directory
5. **Assets**: Put images and other assets in the `public/` directory

## Troubleshooting

### Build Errors
- Check that all imports are correct
- Ensure dependencies are installed at workspace level
- Verify vite.config.js paths are correct

### Port Conflicts
- Each project needs a unique port
- Update both project.json and vite.config.js
- Check that no other services are using the port

### Import Issues
- Shared libraries use ES modules (`@genart/...`)
- Make sure `type: "module"` is in package.json
- Use relative imports for local files (`./utils.js`)