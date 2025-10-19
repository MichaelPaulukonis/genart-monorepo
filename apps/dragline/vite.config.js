// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')
const fs = require('fs')

// Plugin to generate version constants from package.json
const versionPlugin = () => {
  return {
    name: 'version-plugin',
    buildStart() {
      try {
        const packageJson = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf8'))
        const versionContent = `export const APP_VERSION = '${packageJson.version}';\n`
        const versionPath = resolve(__dirname, 'src/utils/version-constants.js')
        fs.writeFileSync(versionPath, versionContent)
        console.log(`Generated version constants: ${packageJson.version}`)
      } catch (error) {
        console.warn('Failed to generate version constants:', error.message)
      }
    }
  }
}

module.exports = defineConfig({
  root: __dirname,
  base: process.env.DEPLOY_ENV === 'GH_PAGES' ? '/dragline/' : '',
  plugins: [versionPlugin()],
  server: {
    port: 5177,
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
    target: 'esnext',
    outDir: '../../dist/apps/dragline',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
