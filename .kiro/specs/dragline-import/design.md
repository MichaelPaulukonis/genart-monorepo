# Design Document

## Overview

The dragline import involves migrating a standalone p5.js application into the genart-monorepo while preserving all functionality and adapting it to work within the Nx build system. The design focuses on maintaining the existing architecture while adapting configuration files, directory structure, and build processes to align with monorepo conventions.

The migration strategy is non-destructive - the original dragline repository will remain intact and continue to serve as the deployment target for GitHub Pages. The monorepo version will be the development environment, with builds pushed back to the original repository for deployment.

## Architecture

### Directory Structure

```
apps/dragline/
├── src/
│   ├── dragline.js           # Main p5 sketch orchestration
│   ├── blocks.js              # Block creation and positioning
│   ├── grid.js                # Character grid rendering
│   ├── selection.js           # Selection mode and cropping
│   ├── infobox.js             # Info panel toggle logic
│   ├── tumblr-random.js       # Tumblr API integration
│   ├── blocks.json            # Fallback block data
│   ├── grids.*.json           # Fallback grid data
│   └── text-grid/             # Text processing utilities
│       ├── index.js
│       ├── gridBuilder.js
│       ├── splitter.js
│       ├── tokenizer.js
│       └── utils/
│           └── helpers.js
├── css/
│   ├── style.css              # Base canvas styling
│   └── infobox.css            # Info panel styling
├── public/
│   ├── favicon.ico
│   └── saxmono.ttf            # Monospace font
├── docs/                      # Preserved documentation
│   ├── 01_backlog/
│   └── reference/
├── index.html                 # Entry point
├── package.json               # App dependencies
├── project.json               # Nx configuration
├── vite.config.js             # Vite build config
└── README.md                  # Adapted documentation
```

### Integration Points

1. **Nx Workspace**: The app integrates as a standard Nx project with defined targets
2. **pnpm Workspace**: Dependencies are managed through the workspace's pnpm configuration
3. **Vite Build System**: Uses Vite for development and production builds, consistent with other apps
4. **Shared Libraries**: Potential future integration with `@genart/p5-utils` for common utilities

## Components and Interfaces

### Core Modules

#### dragline.js (Main Orchestrator)
- **Purpose**: p5.js sketch setup, draw loop, and event handling
- **Dependencies**: blocks.js, grid.js, selection.js, tumblr-random.js
- **Key Functions**:
  - `setup()`: Initialize canvas and fetch initial text
  - `draw()`: Render loop for all blocks and selection overlay
  - `keyPressed()`, `mousePressed()`, `mouseDragged()`: Input handling
- **Integration**: Uses p5js-wrapper for module compatibility

#### blocks.js (Block Management)
- **Purpose**: Create, position, and manage text block instances
- **Key Functions**:
  - `createBlock(text, x, y)`: Generate new text block
  - `updateBlockPosition(block, x, y)`: Move block with collision detection
  - `changeZIndex(block, direction)`: Layer management
- **Data Structure**: Array of block objects with position, text, z-index, fill character

#### grid.js (Character Grid Rendering)
- **Purpose**: Convert text blocks into character grids and render to canvas
- **Key Functions**:
  - `buildGrid(text, width)`: Create character grid from text
  - `renderGrid(grid, x, y, fillChar)`: Draw grid to canvas
  - `populateCharGrid(blocks)`: Composite multiple blocks with z-index layering
- **Integration**: Works with text-grid utilities for text processing

#### selection.js (Crop Selection)
- **Purpose**: Grid-snapped selection rectangle for cropping
- **Key Functions**:
  - `enterSelectionMode()`: Activate selection overlay
  - `moveSelection(dx, dy)`: Nudge selection bounds
  - `saveSelection()`: Export cropped region as PNG
- **State**: Selection bounds, active state, grid snap size

#### tumblr-random.js (Content Fetching)
- **Purpose**: Fetch text from Tumblr API with fallback to local JSON
- **Key Functions**:
  - `fetchTumblrPosts(blogName, apiKey)`: API request
  - `parsePostContent(html)`: Strip HTML and extract text
  - `loadFallbackData()`: Use bundled JSON when API unavailable
- **Configuration**: Blog name, API key (via environment variable)

#### text-grid/ (Text Processing Utilities)
- **Purpose**: Tokenize, split, and gridify text content
- **Modules**:
  - `tokenizer.js`: Break text into words/phrases
  - `splitter.js`: Divide text into manageable chunks
  - `gridBuilder.js`: Convert text to fixed-width grids
  - `helpers.js`: Utility functions
- **Testing**: Jest tests exist for gridBuilder

### Configuration Files

#### package.json
```json
{
  "name": "@genart/dragline",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "p5": "^1.11.1",
    "p5js-wrapper": "^1.2.3",
    "axios": "^1.7.7"
  },
  "devDependencies": {
    "gh-pages": "^6.3.0"
  }
}
```

#### project.json (Nx Configuration)
```json
{
  "name": "dragline",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/dragline/src",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "@nx/vite:dev-server",
      "options": {
        "buildTarget": "dragline:build",
        "port": 5177
      }
    },
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/dragline"
      }
    },
    "preview": {
      "executor": "@nx/vite:preview-server",
      "options": {
        "buildTarget": "dragline:build",
        "port": 5177
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "options": {
        "lintFilePatterns": ["apps/dragline/**/*.js"]
      }
    },
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "command": "gh-pages -d dist/apps/dragline --repo https://github.com/MichaelPaulukonis/dragline.git --nojekyll"
      }
    }
  }
}
```

#### vite.config.js
```javascript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/dragline/' : '/',
  server: {
    port: 5177
  },
  build: {
    target: 'esnext',
    outDir: '../../dist/apps/dragline',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
}))
```

## Data Models

### Block Object
```javascript
{
  id: string,              // Unique identifier
  text: string,            // Original text content
  grid: string[][],        // Character grid representation
  x: number,               // Canvas x position
  y: number,               // Canvas y position
  width: number,           // Grid width in characters
  height: number,          // Grid height in characters
  zIndex: number,          // Layer order
  fillChar: string,        // Current fill character
  selected: boolean        // Selection state
}
```

### Selection State
```javascript
{
  active: boolean,         // Selection mode active
  x: number,               // Top-left x (grid units)
  y: number,               // Top-left y (grid units)
  width: number,           // Selection width (grid units)
  height: number,          // Selection height (grid units)
  cellSize: number         // Grid cell size in pixels
}
```

### Tumblr Response
```javascript
{
  posts: [{
    body: string,          // HTML content
    title: string,         // Post title
    timestamp: number      // Unix timestamp
  }]
}
```

## Error Handling

### Tumblr API Failures
- **Strategy**: Graceful degradation to local JSON files
- **Implementation**: Try-catch around axios requests, automatic fallback
- **User Feedback**: Console logging (optional debug mode)

### Missing Assets
- **Strategy**: Provide sensible defaults
- **Implementation**: Check for font availability, use system fallback if needed
- **User Feedback**: Console warnings for missing resources

### Invalid Text Data
- **Strategy**: Filter and sanitize input
- **Implementation**: Validate text before grid creation, skip empty/invalid blocks
- **User Feedback**: Silent filtering with debug logging

### Build Failures
- **Strategy**: Clear error messages and validation
- **Implementation**: Vite error reporting, path validation
- **User Feedback**: Terminal output with actionable messages

## Testing Strategy

### Unit Tests (Jest)
- **Scope**: Text processing utilities (text-grid/)
- **Existing Coverage**: gridBuilder.test.js
- **Additional Tests**: 
  - Tokenizer edge cases
  - Splitter boundary conditions
  - Helper function validation

### Integration Tests
- **Scope**: Module interactions (blocks + grid, selection + rendering)
- **Approach**: Test key workflows without full p5 environment
- **Priority**: Medium (optional for initial import)

### Manual Testing
- **Scope**: Full application functionality
- **Test Cases**:
  - Block dragging and positioning
  - Keyboard shortcuts (all documented combinations)
  - Selection mode and cropping
  - Tumblr API and fallback behavior
  - Save functionality (full canvas and selection)
  - Info box toggle
  - Z-index layering
  - Fill character cycling

### Build Verification
- **Scope**: Production build integrity
- **Checks**:
  - All assets bundled correctly
  - Paths resolve properly
  - No console errors on load
  - Deployment to GitHub Pages successful

## Deployment Strategy

### Development Workflow
1. Develop in monorepo: `nx dev dragline`
2. Test locally: `nx preview dragline`
3. Build for production: `nx build dragline`
4. Deploy to GitHub Pages: `nx deploy dragline`

### GitHub Pages Deployment
- **Target**: Original dragline repository (MichaelPaulukonis/dragline)
- **Tool**: gh-pages package
- **Process**: 
  1. Build creates `dist/apps/dragline` with base path `/dragline/`
  2. gh-pages pushes dist contents to `gh-pages` branch of original repo
  3. GitHub Pages serves from that branch at `michaelpaulukonis.github.io/dragline`

### Environment Variables
- **VITE_TUMBLR_KEY**: Optional Tumblr API key
- **Configuration**: `.env` file in app directory (not committed)
- **Fallback**: Public API key or local JSON files

## Migration Process

### Phase 1: Structure Setup
1. Create `apps/dragline/` directory structure
2. Copy source files maintaining organization
3. Create configuration files (package.json, project.json, vite.config.js)

### Phase 2: Configuration Adaptation
1. Update Vite config for monorepo paths
2. Configure Nx targets
3. Adjust HTML file paths
4. Update README with monorepo commands

### Phase 3: Dependency Resolution
1. Install dependencies via pnpm
2. Verify p5js-wrapper integration
3. Test axios and gh-pages availability

### Phase 4: Functionality Verification
1. Run dev server and test all interactions
2. Verify Tumblr API and fallback
3. Test save functionality
4. Validate selection mode

### Phase 5: Build and Deployment
1. Run production build
2. Verify asset bundling
3. Test deployment to GitHub Pages
4. Confirm live site functionality

## Future Enhancements

### Potential Shared Library Integration
- Extract common p5 utilities to `@genart/p5-utils`
- Share color palette management if applicable
- Create reusable text rendering utilities

### Monorepo-Specific Features
- Unified deployment dashboard
- Shared testing infrastructure
- Common linting and formatting rules
- Cross-project code sharing

### Documentation Integration
- Link to monorepo architecture docs
- Add to project showcase
- Include in deployment guides
