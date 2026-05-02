const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  root: __dirname,
  base: process.env.DEPLOY_ENV === 'GH_PAGES' ? '/aggressive-text-waves/' : '',
  server: {
    port: 5179,
    open: true,
    fs: {
      allow: [
        resolve(__dirname, '../..'),
        resolve(__dirname, '../../node_modules')
      ]
    }
  },
  build: {
    outDir: '../../dist/apps/aggressive-text-waves',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
