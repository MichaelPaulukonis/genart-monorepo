// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')
const { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } = require('fs')
const { imageListPlugin } = require('../../tools/vite-plugin-image-list.js')

// Vite plugin to copy production images before build
function copyProductionImages () {
  return {
    name: 'copy-production-images',
    configResolved (config) {
      const appRoot = __dirname
      const sourceDir = resolve(appRoot, 'public/images_production')
      const targetDir = resolve(appRoot, 'public/images')

      // Determine if this is a production build
      const isProductionBuild = config.command === 'build' || process.env.NODE_ENV === 'production'

      if (!existsSync(sourceDir)) {
        console.warn('⚠️  images_production directory not found')
        return
      }

      // Production build: always copy from images_production
      if (isProductionBuild) {
        console.log('🚀 Production build detected - copying images from images_production...')
        try {
          // Backup existing images if they exist and are different
          if (existsSync(targetDir)) {
            console.log('ℹ️  Backing up existing public/images (your custom dev images)...')
            const backupDir = resolve(appRoot, 'public/images_dev_backup')
            // Backup the current images (which may be dev images)
            cpSync(targetDir, backupDir, { recursive: true, force: true })
            console.log('✓ Backup created at public/images_dev_backup')
            // Remove the old target directory so we can do a clean copy
            rmSync(targetDir, { recursive: true, force: true })
          }

          // Copy production images (clean copy after removal)
          cpSync(sourceDir, targetDir, { recursive: true })
          console.log('✅ Production images copied to public/images for deployment')
        } catch (error) {
          console.error('❌ Error copying production images:', error.message)
          throw error // Fail the build if we can't copy production images
        }
      } else {
        // Development mode: only copy if images doesn't exist
        if (!existsSync(targetDir)) {
          console.log('ℹ️  public/images not found, copying from images_production...')
          try {
            cpSync(sourceDir, targetDir, { recursive: true })
            console.log('✓ Copied production images to public/images for development')
          } catch (error) {
            console.warn('⚠️  Could not copy production images:', error.message)
            console.warn('    Development will use existing images or fail if none exist')
          }
        } else {
          console.log('ℹ️  Development mode - using existing public/images')
        }
      }
    }
  }
}

// Vite plugin to generate version constants from package.json
function generateVersionConstants () {
  return {
    name: 'generate-version-constants',
    configResolved () {
      try {
        // Get the directory where vite.config.js is located (app root)
        const appRoot = __dirname
        const packagePath = resolve(appRoot, 'package.json')

        // Read and parse package.json
        const packageContent = readFileSync(packagePath, 'utf8')
        const packageJson = JSON.parse(packageContent)

        // Extract version with fallback
        const version = packageJson.version || '1.0.0'
        const buildTime = new Date().toISOString()

        // Generate version constants content
        const versionConstantsContent = `// This file is auto-generated during build - do not edit manually
export const APP_VERSION = '${version}';
export const BUILD_TIME = '${buildTime}';
`

        // Ensure src/utils directory exists
        const utilsDir = resolve(appRoot, 'src/utils')
        mkdirSync(utilsDir, { recursive: true })

        // Write version constants file
        const constantsPath = resolve(utilsDir, 'version-constants.js')
        writeFileSync(constantsPath, versionConstantsContent)

        console.log(`✓ Generated version constants: ${version} (${packageJson.name})`)
      } catch (error) {
        console.warn('⚠️ Could not generate version constants:', error.message)

        // Create fallback file to prevent import errors
        try {
          const appRoot = __dirname
          const utilsDir = resolve(appRoot, 'src/utils')
          mkdirSync(utilsDir, { recursive: true })

          const fallbackContent = `// Fallback version constants - package.json could not be read
export const APP_VERSION = '1.0.0';
export const BUILD_TIME = '${new Date().toISOString()}';
`
          const constantsPath = resolve(utilsDir, 'version-constants.js')
          writeFileSync(constantsPath, fallbackContent)

          console.log('✓ Generated fallback version constants')
        } catch (fallbackError) {
          console.error('❌ Failed to create fallback version constants:', fallbackError.message)
        }
      }
    }
  }
}

module.exports = defineConfig({
  root: __dirname,
  base: process.env.DEPLOY_ENV === 'GH_PAGES' ? '/duo-chrome/' : '',
  server: {
    port: 5173,
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
    outDir: '../../dist/apps/duo-chrome',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  plugins: [
    copyProductionImages(),
    generateVersionConstants(),
    imageListPlugin({
      scanDir: 'public/images',
      outputFile: 'src/generated/images.js',
      extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      exportName: 'imgs'
    })
  ]
})
