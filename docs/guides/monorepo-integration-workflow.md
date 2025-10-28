# Monorepo Integration Workflow

This guide explains how new applications integrate with the existing GenArt monorepo workflow, including version management, conventional commits, and release processes.

## Overview

The GenArt monorepo uses a sophisticated workflow that allows independent versioning and deployment of applications while maintaining shared infrastructure and dependencies. New apps automatically inherit this configuration and benefit from established patterns.

## Nx Release Configuration Inheritance

### Global Configuration (nx.json)

New apps automatically inherit the monorepo-wide release configuration:

```json
{
  "release": {
    "projectsRelationship": "independent",
    "projects": ["apps/*"],
    "releaseTagPattern": "{projectName}@{version}",
    "version": {
      "conventionalCommits": true,
      "git": {
        "commit": true,
        "tag": true
      }
    },
    "changelog": {
      "projectChangelogs": true,
      "git": {
        "commit": false,
        "tag": false
      }
    }
  }
}
```

### What This Means for New Apps

When you add a new app to the `apps/` directory, it automatically:

1. **Gets Independent Versioning**: Each app maintains its own version number
2. **Uses Conventional Commits**: Commit messages determine version bumps
3. **Generates Individual Changelogs**: Each app gets its own `CHANGELOG.md`
4. **Creates Scoped Git Tags**: Tags follow the pattern `app-name@version`
5. **Inherits Git Operations**: Automatic commits and tagging for releases

### No Additional Configuration Required

The `nx.json` configuration uses the glob pattern `"projects": ["apps/*"]`, which means:

- Any new directory in `apps/` is automatically included
- No need to modify `nx.json` when adding apps
- All apps share the same release behavior and conventions

## Conventional Commit Requirements

### Commit Message Format

All commits in the monorepo must follow the conventional commit specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Required Elements for Version Bumping

For new apps to benefit from automated versioning:

1. **Type**: Must be a recognized type (`feat`, `fix`, `chore`, etc.)
2. **Scope**: Should include the app name for clarity
3. **Description**: Clear, concise description of the change

### Examples for New Apps

```bash
# Feature addition (minor version bump)
git commit -m "feat(my-new-app): add particle physics simulation"

# Bug fix (patch version bump)
git commit -m "fix(my-new-app): resolve canvas scaling issue on mobile"

# Chore/maintenance (patch version bump)
git commit -m "chore(my-new-app): update p5.js dependency"

# Breaking change (major version bump)
git commit -m "feat(my-new-app)!: redesign user interface

BREAKING CHANGE: The control panel layout has been completely redesigned"
```

### Version Bump Rules

| Commit Type                    | Version Impact        | Example            |
| ------------------------------ | --------------------- | ------------------ |
| `feat:`                        | Minor (0.1.0 → 0.2.0) | New features       |
| `fix:`                         | Patch (0.1.0 → 0.1.1) | Bug fixes          |
| `chore:`                       | Patch (0.1.0 → 0.1.1) | Maintenance        |
| `docs:`                        | No bump               | Documentation only |
| `style:`                       | No bump               | Code formatting    |
| `refactor:`                    | No bump               | Code restructuring |
| `test:`                        | No bump               | Adding tests       |
| `feat!:` or `BREAKING CHANGE:` | Major (0.1.0 → 1.0.0) | Breaking changes   |

## Adding New Apps to Release Workflows

### Automatic Inclusion

New apps are automatically included in monorepo-wide operations:

```bash
# Release all apps with changes
nx release

# This will automatically detect and release your new app if it has
# conventional commits since its last release (or since creation)
```

### Individual App Releases

Each new app can be released independently:

```bash
# Release specific app
nx release version --projects=my-new-app
nx release changelog --projects=my-new-app

# Or use the combined release-deploy target
nx run my-new-app:release-deploy
```

### Multi-App Releases

Include new apps in multi-app releases:

```bash
# Release multiple specific apps
nx release --projects=duo-chrome,my-new-app,another-app

# Release all apps (forces release even without changes)
nx release --projects=apps/*
```

## Shared Dependencies and Libraries

### Workspace Dependencies

New apps automatically have access to:

```json
{
  "dependencies": {
    "@genart/p5-utils": "workspace:*",
    "@genart/color-palettes": "workspace:*",
    "p5js-wrapper": "^1.0.0",
    "file-saver": "^2.0.5"
  }
}
```

### Using Shared Libraries

Import shared functionality in your new app:

```javascript
// src/sketch.js
import { p5 } from "p5js-wrapper";
import { getRandomColor, RISOCOLORS } from "@genart/color-palettes";
import { createFilenamer, datestring } from "@genart/p5-utils";

const sketch = function (p) {
  const namer = createFilenamer(`my-app-${datestring()}`);

  p.setup = function () {
    p.createCanvas(800, 600);
    const bgColor = getRandomColor(RISOCOLORS);
    p.background(bgColor.color);
  };

  p.keyPressed = function () {
    if (p.key === "s" || p.key === "S") {
      p.saveCanvas(namer(), "png");
    }
  };
};

new p5(sketch);
```

### Dependency Management

- **Workspace Dependencies**: Shared libraries are managed at the workspace level
- **App-Specific Dependencies**: Add to individual app's `package.json` if needed
- **Version Synchronization**: Shared dependencies stay in sync across all apps

## Build System Integration

### Nx Build Caching

New apps benefit from Nx's intelligent caching:

```bash
# First build (no cache)
nx build my-new-app

# Subsequent builds (cached if no changes)
nx build my-new-app  # Uses cache, very fast

# Build all apps (only rebuilds changed apps)
nx run-many --target=build --all
```

### Dependency Graph

View how your new app fits into the monorepo:

```bash
# Show dependency graph
nx graph

# Show affected projects when you change your app
nx affected:graph
```

### Parallel Execution

Nx can build multiple apps in parallel:

```bash
# Build all apps in parallel
nx run-many --target=build --all --parallel=3

# Your new app will be built alongside others
```

## Development Workflow Integration

### Development Server Management

Each app runs on its own port:

```bash
# Start multiple dev servers simultaneously
nx dev duo-chrome        # Port 5173
nx dev my-new-app        # Port 5178 (your assigned port)
nx dev another-app       # Port 5179

# Or start all dev servers
nx run-many --target=dev --all
```

### Code Quality Integration

New apps inherit the monorepo's code quality tools:

```bash
# Lint your new app
nx lint my-new-app

# Lint all apps
nx run-many --target=lint --all

# Format code (if configured)
nx format:write
```

## Best Practices for Monorepo Integration

### 1. Consistent Naming

Follow established patterns:

```bash
# Directory structure
apps/my-new-app/          # kebab-case
├── src/
│   ├── sketch.js         # Main entry point
│   └── utils.js          # App-specific utilities
├── css/
│   └── style.css
└── public/
```

### 2. Scope Your Commits

Always include the app name in commit scopes:

```bash
# Good - clear scope
git commit -m "feat(my-new-app): add color picker"

# Avoid - unclear scope
git commit -m "feat: add color picker"
```

### 3. Use Shared Libraries

Leverage existing shared code instead of duplicating:

```javascript
// Good - use shared utilities
import { getRandomItem } from "@genart/p5-utils";

// Avoid - duplicating functionality
function getRandomItem(array) {
  /* ... */
}
```

### 4. Follow Port Conventions

Use the next available port and document it:

```javascript
// vite.config.js
module.exports = defineConfig({
  server: {
    port: 5178, // Next available port
  },
});
```

### 5. Maintain Independent Versions

Each app should have its own version lifecycle:

```bash
# Release apps independently based on their changes
nx release version --projects=my-new-app  # Only if this app changed
nx release version --projects=duo-chrome  # Only if this app changed
```

## Workflow Examples

### Example 1: Adding a New Feature

```bash
# 1. Create feature branch (optional but recommended)
git checkout -b feature/my-new-app-particles

# 2. Implement feature in your app
# ... make changes to apps/my-new-app/ ...

# 3. Commit with conventional format
git add apps/my-new-app/
git commit -m "feat(my-new-app): add particle system with gravity"

# 4. Test the app
nx dev my-new-app
nx build my-new-app

# 5. Release and deploy
nx run my-new-app:release-deploy

# 6. Merge feature branch (if using)
git checkout main
git merge feature/my-new-app-particles
```

### Example 2: Multi-App Update

```bash
# 1. Update shared library
# ... make changes to libs/p5-utils/ ...

# 2. Update apps that use the new functionality
# ... update apps/my-new-app/ and apps/duo-chrome/ ...

# 3. Commit changes with appropriate scopes
git add .
git commit -m "feat(p5-utils): add new animation helpers

feat(my-new-app): integrate new animation system
feat(duo-chrome): use improved animation helpers"

# 4. Release affected apps
nx release --projects=my-new-app,duo-chrome
```

### Example 3: Bug Fix Workflow

```bash
# 1. Identify and fix bug
# ... fix issue in apps/my-new-app/ ...

# 2. Commit fix
git add apps/my-new-app/
git commit -m "fix(my-new-app): resolve memory leak in animation loop"

# 3. Release patch version
nx run my-new-app:release-deploy
# This creates version bump: 1.2.3 → 1.2.4
```

## Maintaining Consistency

### Version Alignment

While apps have independent versions, consider alignment for major releases:

```bash
# Check all app versions
nx run-many --target=version --all

# Coordinate major version bumps if needed
nx release --projects=apps/* --specifier=major
```

### Documentation Updates

Keep documentation in sync:

- Update port assignment tables when adding apps
- Document new patterns or conventions
- Update README files with new app information

### Dependency Updates

Coordinate shared dependency updates:

```bash
# Update workspace dependencies
pnpm update

# Test all apps after updates
nx run-many --target=build --all
nx run-many --target=lint --all
```

## Troubleshooting Integration Issues

### Issue: App Not Detected by Nx Release

**Cause**: App not in `apps/` directory or missing `package.json`

**Solution**:

```bash
# Ensure proper structure
apps/my-new-app/
├── package.json    # Required for Nx release
└── project.json    # Required for Nx targets
```

### Issue: Version Bumps Not Working

**Cause**: Commits don't follow conventional format

**Solution**:

```bash
# Check recent commits
git log --oneline -5

# Ensure format: type(scope): description
git commit -m "feat(my-new-app): describe feature"
```

### Issue: Build Conflicts

**Cause**: Port conflicts or dependency issues

**Solution**:

```bash
# Check port usage
lsof -i :5178

# Verify dependencies
nx graph
nx affected:graph
```

## Related Documentation

- [New App Setup Guide](./new-app-automated-versioning-setup.md) - Complete setup process
- [Version Management Guide](./version-management.md) - Detailed versioning workflows
- [Project Template Guide](../templates/project-json-template-guide.md) - Configuration templates
- [Release Workflow Examples](./release-workflow-examples.md) - Common release patterns
