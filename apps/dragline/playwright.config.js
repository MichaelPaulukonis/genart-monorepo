const { defineConfig } = require('@playwright/test')
const baseConfig = require('../../playwright.config.js')

module.exports = defineConfig({
  ...baseConfig,
  testDir: './tests',
  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:5177/'
  },
  webServer: {
    command: 'python3 -m http.server 5177 --directory dist/apps/dragline',
    url: 'http://localhost:5177/',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes
    stdout: 'pipe',
    stderr: 'pipe'
  }
})