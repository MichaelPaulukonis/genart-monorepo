# Version Management and Deployment Quick Reference

This is a quick reference for versioning and deploying apps in the GenArt monorepo.

## Quick Commands

### Release and Deploy (One Command)
```bash
# Release and deploy a specific app
nx run duo-chrome:release-deploy
nx run crude-collage-painter:release-deploy
nx run those-shape-things:release-deploy
nx run computational-collage:release-deploy
nx run dragline:release-deploy
```

### Separate Release and Deploy
```bash
# Release first
nx release --projects=duo-chrome

# Then deploy
nx run duo-chrome:deploy
```

### Multiple Apps
```bash
# Release all changed apps
nx release

# Deploy specific apps
nx run duo-chrome:deploy
nx run crude-collage-painter:deploy
```

## Commit Message Format

Use conventional commits to automatically determine version bumps:

```bash
# Feature (minor version bump: 0.1.0 → 0.2.0)
git commit -m "feat(duo-chrome): add new color palette"

# Bug fix (patch version bump: 0.1.0 → 0.1.1)
git commit -m "fix(dragline): resolve canvas scaling issue"

# Chore/maintenance (patch version bump)
git commit -m "chore(duo-chrome): update dependencies"
```

## Typical Workflow

1. **Make changes** to your app
2. **Commit with conventional format**:
   ```bash
   git add .
   git commit -m "feat(app-name): describe your changes"
   ```
3. **Release and deploy**:
   ```bash
   nx run app-name:release-deploy
   ```

## Preview Changes (Dry Run)

```bash
# See what would happen without making changes
nx release --projects=duo-chrome --dry-run
```

## Check Current Versions

```bash
# View current versions of all apps
cat apps/*/package.json | grep -A1 '"name":\|"version":'
```

## Troubleshooting

- **No changes detected**: Ensure you have conventional commits since last release
- **Deployment fails**: Run `nx run app-name:deploy` separately after fixing issues
- **Version conflicts**: Ensure working directory is clean and pull latest changes

## For More Details

See the complete [Version Management Guide](../guides/version-management.md) for detailed information about the system, configuration, and advanced workflows.