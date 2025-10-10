# GenArt Monorepo

A monorepo for creative coding and generative art projects using Nx.

## Projects

- **duo-chrome** - Duotone image compositions using RISO colors
- **crude-collage-painter** - Interactive collage painting tool

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all projects in development mode
pnpm dev

# Build all projects
pnpm build
```

## Structure

```
genart-monorepo/
├── apps/           # Individual applications
├── libs/           # Shared libraries
├── tools/          # Build and deployment tools
└── docs/           # Documentation
```

## Development

Each project can be run independently:

```bash
# Run specific project
nx dev duo-chrome
nx dev crude-collage-painter

# Build specific project
nx build duo-chrome
```

## Adding New Projects

See [docs/guides/adding-projects.md](./docs/guides/adding-projects.md) for instructions on adding new creative coding projects to the monorepo.