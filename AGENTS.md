<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->

# Duo-Chrome Image Management Guidelines

## Automated Image Deployment (Task #9)

The Duo-Chrome image management system now handles production deployments automatically:

**Development Workflow (No Manual Image Swapping Needed)**
- Work with your custom images in `apps/duo-chrome/public/images/` 
- These images are git-ignored, so your local changes don't affect version control
- When you run `pnpm nx dev duo-chrome`, the existing images in `public/images/` are used

**Production Build Workflow (Fully Automatic)**
- When you run `pnpm nx build duo-chrome`, the build system automatically:
  1. **Backs up** your current development images to `public/images_dev_backup/`
  2. **Copies** the official production images from `public/images_production/` to `public/images/`
  3. **Deploys** only the official production images to `dist/` and production
  4. Your development images are safe and can be restored anytime

**Official Image Source**
- `apps/duo-chrome/public/images_production/` contains the official images that get deployed
- This folder is tracked in git
- Update this folder when you need to change the deployed images

**When You Need to Change Deployed Images**
1. Update the images in `public/images_production/`
2. Commit the changes to git
3. Run `pnpm nx build duo-chrome` to deploy (production images are automatically used)
4. Your local development images remain unchanged in `public/images/` and `public/images_dev_backup/`

**No More Manual Image Swapping**
- Agents should **NEVER** run `images:work` or `images:commit` scripts
- The build system handles image management automatically
- The deprecated npm scripts are still available for manual use if needed, but are no longer necessary

**Use Safe Image Swapping** (if manual swapping is needed)
- The `scripts/swap-duo-chrome-images.js` script is available for manual directory management
- **DO NOT** use this during normal development or deployment - the build system handles it automatically
- The script creates timestamped backups to prevent data loss
