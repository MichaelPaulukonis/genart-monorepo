# Playwright Troubleshooting Log

This document summarizes the issues encountered and steps taken during the Playwright testing setup and standardization, particularly focusing on the `webServer` configuration.

## Task 51: Create App-Specific Playwright Configurations

**Objective**: Create app-specific `playwright.config.js` files for each application and update `project.json` files to use `e2e` targets.

**Steps Taken**:
1.  Created `tests/` directories and `playwright.config.js` files for `duo-chrome`, `monochromifier`, `dragline`, and `those-shape-things`.
2.  Updated `project.json` files for `duo-chrome`, `monochromifier`, `crude-collage-painter`, `computational-collage`, `those-shape-things`, and `dragline` to include an `e2e` target using the `@nx/playwright:playwright` executor, pointing to their respective app-specific `playwright.config.js` files.
3.  Created placeholder tests (`placeholder.spec.js`) in each app's `tests/` directory.

## Issue 1: `mergeConfig is not a function`

**Description**: When initially running `nx e2e <app-name>`, an error `mergeConfig is not a function` was encountered. This was due to an incorrect assumption that `@playwright/test` exports a `mergeConfig` utility.

**Resolution**: The `playwright.config.js` files were updated to use a full Playwright configuration object directly, rather than attempting to merge with a non-existent `baseConfig` utility. The root `playwright.config.js` was used as a reference for the structure.

## Issue 2: Playwright Tests Hanging/Timing Out

**Description**: After resolving the `mergeConfig` issue, running `npm run test:e2e` (which executes `nx run-many --target=e2e --all`) resulted in tests hanging and eventually timing out. Individual `nx e2e <app-name>` commands also exhibited this behavior.

**Troubleshooting Steps & Observations**:

### Attempt 1: Running `http-server` in Background
*   **Approach**: Modified `webServer.command` in each `playwright.config.js` to `nx build <app-name> && http-server dist/apps/<app-name> -p <port> --silent &`. The `&` was added to run `http-server` in the background.
*   **Outcome**: Tests still timed out. The `&` caused Playwright's `webServer` to not properly manage the server's lifecycle, as it expects the command to keep the server in the foreground.

### Attempt 2: Separating Build and Serve Steps
*   **Approach**:
    1.  Updated the root `package.json`'s `test:e2e` script to `nx run-many --target=build --all && nx run-many --target=e2e --all`. This ensures all apps are built before any e2e tests run.
    2.  Modified `webServer.command` in each `playwright.config.js` to *only* serve the built application using `http-server` in the foreground: `http-server dist/apps/<app-name> -p <port> --silent`.
*   **Outcome**: Tests still timed out. Logs showed "Timed out waiting 180000ms from config.webServer." This indicated that `http-server` was either not starting fast enough or not being detected by Playwright's `url` check.

### Attempt 3: Switching to `npx serve`
*   **Approach**:
    1.  Installed `serve` as a dev dependency (`pnpm add serve --save-dev --workspace-root`).
    2.  Modified `webServer.command` in each `playwright.config.js` to use `npx serve dist/apps/<app-name> -l <port> --single`. The `--single` flag was added to handle single-page application routing.
*   **Outcome**: Tests still timed out. Running `nx e2e duo-chrome` directly showed `[WebServer]` logs with numerous `Returned 404` and `Returned 301` errors for `/`, `/index.html`, and `/index`. This suggested that `npx serve` was not correctly serving the `index.html` at the root URL, despite the `--single` flag.

### Attempt 4: Switching to Python's `http.server`
*   **Approach**: Modified `webServer.command` in each `playwright.config.js` to use `python3 -m http.server <port> --directory dist/apps/<app-name>`.
*   **Outcome**: Tests still timed out. No `[WebServer]` logs were observed from the Python server, indicating it might not be starting correctly or its output is not being piped.

## Current Understanding of the Issue

The core problem lies in reliably serving the built application for Playwright's `webServer` to consume. While `nx build` successfully creates the `dist` directories with `index.html`, the subsequent serving mechanism (whether `http-server`, `npx serve`, or Python's `http.server`) is not making the application accessible to Playwright at the specified `baseURL` within the allotted timeout.

The `404` and `301` errors observed with `npx serve` are particularly concerning, as `index.html` is present in the served directory. This suggests a deeper interaction issue between Playwright's `webServer` and the chosen static file server, or a subtle misconfiguration in how the server is invoked or how Playwright expects the application to respond.

## Next Steps for Troubleshooting

1.  **Verify `python3 -m http.server` manually**: Run the Python server command directly in a terminal and manually verify that `http://localhost:<port>` serves the `index.html` correctly in a browser. This will confirm if the Python server command itself is functional.
2.  **Increase Playwright `webServer` timeout**: Temporarily increase the `timeout` value in `playwright.config.js` to see if the server eventually becomes available.
3.  **Check Playwright `webServer` `url` property**: Ensure the `url` property in `webServer` is precisely what the server is listening on and serving.
4.  **Consider `start-server-and-test`**: If direct serving commands continue to fail, re-evaluate using `start-server-and-test` as it's specifically designed to manage server startup and shutdown for testing.
5.  **Review Nx `webServer` documentation**: Re-read any relevant Nx or Playwright documentation regarding `webServer` configuration, especially in a monorepo context, for any specific recommendations or known issues.
