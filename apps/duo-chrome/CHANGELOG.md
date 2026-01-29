# Unreleased

## Features

- **loop-animation:** Implement seamless loop animation mode with complete control suite
  - Added LoopAnimationController with closed-walk generation algorithm for creating seamless image loops
  - Implements graph-based adjacency validation to ensure proper image sequencing
  - Supports dynamic loop length configuration with validation and boundary constraints
  - Generates complex loop sequences where each image pair appears exactly once, creating smooth transitions
  - Async API with progress callbacks for responsive UI during walk generation
  - Comprehensive test suite for closed-walk algorithm with edge cases

- **loop-animation:** Add interactive loop animation UI panel with playback controls
  - Created LoopAnimationPanel with dedicated loop mode toggle switch
  - Loop length input with validation and max length display (calculated from image set size)
  - Real-time playback controls: Play, Pause, Stop with keyboard shortcuts (Space, Escape)
  - Frame counter display showing current position in loop sequence
  - FPS slider for adjusting animation speed (configurable frame rate)
  - Image pair preview panel showing current A/B pair filenames
  - Loading spinner with progress indication during walk generation
  - Contextual help text guiding users through each state
  - Full keyboard navigation integration with existing duo-chrome shortcuts

- **loop-animation:** Implement loop frame export functionality
  - "Save Loop" button exports all frames as individual PNG files with unique timestamps
  - Filename pattern: `loop-{timestamp}-frame-{NNN}.png` for proper sequencing
  - Frame counter updates during save to show progress
  - Save operation can be interrupted using Stop button
  - Proper canvas rendering ensures each exported frame contains correct image composition
  - Enables external GIF/video creation from saved frame sequences

- **loop-animation:** Implement color cycling for loop animations
  - Colors cycle through palette based on frame index (independent of image pairs)
  - Each frame displays two consecutive images with different palette colors
  - Palette colors wrap around seamlessly when loop length exceeds palette size
  - Ensures first and last frames maintain image A with consistent color for seamless looping
  - Color selection independent of A/B image selection

- **theme-management:** Implement image set filtering by visual theme
  - Theme-based assignment allows separate filters for A and B image sets
  - Filters images by metadata (color, style, subject) using predefined themes
  - Validates image set compatibility before generating loops
  - Fallback to full image set if theme filtering produces empty results
  - Integrates with existing duo-chrome image management system

### Fixes

- **loop-animation:** Fix loop mode image set initialization with fallback handling
  - Added secondary fallback checks for empty theme-filtered image sets
  - Ensures loop mode works correctly when theme filters produce no results
  - Full image set used as fallback when theme-based filtering returns empty

- **loop-animation:** Fix frame rendering during loop save operations
  - Images now properly load and display when saving loop frames
  - Canvas renders updated content before each frame capture
  - Resolved issue where all saved frames contained identical images

- **loop-animation:** Resolve loop panel event propagation and UI interaction issues
  - Panel-level event handlers properly isolate loop controls from canvas
  - Fixed button enable/disable logic during generation and playback states
  - Improved keyboard shortcut handling for play/pause/stop controls

### Developer Experience

- **images:** Restructure image management for dev/production separation
  - Created `public/images_production/` as tracked official image source
  - Made `public/images/` git-ignored for local development image swapping
  - Updated Vite config with plugin to auto-copy production images during build if needed
  - Developers can swap images locally without git status noise
  - Ensures only production images are deployed

# 0.3.0 (2025-10-27)

Version corrected from previous mismatch. This release includes:
- Interactive controls system with A/B image selection
- Individual size control and image navigation
- Comprehensive user interface improvements
- Performance optimizations and testing infrastructure

# 1.0.0 (2025-10-19)

This was a version bump only for duo-chrome to align it with other projects, there were no code changes.