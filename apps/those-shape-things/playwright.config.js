const { defineConfig, devices } = require('@playwright/test')
const baseConfig = require('../../playwright.config.js')

module.exports = defineConfig({
  ...baseConfig,
  testDir: './tests',
  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:5175/'
  },
  webServer: {
    command: 'nx dev those-shape-things',
    url: 'http://localhost:5175/',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes
    stdout: 'pipe',
    stderr: 'pipe'
  }
})