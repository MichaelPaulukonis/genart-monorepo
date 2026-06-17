# Auto Movement Design Notes

## Architecture Outline

- **`src/motion.js` (new)**: owns all motion logic. Factory
  `createMotionSystem({ grid, getBlocks, requestDisplay, rng })` returns
  `{ impulse, update, isActive, cycleStrategy, strategyName }`. Holds a strategy
  registry and a `Map<area, state>` of per-block kinematics. Blocks themselves
  stay plain integer-grid objects — float positions live only in the map, so
  save / JSON serialization is unaffected.
- **Strategy registry**: array of `{ name, init, step }`. Active index cycled by
  `cycleStrategy`. Adding a strategy = appending one object; no other change.
- **`src/dragline.js`**: instantiate motion system in `setup`
  (`getBlocks: () => textAreas`, `requestDisplay: display`,
  `rng: Math.random`). Drive from `p.draw`. Add `m` / `Shift+M` in `keyPressed`.
- **`MOTION_CONFIG`**: tunable constants object near the other sketch consts.

## Motion Loop / Data Flow

```
keyPressed 'm'  → motion.impulse()         // re-init Map for every block
p.draw          → if motion.isActive():
                     stillActive = motion.update()   // step all blocks
                     display()                        // redraw field
                  // when update() returns false, loop goes idle
```

- `impulse()` clears the state map and calls the active strategy's `init` for
  each block; sets an internal `active` flag.
- `update()` iterates the map, calls `step` per block, removes settled blocks,
  returns `true` while any remain.
- The existing diff-based `populateCharGrid` clears each block's previous cells
  via `previousTextAreas`, so per-frame position changes redraw correctly with
  no `fieldIsDirty` toggling.

## Strategy Step Logic

```
// velocity-friction
fx += vx; fy += vy
if fx < 0 || fx > cols - w:  vx = -vx; fx = clamp(fx)
if fy < 0 || fy > rows - h:  vy = -vy; fy = clamp(fy)
vx *= friction; vy *= friction
area.x = round(fx); area.y = round(fy)
done = hypot(vx, vy) < settleEpsilon

// ease-tween
elapsed += 1
t = min(1, elapsed / duration)
e = 1 - (1 - t)^3            // easeOutCubic
area.x = round(lerp(startX, targetX, e))
area.y = round(lerp(startY, targetY, e))
done = t >= 1
```

## Keybindings

| Key       | Action                          | Notes                          |
|-----------|---------------------------------|--------------------------------|
| `m`       | Impulse all blocks              | Re-throws if already animating |
| `Shift+M` | Cycle active strategy           | Logs new strategy name         |

Guards: ignored when `selectionState.isActive` or `dragging`. No collision with
existing bindings (`s`/`S`, Shift+S, Shift+Alt+S, space, `r`, `n`, `i`/`?`,
arrows, Delete/Backspace).

## Component Interactions

- `dragline.js`: orchestrates trigger + draw loop; passes live `textAreas` via
  `getBlocks` thunk so the system always sees the current block array (handles
  add/remove/reset between impulses).
- `grid.js`: bounds (`cols`, `rows`, `cellSize`) consumed read-only for clamping.
- `blocks.js`: unchanged. Motion never adds fields to block objects.

## Testing Strategy

Vitest, pure module, deterministic via injected `rng`:

- **bounce**: a block aimed past an edge inverts the matching velocity component
  and stays within `[0, cols-w]` / `[0, rows-h]` across the whole run.
- **friction settle**: velocity-friction reports `done` within a bounded number
  of frames; final speed `< settleEpsilon`.
- **tween target**: ease-tween reaches the exact target cell at `t = 1` and
  reports `done`.
- **bounds invariant**: across both strategies, `area.x/y` never leave grid
  bounds on any frame.
- `p.draw` integration verified manually in the browser.

## Risks & Mitigations

- **Frame-rate dependence**: frame-based stepping (speeds in cells/frame) means
  motion duration varies with FPS. Acceptable for v1; if it matters, multiply
  steps by `p.deltaTime / 16.67`. Noted, not built.
- **Performance**: redraw every frame during motion rebuilds the char grid. Same
  cost as existing continuous arrow-key movement; fine for a single screen.
- **Re-throw mid-flight**: pressing `m` while animating re-inits cleanly because
  `impulse()` rebuilds the whole state map from current positions.
- **Block set changes between impulses**: `getBlocks` thunk re-reads `textAreas`
  each impulse, so add/remove/reset/fetch are handled — stale `Map` entries for
  removed blocks are dropped on the next `impulse()`.

## Future Extensions

- Additional strategies (orbiting clusters, gravity, drift) — append to registry.
- Continuous / ambient toggle mode.
- Frame-rate-independent stepping via `deltaTime`.
- Per-block or selected-only impulse.
