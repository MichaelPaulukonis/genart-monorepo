# project.json Template for New Apps

This template provides a standardized `project.json` configuration for new applications with automated version management and deployment capabilities.

## Template File

The template is located at `docs/templates/project.json.template` and includes all necessary targets for development, building, linting, deployment, and automated versioning.

## Template Variables

Replace the following placeholders when creating a new app:

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `{{APP_NAME}}` | App directory name (kebab-case) | `my-new-app` | Must match directory name exactly |
| `{{DEV_PORT}}` | Development server port | `5178` | Must be unique across all apps |
| `{{PREVIEW_PORT}}` | Preview server port | `4178` | Typically dev port - 1000 |
| `{{REPO_URL}}` | GitHub repository URL | `https://github.com/username/my-new-app.git` | For GitHub Pages deployment |

## Port Assignment

Use the next available ports based on existing apps:

| App Name | Dev Port | Preview Port |
|----------|----------|--------------|
| duo-chrome | 5173 | 4173 |
| crude-collage-painter | 5174 | 4174 |
| those-shape-things | 5175 | 4175 |
| computational-collage | 5176 | 4176 |
| dragline | 5177 | 4177 |
| **Next available** | **5178** | **4178** |

## Usage Instructions

### 1. Copy the Template

```bash
# From monorepo root
cp docs/templates/project.json.template apps/my-new-app/project.json
```

### 2. Replace Variables

Edit the copied file and replace all template variables:

```bash
# Example replacements for app named "particle-system"
# {{APP_NAME}} → particle-system
# {{DEV_PORT}} → 5178
# {{PREVIEW_PORT}} → 4178
# {{REPO_URL}} → https://github.com/yourusername/particle-system.git
```

### 3. Verify Configuration

After replacement, your `project.json` should look like:

```json
{
  "name": "particle-system",
  "sourceRoot": "apps/particle-system/src",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "@nx/vite:dev-server",
      "options": {
        "buildTarget": "particle-system:build",
        "port": 5178
      }
    },
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/particle-system",
        "configFile": "apps/particle-system/vite.config.js"
      }
    },
    "preview": {
      "executor": "@nx/vite:preview-server",
      "options": {
        "buildTarget": "particle-system:build",
        "port": 4178
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/particle-system/**/*.{js,jsx}"]
      }
    },
    "deploy": {
      "dependsOn": ["build"],
      "executor": "nx:run-commands",
      "options": {
        "command": "npx gh-pages -d dist/apps/particle-system --repo https://github.com/yourusername/particle-system.git"
      }
    },
    "release-deploy": {
      "dependsOn": ["build"],
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx release version --projects=particle-system",
          "nx release changelog --projects=particle-system",
          "npx gh-pages -d dist/apps/particle-system --repo https://github.com/yourusername/particle-system.git"
        ],
        "parallel": false
      }
    }
  }
}
```

## Target Explanations

### Development Targets

- **`dev`**: Starts development server with hot reload
- **`build`**: Creates production build in `dist/apps/{app-name}`
- **`preview`**: Serves production build locally for testing
- **`lint`**: Runs ESLint on app files

### Deployment Targets

- **`deploy`**: Deploys built app to GitHub Pages (manual deployment)
- **`release-deploy`**: Complete automated workflow (version → changelog → deploy)

### Key Features of release-deploy Target

1. **Corrected Subcommand Structure**: Uses `nx release version` and `nx release changelog` separately to avoid git configuration conflicts
2. **Sequential Execution**: `parallel: false` ensures commands run in correct order
3. **Build Dependency**: Automatically builds before deployment
4. **Error Isolation**: Separate commands allow easier debugging if one step fails

## Required Customizations

When using this template, you **must** customize:

### 1. App Name
- Replace `{{APP_NAME}}` with your actual app directory name
- Ensure consistency across all occurrences
- Use kebab-case naming convention

### 2. Port Numbers
- Choose unique port numbers not used by other apps
- Update both dev and preview ports
- Document your port assignment

### 3. Repository URL
- Create GitHub repository for your app
- Use the correct repository URL format
- Ensure you have push permissions to the repository

### 4. File Paths (if different structure)
- Verify source root path matches your structure
- Confirm build output path is correct
- Check lint file patterns include your files

## Validation Checklist

After creating your `project.json` from the template:

- [ ] All `{{VARIABLES}}` have been replaced
- [ ] App name is consistent throughout the file
- [ ] Port numbers are unique and available
- [ ] Repository URL is correct and accessible
- [ ] File paths match your project structure
- [ ] No syntax errors in JSON

## Testing the Configuration

Verify your configuration works:

```bash
# Test development server
nx dev your-app-name

# Test build process
nx build your-app-name

# Test linting
nx lint your-app-name

# Test preview server
nx preview your-app-name
```

## Common Mistakes to Avoid

1. **Inconsistent naming**: App name must match directory name exactly
2. **Port conflicts**: Always check existing port assignments
3. **Invalid JSON**: Ensure proper JSON syntax after replacements
4. **Wrong repository URL**: Verify GitHub repository exists and is accessible
5. **Missing dependencies**: Ensure build dependencies are satisfied

## Integration with Monorepo

This template is designed to work with the existing monorepo configuration:

- **Nx Release**: Inherits settings from `nx.json`
- **Conventional Commits**: Uses monorepo-wide commit conventions
- **Shared Libraries**: Compatible with `@genart/*` packages
- **Build System**: Uses shared Vite and ESLint configurations

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :5178

# Choose a different port and update template
```

### Build Path Issues
```bash
# Verify output directory exists after build
ls -la dist/apps/your-app-name/
```

### Repository Access Issues
```bash
# Test repository access
git ls-remote https://github.com/username/repo.git
```

## Related Files

When using this template, you'll also need:

- `package.json` - App metadata and dependencies
- `vite.config.js` - Build configuration with matching ports
- `index.html` - App entry point
- `src/sketch.js` - Main application code

See the [New App Setup Guide](../guides/new-app-automated-versioning-setup.md) for complete setup instructions.