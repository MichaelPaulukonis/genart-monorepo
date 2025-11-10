# Debugging Transparent Line Artifacts in Image Processing

This document outlines a subtle bug encountered in the `monochromifier` application, the research conducted to understand it, and the solution implemented to resolve it.

## The Problem

A bug was observed where both the on-screen and exported images would occasionally have small, empty (fully transparent) horizontal lines at regular intervals. This issue was not consistently reproducible but seemed related to pixel calculations during image scaling and cropping operations. In some cases, almost every other line was transparent.

## Research and Common Causes

Research into this type of graphical artifact pointed to several common causes, primarily related to floating-point inaccuracies in graphics programming:

-   **Non-Integer Scaling**: Scaling images or canvases by non-integer factors can cause some graphics libraries to interpolate improperly, leading to skipped rows of pixels.
-   **Subpixel Rendering**: Drawing with non-integer coordinates (e.g., at `10.5px`) can cause inconsistent rendering and gaps.
-   **Mismatched Source/Destination Sizes**: Resampling an image with inconsistent rounding can create line artifacts.
-   **Off-by-One Errors**: Loops or copy operations might miss the first or last row if boundary conditions are incorrect.

### Best Practices to Avoid These Bugs

-   **Always Use Integer Pixel Sizes**: Ensure all canvas, viewport, and buffer dimensions are integers.
-   **Explicit Rounding**: Always round calculated positions to integer values before drawing, copying, or exporting.
-   **Use High-Quality Resampling**: Use functions that support proper anti-aliasing.
-   **Review Coordinate Conversion Code**: Ensure all floating-point calculations are converted to integers before being used for pixel operations.

## The Solution

The investigation, guided by the `codebase_investigator` tool, identified two key areas in `apps/monochromifier/src/monochromifier.js` where floating-point numbers were being used for pixel calculations. The solution involved enforcing integer math in these critical sections.

### 1. Image Scaling in `buildCombinedLayer`

**Problem:** The `scaledWidth` and `scaledHeight` were calculated using `Math.round()`. This could lead to subtle rounding errors and aspect ratio distortions, causing rendering artifacts.

**Fix:** The calculation was changed to use `Math.floor()` to ensure a more conservative and stable scaling of the image.

```javascript
// Before
const scaledWidth = Math.round(img.width * scaleRatio)
const scaledHeight = Math.round(img.height * scaleRatio)

// After
const scaledWidth = Math.floor(img.width * scaleRatio)
const scaledHeight = Math.floor(img.height * scaleRatio)
```

### 2. Image Cropping in `performCrop`

**Problem:** The `x`, `y`, `w`, and `h` parameters for the `img.get()` function were calculated by dividing integer mouse coordinates by a floating-point `paintScale`, resulting in floating-point arguments.

**Fix:** The calculations for `x`, `y`, `w`, and `h` were wrapped in `Math.round()` to ensure that only integer values are passed to `img.get()`.

```javascript
// Before
const x = Math.min(cropStart.x, cropEnd.x) / paintScale
const y = Math.min(cropStart.y, cropEnd.y) / paintScale
const w = Math.abs(cropEnd.x - cropStart.x) / paintScale
const h = Math.abs(cropEnd.y - cropStart.y) / paintScale

// After
const x = Math.round(Math.min(cropStart.x, cropEnd.x) / paintScale)
const y = Math.round(Math.min(cropStart.y, cropEnd.y) / paintScale)
const w = Math.round(Math.abs(cropEnd.x - cropStart.x) / paintScale)
const h = Math.round(Math.abs(cropEnd.y - cropStart.y) / paintScale)
```

By enforcing integer math in these two areas, the application now operates on a stable pixel grid, which should eliminate the source of the transparent line artifacts.


## some research

### Common Causes

- **Non-Integer Scaling**: When images or canvases are scaled by non-integer factors, some graphics libraries may not interpolate properly, causing skipped rows of pixels leading to gaps or transparent lines.
- **Subpixel Rendering**: Drawing with non-integer coordinates (e.g., lines or shapes positioned at 10.5px, 20.5px) can cause certain graphics APIs to interpret coverage inconsistently, occasionally skipping some rows entirely.
- **Mismatched Source/Destination Sizes**: Resampling an image from one size to another, especially when destination heights or widths are not integers or not matching the source, can create line artifacts if rounding is inconsistent.
- **Off-by-One Errors**: Sometimes, loops or copy operations miss the final (or initial) row if the boundary conditions are off by one.

### Best Practices to Avoid These Bugs

- **Always Use Integer Pixel Sizes for Canvases/Images**: Ensure all canvas, viewport, and buffer dimensions are integer values. Never create or transform images with fractional pixel sizes.
- **Explicit Rounding**: When calculating positions, always round (floor, ceil, or round, depending on intent) to integer values before drawing, copying, or exporting.
- **Use High-Quality Resampling**: When rescaling, use functions or libraries that support proper anti-aliasing and resampling, and verify they aren’t truncating or skipping scanlines.
- **Test with a Variety of Dimensions**: Systematically test resizing and exporting with both typical and edge-case dimensions (especially odd, even, and prime numbers) to flush out subtle rounding bugs.
- **Review Coordinate Conversion Code**: Check for places where coordinates, sizes, or loop indices are calculated with floating point math and ensure all are converted to integers before being used for pixel operations.
- **Care with Graphics Libraries**: Some APIs (notably HTML canvas, some OpenGL/WebGL settings, and certain image libraries) require explicit integer coordinates/dimensions to render correctly without gaps.

### Debugging and Diagnosis Tips

- **Visualize Pixel Grids**: Overlay a grid or visual debug layer to identify exactly where gaps appear.
- **Force Integer Math Temporarily**: Clamp all calculations involved in drawing size, positions, and buffer sizes to integers and observe if the problem vanishes.
- **Check for DPI/Scaling Issues**: If using high-DPI (Retina) displays or devicePixelRatio scaling, ensure all multiplications result in integers before image processing or export.

For most graphics workflows, maintaining integer math wherever possible is the single most reliable way to prevent these artifacts. If using higher-level frameworks, consult their documentation for best practices around coordinates and pixel alignment, as each can have its own quirks for fractional pixel handling.


https://observablehq.com/@tmcw/why-does-the-html-canvas-have-hairline-gaps, https://stackoverflow.com/questions/36901599/canvas-leaves-gaps-between-drawn-images, https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes

