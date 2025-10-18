# Release Workflow Examples

This document provides real-world examples of common release and deployment scenarios in the GenArt monorepo.

## Scenario 1: Adding a New Feature

You've added a new color blending mode to the duo-chrome app.

### Steps:
1. **Make your changes** to the duo-chrome app
2. **Test locally**:
   ```bash
   nx dev duo-chrome
   ```
3. **Commit with conventional format**:
   ```bash
   git add .
   git commit -m "feat(duo-chrome): add multiply blend mode for RISO colors"
   ```
4. **Release and deploy**:
   ```bash
   nx run duo-chrome:release-deploy
   ```

### Result:
- Version bumps from `0.1.0` → `0.2.0` (minor bump for feature)
- Git tag created: `duo-chrome@0.2.0`
- Changelog updated with new feature
- App deployed to GitHub Pages

## Scenario 2: Fixing a Bug

You discovered and fixed a canvas scaling issue in dragline.

### Steps:
1. **Fix the bug**
2. **Test the fix**:
   ```bash
   nx dev dragline
   ```
3. **Commit the fix**:
   ```bash
   git add .
   git commit -m "fix(dragline): resolve canvas scaling on high-DPI displays"
   ```
4. **Release and deploy**:
   ```bash
   nx run dragline:release-deploy
   ```

### Result:
- Version bumps from `0.1.0` → `0.1.1` (patch bump for fix)
- Git tag created: `dragline@0.1.1`
- Changelog updated with bug fix
- App deployed with fix

## Scenario 3: Updating Multiple Apps

You've made improvements to both crude-collage-painter and those-shape-things.

### Steps:
1. **Make changes** to both apps
2. **Test both apps**:
   ```bash
   nx dev crude-collage-painter
   nx dev those-shape-things
   ```
3. **Commit changes** (can be separate commits or one commit with multiple scopes):
   ```bash
   git add .
   git commit -m "feat(crude-collage-painter): add brush opacity control
   
   feat(those-shape-things): add hexagon tile pattern"
   ```
4. **Release all changed apps**:
   ```bash
   nx release
   ```
5. **Deploy the updated apps**:
   ```bash
   nx run crude-collage-painter:deploy
   nx run those-shape-things:deploy
   ```

### Result:
- `crude-collage-painter`: `0.1.0` → `0.2.0`
- `those-shape-things`: `0.1.0` → `0.2.0`
- Both get individual git tags and changelog updates
- Both apps deployed with new features

## Scenario 4: Preview Before Release

You want to see what would happen before actually releasing.

### Steps:
1. **Make your changes and commit**:
   ```bash
   git add .
   git commit -m "feat(computational-collage): add image filters"
   ```
2. **Preview the release**:
   ```bash
   nx release --projects=computational-collage --dry-run
   ```
3. **Review the output**, then release for real:
   ```bash
   nx run computational-collage:release-deploy
   ```

### Dry Run Output Example:
```
NX   Running release version for project: computational-collage

computational-collage: 0.1.0 → 0.2.0

CREATE apps/computational-collage/CHANGELOG.md
UPDATE apps/computational-collage/package.json

NX   Previewing an entry in apps/computational-collage/CHANGELOG.md for computational-collage@0.2.0

## 0.2.0 (2024-01-15)

### Features

* **computational-collage:** add image filters ([abc123f](https://github.com/user/repo/commit/abc123f))
```

## Scenario 5: Emergency Hotfix

You need to quickly fix a critical issue in production.

### Steps:
1. **Create hotfix branch** (optional but recommended):
   ```bash
   git checkout -b hotfix/duo-chrome-memory-leak
   ```
2. **Fix the critical issue**
3. **Commit with clear description**:
   ```bash
   git add .
   git commit -m "fix(duo-chrome): resolve memory leak in animation loop"
   ```
4. **Release and deploy immediately**:
   ```bash
   nx run duo-chrome:release-deploy
   ```
5. **Merge back to main**:
   ```bash
   git checkout main
   git merge hotfix/duo-chrome-memory-leak
   git push origin main
   ```

### Result:
- Quick patch release: `1.2.3` → `1.2.4`
- Immediate deployment of fix
- Clear changelog entry for the hotfix

## Scenario 6: Major Version Release

You're making breaking changes to the computational-collage API.

### Steps:
1. **Make breaking changes**
2. **Update documentation** for the breaking changes
3. **Commit with breaking change indicator**:
   ```bash
   git add .
   git commit -m "feat!: redesign computational-collage API for better performance
   
   BREAKING CHANGE: The collage.create() method now requires a configuration object instead of individual parameters."
   ```
4. **Release and deploy**:
   ```bash
   nx run computational-collage:release-deploy
   ```

### Result:
- Major version bump: `0.5.2` → `1.0.0`
- Git tag: `computational-collage@1.0.0`
- Changelog includes breaking change notice
- Deployed with new API

## Scenario 7: Dependency Updates

You've updated shared libraries and need to release apps that use them.

### Steps:
1. **Update the shared library** (e.g., `@genart/p5-utils`)
2. **Test affected apps**:
   ```bash
   nx affected:test
   nx affected:build
   ```
3. **Commit the dependency update**:
   ```bash
   git add .
   git commit -m "chore: update @genart/p5-utils to v2.1.0"
   ```
4. **Release affected apps**:
   ```bash
   nx release --projects=$(nx show projects --affected)
   ```

### Result:
- Only apps that actually use the updated library get released
- Patch version bumps for dependency updates
- All affected apps stay in sync

## Best Practices from Examples

1. **Use descriptive commit messages** - They become your changelog
2. **Test before releasing** - Always run the app locally first
3. **Use dry-run for complex releases** - Preview changes when unsure
4. **Scope commits properly** - Include the app name for clarity
5. **Release frequently** - Small, frequent releases are easier to manage
6. **Document breaking changes** - Use `BREAKING CHANGE:` footer for major bumps

## Troubleshooting Common Issues

### "No changes detected"
```bash
# Check what commits exist since last release
git log --oneline $(git describe --tags --abbrev=0)..HEAD

# Ensure commits follow conventional format
git log --oneline --grep="^feat\|^fix\|^chore"
```

### Release succeeded but deploy failed
```bash
# The version is already tagged, just run deploy
nx run app-name:deploy
```

### Want to undo a release
```bash
# Delete the git tag (if not pushed yet)
git tag -d app-name@1.2.3

# Reset the commit (if not pushed yet)
git reset --hard HEAD~1
```