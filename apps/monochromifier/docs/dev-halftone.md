# Monochromifier — Halftone Modes: Developer Reference

Technical reference for the halftone rendering system in the monochromifier app. See also: [User Guide](./user-halftone.md)

## Overview

Halftone effects are implemented as a WebGL fragment shader that replaces the standard monochrome shader when halftone is enabled. The pipeline selects between two shaders at render time based on `state.halftone.enabled`.

## File Locations

| File | Purpose |
|---|---|
| `apps/monochromifier/src/monochromifier.js` | App entry point; state definition, control init, render orchestration |
| `apps/monochromifier/src/webgl-processor.js` | `WebGLProcessor` class — shader loading, uniform binding, render dispatch |
| `apps/monochromifier/public/shaders/halftone.frag` | Halftone fragment shader (all three pattern types) |
| `apps/monochromifier/public/shaders/monochrome.frag` | Standard monochrome fragment shader |
| `apps/monochromifier/public/shaders/monochrome.vert` | Shared vertex shader (used by both pipelines) |
| `apps/monochromifier/index.html` | UI controls for halftone settings |

## State Shape

Defined in `monochromifier.js` alongside the rest of the app state:

```javascript
halftone: {
  enabled: false,      // boolean — toggles halftone vs monochrome shader
  patternType: 0,      // 0: Circular Dots | 1: Line Screen | 2: Bayer Dither
  dotSize: 8,          // float — grid cell size in pixels (range: 2–50)
  angle: 45            // float — pattern rotation in degrees (range: 0–180)
}
```

Settings are persisted to `localStorage` under the key `monochromifier_halftone_settings`.

## WebGLProcessor API

```javascript
class WebGLProcessor {
  constructor(p, width, height)
  async init(shaderConfigs)       // Loads shaders; call once in setup
  process(state, img)             // Binds shader, sets uniforms, renders; returns p5.Graphics
  updateSize(w, h)                // Resizes internal WebGL buffer
  getProcessedPixels()            // Returns pixel array from last render (for content-bounds detection)
}
```

### Shader Initialization

```javascript
await state.webglProcessor.init({
  monochrome: { vert: './shaders/monochrome.vert', frag: './shaders/monochrome.frag' },
  halftone:   { vert: './shaders/monochrome.vert', frag: './shaders/halftone.frag' }
})
```

### Shader Selection at Render Time

`process()` selects the active shader based on `state.halftone.enabled`:

```javascript
const shaderName = state.halftone?.enabled ? 'halftone' : 'monochrome'
```

## Halftone Fragment Shader Uniforms

| Uniform | Type | Description |
|---|---|---|
| `uTexImage` | `sampler2D` | Source image |
| `uPatternType` | `int` | Pattern selector: 0=Dots, 1=Lines, 2=Dither |
| `uDotSize` | `float` | Grid cell size in pixels |
| `uAngle` | `float` | Rotation in **radians** (converted from degrees before binding) |
| `uThreshold` | `float` | Normalized luminance threshold (0.0–1.0) |
| `uInvert` | `bool` | Invert output colors |
| `uBackgroundColor` | `vec3` | Background RGB |
| `uTransparencyMode` | `bool` | Enable transparent output |
| `uTransparencyThreshold` | `float` | Alpha cutoff for transparency |

Angle conversion happens in `webgl-processor.js` before the uniform is set:

```javascript
activeShader.setUniform('uAngle', (state.halftone.angle || 0) * (Math.PI / 180.0))
```

## Pattern Implementations

### Luminance Calculation (shared)

All three patterns call the same helper, which uses the standard ITU-R BT.601 luma formula:

```glsl
float getRawLuminance(vec2 uv, sampler2D tex) {
  vec4 color = texture2D(tex, clamp(uv, 0.0, 1.0));
  if (color.a == 0.0) return 1.0;  // transparent → treat as white
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}
```

### Density Formula (shared)

```glsl
float density = clamp(uThreshold * 2.0 - lum, 0.0, 1.0);
```

- `uThreshold = 0.0` → zero density everywhere (all white)
- `uThreshold = 0.5` → midtones produce the strongest pattern
- `uThreshold = 1.0` → full density everywhere (all black)

### Rotation Helper (shared)

```glsl
vec2 rotate(vec2 pt, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(pt.x * c - pt.y * s, pt.x * s + pt.y * c);
}
```

---

### Type 0 — Circular Dots

1. Rotate the pixel coordinate by `uAngle`
2. Snap to nearest grid cell of size `uDotSize`
3. Sample luminance at the cell center
4. Compute density from the shared formula
5. Draw circle: `radius = density * 0.707` (diagonal of unit cell ÷ 2)
6. Anti-aliased edge: `smoothstep(radius, radius - 0.1, dist)`

### Type 1 — Line Screen

1. Rotate the pixel coordinate by `uAngle`
2. Generate sine wave along the X axis: `sin(rotatedPos.x * (6.28318 / uDotSize)) * 0.5 + 0.5`
3. Threshold against density using `step()`
4. Angle controls line orientation; `uDotSize` controls line frequency

### Type 2 — Bayer Dither

1. Map pixel to an 8×8 grid cell: `ivec2 cell = ivec2(mod(gl_FragCoord.xy, 8.0))`
2. Look up threshold from a hardcoded 8×8 Bayer matrix (64 values via conditionals)
3. Compare density against matrix threshold: `density > thresholdMat ? 1.0 : 0.0`
4. Angle and `uDotSize` have no effect on this pattern type

## Control Wiring

Controls are initialized in `initHalftoneControls()` (`monochromifier.js` ~line 205). Each input event:
1. Updates the relevant `state.halftone.*` field
2. Calls `buildCombinedLayer(state.img)` to re-render
3. Calls `saveSettings()` to persist to localStorage

```javascript
toggle.addEventListener('change', (e) => {
  state.halftone.enabled = e.target.checked
  buildCombinedLayer(state.img)
  saveSettings()
})
```

The halftone controls panel (`#halftone-controls`) is a draggable overlay. Keyboard shortcut `j` toggles panel visibility; pressing `h` (hide all UI) also hides it.

## Rendering Pipeline

```
User adjusts control
  → state.halftone updated
  → buildCombinedLayer(img)
    → webglProcessor.process(state, img)
      → shader selected (halftone | monochrome)
      → uniforms bound
      → render to internal WebGL buffer
    → paint layer composited on top (CPU-space, after shader)
    → result displayed on main canvas
```

The paint layer (brush strokes) is composited after shader rendering to avoid double-processing.

## Related Documentation

- [User Guide: Halftone Modes](./user-halftone.md)
- [Monochromifier app source](../src/)
- [fit-method-analysis](./fit-method-analysis.md)
