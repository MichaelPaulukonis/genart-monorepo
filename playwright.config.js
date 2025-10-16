const { defineConfig, devices } = require('@playwright/test')

/**
 * Playwright Configuration for GenArt Monorepo
 * 
 * Adapted from PolychromeText project for testing Vite-based p5.js apps.
 * Each app in the monorepo has its own port assignment (see tech.md).
 */

/**
 * Port assignments for apps:
 * - duo-chrome: 5173
 * - crude-collage-painter: 5174
 * - those-shape-things: 5175
 * - computational-collage: 5176
 */
const APP_PORTS = {
  'duo-chrome': 5173,
  'crude-collage-painter': 5174,
  'those-shape-things': 5175,
  'computational-collage': 5176
}

// Get the app to test from environment variable, default to duo-chrome
const TEST_APP = process.env.TEST_APP || 'duo-chrome'
const PORT = APP_PORTS[TEST_APP] || 5173

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './test/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: `http://localhost:${PORT}`,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }

    // Uncomment to test on additional browsers:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] }
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // }
  ],

  /* Run local dev server before starting tests */
  webServer: {
    // Use nx to run the specific app
    command: `nx dev ${TEST_APP}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes
    stdout: 'pipe',
    stderr: 'pipe'
  },

  /* Global test settings */
  timeout: 30000, // Increased for verification script
  
  /* Expect settings including visual regression */
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.1,
      mode: 'pixel'
    }
  }
})
