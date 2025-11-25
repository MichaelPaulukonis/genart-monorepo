# Image Swap Setup Guide

## Current State

You currently have:
- `public/images/` - Your custom working images (active)
- `public/images_original/` - Copy of official committed images

## Quick Reference

```bash
# Switch to custom working images
npm run images:work

# Switch to official images (before committing)
npm run images:commit
```

## Initial Setup (Already Done)

Your folders are already set up correctly! You're in "work mode" with:
- Custom images active in `public/images/`
- Official images backed up in `public/images_original/`

## Before Your Next Commit

1. Run `npm run images:commit` to swap to official images
2. Commit your changes
3. Run `npm run images:work` to swap back to your custom images

## Checking Current State

Run the script without swapping to see current folder status:

```bash
node ../../scripts/swap-duo-chrome-images.js
```

This will show which folders exist and help you determine which mode you're in.

## Full Documentation

See [docs/guides/duo-chrome-image-management.md](../../docs/guides/duo-chrome-image-management.md) for complete documentation.
