# Version Management with Nx Release

This guide covers the automated version management system using Nx Release with independent versioning for each application in the GenArt monorepo.

## Overview

The monorepo uses **Nx Release with independent versioning**, which means:

- Each app maintains its own version number (e.g., `duo-chrome@1.2.3`, `dragline@2.0.1`)
- Versions are automatically determined from conventional commit messages
- Each app gets its own changelog and git tags
- Only changed apps need to be released

## Configuration

The version management is configured in `nx.json`:

```json
{
  "release": {
    "projectsRelationship": "independent",
    "projects": ["apps/*"],
    "releaseTagPattern": "{projectName}@{version}",
    "version": {
      "conventionalCommits": true
    },
    "changelog": {
      "projectChangelogs": true,
      "git": {
        "commit": true,
        "tag": true
      }
    }
  }
}
```

## Conventional Commits

Version bumps are automatically determined from commit message prefixes:

| Commit Type        | Version Bump          | Example                                       |
| ------------------ | --------------------- | --------------------------------------------- |
| `feat:`            | Minor (0.1.0 → 0.2.0) | `feat(duo-chrome): add new color palette`     |
| `fix:`             | Patch (0.1.0 → 0.1.1) | `fix(dragline): resolve canvas scaling issue` |
| `chore:`           | Patch (0.1.0 → 0.1.1) | `chore(duo-chrome): update dependencies`      |
| `BREAKING CHANGE:` | Major (0.1.0 → 1.0.0) | `feat!: redesign API interface`               |

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**

```bash
feat(duo-chrome): add RISO color blending modes
fix(crude-collage-painter): fix brush size calculation
chore(those-shape-things): update p5.js to latest version
docs: update README with new features
```

## Release Commands

### Individual App Release

Release a specific app:

```bash
# Auto-detect version bump from commits
nx release --projects=duo-chrome

# Specify version type manually
nx release --projects=duo-chrome --specifier=patch
nx release --projects=duo-chrome --specifier=minor
nx release --projects=duo-chrome --specifier=major

# Preview changes without applying (dry run)
nx release --projects=duo-chrome --dry-run
```

### Multiple App Release

Release multiple apps:

```bash
# Release all changed apps (recommended)
nx release

# Release specific apps
nx release --projects=duo-chrome,dragline

# Release all apps (forces release even if unchanged)
nx release --projects=apps/*
```

### Release and Deploy

Each app has a `release-deploy` target that combines versioning and deployment:

```bash
# Release and deploy in one command
nx run duo-chrome:release-deploy
nx run crude-collage-painter:release-deploy
nx run those-shape-things:release-deploy
nx run computational-collage:release-deploy
nx run dragline:release-deploy
```

## What Happens During Release

When you run `nx release`, the following occurs automatically:

1. **Version Detection**: Analyzes conventional commits to determine version bump
2. **Package.json Update**: Updates the version in the app's `package.json`
3. **Changelog Generation**: Creates/updates `CHANGELOG.md` in the app directory
4. **Git Commit**: Creates a commit with the version changes
5. **Git Tag**: Creates a tag like `duo-chrome@1.2.3`

## Deployment Integration

### Manual Deployment

After releasing, deploy manually:

```bash
# Release first
nx release --projects=duo-chrome

# Then deploy
nx run duo-chrome:deploy
```

### Combined Release and Deploy

Use the `release-deploy` target for one-step operation:

```bash
nx run duo-chrome:release-deploy
```

This target:

1. Runs `nx release --projects=duo-chrome`
2. Builds the app
3. Deploys to GitHub Pages

## Workflow Examples

### Feature Development Workflow

1. **Make changes** to an app
2. **Commit with conventional format**:
   ```bash
   git add .
   git commit -m "feat(duo-chrome): add new color mixing algorithm"
   ```
3. **Release and deploy**:
   ```bash
   nx run duo-chrome:release-deploy
   ```

### Bug Fix Workflow

1. **Fix the issue**
2. **Commit the fix**:
   ```bash
   git add .
   git commit -m "fix(dragline): resolve memory leak in animation loop"
   ```
3. **Release and deploy**:
   ```bash
   nx run dragline:release-deploy
   ```

### Multi-App Update Workflow

1. **Make changes** to multiple apps
2. **Commit changes** with appropriate scopes:

   ```bash
   git add .
   git commit -m "feat(duo-chrome): add new blend mode

   feat(crude-collage-painter): add brush opacity control"
   ```

3. **Release all changed apps**:
   ```bash
   nx release
   ```
4. **Deploy the updated apps**:
   ```bash
   nx run duo-chrome:deploy
   nx run crude-collage-painter:deploy
   ```

## Version History

Each app maintains its own version history:

- **Git Tags**: `duo-chrome@1.2.3`, `dragline@2.0.1`, etc.
- **Changelogs**: Individual `CHANGELOG.md` files in each app directory
- **Package Versions**: Independent version numbers in each `package.json`

## Troubleshooting

### No Changes Detected

If `nx release` says "No changes detected":

- Ensure you have conventional commits since the last release
- Use `--dry-run` to see what would be released
- Check that your commits follow the conventional format

### Version Conflicts

If you encounter version conflicts:

- Ensure your working directory is clean before releasing
- Pull latest changes from the remote repository
- Resolve any merge conflicts before releasing

### Failed Deployment

If deployment fails after successful release:

- The version has already been tagged and committed
- Fix the deployment issue
- Run just the deploy command: `nx run app-name:deploy`

## Best Practices

1. **Use Conventional Commits**: Always follow the conventional commit format
2. **Scope Your Commits**: Include the app name in the scope for clarity
3. **Test Before Release**: Use `--dry-run` to preview changes
4. **Release Frequently**: Small, frequent releases are easier to manage
5. **Check Dependencies**: Ensure all dependencies are up to date before major releases
6. **Document Breaking Changes**: Use `BREAKING CHANGE:` footer for major version bumps

## Related Documentation

- [Deployment Guide](../deployment/github-pages.md) - GitHub Pages deployment details
- [Adding Projects Guide](./adding-projects.md) - How to add new apps to the monorepo
- [Nx Release Documentation](https://nx.dev/features/manage-releases) - Official Nx Release docs
