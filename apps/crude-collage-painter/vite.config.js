// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  root: __dirname,
  base: process.env.DEPLOY_ENV === 'GH_PAGES' ? '/crude-collage-painter/' : '',
  server: {
    port: 5174,
    open: true,
    fs: {
      allow: [
        // Allow serving files from the project root and parent directories
        resolve(__dirname, '../..'),
        // Allow serving from node_modules
        resolve(__dirname, '../../node_modules')
      ]
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})