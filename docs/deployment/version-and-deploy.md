# Version Management and Deployment Quick Reference

This is a quick reference for versioning and deploying apps in the GenArt monorepo.

## Quick Commands

### Release and Deploy (One Command)
```bash
# Release and deploy a specific app (recommended)
nx run duo-chrome:release-deploy
nx run crude-collage-painter:release-deploy
nx run those-shape-things:release-deploy
nx run computational-collage:release-deploy
nx run dragline:release-deploy
```

### Separate Release and Deploy
```bash
# Release first (using subcommands to avoid configuration conflicts)
nx release version --projects=duo-chrome
nx release changelog --projects=duo-chrome

# Then deploy
nx run duo-chrome:deploy
```

### Multiple Apps
```bash
# Release all changed apps (version and changelog separately)
nx release version
nx release changelog

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
# See what would happen without making changes (using subcommands)
nx release version --projects=duo-chrome --dry-run
nx release changelog --projects=duo-chrome --dry-run
```

## Check Current Versions

```bash
# View current versions of all apps
cat apps/*/package.json | grep -A1 '"name":\|"version":'
```

## Troubleshooting

### Common Issues

- **No changes detected**: Ensure you have conventional commits since last release
- **Deployment fails**: Run `nx run app-name:deploy` separately after fixing issues
- **Version conflicts**: Ensure working directory is clean and pull latest changes

### Git Configuration Conflict Error

If you encounter an error like:
```
Error: Cannot use both top-level release configuration and granular git configuration
```

**Cause**: This occurs when using the old `nx release --projects=app-name` command with the current nx.json configuration that has git settings in the changelog section.

**Solution**: Use the nx release subcommands instead:
```bash
# ❌ DON'T: This causes the configuration conflict
nx release --projects=duo-chrome

# ✅ DO: Use subcommands to avoid the conflict
nx release version --projects=duo-chrome
nx release changelog --projects=duo-chrome
```

**Why this works**: The subcommands don't trigger the same configuration conflict as the top-level `nx release` command.

### Validation Steps

After a successful release, verify:

1. **Version was updated**:
   ```bash
   cat apps/duo-chrome/package.json | grep version
   ```

2. **Git tag was created**:
   ```bash
   git tag --list | grep duo-chrome
   ```

3. **Changelog was updated**:
   ```bash
   cat apps/duo-chrome/CHANGELOG.md
   ```

4. **Deployment succeeded**:
   - Check the GitHub Pages URL for your app
   - Verify the deployed version matches the released version

### Recovery from Failed Releases

If a release fails partway through:

1. **Check what completed**:
   ```bash
   # Check if version was bumped
   git log --oneline -5
   # Check if tag was created
   git tag --list | tail -5
   ```

2. **Complete manually if needed**:
   ```bash
   # If version was bumped but deployment failed
   nx run app-name:deploy
   
   # If nothing completed, start over
   nx run app-name:release-deploy
   ```

## Comprehensive Workflow Examples

### Single App Release Process

Complete workflow for releasing a single application:

```bash
# 1. Make your changes and commit with conventional format
git add .
git commit -m "feat(duo-chrome): add new blend mode options"

# 2. Release and deploy in one command (recommended)
nx run duo-chrome:release-deploy

# OR: Release and deploy separately for more control
nx release version --projects=duo-chrome
nx release changelog --projects=duo-chrome
nx run duo-chrome:deploy
```

**What happens during release-deploy:**
1. **Version**: Analyzes conventional commits and bumps version appropriately
2. **Changelog**: Generates changelog entries and creates git tag
3. **Build**: Compiles the application for production
4. **Deploy**: Pushes built files to GitHub Pages

### Multi-App Release Process

When changes affect multiple applications:

```bash
# 1. Make changes across multiple apps and commit
git add .
git commit -m "feat: update shared color palette library"

# 2. Release all affected apps
nx release version  # Updates versions for all changed apps
nx release changelog  # Generates changelogs and tags for all changed apps

# 3. Deploy each app individually
nx run duo-chrome:deploy
nx run crude-collage-painter:deploy
nx run those-shape-things:deploy
```

**Alternative: Deploy specific apps only**
```bash
# Release all but deploy selectively
nx release version
nx release changelog
nx run duo-chrome:deploy  # Only deploy this one
```

### Dry Run Examples

Test your release process without making actual changes:

```bash
# Single app dry run
nx release version --projects=duo-chrome --dry-run
nx release changelog --projects=duo-chrome --dry-run

# Multi-app dry run
nx release version --dry-run
nx release changelog --dry-run
```

**Dry run output shows:**
- Which version bump would occur (patch/minor/major)
- What changelog entries would be generated
- Which git tags would be created
- No actual changes are made

### Conventional Commits and Version Increments

Understanding how commit messages determine version bumps:

```bash
# Patch version bump (0.1.0 → 0.1.1)
git commit -m "fix(duo-chrome): resolve canvas scaling on mobile"
git commit -m "chore(dragline): update dependencies"
git commit -m "docs(computational-collage): update README"

# Minor version bump (0.1.0 → 0.2.0)  
git commit -m "feat(duo-chrome): add new color palette"
git commit -m "feat(crude-collage-painter): implement brush size controls"

# Major version bump (0.1.0 → 1.0.0)
git commit -m "feat(those-shape-things): redesign UI layout

BREAKING CHANGE: The toolbar layout has been completely redesigned"

# Multiple commits in one release
git commit -m "fix(duo-chrome): resolve mobile scaling"
git commit -m "feat(duo-chrome): add new blend modes"
# Results in minor bump (0.1.0 → 0.2.0) - highest level wins
```

**Version bump priority:**
1. **BREAKING CHANGE** → Major version bump
2. **feat:** → Minor version bump  
3. **fix:**, **chore:**, **docs:** → Patch version bump

### Advanced Scenarios

**Releasing after multiple commits:**
```bash
# Multiple commits since last release
git log --oneline duo-chrome@0.1.0..HEAD

# Release will analyze all commits since last tag
nx run duo-chrome:release-deploy
```

**Handling failed deployments:**
```bash
# If deployment fails but version was already bumped
git tag --list | grep duo-chrome  # Check if tag exists
nx run duo-chrome:deploy  # Retry just the deployment
```

**Working with feature branches:**
```bash
# On feature branch - test release process
nx release version --projects=duo-chrome --dry-run

# After merging to main - actual release
git checkout main
git pull origin main
nx run duo-chrome:release-deploy
```

## Version Mismatch Prevention

### Pre-Release Validation

Always validate versions before releasing to prevent mismatches:

```bash
# Validate single project
node scripts/validate-versions.js --project=duo-chrome

# Validate all projects
node scripts/validate-versions.js --all

# Auto-fix simple mismatches
node scripts/validate-versions.js --project=duo-chrome --fix
```

### Integrated Validation

The release process now includes automatic validation. If you see this error:

```
❌ Version mismatches detected. Please resolve before releasing.
```

**Quick Fix:**
```bash
# For simple cases (package.json behind git tag)
node scripts/validate-versions.js --project=duo-chrome --fix

# For complex cases
node scripts/fix-version.js --project=duo-chrome --sync-to-tag
```

### Version Correction

If you need to fix version mismatches:

```bash
# Fix to specific version
node scripts/fix-version.js --project=duo-chrome --target-version=0.4.0

# Sync package.json to match git tag
node scripts/fix-version.js --project=duo-chrome --sync-to-tag

# Preview changes first
node scripts/fix-version.js --project=duo-chrome --target-version=0.4.0 --dry-run
```

## For More Details

- **Troubleshooting:** See [Version Mismatch Troubleshooting Guide](../troubleshooting/version-mismatches.md) for detailed resolution steps
- **Complete Guide:** See [Version Management Guide](../guides/version-management.md) for system details and advanced workflows