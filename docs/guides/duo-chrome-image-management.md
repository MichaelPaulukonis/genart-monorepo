# Duo-Chrome Image Management

## Overview

The duo-chrome app uses a swap script workflow to manage different image sets for local development vs. committed/deployed versions.

## Folder Structure

- `public/images/` - Active images used by the app
- `public/images_local/` - Your custom working images (not committed)
- `public/images_original/` - Official images that match what's in git

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

## Initial Setup

If you're setting up a fresh clone:

1. The repo contains official images in `public/images/`
2. If you want to use custom images:
   - Run `npm run images:commit` first (this moves official images to `images_original/`)
   - Add your custom images to a new `public/images_local/` folder
   - Run `npm run images:work` to activate your custom images

## Safety Notes

- The script prevents accidental overwrites by checking for existing folders
- Always check which mode you're in before committing
- Run `npm run images:commit` to verify folder state
- The `images.bak/` folder is separate and not affected by these scripts

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
