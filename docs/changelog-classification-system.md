# Changelog Classification System

## Overview

The GenArt monorepo uses a hybrid changelog approach with both workspace-level and app-specific changelogs. This document defines the classification system that determines where changes should be documented.

## Classification Rules

### Monorepo Changelog (`/CHANGELOG.md`)
**Purpose**: Documents infrastructure, shared components, and cross-app changes that affect the entire workspace.

**Automatic Detection**: Changes are automatically routed to the monorepo changelog if commit messages or file paths contain these keywords:

#### Infrastructure Keywords
- `nx.json` - Nx workspace configuration changes
- `nx` - Nx tooling and commands
- `monorepo` - Monorepo-wide changes
- `workspace` - Workspace configuration and setup

#### Shared Libraries Keywords
- `libs/` - Changes to shared libraries in the libs/ directory
- `lib/` - Library-related changes

#### Build & Deployment Keywords
- `build` - Build system changes
- `ci` - Continuous integration changes
- `deploy` - Deployment configuration and scripts
- `release` - Release process and versioning
- `version` - Version management across apps
- `chore(release)` - Release automation commits

#### Documentation Keywords
- `docs/` - Monorepo-wide documentation changes

### App-Specific Changelogs (`apps/[app-name]/CHANGELOG.md`)
**Purpose**: Documents features, fixes, and changes specific to individual applications.

**Content Types**:
- App-specific features and functionality
- UI/UX improvements within the app
- App-specific bug fixes
- Performance improvements for the app
- App-specific configuration changes
- App-specific dependencies

## Classification Examples

### ✅ Monorepo Changelog Examples

```bash
# Infrastructure changes
feat(monorepo): add hybrid changelog generation system
fix(nx): resolve release configuration conflicts  
chore(workspace): update Nx to version 17

# Shared library changes
feat(libs/p5-utils): add new canvas utility functions
fix(libs/color-palettes): resolve RISO color mapping issue

# Build and deployment
feat(build): add automated screenshot generation
fix(ci): resolve deployment pipeline issues
chore(release): update version bump automation

# Cross-app documentation
docs(monorepo): update integration workflow guide
docs(architecture): add shared library guidelines
```

### ✅ App-Specific Changelog Examples

```bash
# App features
feat(duo-chrome): add new color mixing algorithm
feat(dragline): implement pressure-sensitive drawing

# App UI/UX
fix(crude-collage): resolve canvas resize issues
feat(monochromifier): add save-as-transparent option

# App-specific improvements
perf(computational-collage): optimize rendering performance
fix(those-shape-things): resolve shape rotation bug
```

## Edge Cases and Guidelines

### 1. Changes Affecting Both Shared Libraries and Apps
**Rule**: If a change modifies a shared library AND specific apps:
- Primary entry goes in **monorepo changelog** (due to shared library impact)
- Optional secondary entry in **app changelog** if the change significantly affects app behavior

**Example**:
```bash
# Commit: feat(libs/p5-utils): add new drawing function, update duo-chrome to use it

# Monorepo changelog:
- feat(libs/p5-utils): add new drawing function with pressure sensitivity

# App changelog (optional):
- feat(duo-chrome): integrate new pressure-sensitive drawing capabilities
```

### 2. Documentation Changes
**Rule**: 
- **Monorepo changelog**: Changes to `docs/` (workspace-wide documentation)
- **App changelog**: Changes to `apps/[app]/docs/` (app-specific documentation)

### 3. Dependency Updates
**Rule**:
- **Monorepo changelog**: Root `package.json` dependency updates
- **App changelog**: App-specific `package.json` dependency updates

### 4. Configuration Changes
**Rule**:
- **Monorepo changelog**: `nx.json`, root configs, workspace-wide settings
- **App changelog**: `apps/[app]/project.json`, app-specific configs

## Commit Message Best Practices

### For Monorepo Changelog Routing
Include relevant keywords in your commit messages:

```bash
# Good examples
feat(nx): add workspace changelog configuration
fix(libs/color-palettes): resolve import issue
chore(build): update Vite configuration for all apps
docs(monorepo): update development workflow guide

# Ensure scope indicates workspace-level impact
feat(workspace): implement hybrid release system
fix(monorepo): resolve inter-app dependency issues
```

### For App-Specific Changelog Routing
Use app names in scope and avoid infrastructure keywords:

```bash
# Good examples  
feat(duo-chrome): add color inversion feature
fix(dragline): resolve mouse tracking issue
perf(computational-collage): optimize image processing
docs(crude-collage): update user interaction guide
```

## Validation and Testing

### Manual Classification Check
When unsure about classification, ask:

1. **Does this change affect multiple apps or shared infrastructure?** → Monorepo changelog
2. **Does this change modify shared libraries (`libs/`)?** → Monorepo changelog  
3. **Does this change affect build, deployment, or Nx configuration?** → Monorepo changelog
4. **Is this an app-specific feature, fix, or improvement?** → App changelog

### Automated Classification
The `scripts/generate-workspace-changelog.js` automatically scans app changelogs and promotes entries containing infrastructure keywords to the monorepo changelog.

**To test classification**:
```bash
# Preview what would be aggregated
pnpm gen:changelog

# Apply aggregation to root changelog
pnpm gen:changelog:apply
```

## Maintenance and Updates

### Keyword List Updates
The keyword list should be updated when:
- New shared libraries are added
- New infrastructure tools are introduced
- New deployment targets are added
- Cross-app patterns emerge

**To update keywords**:
1. Modify the `KEYWORDS` array in `scripts/generate-workspace-changelog.js`
2. Test with existing changelogs to verify effectiveness
3. Update this documentation
4. Commit with scope `feat(monorepo): update changelog classification keywords`

### Regular Review
- Monthly: Review misclassified entries and update guidelines
- Quarterly: Evaluate keyword effectiveness and suggest improvements
- Release cycles: Validate that hybrid approach serves release documentation needs

## Integration with Release Process

### Automated Workflow
1. Developers create commits following classification guidelines
2. App-specific changes go to app changelogs via Nx release process
3. Infrastructure changes are detected and aggregated via the workspace changelog script
4. Release process generates both app-specific and workspace-level changelog updates

### Manual Override
For edge cases or special releases:
- Manually edit changelogs after automated generation
- Document override reasons for future reference
- Consider updating classification rules if pattern emerges