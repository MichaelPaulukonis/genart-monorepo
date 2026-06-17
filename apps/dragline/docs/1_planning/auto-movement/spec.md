# Auto Movement Spec

## Functionality

A keystroke (`m`) gives every text block a random impulse. Blocks animate over
the following frames and settle. The motion shape is governed by the active
**strategy**; `Shift+M` cycles strategies. Motion is one-shot: once all blocks
settle, the draw loop returns to idle until the next press.

Disabled while selection mode is active or a block is being dragged.

## Technical Scope

- **New module** `src/motion.js` — pure logic, framework-agnostic, unit-tested.
- **Integration** in `src/dragline.js` — instantiate in `setup`, drive from
  `p.draw`, add key handlers in `keyPressed`.
- **Config** `MOTION_CONFIG` object: `minSpeed`, `maxSpeed`, `friction`,
  `settleEpsilon`, `minDuration`, `maxDuration`.

### Motion system API

```js
createMotionSystem({ grid, getBlocks, requestDisplay, rng })
  → {
      impulse(),        // (re)throw all blocks under current strategy
      update(),         // advance one frame; returns isActive
      isActive(),
      cycleStrategy(),
      strategyName()
    }
```

### Strategy interface

```js
{
  name,
  init(area, grid, rng) → state,   // seed kinematics for one block
  step(area, state, grid) → done   // advance one frame, mutate area pos, return done
}
```

`step` updates float position in `state`, writes `area.x = round(fx)` /
`area.y = round(fy)` clamped to `[0, cols-w]` / `[0, rows-h]`, returns whether
the block has settled.

### Strategies

- **velocity-friction**: `init` picks random angle + speed in
  `[minSpeed, maxSpeed]` (cells/frame) → `vx, vy`; seeds `fx, fy` from current
  cell. `step` advances `fx/fy`; on hitting an edge, inverts that axis component
  and clamps (bounce); applies `v *= friction`. `done` when speed `<
  settleEpsilon`.
- **ease-tween**: `init` picks random target cell pre-clamped inside bounds plus
  duration in `[minDuration, maxDuration]` frames; records start. `step`
  advances `elapsed`, `t = elapsed/duration`, `easeOutCubic(t)`, lerps
  start→target. `done` at `t >= 1`.

## Interaction / UI Treatments

This is a keyboard-driven, no-chrome feature. UI options concern strategy
feedback only:

1. **Console log on cycle** (lean) — `Shift+M` prints the new strategy name to
   console. Zero screen clutter. Chosen default.
2. **Transient on-canvas label** — strategy name fades in/out near a corner on
   cycle. More discoverable, adds a render path + timer.
3. **Infobox line** — list current strategy in the existing `#info-box`. Always
   visible when infobox open; stale when closed.

Trade-off: (1) is least work and matches dragline's terse, keyboard-first feel;
(2) is friendliest for live demos. Start with (1), revisit if needed.

## Out of Scope (v1)

- Per-block or selected-only impulse (design covers all-blocks only).
- Continuous / ambient looping motion.
- Spin-off sketch extraction.
