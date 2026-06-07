# Strategy D — Crystallization Lock (ATW)

App: aggressive-text-waves. Date: 2026-06-06. Completes Taskmaster #16's
4-strategy menu (A reject-bounce, B soft-exclusion, C cascade already shipped).

## Problem

A fourth selectable `pileup` strategy for nonOverlap mode: words that get
hemmed in by neighbors "crystallize" — lock in place as immovable obstacles —
and "melt" (reanimate) when the crowding around them dissolves. Gives a
settling/clustering aesthetic distinct from the push-apart strategies.

Note: task #16 said "6+ hexagonal neighbors", but ATW's grid is **square**.
Adapted to an 8-neighborhood border-density measure.

## Decisions (brainstormed 2026-06-06)

- Lock trigger: **hemmed-in** — density-driven (border ring occupied fraction).
- Permanence: **melt when neighbors clear** (dynamic), with hysteresis.
- Locked look: **faded / ghostly** (reduced glyph alpha).

## Design

### State
`Word.isLocked` (default `false`).

### Immovability
- `Word.update()` early-returns when `isLocked` (no physics, position frozen).
- `resolveOccupancy` processes **locked words first** (stable partition by
  `isLocked`), so pinned words hold their cells against mobile claimants. This
  is generic ("pinned claim first") — no word is ever locked outside crystallize
  mode, so other strategies are unaffected and no strategy-name check is needed.

### Lock / melt — density post-pass (hysteresis)
A post-resolve pass (crystallize only) scans each word's **border ring** — the
set of 8-neighborhood cells around its strip footprint, wrap-around, excluding
its own strip cells — in the freshly stamped grid:
- not locked + density ≥ **0.6** → lock
- locked + density < **0.4** → melt
- 0.4–0.6 dead band → no flip (prevents lock/unlock flicker)

Density alone captures "hemmed-in" (crowded ≈ blocked), so no separate
blocked-flag is needed; melt falls out when a cluster dissolves.

### Generic resolver hook (altitude)
`resolveOccupancy` gains ONE generic extension point: after the claim loop it
looks up `PILEUP_POST[pileupStrategy]` and calls it if defined
(`post(wordObjects, grid, cols, rows)`). Crystallize-specific logic lives in
`crystallize.js`; the resolver stays strategy-agnostic. Bare
`(word, ctx) => boolean` contract for A/B/C unchanged.

### handleOverlap for crystallize
`crystallize(word, ctx)` = `word.revert()` — a still-mobile blocked word holds
position this frame; locking is decided by the post-pass.

### Render
In sketch's cell-draw loop, draw a cell's glyph at reduced alpha when
`grid[y][x].occupiedBy?.isLocked`. Implemented via an optional `alpha` param on
`Cell.display(alpha = 255)`; sketch passes `90` for locked-occupant cells.

## Files
- `word.js` — `isLocked` field; `update()` guard.
- `cell.js` — `display(alpha = 255)`.
- `strategies/crystallize.js` (new) — `crystallize` (revert),
  `crystallizePostResolve`, `borderDensity` helper.
- `occupancy.js` — locked-first stable partition; optional `PILEUP_POST` hook.
- `pileup-strategies.js` — register `crystallize` in `PILEUP_STRATEGIES`,
  `PILEUP_STRATEGY_OPTIONS`, and new `PILEUP_POST`.
- `sketch.js` — faded render for locked cells.
- `strategies/crystallize.test.js` (new) — tests below.

## Testing
- `borderDensity`: known grid + placed word → expected fraction; wrap at edges;
  excludes own strip cells.
- `crystallizePostResolve`: density ≥0.6 locks; <0.4 melts; 0.4–0.6 no flip
  (both directions).
- `Word.update()` guard: locked word's posX/posY/x/y unchanged after update().
- Full suite + lint + build green; manual: nonOverlap + crystallize, watch
  clusters lock (fade) and melt when sources move away.

## Out of scope (YAGNI)
- Tunable thresholds via Tweakpane (constants for now; can expose later like
  `soft repel`).
- Glow/stroke variants (faded only).
