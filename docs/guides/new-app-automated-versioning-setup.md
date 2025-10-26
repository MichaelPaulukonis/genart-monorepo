# New App Setup with Automated Versioning

This guide provides a comprehensive step-by-step process for adding new applications to the GenArt monorepo with automated version management and deployment capabilities.

## Overview

When adding a new app to the monorepo, you'll need to:

1. Set up the basic project structure
2. Configure automated versioning with Nx Release
3. Set up GitHub Pages deployment
4. Configure the release-deploy target
5. Perform the first release

## Prerequisites

- Node.js and pnpm installed
- Git repository access
- GitHub account with repository creation permissions
- Understanding of conventional commits

## Step-by-Step Setup Process

### 1. Create Basic Project Structure

First, create your new app following the standard monorepo structure:

```bash
# From monorepo root
mkdir apps/my-new-app
cd apps/my-new-app

# Create directory structure
mkdir src css public
touch index.html package.json vite.config.js project.json README.md
```

### 2. Configure package.json

Create the basic package.json with version management in mind:

```json
{
  "name": "my-new-app",
  "version": "0.0.0",
  "type": "module",
  "description": "Brief description of your app",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "keywords": ["generative-art", "p5js", "creative-coding"],
  "author": "Your Name",
  "license": "MIT"
}
```

**Important Notes:**
- Start with version `0.0.0` - the first release will bump this to `0.1.0`
- The `name` field must match your app directory name
- Include descriptive keywords for better discoverability

### 3. Create GitHub Repository

Create a dedicated repository for deployment:

1. Go to GitHub and create a new repository named `my-new-app`
2. **Do not initialize** with README, .gitignore, or license (keep it empty)
3. Note the repository URL: `https://github.com/yourusername/my-new-app.git`

### 4. Configure project.json with Automated Versioning

Create the Nx project configuration with the corrected release-deploy target:

```json
{
  "name": "my-new-app",
  "sourceRoot": "apps/my-new-app/src",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "@nx/vite:dev-server",
      "options": {
        "buildTarget": "my-new-app:build",
        "port": 5177
      }
    },
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/my-new-app",
        "configFile": "apps/my-new-app/vite.config.js"
      }
    },
    "preview": {
      "executor": "@nx/vite:preview-server",
      "options": {
        "buildTarget": "my-new-app:build",
        "port": 4177
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/my-new-app/**/*.{js,jsx}"]
      }
    },
    "deploy": {
      "dependsOn": ["build"],
      "executor": "nx:run-commands",
      "options": {
        "command": "npx gh-pages -d dist/apps/my-new-app --repo https://github.com/yourusername/my-new-app.git"
      }
    },
    "release-deploy": {
      "dependsOn": ["build"],
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx release version --projects=my-new-app",
          "nx release changelog --projects=my-new-app",
          "npx gh-pages -d dist/apps/my-new-app --repo https://github.com/yourusername/my-new-app.git"
        ],
        "parallel": false
      }
    }
  }
}
```

**Key Configuration Points:**

- **Unique Ports**: Use the next available port numbers (check existing apps)
- **Repository URL**: Replace `yourusername` with your GitHub username
- **Release-Deploy Target**: Uses the corrected subcommand structure to avoid git configuration conflicts
- **Command Sequence**: Version → Changelog → Deploy (parallel: false ensures proper order)

### 5. Configure Vite

Create `vite.config.js` with the correct port:

```javascript
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  root: __dirname,
  server: {
    port: 5177, // Match the port in project.json
    open: true,
    fs: {
      allow: [
        resolve(__dirname, '../..'),
        resolve(__dirname, '../../node_modules')
      ]
    }
  },
  build: {
    outDir: '../../dist/apps/my-new-app',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
```

### 6. Create Basic App Files

Create a minimal working app:

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My New App</title>
  </head>
  <body>
    <script type="module" src="/src/sketch.js"></script>
  </body>
</html>
```

**src/sketch.js:**
```javascript
import { p5 } from 'p5js-wrapper'
import '../css/style.css'

const sketch = function (p) {
  p.setup = function () {
    p.createCanvas(800, 600)
    p.background(240)
  }
  
  p.draw = function () {
    // Your creative code here
  }
}

new p5(sketch)
```

**css/style.css:**
```css
body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f0f0;
}

canvas {
  border: 1px solid #ccc;
}
```

### 7. Test the Setup

Verify everything works before setting up versioning:

```bash
# From monorepo root
nx dev my-new-app

# Should open browser at http://localhost:5177
# Verify the app loads correctly
```

### 8. Commit Initial Code

Create the initial commit with conventional commit format:

```bash
# From monorepo root
git add apps/my-new-app/
git commit -m "feat(my-new-app): initial app setup with basic p5.js sketch"
```

### 9. Perform First Release

Use the `--first-release` flag for the initial version:

```bash
# First release - creates version 0.1.0
nx release version --projects=my-new-app --first-release

# Generate changelog
nx release changelog --projects=my-new-app

# Or use the combined command (after the first release setup)
nx run my-new-app:release-deploy
```

**What happens during first release:**
- Version bumps from `0.0.0` to `0.1.0`
- Creates initial `CHANGELOG.md`
- Creates git tag `my-new-app@0.1.0`
- Builds and deploys to GitHub Pages

### 10. Enable GitHub Pages

After the first deployment:

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Set source to "Deploy from a branch"
4. Select `gh-pages` branch and `/ (root)` folder
5. Save settings

Your app will be available at: `https://yourusername.github.io/my-new-app`

## Port Assignment Reference

Keep track of used ports to avoid conflicts:

| App Name | Dev Port | Preview Port |
|----------|----------|--------------|
| duo-chrome | 5173 | 4173 |
| crude-collage-painter | 5174 | 4174 |
| those-shape-things | 5175 | 4175 |
| computational-collage | 5176 | 4176 |
| dragline | 5177 | 4177 |
| **your-new-app** | **5178** | **4178** |

## Naming Conventions

### Repository Names
- Use kebab-case: `my-new-app`
- Keep names descriptive but concise
- Avoid special characters or spaces

### App Directory Structure
```
apps/my-new-app/
├── src/
│   ├── sketch.js          # Main p5.js sketch
│   └── utils.js           # App-specific utilities
├── css/
│   └── style.css          # App styles
├── public/                # Static assets
├── index.html             # Entry point
├── package.json           # App metadata and version
├── project.json           # Nx configuration
├── vite.config.js         # Build configuration
├── README.md              # App documentation
└── CHANGELOG.md           # Generated after first release
```

## Conventional Commits for Version Management

Your commit messages determine version bumps:

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | Minor (0.1.0 → 0.2.0) | `feat(my-app): add color picker` |
| `fix:` | Patch (0.1.0 → 0.1.1) | `fix(my-app): resolve canvas scaling` |
| `chore:` | Patch (0.1.0 → 0.1.1) | `chore(my-app): update dependencies` |
| `feat!:` or `BREAKING CHANGE:` | Major (0.1.0 → 1.0.0) | `feat(my-app)!: redesign interface` |

## Troubleshooting Common Issues

### Issue: "No changes detected" during release

**Cause:** No conventional commits since last release

**Solution:**
```bash
# Check recent commits
git log --oneline -10

# Ensure commits follow conventional format
git commit -m "feat(my-app): describe your feature"

# Try release again
nx release version --projects=my-new-app
```

### Issue: Git configuration conflict error

**Cause:** Using old `nx release --projects=app` command instead of subcommands

**Solution:** Use the corrected release-deploy target or run subcommands separately:
```bash
# Correct approach
nx release version --projects=my-new-app
nx release changelog --projects=my-new-app

# Or use the release-deploy target
nx run my-new-app:release-deploy
```

### Issue: GitHub Pages deployment fails

**Cause:** Repository doesn't exist or permissions issue

**Solutions:**
1. Verify repository exists and is accessible
2. Check repository URL in project.json
3. Ensure you have push permissions
4. For first deployment, repository can be empty

### Issue: Port already in use

**Cause:** Another service is using the configured port

**Solutions:**
1. Check the port assignment table above
2. Use `lsof -i :5177` to see what's using the port
3. Choose a different port and update both `project.json` and `vite.config.js`

### Issue: Build fails with import errors

**Cause:** Missing dependencies or incorrect import paths

**Solutions:**
1. Install missing dependencies: `pnpm add dependency-name`
2. Check import paths are correct
3. Ensure shared libraries are properly installed

### Issue: First release fails with version conflict

**Cause:** Version in package.json is not `0.0.0`

**Solution:**
1. Set version to `0.0.0` in package.json
2. Use `--first-release` flag for initial release
3. Commit the version change before releasing

## Validation Checklist

Before considering your app setup complete, verify:

- [ ] App runs locally with `nx dev my-new-app`
- [ ] Build succeeds with `nx build my-new-app`
- [ ] Conventional commit created for initial code
- [ ] First release completes successfully
- [ ] GitHub repository exists and is accessible
- [ ] GitHub Pages is enabled and working
- [ ] App is accessible at the GitHub Pages URL
- [ ] Version appears correctly in package.json and git tags
- [ ] CHANGELOG.md is generated
- [ ] Port numbers are unique and documented

## Next Steps

After successful setup:

1. **Develop your app** using the shared libraries and patterns
2. **Commit changes** using conventional commit format
3. **Release updates** using `nx run my-new-app:release-deploy`
4. **Monitor deployments** via GitHub Pages settings
5. **Update documentation** as your app evolves

## Related Documentation

- [Version Management Guide](./version-management.md) - Detailed versioning workflows
- [Adding Projects Guide](./adding-projects.md) - General project setup
- [GitHub Pages Deployment](../deployment/github-pages.md) - Deployment details
- [Release Workflow Examples](./release-workflow-examples.md) - Common release patterns
