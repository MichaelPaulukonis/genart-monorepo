# Duo-Chrome Image Management

## Overview

The duo-chrome app uses a swap script workflow to manage different image sets for local development vs. committed/deployed versions. The script has been enhanced with safety features including automatic timestamped backups and flexible directory management.

## Folder Structure

- `public/images/` - Active images used by the app
- `public/images_local/` - Your custom working images (not committed)
- `public/images_original/` - Official images that match what's in git
- `public/images_YYYY-MM-DDTHH-MM-SS/` - Automatic timestamped backups

## Workflow

### Working with Custom Images

When you want to work with your custom image set:

```bash
cd apps/duo-chrome
npm run images:work
```

This swaps the folders so:

- Your custom images are now in `public/images/` (active)
- Official images are saved in `public/images_original/`

### Preparing to Commit

Before committing changes or deploying:

```bash
cd apps/duo-chrome
npm run images:commit
```

This swaps the folders so:

- Official images are now in `public/images/` (ready to commit)
- Your custom images are saved in `public/images_local/`

**Important:** Remember to run `npm run images:work` after committing to switch back to your working images!

### Safety Features

The script now includes automatic backup creation:

- When swapping directories, if the target exists, it's automatically backed up with a timestamp
- Backup format: `images_YYYY-MM-DDTHH-MM-SS-sssZ` (e.g., `images_2026-01-25T15-30-45-123Z`)
- Backups are preserved and not overwritten by subsequent swaps
- This prevents data loss if you forget which mode you're in

## Initial Setup

If you're setting up a fresh clone:

1. The repo contains official images in `public/images/`
2. If you want to use custom images:
   - Run `npm run images:commit` first (this moves official images to `images_original/`)
   - Add your custom images to a new `public/images_local/` folder
   - Run `npm run images:work` to activate your custom images

## Advanced Usage

### Custom Directory Swapping

The script supports flexible directory management using commander.js:

```bash
# Copy a specific image set to the active images folder
node scripts/swap-duo-chrome-images.js --source images_experimental

# Specify both source and target
node scripts/swap-duo-chrome-images.js --source images_set_a --target images_set_b

# Dry run to preview changes without executing
node scripts/swap-duo-chrome-images.js --source images_test --dry-run

# Force overwrite without creating backup (use with caution!)
node scripts/swap-duo-chrome-images.js --source images_local --force
```

### Command-Line Options

- `--source, -s <path>`: Source directory name (relative to `public/`)
- `--target, -t <path>`: Target directory name (default: `images`)
- `--dry-run, -d`: Preview changes without making them
- `--force, -f`: Force overwrite without creating backup
- Legacy mode arguments: `work` or `commit` (maintains backward compatibility)

## Safety Notes

### Recovering from Timestamped Backups

If you need to restore from a backup:

```bash
# List available backups
ls -la apps/duo-chrome/public/ | grep images_

# Copy a backup to become the active images
node scripts/swap-duo-chrome-images.js --source images_2026-01-25T15-30-45-123Z
```

### Cleaning Up Old Backups

Timestamped backups accumulate over time. Clean them up periodically:

```bash
# Review backups
ls -lat apps/duo-chrome/public/images_*

# Remove old backups (adjust date pattern as needed)
rm -rf apps/duo-chrome/public/images_2025-*
```

- The script automatically creates timestamped backups before overwriting existing folders
- Backups are never automatically deleted—clean them up manually when no longer needed
- Use `--dry-run` to preview changes before executing
- Always check which mode you're in before committing
- The old `images.bak/` folder is separate and not affected by these scripts

## Troubleshooting

### "Already exists" Error

If you see an error about a folder already existing, check the current state:

```bash
ls -la apps/duo-chrome/public/
```

You should see either:

- **Work mode**: `images/` and `images_original/` exist
- **Commit mode**: `images/` and `images_local/` exist

If folders are in an unexpected state, manually rename them to match one of the modes above.

### Forgot to Switch Before Committing

If you accidentally committed with the wrong images:

1. Run `npm run images:commit` to get official images
2. Amend your commit: `git add apps/duo-chrome/public/images && git commit --amend --no-edit`
3. Run `npm run images:work` to switch back

## Alternative: Using Nx Commands

You can also run the scripts from the workspace root using nx:

```bash
# From workspace root
nx run duo-chrome:images:work
nx run duo-chrome:images:commit
```

However, the npm scripts are simpler and work from any directory.
