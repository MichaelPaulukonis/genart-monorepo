# Project Structure & Organization

## Monorepo Layout

```
genart-monorepo/
├── apps/                      # Individual applications
│   ├── duo-chrome/           # Duotone compositions app
│   ├── crude-collage-painter/ # Collage painting app
│   ├── those-shape-things/   # Geometric tile compositions app
│   └── computational-collage/ # Advanced collage creation app
├── libs/                     # Shared libraries
│   ├── p5-utils/            # Common p5.js utilities
│   └── color-palettes/      # RISO colors and palette management
├── tools/                   # Build and deployment tools
├── docs/                    # Documentation
│   ├── guides/             # How-to guides
│   └── architecture/       # Technical documentation
├── dist/                   # Build outputs
├── .nx/                    # Nx cache and workspace data
└── .kiro/                  # Kiro AI assistant configuration
```

## Application Structure

Each app follows this standard structure:

```
apps/project-name/
├── src/
│   ├── sketch.js          # Main p5.js sketch file
│   ├── utils.js           # Project-specific utilities
│   └── *.js               # Additional modules
├── css/
│   └── style.css          # Project styles
├── public/
│   └── images/            # Static assets (images, etc.)
├── index.html             # Entry point
├── package.json           # Project dependencies
├── project.json           # Nx configuration
├── vite.config.js         # Vite build configuration
└── README.md              # Project documentation
```

## Library Structure

Shared libraries in `libs/` use this pattern:

```
libs/library-name/
├── src/
│   └── index.js           # Main export file
├── package.json           # Library metadata
└── README.md              # Library documentation
```

## Naming Conventions

- **Apps**: kebab-case (e.g., `duo-chrome`, `crude-collage-painter`)
- **Libraries**: scoped packages `@genart/library-name`
- **Files**: kebab-case for directories, camelCase for JS files
- **Variables**: camelCase in JavaScript
- **Constants**: UPPER_SNAKE_CASE

## Import Patterns

- Use ES6 modules (`import`/`export`)
- Import p5.js via `p5js-wrapper` for module compatibility
- Shared libraries imported as `@genart/library-name`
- Relative imports for local modules

## Configuration Files

- `nx.json`: Workspace-level Nx configuration
- `package.json`: Root dependencies and workspace scripts
- `pnpm-workspace.yaml`: pnpm workspace configuration
- Individual `vite.config.js` per app with unique ports