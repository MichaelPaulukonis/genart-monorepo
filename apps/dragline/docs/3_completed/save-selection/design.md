# Save-Selection Design Notes

## Architecture Outline
- **State store**: Track selection mode flag, rectangle bounds (x, y, width, height), aspect ratio, and last-saved timestamp. Lives alongside existing global sketch state in `dragline.js`.
- **Input handling**: Reuse current pointer listeners, gating selection-specific behavior behind the mode flag. Introduce keyboard listeners for escape (cancel), enter (confirm), and arrow-key nudging (optional).
- **Rendering layer**: Draw overlay each frame after blocks/text rendering to ensure handles and mask appear on top. Consider a dedicated helper (e.g., `renderSelectionOverlay(p, selectionState)`).
- **Export pipeline**: Refactor existing save routine so it accepts optional crop bounds. Shared utility performs off-screen render using p5’s `createGraphics` or direct pixel extraction before saving.

## Interaction Flow
1. Shortcut detected → toggle selection mode and initialize default/previous bounds.
2. Mouse down inside bounds → begin drag; outside bounds but on handles → resize; otherwise ignore.
3. Mouse move updates draft bounds, snapping to grid increments.
4. Mouse up commits new bounds.
5. Save shortcut while in mode → call export with current bounds → exit mode and clear overlay.

## Visual Treatments
```
+--------------------------------------------+
|                                            |
|    ###############----------############   |
|    #             #  mask   #          #   |
|    #  selection  #          ----------    |
|    #    area     #                        |
|    #             #                        |
|    ###############                        |
|                                            |
+--------------------------------------------+
```
- Dimmed mask uses semi-transparent black (e.g., rgba(0,0,0,0.35)).
- Handles rendered as 8x8 squares; highlight on hover to indicate active drag target.
- Optional on-screen tooltip showing pixel/grid dimensions near the bottom-right corner.

## Component Interactions
- `dragline.js`: orchestrates mode toggling and delegates to overlay renderer.
- `grid.js`: expose helper to convert pixel coordinates to grid cells for snapping.
- `blocks.js`: unaffected, but ensure selection mode doesn’t interfere with block movement inputs.
- Future ratio UI (HTML overlay) would communicate via a small controller module that updates `selectionState.aspectRatio`.

## Risks & Mitigations
- **Performance**: Overlay redraw may introduce minor overhead; mitigate by caching mask layer or drawing only when selection state changes.
- **Input conflicts**: Drag gestures currently used for block manipulation—ensure selection mode captures events first and disables block drags while active.
- **Export fidelity**: Cropping via pixel manipulation must maintain text crispness; verify using off-screen buffer at device pixel ratio.

## Future Extensions
- Persist selection configuration to `localStorage` for cross-session reuse.
- Add timeline capture mode that iterates frames and saves sequential filenames using current bounds.
- Support keyboard-only adjustments for accessibility.
