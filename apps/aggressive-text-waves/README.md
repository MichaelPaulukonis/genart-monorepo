# aggressive-text-waves

Text animated on a character grid, driven by 2D Perlin noise. Words from a source text drift across the grid toward a wandering gravity well. Background cells fill with noise-selected punctuation characters.

**Live:** https://michaelpaulukonis.github.io/aggressive-text-waves/

![Aggressive Text Waves](./docs/screenshots/aggressive-text-waves-main.png)

## Controls

| Control | Description |
|---------|-------------|
| `Space` | Pause / resume |
| `n` | Step one frame (when paused) |
| `c` | Toggle gravity center indicators |
| `o` | Toggle word outlines |
| `s` | Save current frame as PNG |
| `r` | Toggle frame recording (sequential PNGs) |
| `?` | Show/hide about screen |
| Step button | Toggle single-step mode |
| Record button | Toggle frame recording |

## Tweakpane Parameters

| Parameter | Description |
|-----------|-------------|
| `outline` | Toggle word outlines |
| `scale` | Cell size in pixels; triggers grid reinit on change |
| `vert ratio` | Fraction of words placed vertically |
| **gravity** | |
| `center speed` | How fast gravity sources drift |
| `sources` | Number of active gravity sources (0-5) |
| `strength N` | Per-source strength (-1 repel … +1 attract) |
| **physics** | |
| `maxSpeed` | Maximum word velocity |
| `damping` | Velocity damping per frame |
| `wander` | Random wandering force |
| `gravity force` | Pull/push strength toward sources |
| `separation` | Force keeping words apart |
| `xOffsetSpeed` / `yOffsetSpeed` / `zOffsetSpeed` | Noise offset advance rates |

## Dev

```bash
nx dev aggressive-text-waves   # http://localhost:5179
nx build aggressive-text-waves
nx deploy aggressive-text-waves
```

## Notes

- "Waves" in the name refers to 2D Perlin noise fields, not literal wave motion
- Ported from `my-sketches` canvas-sketch repo; canvas-sketch removed in favor of plain p5 instance mode
- Tweakpane v4 (`addBinding` API)
