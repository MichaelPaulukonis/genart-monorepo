const { defineConfig, devices } = require('@playwright/test');
const baseConfig = require('../../playwright.config.js');

module.exports = defineConfig({
  ...baseConfig,
  testDir: './tests',
  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:5174/',
  },
});