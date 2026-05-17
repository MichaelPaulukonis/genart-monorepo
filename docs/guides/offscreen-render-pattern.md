# Off-Screen Render Pattern

Render to a high-resolution `p5.Graphics` buffer, display a scaled-down copy on the visible canvas, and save the full-resolution buffer.

## Why

- Saves export at output resolution (e.g. 2000×2000) regardless of display canvas size
- Display canvas can fit any viewport without affecting export quality
- Sub-pixel anti-aliasing on the large buffer acts as free SSAA when downscaled for display

## Helper: `createOffscreenCanvas`

`@genart/p5-utils` exports `createOffscreenCanvas(p, { outputSize, displaySize })`:

```js
import { createOffscreenCanvas } from '@genart/p5-utils'

p.setup = () => {
  p.createCanvas(800, 800)
  const { pg, scale, display } = createOffscreenCanvas(p, {
    outputSize: 2000,
    displaySize: 800
  })
  // pg    — p5.Graphics to draw on
  // scale — outputSize / displaySize (2.5 here)
  // display() — blits pg to main canvas at end of render
}
```

## Rules for Drawing Context

| Use `p.*` | Use `pg.*` |
|-----------|------------|
| `p.noise()`, `p.random()` | `pg.background()` |
| `p.floor()`, `p.color()`, `p.lerpColor()` | `pg.fill()`, `pg.stroke()`, `pg.noStroke()` |
| `p.loop()`, `p.noLoop()`, `p.frameRate()` | `pg.text()`, `pg.rect()`, `pg.line()` |
| `p.image(pg, ...)` via `display()` | `pg.textAlign()`, `pg.textSize()` |

`p5.Graphics` does **not** have `noise()` or `random()` — always use `p.*` for math.

## Coordinate Scaling

All pixel positions and sizes must be multiplied by `scale`:

```js
const cellSize = logicalCellSize * scale   // e.g. 20 * 2.5 = 50
pg.textSize((logicalCellSize - 4) * scale)
pg.strokeWeight(2 * scale)

// cell at grid position (x, y):
pg.text(letter, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2)
```

Grid dimensions (cols/rows) are based on the **on-screen** canvas size and stay unchanged — only pixel sizes scale up.

## Sub-Pixel Coordinates

`scale` is often non-integer (e.g. 2000/800 = 2.5), so many coordinates are fractional. This is intentional:

- On the off-screen buffer: fractional coords trigger canvas anti-aliasing
- When `display()` downscales to screen: that anti-aliasing becomes SSAA — smoother edges, no extra cost
- In saved PNGs at output resolution: slight softness, acceptable for generative art
- For pixel-crisp output (pixel art, exact geometry): use `Math.round(logicalSize * scale)`

## Saving

`p5.Graphics` has `.canvas` natively, so pass it directly to `saveWithFallback`:

```js
saveWithFallback(p, pg, 'output.png')   // saves 2000×2000
```

Do **not** pass `{ canvas: p.canvas }` — that saves the small display canvas.

## Update / Render Split

Pair this pattern with separated `update()` / `render()` functions:

```js
function update() {
  // advance simulation state only — no drawing
}

function render() {
  pg.background(255)
  // all drawing via pg.*
  display()  // blit to screen
}

p.draw = () => {
  update()
  render()
}
```

This allows display-only changes (toggling overlays, outlines) to call `render()` directly while paused without advancing simulation state. Step mode calls `update(); render()` explicitly instead of `p.redraw()`.

## Example: aggressive-text-waves

`apps/aggressive-text-waves/src/sketch.js` is the reference implementation:

- `OFFSCREEN_SIZE = 2000`, `ONSCREEN_SIZE = 800`, `scale = 2.5`
- `Cell` receives `pg` as drawing context and `params.scale * offscreenScale` as pixel size
- `init()` reconfigures `pg.textSize()` on scale change
- Outline drawing and gravity center indicators use `pg.*` with scaled coordinates
- `displayOffscreen()` returned from helper, called at end of `render()`

## Apps Using This Pattern

| App | Output Size | Display Size | Scale |
|-----|-------------|--------------|-------|
| aggressive-text-waves | 2000×2000 | 800×800 | 2.5× |
