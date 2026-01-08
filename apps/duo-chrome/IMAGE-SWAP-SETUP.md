# Image Swap Setup Guide

## Quick Reference

```bash
# Switch to custom working images
npm run images:work

# Switch to official images (before committing)
npm run images:commit
```

**New Safety Features:**
The swap script now automatically creates timestamped backups (e.g., `images_2026-01-08...`) when switching. It will NEVER overwrite your `images` folder without backing it up first.

## Advanced Usage

You can now explicitly swap any folder:

```bash
# Load specific images
node ../../scripts/swap-duo-chrome-images.js --source my_special_images --target images
```

## Before Your Next Commit

1. Run `npm run images:commit` to load official images.
2. Commit your changes.
3. Run `npm run images:work` to restore your custom images.

## Checking Current State

Run the script help to see available options:

```bash
node ../../scripts/swap-duo-chrome-images.js --help
```

## Full Documentation

See [docs/guides/duo-chrome-image-management.md](../../docs/guides/duo-chrome-image-management.md) for complete documentation.
