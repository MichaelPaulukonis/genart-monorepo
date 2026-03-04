# 0.5.0 (2026-01-29)

Version corrected from previous mismatch. This release includes:
- Interactive controls system with A/B image selection
- Individual size control and image navigation
- Comprehensive user interface improvements
- Performance optimizations and testing infrastructure

# 0.4.0 (2026-01-29)

Version corrected from previous mismatch. This release includes:
- Interactive controls system with A/B image selection
- Individual size control and image navigation
- Comprehensive user interface improvements
- Performance optimizations and testing infrastructure

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

- **loop-animation:** Enhance loop mode with desired start state and regeneration controls
  - Loop now uses current image pair as start/end point when enabling loop mode
  - Added "Refresh" button to regenerate loops while preserving start/end state constraints
  - Loop length changes trigger automatic regeneration with maintained start state
  - UI feedback shows "Generating loop..." message during walk generation (replaces toggle button text)
  - Loading spinner displays while generation is in progress
  - Loop controls disabled during generation to prevent conflicting operations
  - Palette colors wrap around seamlessly when loop length exceeds palette size
  - Ensures first and last frames maintain image A with consistent color for seamless looping
  - Color selection independent of A/B image selection

- **theme-management:** Implement image set filtering by visual theme
  - Theme-based assignment allows separate filters for A and B image sets
  - Filters images by metadata (color, style, subject) using predefined themes
  - Validates image set compatibility before generating loops
  - Fallback to full image set if theme filtering produces empty results
  - Integrates with existing duo-chrome image management system

- **loop-animation:** Add dual-mode PLAYBACK section always visible below loop controls
  - Transport (play/pause, stop, save, regenerate) and speed selector always accessible
  - In non-loop mode: play/pause controls sketch auto-cycling; save saves single frame; regenerate loads new random pair
  - In loop mode: full loop playback controls as before
  - Stop button disabled (not hidden) in non-loop mode
  - FPS selector (1, 2, 4, 8, 12, 24, 30) controls speed in both loop and non-loop modes

- **loop-animation:** Add SET AS FRAME 1 — cyclic walk rotation
  - Rotates the walk array so the current frame becomes frame 1, preserving the closed-loop property
  - Seeds the next walk generation to start near the same image pair
  - Replaces the non-functional in/out marker system

- **loop-animation:** Add FPS speed buttons 1, 2, and 4

### Fixes

- **loop-animation:** Fix space key conflict between loop playback and sketch auto-play
  - Space/P now exclusively controls loop when loop mode is enabled
  - Prevents two competing frame increments running simultaneously

- **loop-animation:** Fix enabling/disabling loop mode changing the displayed frame
  - Enabling loop no longer triggers onFrameChange before walk is generated
  - Disabling loop pauses silently without resetting to frame 0 via stop()

- **loop-animation:** Fix ESC key resetting loop to frame 0
  - ESC now only blurs the focused element; it never advances or resets the frame

- **loop-animation:** Fix FPS not honored in non-loop auto-play
  - Auto-advance interval now computed from loopAnimationController.fps instead of hardcoded 30

- **loop-animation:** Fix active FPS button missing left border on non-first buttons

- **filmstrip:** Fix FilmstripPanel initial visibility state mismatch

- **loop-animation:** Fix loop length input remaining enabled when loop mode is disabled

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