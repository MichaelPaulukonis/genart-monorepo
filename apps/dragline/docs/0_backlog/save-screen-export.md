# Save Screen Export Options

## Idea
Allow artists to capture their compositions directly from the canvas.

## Notes
- Support saving without the gradient background for stark monochrome outputs.
- Explore click-drag selection to export only a user-defined region.
- Keep filenames timestamped for easy cataloging.
- Investigate replacing `p.get()` with `p.image()` in export routines once animation/sequence exports are introduced; `get()` is convenient but significantly slower and could bottleneck batch saves.
- see notes @ https://observablehq.com/@osteele/p5-js-pixel-manipulation-timings
- Prototype alternate overlay treatments like a blurred background outside the selection:
	- Render the scene to an off-screen buffer, apply a blur to non-selection pixels, and composite the crisp selection rectangle back on top.
	- Watch performance—large blur kernels on high-resolution canvases will need caching or throttled redraws.
	- Ensure overlay affordances (handles, dimension label) remain readable once the blur is applied.
