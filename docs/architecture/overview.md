# Architecture Overview

## Monorepo Structure

```
genart-monorepo/
├── apps/                          # Individual applications
│   ├── duo-chrome/               # Duotone image compositions
│   └── crude-collage-painter/    # Interactive collage tool
├── libs/                         # Shared libraries
│   ├── p5-utils/                # Common p5.js utilities
│   └── color-palettes/          # Color management
├── tools/                       # Build and deployment tools
├── docs/                        # Documentation
├── dist/                        # Build outputs
├── nx.json                      # Nx workspace configuration
├── package.json                 # Root dependencies
└── pnpm-workspace.yaml         # pnpm workspace configuration
```

## Design Principles

### 1. Independent Deployability
- Each app in `apps/` can be built and deployed separately
- No runtime dependencies between applications
- Shared code is consumed as libraries, not direct imports

### 2. Shared Libraries
- Common patterns extracted into `libs/`
- Libraries are versioned and can evolve independently
- Clear API boundaries between apps and libraries

### 3. Consistent Tooling
- Nx orchestrates builds, tests, and development
- Vite provides fast development and optimized builds
- ESLint + StandardJS ensures code quality
- pnpm manages dependencies efficiently

## Technology Stack

### Build System
- **Nx**: Monorepo orchestration, task running, caching
- **Vite**: Fast development server and production builds
- **pnpm**: Efficient package management with workspaces

### Creative Coding
- **p5.js**: Core creative coding library
- **p5js-wrapper**: Module-friendly p5.js integration
- **Custom utilities**: Shared helper functions

### Code Quality
- **ESLint**: Linting with p5.js-specific rules
- **StandardJS**: Consistent code formatting
- **Git hooks**: Automated quality checks

## Shared Libraries

### @genart/p5-utils
Common utilities for p5.js projects:
- Array manipulation (`getRandomUniqueItem`, `getRandomItem`)
- File naming (`datestring`, `createFilenamer`)
- Math utilities (`mapRange`, `constrain`)

### @genart/color-palettes
Color management for creative projects:
- RISO printing colors (authentic ink colors)
- Custom palette creation
- Color conversion utilities (hex ↔ RGB)

## Development Workflow

### Adding New Projects
1. Create project in `apps/`
2. Configure Nx project settings
3. Set up Vite configuration
4. Import shared libraries as needed

### Shared Library Development
1. Identify common patterns across projects
2. Extract to appropriate library in `libs/`
3. Update consuming projects to use shared code
4. Version and document the library

### Build and Deployment
- **Development**: `nx dev project-name` or `pnpm dev`
- **Production**: `nx build project-name` or `pnpm build`
- **All projects**: `nx run-many --target=build --all`

## Port Management

Each project uses a unique development port:
- duo-chrome: 5173
- crude-collage-painter: 5174
- (new projects increment from 5175+)

## Caching Strategy

Nx provides intelligent caching:
- Build outputs cached based on input changes
- Only affected projects rebuild
- Shared cache across team members (when configured)

## Future Considerations

### Scaling
- Add more shared libraries as patterns emerge
- Consider micro-frontend architecture for complex UIs
- Implement automated testing for shared libraries

### Deployment
- Individual project deployment to different platforms
- Shared deployment utilities in `tools/`
- CI/CD pipeline for automated builds and deployments