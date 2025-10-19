---
description: Critical build command guidelines for AI agents working with this monorepo
alwaysApply: true
---

# Build Command Guidelines

## ❌ NEVER USE These Commands

- `npm run build` (inside app directories) - **Scripts removed from package.json**
- `pnpm build` (inside app directories) - **Scripts removed from package.json**
- `cd apps/app-name && npm run build` - **Scripts removed from package.json**
- `cd apps/app-name && pnpm build` - **Scripts removed from package.json**

**Why these fail**: Individual apps use nx targets defined in `project.json`, not npm scripts in `package.json`.

## ✅ ALWAYS USE These Commands

- `nx build <app-name>` - Build a specific app
- `nx build duo-chrome` - Build duo-chrome app
- `nx build crude-collage-painter` - Build crude-collage-painter app
- `nx build those-shape-things` - Build those-shape-things app
- `nx build computational-collage` - Build computational-collage app
- `nx run-many --target=build --all` - Build all apps
- `pnpm build` (from root only) - Build all apps

## Development Commands

- `nx dev <app-name>` - Start development server
- `nx lint <app-name>` - Lint specific app
- `nx test <app-name>` - Test specific app

## For AI Agents

When implementing build-related tasks:

1. **Always use `nx build <app-name>`** for individual app builds
2. **Individual apps have NO build scripts** in their `package.json` - all targets are in `project.json`
3. **Use `executeBash` with proper `path` parameter** instead of `cd` commands
4. **Test builds using nx commands** to verify functionality

## Project Structure

- **`project.json`**: Contains nx targets (build, dev, lint, etc.) - **This is the source of truth**
- **`package.json`**: Contains only dependencies and non-nx scripts (like `clean`)
- **`vite.config.js`**: Contains Vite configuration used by nx executors

## Error Recognition

If you see "Exit prior to config file resolving" error, it means:
- You tried to use a non-existent npm script
- You attempted to run Vite directly instead of through nx
- Switch to using `nx build <app-name>` from the workspace root