# Save-Selection Spec

## Overview
Provide a grid-snapped selection workflow layered on top of Dragline’s canvas so artists can capture consistent crops without leaving the application.

## Functional Scope
- Invoke selection mode via modifier + existing save shortcut.
- Display a default 1:1 selection box centered on the current viewport.
- Allow dragging the selection by grabbing anywhere on the canvas.
- Enable resizing from corners or edges while preserving the active aspect ratio.
- Snap bounds to the underlying text grid cells.
- Persist the most recent bounds for the current session and reapply them when selection mode is re-opened.
- Export only the selection rectangle when the save shortcut is triggered within the mode, falling back to existing full-canvas save otherwise.

## Technical Scope
- Extend the current save pipeline to accept crop bounds and render the requested portion without degrading resolution.
- Maintain compatibility with existing full-canvas saves (legacy path should remain accessible).
- Track selection state in-memory; optionally expose hooks for future persistence.
- Optimize redraws so overlay rendering does not introduce noticeable frame drops.
- Ensure compatibility with desktop Chrome and Firefox.

## UI Treatment Options
1. **Canvas Overlay Controls**  
   - Semi-transparent mask outside the bounds with draggable corner/edge handles rendered in p5.  
   - *Pros*: Fully within the canvas; no DOM layering complexity.  
   - *Cons*: Requires careful hit-testing logic; visual styling limited to p5 primitives.

2. **Hybrid Canvas + HTML Handles**  
   - Canvas renders the selection rectangle while lightweight absolutely-positioned HTML elements handle drag/resize.  
   - *Pros*: Easier to style handles and tooltips; leverage browser cursor feedback.  
   - *Cons*: Must sync DOM positioning with canvas transforms; potential z-index edge cases.

3. **Command Palette Style Controls**  
   - Minimal canvas overlay paired with quick keyboard-driven adjustments (arrow keys to nudge, shift to resize).  
   - *Pros*: Accessible for power users; fewer on-screen elements.  
   - *Cons*: Higher learning curve; less discoverable for new users.

**Trade-offs & Use Cases**
- Overlay-only solutions (Option 1) feel most direct for drag-and-drop workflows but demand more custom rendering effort.
- Hybrid (Option 2) offers richer affordances and is friendlier to future ratio toggles but introduces coordination between canvas and DOM layers.
- Keyboard-centric (Option 3) is efficient for rapid iteration or animation frame batching yet may require onboarding cues to avoid confusion.

## Non-Goals
- Implementing multi-selection storage or named presets (reserved for a follow-up release).
- Introducing new Tumblr or external export integrations.
- Persisting selection state across browser sessions.
