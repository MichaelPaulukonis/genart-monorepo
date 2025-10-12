---
inclusion: manual
---

# GitHub Pages Deployment Guidelines

## Deployment Strategy

We deploy individual apps from the Nx monorepo to separate GitHub repositories' `gh-pages` branches. This maintains clean URLs while keeping development centralized.

## Key Principles

- **Development**: All code lives in the monorepo
- **Deployment**: Built apps push to individual repo `gh-pages` branches  
- **URLs**: Maintain existing structure (`https://michaelpaulukonis.github.io/app-name`)
- **Repositories**: Original repos become deployment targets only

## Current Configuration

### Existing Apps
- duo-chrome
- crude-collage-painter  
- those-shape-things
- computational-collage

### Deploy Commands
```bash
npm run deploy:{app-name}
nx deploy {app-name}
```

## Adding New Apps

When creating a new app that needs GitHub Pages deployment:

1. **Create empty GitHub repository** with the app name
2. **Add deploy script** to root `package.json`:
   ```json
   "deploy:app-name": "nx build app-name && gh-pages -d dist/apps/app-name --repo https://github.com/michaelpaulukonis/app-name.git"
   ```
3. **Add deploy target** to app's `project.json`:
   ```json
   "deploy": {
     "dependsOn": ["build"],
     "command": "gh-pages -d dist/apps/app-name --repo https://github.com/michaelpaulukonis/app-name.git"
   }
   ```
4. **Update GitHub Actions** workflow in `.github/workflows/deploy.yml`
5. **Enable GitHub Pages** in repository settings after first deployment

## Build Configuration

Ensure apps build correctly for GitHub Pages:

- **Base Path**: Apps should build with correct base path for their domain
- **Output Directory**: Must match `dist/apps/{app-name}` pattern
- **Static Assets**: Ensure all assets use relative paths

## Automation

- GitHub Actions automatically deploy on main branch pushes
- Individual apps can be deployed manually as needed
- Failed deployments don't affect other apps

## Repository Management

- **Monorepo**: Contains all source code and development history
- **Individual Repos**: Only `gh-pages` branches matter for GitHub Pages
- **Main Branches**: Can be archived or ignored in individual repos
- **New Repos**: Can be created as needed for new apps

## Troubleshooting

- Verify build output paths match deploy commands
- Ensure GitHub token permissions for repository access
- Check GitHub Pages settings in target repositories
- Use `NODE_DEBUG=gh-pages` for deployment debugging