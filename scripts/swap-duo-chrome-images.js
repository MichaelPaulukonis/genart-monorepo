#!/usr/bin/env node

/**
 * Manage Duo-Chrome Image Folders
 * 
 * Refactored to use commander.js for safer and more flexible image set management.
 */

const { program } = require('commander');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = process.env.DUO_CHROME_PUBLIC_DIR || path.join(__dirname, '..', 'apps', 'duo-chrome', 'public');
const DEFAULT_TARGET = 'images';

program
  .name('swap-duo-chrome-images')
  .description('Manage image folder swapping for duo-chrome app')
  .version('2.0.0')
  .argument('[mode]', 'Legacy mode: "work" (images -> images_original, images_local -> images) or "commit" (images -> images_local, images_original -> images)')
  .option('-s, --source <path>', 'Source directory name relative to public/')
  .option('-t, --target <path>', 'Target directory name relative to public/', DEFAULT_TARGET)
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-f, --force', 'Force overwrite of target directory')
  .action((mode, options) => {
    const { source, target, dryRun, force } = options;

    if (dryRun) {
      console.log('🧪 Dry run: No changes will be made.');
    }

    if (mode) {
      if (dryRun) {
        console.log(`🧪 Dry run: mode: ${mode}`);
      } else {
        console.log(`Processing legacy mode: ${mode}`);
      }
      handleLegacyMode(mode, dryRun);
      return;
    }

    if (source) {
      handleExplicitCopy(source, target, dryRun, force);
      return;
    }

    program.help();
  });

/**
 * Check if a directory exists
 */
function dirExists(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Rename a directory safely
 */
function renameDir(from, to, dryRun) {
  const fromPath = path.join(PUBLIC_DIR, from);
  const toPath = path.join(PUBLIC_DIR, to);

  if (!dirExists(fromPath)) {
    console.warn(`⚠️  Warning: ${from} does not exist, skipping`);
    return false;
  }

  if (dirExists(toPath)) {
    if (dryRun) {
      console.log(`[Dry run] Notice: ${to} already exists. A real run would fail here unless it's a swap.`);
    } else {
      console.error(`❌ Error: ${to} already exists!`);
      console.log('   Cannot proceed with swap. Please resolve manually.');
      process.exit(1);
    }
  }

  if (dryRun) {
    console.log(`[Dry run] Would rename ${from} → ${to}`);
  } else {
    fs.renameSync(fromPath, toPath);
    console.log(`✓ Renamed ${from} → ${to}`);
  }
  return true;
}

function handleLegacyMode(mode, dryRun) {
  if (mode === 'work') {
    // Work mode: images → images_original, images_local → images
    renameDir('images', 'images_original', dryRun);
    renameDir('images_local', 'images', dryRun);
  } else if (mode === 'commit') {
    // Commit mode: images → images_local, images_original → images
    renameDir('images', 'images_local', dryRun);
    renameDir('images_original', 'images', dryRun);
  } else {
    console.error(`❌ Error: Invalid mode "${mode}". Use "work" or "commit"`);
    process.exit(1);
  }
}

function handleExplicitCopy(source, target, dryRun, force) {
  const sourcePath = path.join(PUBLIC_DIR, source);
  const targetPath = path.join(PUBLIC_DIR, target);

  if (!dirExists(sourcePath)) {
    console.error(`❌ Error: Source directory "${source}" does not exist in ${PUBLIC_DIR}`);
    process.exit(1);
  }

  if (dirExists(targetPath) && !force && !dryRun) {
    // Backup existing target
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${target}_${timestamp}`;
    const backupPath = path.join(PUBLIC_DIR, backupName);
    
    console.log(`ℹ️  Target directory "${target}" exists.`);
    console.log(`📦 Creating backup at "${backupName}"...`);
    
    try {
      fs.renameSync(targetPath, backupPath);
      console.log(`✓ Backup created: ${backupName}`);
    } catch (err) {
      console.error(`❌ Error creating backup: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`Copying "${source}" to "${target}"...`);
  
  if (dryRun) {
    console.log(`[Dry run] Would copy ${sourcePath} to ${targetPath}`);
    if (dirExists(targetPath)) {
      console.log(`[Dry run] Target "${target}" exists and would be backed up`);
    }
  } else {
    try {
      if (dirExists(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      // fs.cpSync requires Node.js v16.7.0+
      fs.cpSync(sourcePath, targetPath, { recursive: true });
      console.log(`✅ Successfully copied ${source} → ${target}`);
    } catch (err) {
      console.error(`❌ Error during copy: ${err.message}`);
      process.exit(1);
    }
  }
}

program.parse();