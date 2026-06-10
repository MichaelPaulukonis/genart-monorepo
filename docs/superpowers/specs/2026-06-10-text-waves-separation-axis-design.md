# Text-Waves Separation Axis — Design

**App:** aggressive-text-waves
**Taskmaster:** #17 (Investigate gravity behavior vs word orientation)
**Date:** 2026-06-10
**Status:** approved, pre-implementation

## Problem Statement

At default settings, words cluster into a vertical stripe instead of spreading
across the canvas as a 2D word-cloud. Looks like a leaderboard, not a cloud.

Task #17 framed the cause as a single-point gravity anchor ignoring word length.
That framing is **stale**: commit `5c57d0f` (boids physics) already added a
`halfLen` center-shift so gravity pulls a word's bbox *center*, not its left edge
(`word.js:106-107`).

The real cause is **axis-locked separation**. In `_applySeparation`
(`word.js:74-85`), two same-orientation **horizontal** words that overlap are
pushed apart purely along **Y** (`dx = 0; dy = ±overlap`). Horizontal words can
only shove each other into adjacent rows. Meanwhile gravity collapses every
word's X toward the attractor. Two orthogonal forces:

- **Gravity** → collapses X toward attractor
- **Separation** → spreads only along Y

Net result is a 1D vertical stripe. With `verticalRatio: 0.0` (default = all
horizontal) it is guaranteed.

Note: the minimum-translation-vector ("physically correct" AABB push) is *not*
the fix — for two 1-row-tall words it always prefers the cheap 1-cell Y hop,
which is exactly the current banding behavior.

## Requirements

1. Words spread in 2D at default params; the vertical stripe disappears.
2. Determinism preserved: same random seed → same output (no RNG added to
   separation). Supports same-seed before/after visual comparison.
3. Both overlap modes keep working: `gibberish` (free overlap) and `nonOverlap`
   (occupancy-resolved). Separation runs before occupancy and is mode-agnostic;
   it must not muddy the clarity of nonOverlap visualization.
4. Torus wrapping respected — grid wraps on both axes (`sketch.js:145-148`).
5. No change to gravity, occupancy, pileup strategies, or the
   `random() > avgMag` separation gate.

## Technical Approach

Rewrite `_applySeparation` only. Replace the axis-locked push with **2D
center-to-center repulsion** (boids-style separation).

For each overlapping `other` (overlap from existing `touches()`):

1. **Bbox centers** (anchor + half-length along long axis):
   - horizontal → `(posX + L/2, posY + 0.5)`
   - vertical   → `(posX + 0.5, posY + L/2)`
2. **Vector** `d = thisCenter − otherCenter`.
3. **Torus shortest path**: if `|dx| > cols/2` → `dx += dx > 0 ? -cols : cols`;
   same for `dy`/`rows`. Mirrors the gravity-repulsion wrap in `word.js:112-113`.
4. **Normalize**, scale by `overlap × separationForce`, add to `vx/vy`.
5. **Coincident-center fallback** (`dist ≈ 0`): push along a deterministic axis
   from `Math.sign(this.xoff - other.xoff)` (ties → `yoff`; final tie → +1). No
   RNG — reproducible and readable in nonOverlap.

Because the vector is 2D, same-row horizontal words (centers differ in X) are
pushed apart along **X** — sliding past each other — which breaks the stripe.
Vertical words still slide in Y. Cross-orientation pairs fall out of the same
formula.

`touches()` is unchanged; its penetration value is the scale factor.
`separationForce` is unchanged. No new sliders this round.

### Out of scope (flagged for later exploration)

- `separationRadius` / falloff knob — the natural next exploration lever.
- The `random() > avgMag` gate that suppresses separation under strong gravity.
  At default params separation still fires ~40% of frames, enough to declump.
  If banding lingers under high gravity, that gate is the next lever.
- Length-aware gravity, word mass/inertia, multi-anchor forces, "condense to a
  single letter" — all deferred.

## Implementation Steps

1. Add a `_bboxCenter()` helper (or inline) returning `{cx, cy}` per orientation.
2. Rewrite `_applySeparation` to the 2D center-to-center formula with torus wrap
   and deterministic coincident-center fallback.
3. Add unit tests (below).
4. Visual evaluation with a fixed seed.

## Testing Strategy

New unit tests in `word.test.js` (fake ctx, no RNG dependence):

- **Banding regression**: two horizontal words on the same row overlapping →
  net separation force has a nonzero **X** component pushing them apart (proves
  the push is no longer Y-only).
- **Vertical pair**: two vertical words same column overlapping → push has
  nonzero **Y** component (slides along long axis, unchanged behavior).
- **Coincident centers**: fully-overlapping pair → deterministic nonzero force,
  same result across runs.
- **Torus wrap**: words near opposite edges → force takes the short way around,
  not across the whole grid.

Visual/aesthetic eval (per #17 testStrategy): same random seed, before/after
screenshots — vertical stripe should become 2D spread. No automated visual test.

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Fix rotates stripe 90° (horizontal band) | 2D center-to-center spreads both axes, not one; unlike the long-axis-only alternative. Verify in visual eval. |
| Separation gate suppresses fix under high gravity | Out of scope; flagged. Fires ~40% at defaults. Revisit if needed. |
| Coincident-center RNG hurts reproducibility | Deterministic fallback from `xoff`/`yoff`, no `random()`. |
| nonOverlap clarity degraded | Separation is a soft pre-occupancy nudge; deterministic, no jitter. Occupancy still authoritative. |

## Dependencies

None. Self-contained change to `word.js` + `word.test.js`. No new packages, no
shared-lib changes.
