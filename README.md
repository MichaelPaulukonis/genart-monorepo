# GenArt Monorepo

A monorepo for creative coding and generative art projects using Nx.

## Projects

- **[duo-chrome](./apps/duo-chrome/)** (port 5173) - Duotone image compositions using RISO colors
- **[crude-collage-painter](./apps/crude-collage-painter/)** (port 5174) - Interactive collage painting tool
- **[those-shape-things](./apps/those-shape-things/)** (port 5175) - Geometric tile-based compositions with color palettes
- **[computational-collage](./apps/computational-collage/)** (port 5176) - Advanced collage creation with multiple composition modes

All applications include version display functionality accessible through help screens or about dialogs.

## Shared Libraries

- **[@genart/p5-utils](./libs/p5-utils/)** - Common p5.js utilities and helper functions
- **[@genart/color-palettes](./libs/color-palettes/)** - RISO colors and palette management
- **[@genart/version-utils](./libs/version-utils/)** - Shared version display utilities (future consolidation)

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all projects in development mode
pnpm dev

# Build all projects
pnpm build
```

## Development

Each project runs on its own port and can be developed independently:

```bash
# Run specific project
nx dev duo-chrome              # http://localhost:5173
nx dev crude-collage-painter   # http://localhost:5174
nx dev those-shape-things      # http://localhost:5175
nx dev computational-collage   # http://localhost:5176

# Build specific project
nx build duo-chrome
nx build crude-collage-painter

# Run all projects simultaneously
pnpm dev
```

## Project Structure

```
genart-monorepo/
├── apps/                      # Individual applications
│   ├── duo-chrome/           # Duotone compositions
│   ├── crude-collage-painter/ # Collage painting tool
│   ├── those-shape-things/   # Geometric tile compositions
│   └── computational-collage/ # Advanced collage creation
├── libs/                     # Shared libraries
│   ├── p5-utils/            # Common utilities
│   └── color-palettes/      # Color management
├── tools/                   # Build and deployment tools
├── docs/                    # Documentation
│   ├── guides/             # How-to guides
│   └── architecture/       # Technical documentation
└── dist/                   # Build outputs
```

## Adding New Projects

See [docs/guides/adding-projects.md](./docs/guides/adding-projects.md) for detailed instructions on adding new creative coding projects to the monorepo.

## Architecture

See [docs/architecture/overview.md](./docs/architecture/overview.md) for technical details about the monorepo structure and design decisions.

## Version Management and Deployment

This monorepo uses **Nx Release with independent versioning** - each app maintains its own version number and can be released independently.

### Quick Release and Deploy
```bash
# Release and deploy a specific app (one command)
nx run duo-chrome:release-deploy
nx run crude-collage-painter:release-deploy
nx run those-shape-things:release-deploy
nx run computational-collage:release-deploy

# Release all changed apps
nx release
```

### Conventional Commits
Use conventional commit messages for automatic version bumping:
```bash
# Feature (minor bump: 0.1.0 → 0.2.0)
git commit -m "feat(duo-chrome): add new color blending mode"

# Bug fix (patch bump: 0.1.0 → 0.1.1)  
git commit -m "fix(dragline): resolve canvas scaling issue"
```

See [docs/guides/version-management.md](./docs/guides/version-management.md) for complete documentation.

## Commands

```bash
# Development
pnpm dev                    # Run all projects
nx dev <project-name>       # Run specific project

# Building
pnpm build                  # Build all projects
nx build <project-name>     # Build specific project

# Version Management
nx release                  # Release all changed apps
nx release --projects=<app> # Release specific app
nx run <app>:release-deploy # Release and deploy app

# Deployment
nx run <app>:deploy         # Deploy specific app
nx run-many --target=deploy # Deploy all apps

# Code Quality
pnpm lint                   # Lint all projects
nx lint <project-name>      # Lint specific project

# Utilities
nx graph                    # View project dependency graph
nx affected:build           # Build only affected projects
```

## Version Display

All applications include version display functionality that shows the current version from each app's `package.json`:

- **duo-chrome**: Press `H` or `I` to open help overlay with version info
- **crude-collage-painter**: Press `?` or `h` to open help screen with version info  
- **those-shape-things**: Press `I` to open about dialog with version info
- **computational-collage**: Press `Q` to open about dialog with version info

Version information is automatically generated during the build process and always reflects the current package.json version.

### Troubleshooting Version Display

If version display shows "v1.0.0" instead of the expected version:

1. **Check build process**: Ensure the app was built with `nx build <app-name>`
2. **Verify package.json**: Confirm the app's package.json has a valid version field
3. **Clean build**: Try `rm -rf dist/apps/<app-name>` and rebuild
4. **Check console**: Look for version loading warnings in browser developer tools

The version generation happens automatically during build - no manual configuration needed.

## Contributing

1. Follow the [project addition guide](./docs/guides/adding-projects.md) for new projects
2. Use StandardJS code style (enforced by ESLint)
3. Extract common patterns into shared libraries when appropriate
4. Update documentation when adding new features or projects