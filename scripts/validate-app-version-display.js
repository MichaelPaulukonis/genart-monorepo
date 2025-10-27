#!/usr/bin/env node

/**
 * App-specific Version Display Validator
 * 
 * Validates that an application properly uses the shared version display library
 * and doesn't have conflicting duplicate styles.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const appName = process.argv[2]

if (!appName) {
  console.error('❌ Usage: node validate-app-version-display.js <app-name>')
  process.exit(1)
}

const appPath = join(process.cwd(), 'apps', appName)

if (!existsSync(appPath)) {
  console.error(`❌ App not found: ${appName}`)
  process.exit(1)
}

/**
 * Recursively find files with extension
 */
function findFiles(dir, extension) {
  const files = []
  
  function walk(currentDir) {
    try {
      const items = readdirSync(currentDir)
      for (const item of items) {
        const fullPath = join(currentDir, item)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          walk(fullPath)
        } else if (item.endsWith(extension)) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  walk(dir)
  return files
}

/**
 * Check if app imports the shared library
 */
function checkSharedLibraryImport() {
  console.log('📦 Checking shared library import...')
  
  try {
    const srcDir = join(appPath, 'src')
    if (!existsSync(srcDir)) {
      console.log('   ⚠️  No src directory found')
      return false
    }
    
    const jsFiles = findFiles(srcDir, '.js')
    let hasImport = false
    
    for (const file of jsFiles) {
      const content = readFileSync(file, 'utf8')
      if (content.includes('libs/version-display/version-display.css')) {
        hasImport = true
        console.log(`   ✅ Found import in: ${file.replace(process.cwd() + '/', '')}`)
        break
      }
    }
    
    if (!hasImport) {
      console.log('   ❌ Shared library import not found')
      return false
    }
    
    return true
  } catch (error) {
    console.log(`   ❌ Error checking imports: ${error.message}`)
    return false
  }
}

/**
 * Check for duplicate version display CSS
 */
function checkForDuplicateCSS() {
  console.log('🔍 Checking for duplicate CSS...')
  
  try {
    const cssDir = join(appPath, 'css')
    if (!existsSync(cssDir)) {
      console.log('   ✅ No CSS directory found (no duplicates possible)')
      return true
    }
    
    const cssFiles = findFiles(cssDir, '.css')
    let hasDuplicates = false
    
    for (const file of cssFiles) {
      const content = readFileSync(file, 'utf8')
      
      // Check for potentially problematic patterns
      const duplicatePatterns = [
        /\.version-info\s*{[^}]*font-family\s*:/,
        /\.version-info\s*{[^}]*font-size\s*:/,
        /\.version-display\s*{[^}]*font-family\s*:/,
        /\.version-display\s*{[^}]*font-size\s*:/
      ]
      
      for (const pattern of duplicatePatterns) {
        if (pattern.test(content)) {
          console.log(`   ⚠️  Potential duplicate CSS in: ${file.replace(process.cwd() + '/', '')}`)
          console.log('      Consider using CSS custom properties instead')
          hasDuplicates = true
          break
        }
      }
    }
    
    if (!hasDuplicates) {
      console.log('   ✅ No duplicate CSS detected')
    }
    
    return !hasDuplicates
  } catch (error) {
    console.log(`   ❌ Error checking CSS: ${error.message}`)
    return false
  }
}

/**
 * Check HTML structure
 */
function checkHTMLStructure() {
  console.log('🏗️  Checking HTML structure...')
  
  try {
    const htmlFile = join(appPath, 'index.html')
    if (!existsSync(htmlFile)) {
      console.log('   ⚠️  No index.html found')
      return true
    }
    
    const content = readFileSync(htmlFile, 'utf8')
    
    // Check for proper class usage
    const hasVersionInfo = /class="[^"]*version-info[^"]*"/.test(content)
    const hasVersionDisplay = /class="[^"]*version-display[^"]*"/.test(content)
    
    if (hasVersionInfo || hasVersionDisplay) {
      console.log('   ✅ Proper version display classes found')
      return true
    } else {
      console.log('   ⚠️  No version display classes found in HTML')
      return true // Not necessarily an error
    }
  } catch (error) {
    console.log(`   ❌ Error checking HTML: ${error.message}`)
    return false
  }
}

/**
 * Main validation function
 */
function validateApp() {
  console.log(`🔍 Validating Version Display for: ${appName}\n`)
  
  const checks = [
    checkSharedLibraryImport(),
    checkForDuplicateCSS(),
    checkHTMLStructure()
  ]
  
  const passed = checks.filter(Boolean).length
  const total = checks.length
  
  console.log('\n' + '='.repeat(50))
  
  if (passed === total) {
    console.log(`✅ VALIDATION PASSED (${passed}/${total})`)
    console.log(`   ${appName} properly uses the version display library`)
  } else {
    console.log(`⚠️  VALIDATION WARNINGS (${passed}/${total})`)
    console.log(`   ${appName} has some issues that should be addressed`)
  }
}

// Run validation
validateApp()