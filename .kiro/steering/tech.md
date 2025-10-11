# Technology Stack

## Build System & Tools

- **Nx**: Monorepo orchestration, task running, and caching
- **Vite**: Fast development server and optimized production builds
- **pnpm**: Package manager with workspace support
- **ESLint + StandardJS**: Code linting and formatting

## Core Technologies

- **p5.js**: Primary creative coding library
- **p5js-wrapper**: Module-friendly p5.js integration
- **JavaScript (ES6+)**: Modern JavaScript with modules
- **HTML5 Canvas**: Rendering target for visual compositions
- **CSS3**: Styling and responsive design

## Key Dependencies

- **file-saver**: Export functionality for saving artwork
- **tweakpane**: GUI controls for interactive parameters
- **jszip**: Archive handling for bundled assets
- **Custom libraries**: `@genart/p5-utils`, `@genart/color-palettes`

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (all projects)
pnpm dev
nx run-many --target=dev --all

# Development (specific project)
nx dev duo-chrome              # Port 5173
nx dev crude-collage-painter   # Port 5174
nx dev those-shape-things      # Port 5175
nx dev computational-collage   # Port 5176

# Building
pnpm build                     # Build all
nx build <project-name>        # Build specific

# Code quality
pnpm lint                      # Lint all
nx lint <project-name>         # Lint specific
standard --fix                 # Auto-fix formatting

# Utilities
nx graph                       # View dependency graph
nx affected:build              # Build only affected projects
```

## Port Assignments

- duo-chrome: 5173
- crude-collage-painter: 5174
- those-shape-things: 5175
- computational-collage: 5176