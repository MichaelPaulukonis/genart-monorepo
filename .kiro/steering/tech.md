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

## Development Server Management

### Port Assignments

- duo-chrome: 5173
- crude-collage-painter: 5174
- those-shape-things: 5175
- computational-collage: 5176

### When starting a development server

1. Always check if a server is already running on the intended port before starting a new one
2. Use commands like `lsof -i :PORT` or `netstat -an | grep PORT` to check for existing processes
3. If a server is already running, either:
   - Use a different port explicitly with appropriate flags
   - Stop the existing server first with appropriate commands
   - Connect to the existing server instead of starting a new one

For React/Next.js/Node applications, consider adding the `-p` or `--port` flag with an alternative port if needed, or use the `--force` flag when appropriate to automatically select an alternative port.

Example:
```bash
# Check if port 3000 is in use
lsof -i :3000 || npm start
```
