# Save-Selection Feature PRD

## 1. Problem Statement & Vision
- **Problem**: The current "save canvas" workflow exports the full browser-sized canvas, producing inconsistent aspect ratios and dimensions across sessions. Artists must manually crop or resize every output before sharing on social channels or compiling animation frames, which slows documentation and publishing.
- **Impacted Users**: Experimenting artists and workshop participants using Dragline—currently centered on the maintainer’s own creative practice—who need predictable, repeatable exports of generative text compositions.
- **Vision**: Introduce a grid-snapped selection overlay that can be invoked with a keyboard shortcut modifier. The overlay defaults to a 1:1 aspect ratio, is draggable anywhere on the canvas, resizable via handles, and visually distinguishes the active crop from the rest of the canvas. Saving within this mode exports only the selected area at high resolution, ready for social media or frame sequencing.

## 2. Target Users & Use Cases
- **Primary Users**: Dragline artists and workshop participants exploring textual block compositions.
- **Primary Goal**: Quickly export social/blog-ready snapshots of interleaved text arrangements without leaving Dragline.
- **Key User Journeys**:
  - **Fresh capture**: Artist finds a pleasing arrangement → invokes save-selection → drags/resizes the default 1:1 box to include/exclude content → triggers the standard save shortcut → overlay disappears and the cropped asset is saved.
  - **Repeat capture**: After minor canvas tweaks, artist reopens save-selection → last-used selection box reappears in the same position and size → artist optionally adjusts → saves via shortcut → overlay closes, preserving the updated crop.

## 3. Core Features & Requirements
- **Must-Have Features (MVP)**:
  - Keyboard shortcut (modifier + existing save key) to enter selection mode.
  - Draggable selection overlay that can be moved by clicking anywhere on the canvas.
  - Resize handles supporting corner and edge adjustments while maintaining the active ratio.
  - Visual styling that deemphasizes everything outside the selection region.
  - Selection bounds snapped to the existing text grid.
  - Persist last-used selection bounds within the current session for quick re-use.
- **Nice-to-Have / Day Two Enhancements**:
  - Grid alignment feedback (e.g., guides or snapping indicators).
  - Additional aspect ratios (1:1, 4:5, etc.) with a lightweight UI for switching.
  - Remembering and recalling multiple named selections.
- **Constraints & Dependencies**:
  - Existing save pipeline may require refactoring to support cropped exports.
  - Maintain performance parity with current save operation.

## 4. Success Metrics & Goals
- **Validation Approach**: Manual playtest by the maintainer—feature considered successful once it supports the documented user journeys without regressions.
- **KPIs**: None formal; rely on qualitative confirmation that no external cropping is needed.
- **Timeline**: MVP targeted for immediate delivery (today/tomorrow) with follow-up enhancements scheduled subsequently.

## 5. Technical Considerations
- **Platform Support**: Desktop Chrome and Firefox.
- **Integrations**: No new services; reuse and extend the existing save/export path.
- **Scalability & Performance**: Baseline implementation assumes a single active selection per session. Future work may address multi-selection persistence and rapid frame capture for animations.

## 6. Future Opportunities & Risks
- **Future Opportunities**: Extend the selection tool for animation workflows (batch frame exports), add ratio presets UI, and explore multiple saved selection states.
- **Risks / Mitigations**:
  - *Risk*: Refactoring the save pipeline could introduce regressions. *Mitigation*: Keep legacy full-canvas save path accessible via original shortcut and add targeted regression tests once implemented.
  - *Risk*: Selection UI may hamper canvas performance on large compositions. *Mitigation*: Profile interactions during manual testing; optimize redraws if needed.
