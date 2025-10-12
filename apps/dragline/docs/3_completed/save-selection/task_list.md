# Save-Selection Implementation Tasks

- ✅ Establish in-memory selection state within `dragline.js`, including mode flag, bounds, aspect ratio, and last-used values.
- ✅ Wire modifier + save shortcut to toggle selection mode, initialize default/previous bounds, and exit cleanly on confirm or cancel keys.
- ✅ Implement pointer hit-testing that distinguishes dragging vs. corner/edge resizing, and snap updated bounds to grid cell increments.
- ✅ Build a dedicated overlay renderer (e.g., `renderSelectionOverlay`) that draws the dimmed mask, selection rectangle, and interactive handles without impacting frame rate.
- ✅ Gate existing block manipulation interactions while selection mode is active to prevent gesture conflicts.
- ✅ Extend `grid.js` (or adjacent utilities) with helpers to convert between pixel coordinates and grid-aligned bounds for snapping and display.
- ✅ Refactor the save pipeline to accept optional crop bounds, render the requested region at full resolution, and fall back to full-canvas exports when no bounds are supplied.
- ✅ Persist the last-used selection bounds for the current session so reopening the mode restores the previous crop.
- ✅ Add Jest unit tests covering the new grid snapping helpers and crop-bound calculations.
- ✅ Update user-facing documentation (`README`, shortcuts reference) to describe the selection workflow and any new commands.
- ✅ **NEW:** Implement ratio preset system with 9 common ratios (1:1, 4:5, 3:4, 2:3, 16:9, 21:9, 9:16, 5:4, and Freeform) with canvas overlay UI and grid-fitting logic that prefers expansion over shrinking.
