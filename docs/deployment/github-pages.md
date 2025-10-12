# GitHub Pages Deployment

This document explains how to deploy individual apps from the Nx monorepo to GitHub Pages while maintaining clean URLs.

## Overview

We use a deployment strategy that keeps development in the monorepo while deploying built apps to separate repositories' `gh-pages` branches. This maintains existing URLs like `https://michaelpaulukonis.github.io/computational-collage`.

## Prerequisites

- `gh-pages` package installed as dev dependency
- Individual repositories for each app (existing or new)
- GitHub Pages enabled on target repositories

## Current Apps

The following apps are configured for GitHub Pages deployment:

- **duo-chrome**: `https://michaelpaulukonis.github.io/duo-chrome`
- **crude-collage-painter**: `https://michaelpaulukonis.github.io/crude-collage-painter`
- **those-shape-things**: `https://michaelpaulukonis.github.io/those-shape-things`
- **computational-collage**: `https://michaelpaulukonis.github.io/computational-collage`

## Deployment Process

### Manual Deployment

Deploy individual apps using npm scripts:

```bash
# Deploy specific app
npm run deploy:computational-collage
npm run deploy:duo-chrome
npm run deploy:crude-collage-painter
npm run deploy:those-shape-things

# Or using Nx directly
nx deploy computational-collage
```

### Automated Deployment

GitHub Actions automatically deploy apps when changes are pushed to the main branch. See `.github/workflows/deploy.yml` for configuration.

## Adding New Apps

To add a new app for GitHub Pages deployment:

### 1. Create Repository

Create a new empty repository on GitHub (e.g., `new-generative-art`).

### 2. Add Deploy Script

Add to root `package.json`:

```json
{
  "scripts": {
    "deploy:new-generative-art": "nx build new-generative-art && gh-pages -d dist/apps/new-generative-art --repo https://github.com/michaelpaulukonis/new-generative-art.git"
  }
}
```

### 3. Configure Project

Add deploy target to the app's `project.json`:

```json
{
  "name": "new-generative-art",
  "targets": {
    "deploy": {
      "dependsOn": ["build"],
      "command": "gh-pages -d dist/apps/new-generative-art --repo https://github.com/michaelpaulukonis/new-generative-art.git"
    }
  }
}
```

### 4. Enable GitHub Pages

1. First deployment creates the `gh-pages` branch automatically
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch"
4. Select `gh-pages` branch and `/ (root)` folder
5. Save settings

### 5. Update GitHub Actions

Add the new app to `.github/workflows/deploy.yml`:

```yaml
- name: Deploy new-generative-art
  run: |
    git remote set-url origin https://git:${GITHUB_TOKEN}@github.com/michaelpaulukonis/new-generative-art.git
    npx gh-pages -d dist/apps/new-generative-art -u "github-actions-bot <support+actions@github.com>"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Repository Structure

### Monorepo (Development)
- All source code lives here
- Nx manages builds and dependencies
- Git history for development

### Individual Repos (Deployment)
- Only `gh-pages` branches are significant
- Main branches become irrelevant
- Serve as deployment targets for GitHub Pages

## Troubleshooting

### First Deployment Fails
If the first deployment to a new repository fails, ensure:
- Repository exists and is accessible
- GitHub token has proper permissions
- Repository is not completely empty (add a README.md)

### Build Path Issues
Ensure build outputs match the paths in deploy commands:
- Nx builds to `dist/apps/{app-name}`
- Deploy commands reference the same path

### Custom Domains
To use custom domains, add the `--cname` option:

```bash
gh-pages -d dist/apps/app-name --repo https://github.com/user/repo.git --cname custom-domain.com
```

## Benefits

- **Clean URLs**: Each app gets its own GitHub Pages URL
- **Monorepo Development**: Shared libraries, unified tooling
- **Independent Deployment**: Deploy apps individually
- **Existing Workflow**: Maintains current URL structure
- **Automated CI/CD**: GitHub Actions handle deployment