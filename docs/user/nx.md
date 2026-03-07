# Nx — Contributor Guide

Practical guide for working in the GenArt monorepo day-to-day. For technical internals, see [Developer Reference](../dev/nx.md).

## What is Nx here?

Nx orchestrates builds, tests, linting, and releases across all apps and shared libraries. You never run `vite` or `vitest` directly — always go through `nx` (or `pnpm nx`).

## Prerequisites

```bash
# Install dependencies (from monorepo root)
pnpm install
```

## Daily Commands

```bash
# Start an app in dev mode
pnpm nx dev duo-chrome

# Build an app
pnpm nx build duo-chrome

# Run unit tests
pnpm nx test duo-chrome

# Run end-to-end tests
pnpm nx e2e duo-chrome

# Lint an app
pnpm nx lint duo-chrome
```

## Running Multiple Apps

```bash
# Build all apps
pnpm nx run-many --target=build --all

# Lint all apps
pnpm nx run-many --target=lint --all

# Only build apps affected by your changes (fast, CI-friendly)
pnpm nx affected --target=build
```

## App Ports

Each app runs on a fixed dev port:

| App | Port |
|---|---|
| duo-chrome | 5173 |
| crude-collage-painter | 5174 |
| computational-collage | 5175 |
| dragline | 5176 |
| monochromifier | 5177 |
| those-shape-things | 5178 |

New apps use the next available port (5179+).

## Commits & Versioning

This repo uses **Conventional Commits** — your commit message determines the version bump:

```
feat(duo-chrome): add RISO color blending      → minor bump (0.1.0 → 0.2.0)
fix(dragline): resolve canvas scaling issue     → patch bump (0.1.0 → 0.1.1)
chore(duo-chrome): update dependencies         → patch bump
docs: update README                            → no bump
```

Format: `type(scope): description`

Use the **app name** as the scope (e.g. `duo-chrome`, `dragline`).

## Releasing an App

```bash
# Preview what would be released (dry run — safe to run anytime)
pnpm nx release --projects=duo-chrome --dry-run

# Release a specific app (bumps version, writes changelog, creates git tag)
pnpm nx release --projects=duo-chrome

# Release all apps that have changes
pnpm nx release
```

## Releasing and Deploying Together

Each app has a `release-deploy` target that handles everything in one step:

```bash
pnpm nx run duo-chrome:release-deploy
```

This will:
1. Bump the version (from conventional commits)
2. Update `CHANGELOG.md`
3. Create a git commit and tag
4. Build the app
5. Push the build to GitHub Pages

## Viewing the Dependency Graph

```bash
pnpm nx graph
```

<!-- screenshot-placeholder: nx-graph.png — dependency graph showing apps and shared libs -->

## Shared Libraries

Apps share code through workspace libraries. Import them directly — no local path needed:

```javascript
import { createFilenamer, getRandomItem } from '@genart/p5-utils'
import { getPalette, RISOCOLORS } from '@genart/color-palettes'
import { createVersionDisplay } from '@genart/version-display'
```

## Adding a New App

See [Adding Projects](../guides/adding-projects.md) for the full walkthrough. The short version:

1. Create `apps/my-app/` with `package.json`, `project.json`, `vite.config.js`, `index.html`, `src/`
2. Use the next available port
3. Run `pnpm install` from the root
4. `pnpm nx dev my-app` to verify it works

No changes to `nx.json` are needed — new apps in `apps/` are picked up automatically.

## Caching

Nx caches build outputs. If a build succeeds and nothing changed, subsequent runs replay from cache instantly. To force a rebuild:

```bash
pnpm nx build duo-chrome --skip-nx-cache
```

## Related Guides

- [Adding Projects](../guides/adding-projects.md)
- [Version Management](../guides/version-management.md)
- [Monorepo Integration Workflow](../guides/monorepo-integration-workflow.md)
- [GitHub Pages Deployment](../deployment/github-pages.md)
- [Developer Reference: Nx](../dev/nx.md)
