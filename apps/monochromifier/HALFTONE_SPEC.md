# Halftone Effect Specification

This document outlines the technical design for the Halftone WebGL implementation in the Monochromifier app.

## 1. Algorithms

### A. Circular Dots (Pattern Type 0)
- **Tiling:** Screen space is divided into a grid of cells using `uDotSize`.
- **Sampling:** Luminance is sampled at the center of each cell.
- **Rendering:** A circle is drawn in each cell where the radius $R = luminance \times 0.5$.
- **Anti-aliasing:** Uses `smoothstep(R, R - epsilon, dist)` to prevent jagged edges.

### B. Line Screens (Pattern Type 1)
- **Rotation:** UV coordinates are transformed via a 2D rotation matrix based on `uAngle`.
- **Waveform:** A 1D periodic sine wave is generated along the rotated X-axis.
- **Threshold:** The sine wave is compared against the local luminance to determine line thickness.

### C. Ordered Dithering (Pattern Type 2)
- **Matrix:** An 8x8 Bayer Matrix is hardcoded in the shader.
- **Mapping:** Current pixel coordinates are mapped to matrix indices using `mod(gl_FragCoord, 8.0)`.
- **Comparison:** Pixel luminance is compared against the matrix value to decide the binary output.

## 2. Shader Interface (Uniforms)

| Name | Type | Description |
| :--- | :--- | :--- |
| `uTexImage` | `sampler2D` | Source image texture. |
| `uTexSize` | `vec2` | Image dimensions in pixels. |
| `uPatternType` | `int` | 0: Dots, 1: Lines, 2: Dither. |
| `uDotSize` | `float` | Size of the grid cells or line spacing. |
| `uAngle` | `float` | Rotation angle in radians. |
| `uInvert` | `bool` | Toggles black/white output. |
| `uTransparencyMode` | `bool` | Enable/disable alpha-aware rendering. |
| `uTransparencyThreshold` | `float` | Alpha cutoff value. |

## 3. Implementation Plan
1. **Shaders:** Create `halftone.frag` and reuse `monochrome.vert`.
2. **Integration:** Update `WebGLProcessor` to handle the new shader and uniforms.
3. **UI:** Add a "Halftone" panel to the UI with sliders for Size and Angle, and a dropdown for Pattern Type.
4. **Optimization:** Implement early exits for pixels with 0 alpha.
