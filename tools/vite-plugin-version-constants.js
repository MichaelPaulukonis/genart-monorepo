/**
 * Vite plugin to generate version constants from package.json
 * This plugin reads the version from package.json and creates a version-constants.js file
 * that can be imported by the application at runtime.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

export function generateVersionConstants() {
  return {
    name: 'generate-version-constants',
    buildStart() {
      try {
        // Get the directory where vite.config.js is located (app root)
        const appRoot = process.cwd()
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
          const appRoot = process.cwd()
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