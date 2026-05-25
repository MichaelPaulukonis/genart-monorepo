# GenArt Monorepo

Generative art and creative coding monorepo managed with Nx. Multiple independent p5.js applications sharing common libraries and build tooling.

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

## Stack

- **Monorepo**: Nx + pnpm workspaces
- **Build**: Vite
- **Creative coding**: p5.js via p5js-wrapper
- **Language**: JavaScript or TypeScript (varies per app — respect existing choice)
- **Linting**: ESLint + StandardJS + eslint-plugin-p5js *(may be outdated; modernize when issues arise)*
- **Testing**: Playwright (E2E)

## Project Structure

```text
apps/
  duo-chrome/          (port 5173)
  crude-collage-painter/ (port 5174)
  computational-collage/ (port 5175)
  dragline/            (port 5176)
  monochromifier/      (port 5177)
  those-shape-things/  (port 5178)
  aggressive-text-waves/ (port 5179)
  # new apps increment from 5180+
libs/
  p5-utils/            → @genart/p5-utils
  color-palettes/      → @genart/color-palettes
  version-display/     → @genart/version-display
docs/
  architecture/
  guides/
  plans/               # plan files live here
tools/
scripts/
```

Each app: `src/` · `docs/` · `public/` · `project.json` · `package.json`

## Coding Standards

- **Naming**: `kebab-case` files/folders · `camelCase` variables/functions · `UPPER_SNAKE_CASE` constants
- **StandardJS**: no semicolons · 2-space indent · single quotes · ~100 char line length
- **Shared libs**: always prefer `libs/` over duplicating code across apps
- **p5.js sketches**: use `CONFIG` object for parameters · `randomSeed()` for reproducibility · implement save functionality

Standard sketch structure:

```javascript
import { createNamer } from '@genart/p5-utils'
import { getPalette } from '@genart/color-palettes'

const CONFIG = { width: 800, height: 600, backgroundColor: '#ffffff' }

let namer, palette

function setup() {
  createCanvas(CONFIG.width, CONFIG.height)
  namer = createNamer('my-sketch')
  palette = getPalette('riso-red-blue')
}

function draw() {
  background(CONFIG.backgroundColor)
  // drawing logic
}

function keyPressed() {
  if (key === 's') namer.save()
}
```

## Planning Process

**All feature work and architectural changes require a plan file before any code.**

1. Check `docs/plans/` for an existing relevant plan
2. If one exists: ask the user whether to update it, create a new one, or proceed without
3. If none exists: ask the user whether to create one or proceed without — honor their choice
4. Plan file naming: `NN.semantic-name.md` (e.g., `01.user-comments.md`)
5. Required sections: Problem Statement · Requirements · Technical Approach · Implementation Steps · Testing Strategy · Risks & Mitigation · Dependencies
6. Use Taskmaster MCP to parse the plan as a PRD and generate tasks — append only, never delete existing tasks
7. When all tasks complete: annotate the file internally and move it to `docs/plans/completed/` using `git mv`

**Exceptions** (no plan required): PRD creation · documentation updates · single-line bug fixes

## Git Commit Workflow

When asked to create a commit, follow these steps in order — do not skip or reorder:

0. **Run `/code-review` on the changes first.** Do not skip this step. If the user explicitly says they have already reviewed or asks to skip review, proceed — otherwise treat this as mandatory.
1. Run `git status` and `git diff --staged` to understand the changes
2. Check `.github/changelog-management.md` to evaluate changelog impact
3. Classify the change:
   - **Monorepo changelog** (`/CHANGELOG.md`): infrastructure, shared libs, Nx config, build tools, cross-app changes
   - **App changelog** (`apps/[app]/CHANGELOG.md`): app-specific features, fixes, UI changes
4. If changes meet the criteria, ask: *"Should I create a changelog entry for these changes?"* — advise on which changelog it belongs to
5. If approved, update the appropriate changelog
6. Draft a commit message following Conventional Commits (`type(scope): description`) — **STOP and wait for explicit user approval**
7. **NEVER commit without explicit user approval.** The user may need to test or review first.
8. After approval: stage `CHANGELOG.md` if modified, then run `git commit`

Scope patterns:

- Shared lib changes → `feat(libs/p5-utils): ...`
- Nx/build/infra → `fix(nx): ...` · `chore(build): ...`
- Cross-app → `feat(monorepo): ...`
- App-specific → `feat(duo-chrome): ...` · `fix(dragline): ...`

## Duo-Chrome: Image Management

**NEVER run `images:commit` or modify image directories unless explicitly performing a release or deploy task.**

Directory layout (`apps/duo-chrome/public/`):

- `images/` — active images used by the app
- `images_local/` — custom working images (not committed)
- `images_original/` — official images matching git
- `images_YYYY-MM-DDTHH-MM-SS/` — timestamped auto-backups

Switch to working images: `cd apps/duo-chrome && npm run images:work`  
Switch to commit-ready images: `cd apps/duo-chrome && npm run images:commit`  
After committing, run `images:work` again to restore working images.

Custom swaps via script:

```bash
node scripts/swap-duo-chrome-images.js --source images_experimental
node scripts/swap-duo-chrome-images.js --source images_set_a --target images_set_b
node scripts/swap-duo-chrome-images.js --source images_test --dry-run
```

Backups are created automatically before any overwrite and are never auto-deleted. Use `--dry-run` to preview before executing.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
