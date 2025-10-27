# Version Mismatch Troubleshooting Guide

This guide helps you resolve version synchronization issues between package.json files and git tags in the GenArt monorepo.

## Understanding Version Management

### How Nx Determines Versions

Nx uses **git tags as the source of truth** for version calculations, not package.json files. This is important to understand:

1. **Git Tag**: The authoritative version (e.g., `duo-chrome@0.3.0`)
2. **Package.json**: Should match the latest git tag
3. **Conventional Commits**: Determine how much to increment the version

### Version Calculation Process

```
Current Git Tag (0.3.0) + Conventional Commits = New Version
```

**Commit Types and Version Bumps:**
- `fix:` → Patch version (0.3.0 → 0.3.1)
- `feat:` → Minor version (0.3.0 → 0.4.0)
- `BREAKING CHANGE:` → Major version (0.3.0 → 1.0.0)

## Common Mismatch Scenarios

### Scenario 1: Package.json Behind Git Tag

**Symptoms:**
```
Package.json: 0.2.0
Git Tag: duo-chrome@0.3.0
```

**Cause:** Someone manually edited package.json to a lower version.

**Resolution:**
```bash
# Option 1: Auto-fix (recommended)
node scripts/validate-versions.js --project=duo-chrome --fix

# Option 2: Manual sync to tag
node scripts/fix-version.js --project=duo-chrome --sync-to-tag
```

### Scenario 2: Package.json Ahead of Git Tag

**Symptoms:**
```
Package.json: 0.4.0
Git Tag: duo-chrome@0.3.0
```

**Cause:** Someone manually bumped package.json version without creating a corresponding git tag.

**Resolution Options:**

**Option A: Sync package.json back to git tag (safer)**
```bash
node scripts/fix-version.js --project=duo-chrome --sync-to-tag
```

**Option B: Create new tag to match package.json**
```bash
node scripts/fix-version.js --project=duo-chrome --target-version=0.4.0
```

### Scenario 3: No Git Tags (New Project)

**Symptoms:**
```
Package.json: 0.1.0
Git Tag: none
```

**Cause:** New project that hasn't been released yet.

**Resolution:**
```bash
node scripts/fix-version.js --project=new-project --target-version=0.1.0
```

### Scenario 4: Major Version Jump (The Original Problem)

**Symptoms:**
```
Expected: 0.2.0 → 0.3.0
Actual: 1.0.0 → 2.0.0
```

**Cause:** Package.json was manually edited, but git tag remained at old version. Nx calculated from git tag.

**Resolution:**
```bash
# Remove incorrect tags and set correct version
node scripts/fix-version.js --project=duo-chrome --target-version=0.3.0
```

## Prevention Strategies

### 1. Use Validation in Release Process

Add validation to your project's `project.json`:

```json
{
  "targets": {
    "validate-version": {
      "executor": "nx:run-commands",
      "options": {
        "command": "node scripts/validate-versions.js --project=your-project"
      }
    },
    "release-deploy": {
      "dependsOn": ["build", "validate-version"],
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx release version --projects=your-project",
          "nx release changelog --projects=your-project",
          "nx run your-project:deploy"
        ],
        "parallel": false
      }
    }
  }
}
```

### 2. Regular Validation Checks

Run validation regularly:

```bash
# Check all projects
node scripts/validate-versions.js --all

# Check specific project
node scripts/validate-versions.js --project=duo-chrome

# Auto-fix simple issues
node scripts/validate-versions.js --all --fix
```

### 3. Never Manually Edit package.json Versions

**❌ Don't do this:**
```bash
# Manually editing package.json
vim apps/duo-chrome/package.json  # Change version field
```

**✅ Do this instead:**
```bash
# Use the version correction script
node scripts/fix-version.js --project=duo-chrome --target-version=0.4.0

# Or let Nx handle it through conventional commits
git commit -m "feat(duo-chrome): add new feature"
nx run duo-chrome:release-deploy
```

## Validation Script Reference

### Basic Usage

```bash
# Validate single project
node scripts/validate-versions.js --project=duo-chrome

# Validate all projects
node scripts/validate-versions.js --all

# Auto-fix simple mismatches
node scripts/validate-versions.js --project=duo-chrome --fix
```

### Exit Codes

- `0`: All versions in sync
- `1`: Mismatches found (manual intervention needed)
- `2`: Mismatches found and auto-fixed

### Integration Examples

**Pre-commit Hook:**
```bash
#!/bin/sh
node scripts/validate-versions.js --all --fix
if [ $? -eq 1 ]; then
  echo "❌ Version mismatches detected. Please resolve before committing."
  exit 1
fi
```

**CI/CD Pipeline:**
```yaml
- name: Validate Versions
  run: node scripts/validate-versions.js --all
```

## Fix Script Reference

### Basic Usage

```bash
# Set specific version
node scripts/fix-version.js --project=duo-chrome --target-version=0.4.0

# Sync to git tag
node scripts/fix-version.js --project=duo-chrome --sync-to-tag

# Preview changes (dry run)
node scripts/fix-version.js --project=duo-chrome --target-version=0.4.0 --dry-run
```

### What the Fix Script Does

1. **Removes incorrect git tags** for the project
2. **Updates package.json** to the target version
3. **Creates new git tag** with correct version
4. **Updates changelog** (if it exists)
5. **Commits changes** with proper commit message

## Emergency Procedures

### If You've Already Released with Wrong Version

**Situation:** You've already pushed a release with version 2.0.0 but it should have been 0.3.0.

**Steps:**
1. **Assess impact:** Check if anyone has downloaded/used the incorrect version
2. **Communicate:** Inform team about the version correction
3. **Fix locally:**
   ```bash
   node scripts/fix-version.js --project=duo-chrome --target-version=0.3.0
   git push --force-with-lease
   git push --tags --force
   ```
4. **Update deployment:** Re-deploy with correct version
5. **Document:** Add note to changelog about version correction

### If Multiple Projects Are Affected

```bash
# Check all projects
node scripts/validate-versions.js --all

# Fix all simple mismatches
node scripts/validate-versions.js --all --fix

# For complex cases, fix individually
for project in duo-chrome crude-collage-painter; do
  node scripts/fix-version.js --project=$project --target-version=X.Y.Z
done
```

## Best Practices

### 1. Version Progression Planning

- **Patch (0.1.0 → 0.1.1):** Bug fixes, small improvements
- **Minor (0.1.0 → 0.2.0):** New features, significant improvements
- **Major (0.1.0 → 1.0.0):** Breaking changes, major rewrites

### 2. Conventional Commit Messages

```bash
# Patch bump
git commit -m "fix(duo-chrome): resolve canvas scaling issue"

# Minor bump
git commit -m "feat(duo-chrome): add new color palette system"

# Major bump
git commit -m "feat(duo-chrome): redesign user interface

BREAKING CHANGE: The toolbar layout has been completely redesigned"
```

### 3. Release Workflow

```bash
# 1. Make changes
git add .
git commit -m "feat(duo-chrome): add new feature"

# 2. Validate before release
node scripts/validate-versions.js --project=duo-chrome

# 3. Release and deploy
nx run duo-chrome:release-deploy
```

## Getting Help

If you encounter complex version issues not covered in this guide:

1. **Check the validation output** for specific resolution steps
2. **Use dry-run mode** to preview changes: `--dry-run`
3. **Review git history** to understand how the mismatch occurred
4. **Ask for help** with specific error messages and current state

## Related Documentation

- [Version Management and Deployment Quick Reference](../deployment/version-and-deploy.md)
- [Nx Release Documentation](https://nx.dev/features/manage-releases)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)