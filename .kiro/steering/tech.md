# Technology Stack

## Setup Requirements

### Global Tool Installation

Install these tools globally for the best development experience:

```bash
# Install nx globally for faster commands
npm install -g nx
# or
pnpm add -g nx

# Install pnpm if not already available
npm install -g pnpm
```

**Why global nx?**

- Shorter commands: `nx dev duo-chrome` vs `npx nx dev duo-chrome`
- Faster execution (no npx resolution overhead)
- Better IDE integration and tooling support
- Global nx automatically defers to local version for consistency

### Project Setup

```bash
# Clone and install dependencies
git clone <repo-url>
cd genart-monorepo
pnpm install

# Verify nx installation
nx --version
```

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

## Workflow Preferences

### Nx-First Approach

- **Prefer nx commands** over npm/pnpm scripts when available
- **Leverage nx caching** for builds, tests, and linting
- **Use dependency graph** features (`nx graph`, `nx affected`)
- **Create nx targets** for new workflows instead of standalone scripts
- **Utilize nx generators** for consistent project scaffolding

### Kiro IDE Integration

- **Use Kiro's built-in features** when available (specs, hooks, steering)
- **Leverage MCP tools** for external integrations
- **Prefer Kiro's file operations** over manual file editing
- **Utilize Kiro's context awareness** (#File, #Folder, #Codebase)
- **Take advantage of Kiro's AI capabilities** for code generation and analysis

## Development Commands

**CRITICAL: Always use `nx` commands instead of `npm run` or `pnpm` scripts for individual apps**

```bash
# Install dependencies
pnpm install

# Development (all projects) - prefer nx
nx run-many --target=dev --all
pnpm dev                       # fallback

# Development (specific project) - ALWAYS use nx
nx dev duo-chrome              # Port 5173
nx dev crude-collage-painter   # Port 5174
nx dev those-shape-things      # Port 5175
nx dev computational-collage   # Port 5176

# Building - ALWAYS use nx for individual apps
nx build <project-name>        # Build specific ✅ CORRECT
nx run-many --target=build --all  # Build all
pnpm build                     # fallback for all apps

# ❌ NEVER USE: npm run build or pnpm build inside app directories
# ❌ NEVER USE: cd apps/app-name && npm run build
# ❌ These will cause "Exit prior to config file resolving" errors

# Code quality - prefer nx
nx lint <project-name>         # Lint specific
nx run-many --target=lint --all   # Lint all
pnpm lint                      # fallback
standard --fix                 # Auto-fix formatting

# Testing - prefer nx (when targets are available)
nx test <project-name>         # Unit tests
nx test:e2e <project-name>     # E2E tests
nx run-many --target=test --all    # All tests

# Utilities - leverage nx features
nx graph                       # View dependency graph
nx affected:build              # Build only affected projects
nx affected:test               # Test only affected projects
nx show projects               # List all projects
nx show project <name>         # Show project details
```

### Build Command Guidelines

- **For AI agents**: Always use `nx build <app-name>` when building individual applications
- **Never use**: `npm run build` or `pnpm build` inside app directories - this causes Vite configuration errors
- **Root level**: `pnpm build` is acceptable for building all apps at once
- **Reason**: Nx properly sets up the workspace context and resolves dependencies correctly

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
