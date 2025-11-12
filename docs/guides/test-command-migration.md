# Test Command Migration Guide

This document provides a mapping of old, app-specific test commands to their new Nx-based equivalents.

## Old Commands (Removed from root `package.json`)

| Old Command                       | Description                                                              |
| :-------------------------------- | :----------------------------------------------------------------------- |
| `npm run test:crude-collage`      | Runs Playwright tests for `crude-collage-painter`                        |
| `npm run test:computational-collage` | Runs Playwright tests for `computational-collage`                        |

## New Nx-Based Commands

The new approach leverages Nx targets for consistent test execution across all applications.

### Running E2E Tests for a Specific Application

To run E2E tests for a specific application, use the `nx e2e` command followed by the application's project name:

```bash
nx e2e <app-name>
```

**Examples:**

| Application             | New Command                                |
| :---------------------- | :----------------------------------------- |
| `crude-collage-painter` | `nx e2e crude-collage-painter`             |
| `computational-collage` | `nx e2e computational-collage`             |
| `duo-chrome`            | `nx e2e duo-chrome`                        |
| `monochromifier`        | `nx e2e monochromifier`                    |
| `those-shape-things`    | `nx e2e those-shape-things`                |
| `dragline`              | `nx e2e dragline`                          |

### Running All E2E Tests

To run E2E tests for all applications that have an `e2e` target, use the `nx run-many` command:

```bash
nx run-many --target=e2e --all
```

### Other Global Test Commands

The following global test commands in the root `package.json` remain unchanged:

| Command                   | Description                                                              |
| :------------------------ | :----------------------------------------------------------------------- |
| `npm run test:e2e`        | Runs Playwright using the root `playwright.config.js` (configured via `TEST_APP` env var) |
| `npm run test:e2e:ui`     | Opens Playwright UI for debugging                                        |
| `npm run test:e2e:debug`  | Runs Playwright tests in debug mode                                      |
| `npm run test:e2e:update` | Updates Playwright snapshots                                             |
| `npm run test:e2e:report` | Shows the last Playwright HTML report                                    |
