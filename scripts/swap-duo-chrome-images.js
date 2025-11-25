#!/usr/bin/env node

/**
 * Swap Duo-Chrome Image Folders
 *
 * This script manages the image folder swapping for duo-chrome app:
 * - "work" mode: Swap to custom working images
 * - "commit" mode: Swap to official images for committing/deployment
 *
 * Usage:
 *   node scripts/swap-duo-chrome-images.js work
 *   node scripts/swap-duo-chrome-images.js commit
 */

const fs = require('fs')
const path = require('path')

const PUBLIC_DIR = path.join(__dirname, '..', 'apps', 'duo-chrome', 'public')
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images')
const IMAGES_LOCAL_DIR = path.join(PUBLIC_DIR, 'images_local')
const IMAGES_ORIGINAL_DIR = path.join(PUBLIC_DIR, 'images_original')

const mode = process.argv[2]

if (!mode || !['work', 'commit'].includes(mode)) {
  console.error('❌ Error: Invalid mode. Use "work" or "commit"')
  console.log('\nUsage:')
  console.log('  npm run images:work   - Switch to custom working images')
  console.log('  npm run images:commit - Switch to official images for commit')
  process.exit(1)
}

/**
 * Check if a directory exists
 */
function dirExists (dir) {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}

/**
 * Rename a directory safely
 */
function renameDir (from, to) {
  if (!dirExists(from)) {
    console.warn(`⚠️  Warning: ${path.basename(from)} does not exist, skipping`)
    return false
  }

  if (dirExists(to)) {
    console.error(`❌ Error: ${path.basename(to)} already exists!`)
    console.log('   Cannot proceed with swap. Please resolve manually.')
    process.exit(1)
  }

  fs.renameSync(from, to)
  console.log(`✓ Renamed ${path.basename(from)} → ${path.basename(to)}`)
  return true
}

console.log(`\n🔄 Swapping duo-chrome images to "${mode}" mode...\n`)

if (mode === 'work') {
  // Work mode: images → images_original, images_local → images
  console.log('Switching to custom working images:\n')

  const step1 = renameDir(IMAGES_DIR, IMAGES_ORIGINAL_DIR)
  const step2 = renameDir(IMAGES_LOCAL_DIR, IMAGES_DIR)

  if (step1 && step2) {
    console.log('\n✅ Successfully switched to working images!')
    console.log('   You can now work with your custom images in public/images/')
  } else if (!step1 && !step2) {
    console.log('\n⚠️  Already in work mode (or folders are in unexpected state)')
  }
} else if (mode === 'commit') {
  // Commit mode: images → images_local, images_original → images
  console.log('Switching to official images for commit:\n')

  const step1 = renameDir(IMAGES_DIR, IMAGES_LOCAL_DIR)
  const step2 = renameDir(IMAGES_ORIGINAL_DIR, IMAGES_DIR)

  if (step1 && step2) {
    console.log('\n✅ Successfully switched to official images!')
    console.log('   Ready to commit. The public/images/ folder now contains official images.')
    console.log('   Remember to run "npm run images:work" after committing!')
  } else if (!step1 && !step2) {
    console.log('\n⚠️  Already in commit mode (or folders are in unexpected state)')
  }
}

console.log('\nCurrent folder state:')
console.log(`  images/          ${dirExists(IMAGES_DIR) ? '✓ exists' : '✗ missing'}`)
console.log(`  images_local/    ${dirExists(IMAGES_LOCAL_DIR) ? '✓ exists' : '✗ missing'}`)
console.log(`  images_original/ ${dirExists(IMAGES_ORIGINAL_DIR) ? '✓ exists' : '✗ missing'}`)
console.log()
