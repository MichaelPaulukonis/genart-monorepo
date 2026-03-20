# Monochromifier — Halftone Modes: User Guide

Halftone effects convert your image into a pattern of repeated shapes — dots, lines, or a dither grid — simulating the look of printed or screened artwork. For technical internals, see [Developer Reference](./dev-halftone.md).

## Opening the Halftone Controls

Press **`j`** to show or hide the Halftone Controls panel.

The panel is draggable — click and drag its title bar to reposition it on screen.

<!-- screenshot-placeholder: halftone-panel.png — halftone controls panel showing toggle, pattern dropdown, size and angle sliders -->

## Enabling Halftone

Check the **Enable Halftone** checkbox to activate the effect. Uncheck it to return to the standard monochrome rendering.

Your setting is saved automatically and restored the next time you open the app.

## Pattern Types

Use the **Pattern** dropdown to choose one of three halftone styles:

### Circular Dots

The classic halftone look. The image is divided into a grid; each cell is filled with a circle whose size reflects the brightness of that area — brighter areas get smaller dots, darker areas get larger dots.

<!-- screenshot-placeholder: halftone-dots.png — example image rendered with circular dots halftone -->

### Line Screen

Replaces the dot grid with alternating lines. Line thickness and spacing vary with image brightness. Useful for a woodcut or engraving feel.

<!-- screenshot-placeholder: halftone-lines.png — example image rendered with line screen halftone -->

### Bayer Dither

Uses a fixed 8×8 mathematical grid (a Bayer matrix) to convert the image to black and white with a regular, geometric dither pattern. Unlike the other modes, Size and Angle do not affect this pattern.

<!-- screenshot-placeholder: halftone-dither.png — example image rendered with Bayer dither -->

## Controls

### Size / Frequency

The **Size** slider (range 2–50) controls how large each repeating unit is:

- **Low values** (2–8): fine, high-frequency pattern — more detail preserved
- **High values** (20–50): coarse, large shapes — more graphic, abstract look

> Note: Size has no effect when Bayer Dither is selected.

### Angle

The **Angle** slider (range 0–180°) rotates the halftone grid:

- **0°**: vertical lines / top-aligned dot rows
- **45°**: classic diagonal newspaper-style halftone (default)
- **90°**: horizontal lines

Rotating the angle can reduce moiré patterns or create a specific visual style.

> Note: Angle has no effect when Bayer Dither is selected.

## Combining with Other Controls

Halftone works together with the rest of the app's controls:

- **Threshold** (main controls): adjusts the overall brightness cutoff, which directly affects halftone density — higher threshold = denser, darker pattern
- **Invert**: flips the halftone output (dots become holes, lines become gaps)
- **Background color**: sets the color of the non-dot / non-line areas
- **Transparency mode**: makes the background transparent instead of solid

## Saving Your Output

Press **`s`** to save the current canvas as a PNG. The halftone effect will be included in the saved file.

## Keyboard Reference

| Key | Action |
|---|---|
| `j` | Show / hide halftone controls panel |
| `h` | Show / hide all UI panels |
| `s` | Save canvas as PNG |

## Tips

- Start with **Circular Dots** at size **8** and angle **45°** for the most classic look.
- For a bold, graphic result, increase size to 20+ and lower the threshold.
- **Line Screen** at angle **0°** or **90°** pairs well with high-contrast source images.
- **Bayer Dither** gives a retro pixel-art feel — try it with the Invert option.
- The halftone effect re-renders in real time as you adjust sliders, so experiment freely.

## Related Documentation

- [Developer Reference: Halftone Modes](./dev-halftone.md)
