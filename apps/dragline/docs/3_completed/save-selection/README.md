# Save-Selection

## Goal
Enable Dragline artists to export consistent, social-ready crops of their generative text compositions by letting them define and reuse a grid-aligned selection area when saving.

## Key Requirements
- Modifier + save shortcut enters a dedicated selection mode.
- Selection overlay can be dragged from anywhere on the canvas and resized from corners or edges.
- Selection region snaps to the existing text grid and visually differentiates in- vs. out-of-bounds content.
- Last-used selection bounds persist for the current session so repeat captures are fast.
- Cropped export honors current high-resolution output without regressing full-canvas saves.

## Target Audience
- Dragline artists and workshop participants (currently the maintainer’s own creative workflow) who publish compositions to Instagram, blogs, or animation pipelines.

## Open Questions
- How should the non-selected canvas area be styled (dim, blur, grayscale)?
- Should ratio presets (1:1, 4:5, etc.) ship with the MVP or be introduced once the core workflow is stable?
- What persistence strategy, if any, is needed for remembering selections across sessions or projects?
