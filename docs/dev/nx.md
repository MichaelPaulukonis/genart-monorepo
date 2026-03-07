# Nx — Developer Reference

Technical reference for the Nx monorepo setup in GenArt. See also: [User Guide](../user/nx.md)

## Version & Configuration

| Item | Value |
|---|---|
| Nx version | 21.6.4 |
| Config file | `nx.json` |
| Package manager | pnpm |
| Cloud ID | `68e92d446c557376670b1458` (Nx Cloud) |

## Workspace Layout

```
genart-monorepo/
├── apps/                        # Independent applications
│   ├── duo-chrome/              # port 5173 / preview 4173
│   ├── crude-collage-painter/   # port 5174 / preview 4174
│   ├── computational-collage/   # port 5175 / preview 4175
│   ├── dragline/                # port 5176 / preview 4176
│   ├── monochromifier/          # port 5177 / preview 4177
│   └── those-shape-things/      # port 5178 / preview 4178
├── libs/
│   ├── p5-utils/                # @genart/p5-utils
│   ├── color-palettes/          # @genart/color-palettes
│   └── version-display/         # @genart/version-display
├── nx.json                      # Workspace config + release config
├── pnpm-workspace.yaml          # pnpm workspace definition
└── package.json                 # Root dependencies
```

New apps increment dev ports from 5179+ and preview ports from 4179+.

## Registered Plugins

```json
{
  "plugins": [
    {
      "plugin": "@nx/playwright/plugin",
      "options": { "targetName": "e2e" }
    }
  ]
}
```

The Playwright plugin auto-infers `e2e` targets from `playwright.config.js` files.

## Standard Project Targets

Every app (`project.json`) defines these targets:

| Target | Executor | Notes |
|---|---|---|
| `dev` | `@nx/vite:dev-server` | `buildTarget: <app>:build`, unique port |
| `build` | `@nx/vite:build` | outputs to `dist/apps/<app>` |
| `preview` | `@nx/vite:preview-server` | serves built output locally |
| `lint` | `@nx/eslint:lint` | StandardJS + eslint-plugin-p5js |
| `test` | `nx:run-commands` | `vitest --run` from app directory |
| `e2e` | `@nx/playwright:playwright` | inferred by plugin; CI config: `workers: 1` |
| `deploy` | `nx:run-commands` | `gh-pages` push to individual repo |
| `validate-version` | `nx:run-commands` | runs `scripts/validate-versions.js` |
| `release-deploy` | `nx:run-commands` | sequential: release → gh-pages push |

### Fallback Build Pattern

If `@nx/vite:build` throws `TypeError: Cannot read properties of undefined (reading 'startsWith')`:

```json
"build": {
  "executor": "nx:run-commands",
  "outputs": ["{workspaceRoot}/dist/apps/<app>"],
  "options": {
    "command": "npx vite build",
    "cwd": "apps/<app>"
  }
}
```

## Release Configuration

Configured in `nx.json` under `"release"`:

```json
{
  "release": {
    "projectsRelationship": "independent",
    "projects": ["apps/*"],
    "releaseTagPattern": "{projectName}@{version}",
    "git": { "commit": true, "tag": true },
    "version": { "conventionalCommits": true },
    "changelog": {
      "projectChangelogs": true,
      "workspaceChangelog": {
        "createRelease": false,
        "file": "{workspaceRoot}/CHANGELOG.md",
        "entryWhenNoChanges": "Version bump only",
        "renderOptions": {
          "authors": false,
          "commitReferences": true,
          "versionTitleDate": true
        }
      }
    }
  }
}
```

Key properties:
- `projectsRelationship: "independent"` — each app versions separately
- `projects: ["apps/*"]` — glob includes any new app directory automatically; no `nx.json` edits needed
- `releaseTagPattern: "{projectName}@{version}"` — e.g. `duo-chrome@1.2.3`
- `conventionalCommits: true` — determines version bump from commit type

### Version Bump Rules

| Commit prefix | Bump |
|---|---|
| `feat:` | minor |
| `fix:` | patch |
| `chore:` | patch |
| `docs:`, `style:`, `refactor:`, `test:` | none |
| `feat!:` / `BREAKING CHANGE:` footer | major |

## Conventional Commits & Scopes

Format: `type(scope): description`

Scope conventions:
- App-specific: `feat(duo-chrome): ...`
- Shared lib: `feat(libs/p5-utils): ...`
- Nx/build/infra: `fix(nx): ...` · `chore(build): ...`
- Cross-app: `feat(monorepo): ...`

## Common Commands

All `nx` commands should be prefixed with the package manager to avoid using a global install:

```bash
# Development
pnpm nx dev <app>
pnpm nx run-many --target=dev --all

# Build
pnpm nx build <app>
pnpm nx run-many --target=build --all
pnpm nx run-many --target=build --all --parallel=3

# Lint / Test
pnpm nx lint <app>
pnpm nx test <app>
pnpm nx e2e <app>
pnpm nx run-many --target=lint --all
pnpm nx run-many --target=test --all

# Affected (CI-friendly — only rebuilds what changed)
pnpm nx affected --target=build
pnpm nx affected --target=test

# Release
pnpm nx release                                     # all changed apps
pnpm nx release --projects=duo-chrome               # single app
pnpm nx release --projects=duo-chrome --dry-run     # preview only
pnpm nx release --projects=duo-chrome --specifier=patch

# Release + Deploy (combined target)
pnpm nx run duo-chrome:release-deploy

# Dependency graph
pnpm nx graph
pnpm nx affected:graph
```

## Caching

Nx caches task outputs by input hash. Cached targets replay without re-executing.

- Outputs cached: `build` (via `"outputs": ["{options.outputPath}"]`)
- Remote cache: Nx Cloud (`nxCloudId` in `nx.json`)
- TUI: disabled (`"tui": { "enabled": false }`)

To skip cache for a single run: `pnpm nx build <app> --skip-nx-cache`

## Deployment Architecture

Each app deploys to its own GitHub repository's `gh-pages` branch:

```
monorepo (source) → dist/apps/<app>/ → gh-pages → <app>.github.io/<app>
```

The `deploy` target uses `gh-pages` CLI:

```bash
npx gh-pages -d dist/apps/<app> --repo https://github.com/michaelpaulukonis/<app>.git
```

`release-deploy` runs sequentially (not parallel):
1. `nx release --projects=<app>` — bumps version, writes changelog, commits, tags
2. `npx gh-pages ...` — pushes built output

## Adding a New App

1. Create `apps/<app-name>/` with `package.json`, `project.json`, `vite.config.js`, `index.html`, `src/`
2. Assign next available port (5179+)
3. `project.json` must declare `dev`, `build`, `preview`, `lint` targets at minimum
4. No `nx.json` changes needed — `"projects": ["apps/*"]` auto-includes it
5. See [adding-projects.md](../guides/adding-projects.md) for full walkthrough

## Testing Setup

| App | Framework | Command |
|---|---|---|
| duo-chrome | Vitest (unit) + Playwright (e2e) | `pnpm nx test duo-chrome` / `pnpm nx e2e duo-chrome` |
| others | Playwright (e2e, via plugin) | `pnpm nx e2e <app>` |

Playwright config files: `apps/<app>/playwright.config.js`

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Adding Projects](../guides/adding-projects.md)
- [Version Management](../guides/version-management.md)
- [Monorepo Integration Workflow](../guides/monorepo-integration-workflow.md)
- [GitHub Pages Deployment](../deployment/github-pages.md)
- [User Guide: Nx](../user/nx.md)
