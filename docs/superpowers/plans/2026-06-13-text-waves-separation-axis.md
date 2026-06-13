# Text-Waves Separation Axis Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace axis-locked word separation with 2D center-to-center repulsion so words spread as a cloud instead of collapsing into a vertical stripe.

**Architecture:** Rewrite `Word._applySeparation` only. For each overlapping word, push along the vector between bounding-box centers (scaled by penetration depth), with a deterministic fallback when centers coincide. Gravity, occupancy, pileup strategies, and the separation gate are untouched.

**Tech Stack:** JavaScript (StandardJS — no semicolons, 2-space indent, single quotes), p5.js sketch, Vitest unit tests. Test command: `pnpm nx test aggressive-text-waves`.

**Reference spec:** `docs/superpowers/specs/2026-06-10-text-waves-separation-axis-design.md`

---

## File Structure

- `apps/aggressive-text-waves/src/word.js` — add `_bboxCenter()`, rewrite `_applySeparation()`, update its one call site in `update()`.
- `apps/aggressive-text-waves/src/word.test.js` — add a `describe('Word._applySeparation')` block.

No other files change. No new dependencies.

---

## Context for the implementer

`Word` objects live on a grid. A horizontal word at `(x, y)` of length `L` occupies cells `(x..x+L-1, y)`; a vertical word occupies `(x, y..y+L-1)`. `posX/posY` are the float anchor (top-left cell); `x/y` are the floored integer cells. `isVertical` is a boolean.

`touches(other)` (already implemented, do **not** change it) returns the penetration depth (cells of overlap) between two words, or `0`/falsy when they don't overlap. It requires same-orientation words to share the exact row (horizontal) or column (vertical).

The current `_applySeparation` (`apps/aggressive-text-waves/src/word.js:67-90`) pushes overlapping same-orientation horizontal words apart purely along Y, which causes the vertical-stripe banding. We replace it.

---

## Task 1: Add `_bboxCenter()` helper

**Files:**
- Modify: `apps/aggressive-text-waves/src/word.js` (add method before `_applySeparation`, around line 67)
- Test: `apps/aggressive-text-waves/src/word.test.js`

- [ ] **Step 1: Write the failing test**

Add to `apps/aggressive-text-waves/src/word.test.js` (the file already imports `Word`, `describe`, `it`, `expect` and defines `fakeCtx` and `params`):

```javascript
describe('Word._bboxCenter', () => {
  it('horizontal word center is offset by half length on X', () => {
    const w = new Word('ABCD', 2, 3, fakeCtx, params)
    w.posX = 2; w.posY = 3; w.isVertical = false
    expect(w._bboxCenter()).toEqual({ cx: 4, cy: 3.5 })
  })

  it('vertical word center is offset by half length on Y', () => {
    const w = new Word('ABCD', 2, 3, fakeCtx, params)
    w.posX = 2; w.posY = 3; w.isVertical = true
    expect(w._bboxCenter()).toEqual({ cx: 2.5, cy: 5 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test aggressive-text-waves`
Expected: FAIL — `w._bboxCenter is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `apps/aggressive-text-waves/src/word.js`, add this method immediately before `_applySeparation (words) {`:

```javascript
  _bboxCenter () {
    const half = this.text.length / 2
    return this.isVertical
      ? { cx: this.posX + 0.5, cy: this.posY + half }
      : { cx: this.posX + half, cy: this.posY + 0.5 }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test aggressive-text-waves`
Expected: PASS (both new tests plus all existing tests).

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/word.js apps/aggressive-text-waves/src/word.test.js
git commit -m "feat(aggressive-text-waves): add Word._bboxCenter helper"
```

---

## Task 2: Rewrite `_applySeparation` to 2D center-to-center repulsion

**Files:**
- Modify: `apps/aggressive-text-waves/src/word.js:67-90` (`_applySeparation`) and its call site at `apps/aggressive-text-waves/src/word.js:126`
- Test: `apps/aggressive-text-waves/src/word.test.js`

- [ ] **Step 1: Write the failing tests**

Add this block to `apps/aggressive-text-waves/src/word.test.js`. It uses a `sepParams` object so `separationForce` is defined (the top-level `params` only has `verticalRatio`):

```javascript
describe('Word._applySeparation', () => {
  const sepParams = { verticalRatio: 0, separationForce: 0.2 }

  function makeWord (text, x, y, vertical) {
    const w = new Word(text, x, y, fakeCtx, sepParams)
    w.posX = x; w.posY = y; w.x = x; w.y = y
    w.isVertical = vertical
    w.vx = 0; w.vy = 0
    return w
  }

  it('pushes same-row horizontal words apart along X (no vertical banding)', () => {
    const left = makeWord('ABCD', 2, 3, false)
    const right = makeWord('ABCD', 4, 3, false)
    left._applySeparation([left, right])
    // overlap = 2, centers differ only in X, so push is purely horizontal
    expect(left.vx).toBeLessThan(0) // pushed left, away from right neighbor
    expect(left.vy).toBe(0)
  })

  it('pushes same-column vertical words apart along Y', () => {
    const top = makeWord('ABCD', 3, 2, true)
    const bottom = makeWord('ABCD', 3, 4, true)
    top._applySeparation([top, bottom])
    expect(top.vy).toBeLessThan(0)
    expect(top.vx).toBe(0)
  })

  it('uses a deterministic fallback when centers coincide', () => {
    const a = makeWord('AB', 5, 5, false)
    const b = makeWord('AB', 5, 5, false)
    a.xoff = 10; b.xoff = 5 // a.xoff > b.xoff -> push +X
    a._applySeparation([a, b])
    // overlap = 2, unit push +X scaled by overlap * separationForce
    expect(a.vx).toBeCloseTo(2 * 0.2)
    expect(a.vy).toBe(0)
  })

  it('is reproducible across runs for coincident centers', () => {
    const run = () => {
      const a = makeWord('AB', 5, 5, false)
      const b = makeWord('AB', 5, 5, false)
      a.xoff = 10; b.xoff = 5
      a._applySeparation([a, b])
      return a.vx
    }
    expect(run()).toBe(run())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test aggressive-text-waves`
Expected: FAIL — the horizontal test expects `vy === 0` but the current axis-locked implementation pushes purely along Y (`vy !== 0`, `vx === 0`), and the coincident-center test has no fallback.

- [ ] **Step 3: Replace the implementation**

In `apps/aggressive-text-waves/src/word.js`, replace the entire `_applySeparation` method (currently lines 67-90) with:

```javascript
  _applySeparation (words) {
    const params = this.params
    const a = this._bboxCenter()
    for (const word of words) {
      if (word === this) continue
      const overlap = this.touches(word)
      if (overlap <= 0) continue
      const b = word._bboxCenter()
      let dx = a.cx - b.cx
      let dy = a.cy - b.cy
      let mag = Math.sqrt(dx * dx + dy * dy)
      if (mag < 1e-9) {
        // coincident centers: deterministic, RNG-free push so same-seed runs match
        const s = Math.sign(this.xoff - word.xoff) ||
          Math.sign(this.yoff - word.yoff) || 1
        dx = s; dy = 0; mag = 1
      }
      this.vx += (dx / mag) * overlap * params.separationForce
      this.vy += (dy / mag) * overlap * params.separationForce
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test aggressive-text-waves`
Expected: PASS (all four new `_applySeparation` tests plus everything else).

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/word.js apps/aggressive-text-waves/src/word.test.js
git commit -m "fix(aggressive-text-waves): 2D center-to-center separation kills vertical banding"
```

---

## Task 3: Lint check

**Files:** none (verification only)

- [ ] **Step 1: Run lint**

Run: `pnpm nx lint aggressive-text-waves`
Expected: PASS with no errors. (StandardJS: confirm no semicolons crept in, 2-space indent, single quotes.)

If lint reports issues, fix them in `apps/aggressive-text-waves/src/word.js` / `word.test.js` and re-run until clean. Then:

- [ ] **Step 2: Commit any lint fixes (only if changes were made)**

```bash
git add apps/aggressive-text-waves/src/word.js apps/aggressive-text-waves/src/word.test.js
git commit -m "style(aggressive-text-waves): lint separation changes"
```

---

## Task 4: Visual verification (manual, human-in-the-loop)

**Files:** none. This is the aesthetic acceptance check from task #17.

- [ ] **Step 1: Serve the app**

Run: `pnpm nx serve aggressive-text-waves`
Open the served URL (port 5179).

- [ ] **Step 2: Observe default behavior**

With default params (`verticalRatio: 0.0`, `sourceCount: 1`, `gravityForce: 0.15`), let it run ~10 seconds.
Expected: words spread across the canvas in 2D, **not** collapsed into a vertical stripe.

- [ ] **Step 3: Sanity-check both overlap modes**

Toggle the `overlap` blade between `gibberish` and `nonOverlap`.
Expected: both render; nonOverlap stays readable (no jitter churn); neither re-introduces the stripe.

- [ ] **Step 4: Note residual banding under high gravity (informational)**

Raise `gravity force` toward 1 and source `strength` toward 1.
Expected: words pull tight to the attractor. If a stripe re-appears here, that is the known `random() > avgMag` gate suppressing separation — documented as out of scope in the spec, not a regression.

---

## Self-Review notes

- **Spec coverage:** Requirement 1 (2D spread) → Tasks 2 + 4. Requirement 2 (determinism) → Task 2 coincident-center + reproducibility tests. Requirement 3 (both modes, nonOverlap clarity) → Task 4 step 3. Requirement 4 (gravity/occupancy/gate untouched) → only `_applySeparation` and its call site change; no other code touched. Torus note → honored by omission (see spec).
- **Call site:** `_applySeparation` is called at `apps/aggressive-text-waves/src/word.js:126` as `this._applySeparation(words)`. The new signature is still `_applySeparation(words)` — no call-site change needed. (The earlier idea of passing `cols, rows` for torus wrap was dropped along with the wrap branch.)
- **Type consistency:** `_bboxCenter()` returns `{ cx, cy }` in Task 1 and is consumed as `a.cx/a.cy`, `b.cx/b.cy` in Task 2 — consistent.
- **No placeholders:** every code step shows complete code; every run step shows command + expected result.
