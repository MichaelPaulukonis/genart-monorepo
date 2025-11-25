# Unreleased

## Features

- **palettes:** Add 11 new color palettes from Coolors.co
  - Added Fiery Ocean, Peachy Delight, Pink Ombre, Vibrant Nature, Cool Coastal Vibes
  - Added Golden Twilight, Gold Elegance, Vibrant Sunset, Yellow Pink, Jelly Dream, Fresh Greens
  - Implemented `convertCoolorToArray()` utility function for parsing Coolors.co URLs
  - Exported `ALL_PALETTES` array for easy access to all available palettes

## Developer Experience

- **images:** Add image swap workflow for local development
  - Created `swap-duo-chrome-images.js` script for managing image folders
  - Added `npm run images:work` and `npm run images:commit` commands
  - Documented workflow in `IMAGE-SWAP-SETUP.md` and comprehensive guide
  - Updated `.gitignore` to support custom local image sets
  - Removed accidentally committed `images_original/` folder

# 0.3.0 (2025-10-27)

Version corrected from previous mismatch. This release includes:
- Interactive controls system with A/B image selection
- Individual size control and image navigation
- Comprehensive user interface improvements
- Performance optimizations and testing infrastructure

# 1.0.0 (2025-10-19)

This was a version bump only for duo-chrome to align it with other projects, there were no code changes.