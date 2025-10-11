// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  root: __dirname,
  server: {
    port: 5175,
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
    outDir: '../../dist/apps/those-shape-things',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})