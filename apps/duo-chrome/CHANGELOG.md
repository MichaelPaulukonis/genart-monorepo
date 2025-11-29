# Unreleased

## Features

- **history:** Add comprehensive history system with filmstrip navigation
  - Implemented HistoryManager for composition state tracking and restoration
  - Added ThumbnailGenerator with LRU caching for efficient thumbnail generation
  - Created FilmstripPanel with virtual scrolling for large history sets (100+ entries)
  - Added keyboard navigation: `[`/`]` (step), `Shift+[`/`]` (10 steps), `Cmd+[`/`]` (jump to beginning/end)
  - Implemented debounced capture for rapid parameter changes
  - Added thumbnail regeneration feature (`Shift+T`) to fix corrupted thumbnails
  - Included clear history dialog with confirmation (`Shift+C`)
  - Added localStorage persistence with automatic size management
  - Provided visual and audio feedback for navigation boundaries
  - Created comprehensive architecture documentation in `docs/reference/history-system.md`

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