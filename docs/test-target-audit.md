# Test Target Audit

This document audits the current state of test targets across all applications in the monorepo.

| App Name                  | Has Test Target | Test Command/Executor                               | Configuration / Notes                                                              |
| ------------------------- | :-------------: | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `computational-collage`   |       Yes       | `@nx/playwright:playwright`                         | `apps/computational-collage/playwright.config.js`                                  |
| `crude-collage-painter`   |       Yes       | `@nx/playwright:playwright`                         | `apps/crude-collage-painter/playwright.config.js`                                  |
| `dragline`                |       Yes       | `@nx/playwright:playwright`                         | `apps/dragline/playwright.config.js`                                               |
| `duo-chrome`              |       Yes       | `nx:run-commands` (`node src/size-control.test.js`) | Unit test only. E2E tests are run via the root `playwright.config.js`.             |
| `monochromifier`          |       Yes       | `nx:run-commands` (`node src/size-control.test.js`) | Unit test only. No E2E test target defined.                                        |
| `those-shape-things`    |       Yes       | `@nx/playwright:playwright`                         | `apps/those-shape-things/playwright.config.js`                                     |

## Root `package.json` Test Scripts

-   `"test:crude-collage"`: Runs Playwright for `crude-collage-painter` with its own config.
-   `"test:computational-collage"`: Runs Playwright for `computational-collage` with its own config.
-   `"test"`: Runs `nx run-many --target=test --all`, which executes the `test` target for all projects that have one.
-   `"test:e2e"`: Runs Playwright using the root `playwright.config.js`, which is currently configured to test `duo-chrome`.
