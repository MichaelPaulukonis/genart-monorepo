# Deployment Notes

## Current Status
✅ Deployment working using app-level build script

## Known Issues

### Nx Vite Executor Error
The Nx Vite executor (`@nx/vite:build`) fails with:
```
Cannot read properties of undefined (reading 'startsWith')
```

**Workaround:** Using app's own `vite build` command instead of Nx build.

**Current deploy script:**
```bash
cd apps/crude-collage-painter && DEPLOY_ENV=GH_PAGES npm run build && cd ../.. && gh-pages -d apps/crude-collage-painter/dist --repo https://github.com/michaelpaulukonis/crude-collage-painter.git
```

**Ideal deploy script (not working):**
```bash
nx build crude-collage-painter && gh-pages -d dist/apps/crude-collage-painter --repo https://github.com/michaelpaulukonis/crude-collage-painter.git
```

## Future Improvements

### 1. Fix Nx Vite Executor
Investigate and resolve the executor error. Possible causes:
- Vite version mismatch (apps use v2.9.18, root has v5.4.20)
- Missing or incorrect configuration in `project.json`
- Nx Vite executor version compatibility

**Steps to investigate:**
1. Upgrade app-level Vite to v5.x
2. Check Nx Vite executor documentation for required config
3. Compare with working Nx Vite projects
4. Consider using `@nx/js:tsc` or custom executor if Vite executor continues to fail

### 2. Standardize Build Configuration
Once Nx build works:
- Remove `outDir` from vite.config.js (let Nx manage it)
- Use consistent build patterns across all apps
- Leverage Nx caching for faster builds

### 3. GitHub Actions Automation
Add automated deployment on push to main:
```yaml
# .github/workflows/deploy-crude-collage-painter.yml
name: Deploy Crude Collage Painter
on:
  push:
    branches: [main]
    paths:
      - 'apps/crude-collage-painter/**'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: npm run deploy:crude-collage-painter
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Related Files
- `package.json` - Root deploy script
- `apps/crude-collage-painter/project.json` - Nx configuration
- `apps/crude-collage-painter/vite.config.js` - Vite build config
- `.kiro/steering/github-pages-deployment.md` - Deployment guidelines
