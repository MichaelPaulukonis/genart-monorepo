# Non-Overlapping Word Placement Mode (Taskmaster #16)

App: `aggressive-text-waves` (ATW). Date: 2026-06-05.

## Problem Statement

ATW renders words as multi-cell strips (`text.length` cells, horizontal or
vertical) stamped into a grid that rebuilds every frame. Today two strips can
claim the same cells; last-write-wins produces overlapping fragments
("gibberish"). We want a toggleable mode that prevents strips from sharing
cells, while keeping gibberish as the default option. When gravity sources
cluster words, naive non-overlap can gridlock at edges/equilibrium points, so a
pileup-mitigation strategy is required.

### Reality vs Taskmaster pseudocode

Task #16's pseudocode assumes single-cell words with one `targetCell` and a
`grid.getCellForPosition()` helper. The real code differs:

- Words are **multi-cell strips**, not single cells (`Word.assignToGrid`).
- Grid is `grid[y][x]`, rebuilt each frame in `update()`.
- Words move continuously (`posX/posY`), then floor to `x/y`, then stamp.
- Soft separation already exists (`Word.touches`, `Word._applySeparation`).

This design adapts the task to that reality.

## Requirements

1. `params.overlapMode` enum: `'gibberish'` (default) | `'nonOverlap'`.
   Tweakpane list control, switches live without restart.
2. Visual indicator (corner badge) showing current mode.
3. No two word-strips claim the same cell in `nonOverlap` mode.
4. At least one pileup-mitigation strategy. We implement **two competing**
   strategies (A and C) in separate worktrees for a bake-off.
5. Strategies respect `gravityForce` and multiple gravity sources.
6. Seeded RNG reproducibility preserved when no overlaps occur.
7. No gridlock: a fallback relaxes rules if a word cannot place for >60 frames.
8. Debug overlay to visually verify zero overlap.
9. Existing features (recording, save, source switching, step mode) unaffected.

## Technical Approach

### Shared foundation (feature branch `atw/16-non-overlap`)

**Mode param + UI**
- Add `overlapMode: 'gibberish'` to `params`.
- Tweakpane list: `{ gibberish, nonOverlap }`.
- Corner badge drawn in `render()` (text label, colored border tint).

**Cell occupancy** (`cell.js`)
- Add `this.occupiedBy = null`.
- `clear()` resets `occupiedBy = null` (called each frame).

**Two-phase commit** (`sketch.js` `update()`)
- Phase 1: every word runs existing physics → desired `posX/posY/x/y`.
  Do NOT stamp the grid yet.
- Phase 2: iterate `wordObjects` in **index order** (deterministic →
  reproducible). For each word compute its strip cells:
  - `gibberish`: stamp as today.
  - `nonOverlap`: if all strip cells are free, claim (set `occupiedBy = word`)
    and stamp; else call `word.handleOverlap(blockingWords, grid, cols, rows)`.

**Collision unit**: any strip cell already `occupiedBy` another word blocks the
whole word.

**Strip-cell helper**: extract the cell-coordinate loop from `assignToGrid`
into a shared method (e.g. `Word.stripCells(cols, rows)`) so commit logic and
stamping share one source of truth.

**Gridlock fallback**: per-word `stuckFrames` counter. Successful placement
resets it; failure increments. At `>60`, allow the stamp for one frame and
flash the badge, then reset. Prevents permanent freeze.

**Debug overlay**: key toggle `d`; tints claimed cells so overlap is visually
verifiable.

### Strategy A — Hard Rejection + Bounce (worktree `atw/16-strategy-a`)

`handleOverlap`: reject the move. Revert to last valid `posX/posY` (word tracks
previous committed position), apply `vx *= -0.5; vy *= -0.5`, add small random
jitter to break deadlock. Word re-claims its prior cells.

### Strategy C — Backpressure Propagation (worktree `atw/16-strategy-c`)

`handleOverlap`: push the blocking word along this word's velocity vector
(recursive nudge toward this word's desired position), recursion depth ≤ 3,
energy loss factor `0.8` per step. If the chain resolves, both place; if not,
the blocked word stays put (re-claims prior cells).

### Bake-off mechanics

1. Build + commit shared foundation on `atw/16-non-overlap`.
2. Two git worktrees branch from it: `atw/16-strategy-a`, `atw/16-strategy-c`.
3. One background agent per worktree implements only the strategy-specific
   `handleOverlap` (+ any per-strategy state/draw).
4. Agents verify **mechanics**: zero overlap (debug overlay), tests green, no
   gridlock at 200+ words with 3-4 gravity sources.
5. Human picks the aesthetic winner in browser (port 5179). Agents cannot
   judge generative-art quality.

## Implementation Steps

1. Foundation: `overlapMode` param + Tweakpane list + corner badge.
2. Foundation: `Cell.occupiedBy` + `clear()` reset.
3. Foundation: `Word.stripCells()` helper; refactor `assignToGrid` to use it.
4. Foundation: two-phase commit in `update()`; `handleOverlap` no-op stub.
5. Foundation: gridlock fallback (`stuckFrames`).
6. Foundation: debug overlay (`d` key).
7. Foundation: tests for occupancy/commit (Vitest).
8. Commit foundation; create two worktrees.
9. Worktree A: Strategy A `handleOverlap` + prev-position tracking + tests.
10. Worktree C: Strategy C backpressure + recursion guard + tests.
11. Human bake-off; merge winner.

## Testing Strategy

- **Vitest** unit tests (ATW already uses Vitest — see `text-sources.test.js`):
  - `stripCells` returns correct cells for horizontal + vertical + wrap.
  - Two-phase commit: in `nonOverlap`, no cell ends with two occupants.
  - Gibberish mode unchanged (regression).
  - Gridlock fallback triggers after 60 stuck frames.
  - Per-strategy: A reverts + bounces; C propagates ≤3 deep with energy loss.
- **Manual** (browser, port 5179): toggle modes live; debug overlay shows zero
  overlap in nonOverlap; 3-4 sources, 200 words, watch for gridlock; verify
  record/save/source-switch still work.

## Risks & Mitigation

- **Gridlock at equilibrium** → per-word stuck counter + relax fallback.
- **Perf at high word count** → grid is small (~40x40 at scale 20); full check
  is cheap. Add spatial hashing only if profiling shows a hot spot (YAGNI).
- **Reproducibility break** → fixed index-order commit; no RNG in commit path
  except strategy jitter (document as expected divergence).
- **Noisy A-vs-C diffs** → shared foundation committed first; worktrees differ
  only in `handleOverlap`.

## Dependencies

- Taskmaster deps: tasks 3, 12, 13 (assumed satisfied; verify before merge).
- No new npm packages.

## Out of Scope (YAGNI)

- Strategy B (soft exclusion — partly exists already) and Strategy D
  (crystallization lock).
- Spatial hashing (until proven necessary).
- Lock-state visuals/glow.
