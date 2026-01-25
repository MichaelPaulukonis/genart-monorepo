<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->

# Duo-Chrome Image Management Guidelines



**Use Safe Image Swapping**



- The `scripts/swap-duo-chrome-images.js` script has been refactored to be safe and use timestamped backups.

- **ALWAYS** use the script with explicit flags or standard npm commands:

  - `npm run images:work`: Safely switches to working images (renames current to backup).

  - `npm run images:commit`: Safely switches to official images (renames current to backup).

- **DO NOT** manually rename or delete folders in `apps/duo-chrome/public/` unless you are cleaning up backups.

- The script automatically creates timestamped backups (e.g., `images_2026...`) when switching targets. This prevents data loss.
