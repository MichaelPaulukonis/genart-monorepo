# Version Display Deployment Guide

## Quick Deployment

### Pre-Deployment
```bash
# Validate accessibility and integration
npm run validate:version-display
npm run validate:all

# Build all applications
nx run-many --target=build --all
```

### Deploy
```bash
# Deploy critical apps first
nx run duo-chrome:release-deploy
nx run crude-collage-painter:release-deploy

# Deploy remaining apps
nx run dragline:release-deploy
nx run computational-collage:release-deploy
nx run those-shape-things:release-deploy
```

### Post-Deployment
```bash
# Verify deployments
npm run validate:all
```

## Rollback Procedures

### Emergency Rollback
If version displays are broken:

```bash
# Revert shared library
git checkout HEAD~1 -- libs/version-display/version-display.css

# Rebuild and redeploy
nx run-many --target=build --all
nx run duo-chrome:deploy
nx run crude-collage-painter:deploy
```

### Planned Rollback
For systematic issues:

```bash
# Create rollback branch
git checkout -b rollback-version-display
git revert <problematic-commit-hash>

# Test and deploy
npm run validate:version-display
nx run-many --target=build --all
git checkout main && git merge rollback-version-display
nx run-many --target=deploy --all
```

## Common Issues

### Version text too light
```bash
npm run validate:version-display  # Check contrast ratios
```

### Build failures
```bash
npm run validate:app <app-name>  # Check CSS syntax and imports
```

### Inconsistent appearance
```bash
npm run validate:all  # Check all applications for conflicts
```

## Validation Scripts

- `npm run validate:version-display` - Check accessibility compliance
- `npm run validate:app <name>` - Check specific application integration
- `npm run validate:all` - Run all validations

## Deployment History

| Date | Change | Status |
|------|--------|--------|
| Current | Basic deployment procedures | ✅ Deployed |