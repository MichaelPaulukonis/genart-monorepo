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



**Use Safe Image Swapping**



- The `scripts/swap-duo-chrome-images.js` script has been refactored to be safe and use timestamped backups.

- **ALWAYS** use the script with explicit flags or standard npm commands:

  - `npm run images:work`: Safely switches to working images (renames current to backup).

  - `npm run images:commit`: Safely switches to official images (renames current to backup).

- **DO NOT** manually rename or delete folders in `apps/duo-chrome/public/` unless you are cleaning up backups.

- The script automatically creates timestamped backups (e.g., `images_2026...`) when switching targets. This prevents data loss.
