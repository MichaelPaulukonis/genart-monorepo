// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  server: {
    port: 5173, // Vite's default port, or specify any available port
    open: true  // Automatically open browser
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        single: resolve(__dirname, 'single_sketch.html'),
        multi: resolve(__dirname, 'multi_sketch.html')
      }
    }
  }
})
