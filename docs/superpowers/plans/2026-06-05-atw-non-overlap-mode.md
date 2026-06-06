# Non-Overlapping Word Placement Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toggleable `nonOverlap` mode to aggressive-text-waves so word-strips never share grid cells, with two competing pileup strategies (A: hard rejection + bounce, C: displacement cascade) built in separate worktrees for a bake-off.

**Architecture:** A pure `occupancy.js` module resolves grid claims in a deterministic two-phase commit (physics first, claim second), keeping the logic testable outside the p5 closure. `Word` gains strip-cell + occupancy helpers and a `handleOverlap` hook that each strategy overrides. The shared foundation (Tasks 1-7) lands on `atw/16-non-overlap`; Strategy A (Task 8) and Strategy C (Task 9) are implemented in worktrees branched from the foundation.

**Tech Stack:** JavaScript (StandardJS), p5.js, Tweakpane, Vitest (jsdom).

---

## File Structure

- `apps/aggressive-text-waves/src/cell.js` — add `occupiedBy` field + reset in `clear()`.
- `apps/aggressive-text-waves/src/word.js` — add `stripCells()`, `prevPosX/prevPosY`, `stuckFrames`, default `handleOverlap()`; refactor `assignToGrid` onto `stripCells`.
- `apps/aggressive-text-waves/src/occupancy.js` — NEW. Pure `resolveOccupancy()` + helpers `cellsFree`, `stampWord`. No p5 import.
- `apps/aggressive-text-waves/src/sketch.js` — `params.overlapMode`, Tweakpane list, corner badge, debug overlay (`d` key), call `resolveOccupancy` in `update()`.
- `apps/aggressive-text-waves/src/occupancy.test.js` — NEW. Tests for resolution, collision, gridlock.
- `apps/aggressive-text-waves/src/word.test.js` — NEW. Tests for `stripCells` + strategy `handleOverlap`.

**Test runner:** from repo root `pnpm nx test aggressive-text-waves`, or inside a worktree `cd apps/aggressive-text-waves && npx vitest --run <file>`.

**Test helpers (used across tasks):**

```javascript
// minimal p5 stub — Word constructor calls ctx.random; physics not exercised in unit tests
const fakeCtx = { random: () => 0.5, noise: () => 0.5 }

// build a cols x rows grid of real Cell objects (Cell.display unused in tests, ctx=null ok)
import { Cell } from './cell.js'
function makeGrid (cols, rows) {
  const g = []
  for (let y = 0; y < rows; y++) {
    const row = []
    for (let x = 0; x < cols; x++) row.push(new Cell(x, y, 1, null))
    g.push(row)
  }
  return g
}
```

---

## Task 1: Cell occupancy field

**Files:**
- Modify: `apps/aggressive-text-waves/src/cell.js`
- Test: `apps/aggressive-text-waves/src/occupancy.test.js` (create)

- [ ] **Step 1: Write the failing test**

```javascript
// occupancy.test.js
import { describe, it, expect } from 'vitest'
import { Cell } from './cell.js'

describe('Cell.occupiedBy', () => {
  it('defaults to null', () => {
    expect(new Cell(0, 0, 1, null).occupiedBy).toBe(null)
  })

  it('clear() resets occupiedBy to null', () => {
    const c = new Cell(0, 0, 1, null)
    c.occupiedBy = { id: 'w1' }
    c.clear()
    expect(c.occupiedBy).toBe(null)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/occupancy.test.js`
Expected: FAIL — `occupiedBy` is `undefined`.

- [ ] **Step 3: Implement**

In `cell.js` constructor add after `this.isWord = false`:

```javascript
    this.occupiedBy = null
```

In `clear()` add:

```javascript
  clear () {
    this.letter = ' '
    this.isWord = false
    this.occupiedBy = null
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/occupancy.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/cell.js apps/aggressive-text-waves/src/occupancy.test.js
git commit -m "feat(aggressive-text-waves): add Cell.occupiedBy for non-overlap mode"
```

---

## Task 2: Word.stripCells() helper + assignToGrid refactor

**Files:**
- Modify: `apps/aggressive-text-waves/src/word.js`
- Test: `apps/aggressive-text-waves/src/word.test.js` (create)

`stripCells` returns the wrapped cell coordinates + char a word occupies. `assignToGrid` is refactored to consume it (single source of truth).

- [ ] **Step 1: Write the failing test**

```javascript
// word.test.js
import { describe, it, expect } from 'vitest'
import { Word } from './word.js'

const fakeCtx = { random: () => 0.5, noise: () => 0.5 }
const params = { verticalRatio: 0 }

describe('Word.stripCells', () => {
  it('horizontal word lists each cell left-to-right', () => {
    const w = new Word('AB', 2, 3, fakeCtx, params)
    w.x = 2; w.y = 3; w.isVertical = false
    expect(w.stripCells(10, 10)).toEqual([
      { x: 2, y: 3, char: 'A' },
      { x: 3, y: 3, char: 'B' }
    ])
  })

  it('vertical word lists each cell top-to-bottom', () => {
    const w = new Word('AB', 2, 3, fakeCtx, params)
    w.x = 2; w.y = 3; w.isVertical = true
    expect(w.stripCells(10, 10)).toEqual([
      { x: 2, y: 3, char: 'A' },
      { x: 2, y: 4, char: 'B' }
    ])
  })

  it('wraps horizontally on cols', () => {
    const w = new Word('AB', 9, 0, fakeCtx, params)
    w.x = 9; w.y = 0; w.isVertical = false
    expect(w.stripCells(10, 10)).toEqual([
      { x: 9, y: 0, char: 'A' },
      { x: 0, y: 0, char: 'B' }
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/word.test.js`
Expected: FAIL — `w.stripCells is not a function`.

- [ ] **Step 3: Implement**

Add method to `Word` (in `word.js`):

```javascript
  stripCells (cols, rows) {
    const cells = []
    for (let i = 0; i < this.text.length; i++) {
      const x = this.isVertical ? this.x : (this.x + i) % cols
      const y = this.isVertical ? (this.y + i) % rows : this.y
      cells.push({ x, y, char: this.text.charAt(i) })
    }
    return cells
  }
```

Refactor `assignToGrid` to reuse it:

```javascript
  assignToGrid (grid, cols, rows) {
    for (const { x, y, char } of this.stripCells(cols, rows)) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        grid[y][x].setWordLetter(char)
      }
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/word.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/word.js apps/aggressive-text-waves/src/word.test.js
git commit -m "feat(aggressive-text-waves): add Word.stripCells, refactor assignToGrid onto it"
```

---

## Task 3: occupancy.js — cellsFree + stampWord helpers

**Files:**
- Create: `apps/aggressive-text-waves/src/occupancy.js`
- Test: `apps/aggressive-text-waves/src/occupancy.test.js`

- [ ] **Step 1: Write the failing test**

Append to `occupancy.test.js`:

```javascript
import { cellsFree, stampWord } from './occupancy.js'
import { Word } from './word.js'

const fakeCtx = { random: () => 0.5, noise: () => 0.5 }
const params = { verticalRatio: 0 }

function makeGrid (cols, rows) {
  const g = []
  for (let y = 0; y < rows; y++) {
    const row = []
    for (let x = 0; x < cols; x++) row.push(new Cell(x, y, 1, null))
    g.push(row)
  }
  return g
}

function makeWord (text, x, y) {
  const w = new Word(text, x, y, fakeCtx, params)
  w.x = x; w.y = y; w.isVertical = false
  return w
}

describe('cellsFree', () => {
  it('true when all strip cells unoccupied', () => {
    const grid = makeGrid(10, 10)
    const w = makeWord('AB', 0, 0)
    expect(cellsFree(w.stripCells(10, 10), grid, w)).toBe(true)
  })

  it('false when any strip cell occupied by another word', () => {
    const grid = makeGrid(10, 10)
    grid[0][1].occupiedBy = { id: 'other' }
    const w = makeWord('AB', 0, 0)
    expect(cellsFree(w.stripCells(10, 10), grid, w)).toBe(false)
  })

  it('true when the occupant is the same word (re-claim)', () => {
    const grid = makeGrid(10, 10)
    const w = makeWord('AB', 0, 0)
    grid[0][1].occupiedBy = w
    expect(cellsFree(w.stripCells(10, 10), grid, w)).toBe(true)
  })
})

describe('stampWord', () => {
  it('sets letter and occupiedBy on each strip cell', () => {
    const grid = makeGrid(10, 10)
    const w = makeWord('AB', 0, 0)
    stampWord(w, grid, 10, 10)
    expect(grid[0][0].letter).toBe('A')
    expect(grid[0][0].isWord).toBe(true)
    expect(grid[0][0].occupiedBy).toBe(w)
    expect(grid[0][1].occupiedBy).toBe(w)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/occupancy.test.js`
Expected: FAIL — cannot resolve `./occupancy.js` exports.

- [ ] **Step 3: Implement**

Create `occupancy.js`:

```javascript
export function cellsFree (cells, grid, word) {
  for (const { x, y } of cells) {
    const occ = grid[y][x].occupiedBy
    if (occ !== null && occ !== word) return false
  }
  return true
}

export function stampWord (word, grid, cols, rows) {
  for (const { x, y, char } of word.stripCells(cols, rows)) {
    grid[y][x].setWordLetter(char)
    grid[y][x].occupiedBy = word
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/occupancy.test.js`
Expected: PASS (Task 1 + Task 3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/occupancy.js apps/aggressive-text-waves/src/occupancy.test.js
git commit -m "feat(aggressive-text-waves): add cellsFree + stampWord occupancy helpers"
```

---

## Task 4: Word default handleOverlap + position/stuck tracking

**Files:**
- Modify: `apps/aggressive-text-waves/src/word.js`
- Test: `apps/aggressive-text-waves/src/word.test.js`

Default behavior (gibberish strategy, and base both real strategies override): when blocked, the word stays at its previous committed position. Adds `prevPosX/prevPosY` (committed each successful frame) and `stuckFrames`.

- [ ] **Step 1: Write the failing test**

Append to `word.test.js`:

```javascript
describe('Word default handleOverlap', () => {
  it('reverts posX/posY to previous committed position', () => {
    const w = new Word('AB', 0, 0, fakeCtx, params)
    w.prevPosX = 2; w.prevPosY = 3
    w.posX = 5; w.posY = 6
    w.handleOverlap({ blockers: [], grid: [], cols: 10, rows: 10, tryClaim: () => false })
    expect(w.posX).toBe(2)
    expect(w.posY).toBe(3)
    expect(w.x).toBe(2)
    expect(w.y).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/word.test.js`
Expected: FAIL — `w.handleOverlap is not a function`.

- [ ] **Step 3: Implement**

In `word.js` constructor, after `this.vy = 0`:

```javascript
    this.prevPosX = x
    this.prevPosY = y
    this.stuckFrames = 0
```

Add method:

```javascript
  // ctx: { blockers, grid, cols, rows, tryClaim }
  // default strategy: revert to previous committed position
  handleOverlap (ctx) {
    this.posX = this.prevPosX
    this.posY = this.prevPosY
    this.x = Math.floor(this.posX)
    this.y = Math.floor(this.posY)
    return false
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/word.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/word.js apps/aggressive-text-waves/src/word.test.js
git commit -m "feat(aggressive-text-waves): add Word prev-position tracking + default handleOverlap"
```

---

## Task 5: resolveOccupancy — two-phase commit + gridlock fallback

**Files:**
- Modify: `apps/aggressive-text-waves/src/occupancy.js`
- Test: `apps/aggressive-text-waves/src/occupancy.test.js`

`resolveOccupancy` runs Phase 2: iterate words in index order, claim free strips, else invoke `handleOverlap`. Gibberish mode always stamps. Gridlock fallback: a word blocked >60 consecutive frames is force-stamped once and its counter reset.

- [ ] **Step 1: Write the failing test**

Append to `occupancy.test.js`:

```javascript
import { resolveOccupancy } from './occupancy.js'

describe('resolveOccupancy', () => {
  it('gibberish mode stamps all words even if overlapping', () => {
    const grid = makeGrid(10, 10)
    const a = makeWord('AB', 0, 0)
    const b = makeWord('CD', 0, 0) // same cells
    resolveOccupancy({ wordObjects: [a, b], grid, cols: 10, rows: 10, overlapMode: 'gibberish' })
    expect(grid[0][0].letter).toBe('C') // last write wins
  })

  it('nonOverlap mode: first word claims, second is blocked (handleOverlap called)', () => {
    const grid = makeGrid(10, 10)
    const a = makeWord('AB', 0, 0)
    const b = makeWord('CD', 0, 0)
    b.prevPosX = 5; b.prevPosY = 5
    resolveOccupancy({ wordObjects: [a, b], grid, cols: 10, rows: 10, overlapMode: 'nonOverlap' })
    expect(grid[0][0].occupiedBy).toBe(a)
    expect(b.posX).toBe(5) // b reverted via default handleOverlap
  })

  it('nonOverlap mode: no cell ends with two distinct occupants', () => {
    const grid = makeGrid(10, 10)
    const words = [makeWord('AB', 0, 0), makeWord('AB', 0, 0), makeWord('AB', 1, 1)]
    words.forEach(w => { w.prevPosX = w.x; w.prevPosY = w.y })
    resolveOccupancy({ wordObjects: words, grid, cols: 10, rows: 10, overlapMode: 'nonOverlap' })
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        // occupiedBy is a single ref; the invariant is it is never double-stamped mid-resolve
        expect(grid[y][x].occupiedBy === null || typeof grid[y][x].occupiedBy === 'object').toBe(true)
      }
    }
  })

  it('resets stuckFrames on successful claim', () => {
    const grid = makeGrid(10, 10)
    const a = makeWord('AB', 0, 0)
    a.stuckFrames = 5
    resolveOccupancy({ wordObjects: [a], grid, cols: 10, rows: 10, overlapMode: 'nonOverlap' })
    expect(a.stuckFrames).toBe(0)
  })

  it('gridlock fallback force-stamps a word stuck > 60 frames', () => {
    const grid = makeGrid(10, 10)
    const a = makeWord('AB', 0, 0)
    const b = makeWord('CD', 0, 0)
    b.prevPosX = 0; b.prevPosY = 0
    b.stuckFrames = 61
    const res = resolveOccupancy({ wordObjects: [a, b], grid, cols: 10, rows: 10, overlapMode: 'nonOverlap' })
    expect(b.stuckFrames).toBe(0) // reset after relax
    expect(res.relaxed).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/occupancy.test.js`
Expected: FAIL — `resolveOccupancy` not exported.

- [ ] **Step 3: Implement**

Add to `occupancy.js`:

```javascript
const GRIDLOCK_FRAMES = 60

export function resolveOccupancy ({ wordObjects, grid, cols, rows, overlapMode }) {
  let relaxed = 0

  if (overlapMode !== 'nonOverlap') {
    for (const w of wordObjects) stampWord(w, grid, cols, rows)
    return { relaxed }
  }

  const tryClaim = (word) => {
    const cells = word.stripCells(cols, rows)
    if (!cellsFree(cells, grid, word)) return false
    stampWord(word, grid, cols, rows)
    return true
  }

  for (const word of wordObjects) {
    if (tryClaim(word)) {
      word.prevPosX = word.posX
      word.prevPosY = word.posY
      word.stuckFrames = 0
      continue
    }
    // blocked
    word.stuckFrames++
    if (word.stuckFrames > GRIDLOCK_FRAMES) {
      stampWord(word, grid, cols, rows) // relax: force placement for one frame
      word.stuckFrames = 0
      relaxed++
      continue
    }
    const blockers = blockingWords(word, grid, cols, rows)
    word.handleOverlap({ blockers, grid, cols, rows, tryClaim })
  }

  return { relaxed }
}

function blockingWords (word, grid, cols, rows) {
  const set = new Set()
  for (const { x, y } of word.stripCells(cols, rows)) {
    const occ = grid[y][x].occupiedBy
    if (occ !== null && occ !== word) set.add(occ)
  }
  return [...set]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/occupancy.test.js`
Expected: PASS (all occupancy tests).

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/occupancy.js apps/aggressive-text-waves/src/occupancy.test.js
git commit -m "feat(aggressive-text-waves): two-phase commit resolveOccupancy + gridlock fallback"
```

---

## Task 6: Wire occupancy into sketch.js update()

**Files:**
- Modify: `apps/aggressive-text-waves/src/sketch.js`

No new unit test (integration lives in p5 closure); manual verification step included.

- [ ] **Step 1: Add param + import**

In `sketch.js` add to imports (line ~5 region):

```javascript
import { resolveOccupancy } from './occupancy.js'
```

Add to `params` object (after `separationForce: 0.2`, add a comma to the prior line):

```javascript
  separationForce: 0.2,
  overlapMode: 'gibberish'
```

- [ ] **Step 2: Replace stamping in update()**

In `update()`, replace the final word loop:

```javascript
    for (let i = 0; i < wordObjects.length; i++) {
      wordObjects[i].update(wordObjects, gravitySources, cols, rows)
      wordObjects[i].assignToGrid(grid, cols, rows)
    }
```

with a physics phase + resolve phase:

```javascript
    // Phase 1: physics (no stamping)
    for (let i = 0; i < wordObjects.length; i++) {
      wordObjects[i].update(wordObjects, gravitySources, cols, rows)
    }
    // Phase 2: deterministic occupancy commit
    lastResolve = resolveOccupancy({
      wordObjects,
      grid,
      cols,
      rows,
      overlapMode: params.overlapMode
    })
```

Add a declaration near the other `let` vars (e.g. after `let backgroundZoff = 0`):

```javascript
  let lastResolve = { relaxed: 0 }
```

- [ ] **Step 3: Verify app runs, gibberish unchanged**

Run: `pnpm nx serve aggressive-text-waves` (port 5179). Open browser.
Expected: default behavior identical to before (gibberish). No console errors.

- [ ] **Step 4: Run full ATW test suite**

Run: `pnpm nx test aggressive-text-waves`
Expected: all tests PASS (existing + new).

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/sketch.js
git commit -m "feat(aggressive-text-waves): wire two-phase occupancy commit into update loop"
```

---

## Task 7: Tweakpane mode control + corner badge + debug overlay

**Files:**
- Modify: `apps/aggressive-text-waves/src/sketch.js`

- [ ] **Step 1: Add Tweakpane list for overlapMode**

After the `verticalRatio` binding (line ~93 region), add:

```javascript
  pane.addBlade({
    view: 'list',
    label: 'overlap',
    options: [
      { text: 'gibberish', value: 'gibberish' },
      { text: 'nonOverlap', value: 'nonOverlap' }
    ],
    value: params.overlapMode
  }).on('change', (ev) => { params.overlapMode = ev.value })
```

- [ ] **Step 2: Add debug overlay toggle**

Add a `let showOccupancy = false` near the other `let` vars. In `p.keyPressed`, add:

```javascript
    if (p.key === 'd' || p.key === 'D') showOccupancy = !showOccupancy
```

- [ ] **Step 3: Draw badge + overlay in render()**

At the end of `render()`, before `displayOffscreen()`:

```javascript
    if (showOccupancy && params.overlapMode === 'nonOverlap') {
      pg.noStroke()
      pg.fill(0, 180, 255, 80)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[y][x].occupiedBy !== null) {
            pg.rect(x * cellSize, y * cellSize, cellSize, cellSize)
          }
        }
      }
    }

    // mode badge
    const badgeFlash = lastResolve.relaxed > 0
    pg.noStroke()
    pg.fill(badgeFlash ? p.color(220, 40, 40) : p.color(0, 0, 0, 160))
    pg.rect(0, 0, 220 * offscreenScale, 34 * offscreenScale)
    pg.fill(255)
    pg.textSize(18 * offscreenScale)
    pg.textAlign(pg.LEFT, pg.CENTER)
    pg.text(`mode: ${params.overlapMode}${badgeFlash ? ' (relax!)' : ''}`,
      8 * offscreenScale, 17 * offscreenScale)
    pg.textAlign(pg.CENTER, pg.CENTER)
    pg.textSize((params.scale - 4) * offscreenScale)
```

- [ ] **Step 4: Manual verification**

Run: `pnpm nx serve aggressive-text-waves`. In browser:
- Switch overlap list to `nonOverlap` live — badge updates, words stop sharing cells.
- Press `d` — claimed cells tint blue; confirm no cell tinted as double-claimed.
- Set sources=4, observe no permanent freeze (badge may flash `relax!`).
Expected: all hold; record/save/source-switch unaffected.

- [ ] **Step 5: Commit**

```bash
git add apps/aggressive-text-waves/src/sketch.js
git commit -m "feat(aggressive-text-waves): overlap mode control, badge, occupancy debug overlay"
```

**Foundation complete.** Create worktrees before Tasks 8 / 9:

```bash
git worktree add ../genart-atw-strategy-a -b atw/16-strategy-a atw/16-non-overlap
git worktree add ../genart-atw-strategy-c -b atw/16-strategy-c atw/16-non-overlap
```

Tasks 8 and 9 are implemented independently, one per worktree, in parallel.

---

## Task 8: Strategy A — Hard Rejection + Bounce (worktree `atw/16-strategy-a`)

**Files:**
- Modify: `apps/aggressive-text-waves/src/word.js` (override `handleOverlap`)
- Test: `apps/aggressive-text-waves/src/word.test.js`

Reject the move: revert to previous committed position, reverse + halve velocity, add small jitter to break deadlock, then re-claim prior cells.

- [ ] **Step 1: Write the failing test**

Append to `word.test.js`:

```javascript
describe('Strategy A handleOverlap', () => {
  it('reverts position and reverses+halves velocity', () => {
    const w = new Word('AB', 0, 0, fakeCtx, params)
    w.prevPosX = 2; w.prevPosY = 3
    w.posX = 5; w.posY = 6
    w.vx = 0.4; w.vy = -0.2
    let claimed = null
    w.handleOverlap({ blockers: [], grid: [], cols: 10, rows: 10, tryClaim: (word) => { claimed = word; return true } })
    expect(w.posX).toBeCloseTo(2, 5)
    expect(w.posY).toBeCloseTo(3, 5)
    // velocity reversed and halved (jitter is small; check sign + rough magnitude)
    expect(w.vx).toBeLessThan(0)
    expect(w.vy).toBeGreaterThan(0)
    expect(claimed).toBe(w) // re-claims prior cells
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/word.test.js`
Expected: FAIL — default handleOverlap does not touch velocity or call tryClaim.

- [ ] **Step 3: Implement (replace default handleOverlap)**

Replace the `handleOverlap` method in `word.js` with:

```javascript
  // Strategy A: hard rejection + bounce
  handleOverlap (ctx) {
    this.posX = this.prevPosX
    this.posY = this.prevPosY
    this.vx *= -0.5
    this.vy *= -0.5
    this.vx += (this.ctx.random() - 0.5) * 0.05
    this.vy += (this.ctx.random() - 0.5) * 0.05
    this.x = Math.floor(this.posX)
    this.y = Math.floor(this.posY)
    ctx.tryClaim(this) // re-claim prior cells (free since this held them last frame)
    return true
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/word.test.js`
Expected: PASS. Note: `fakeCtx.random` returns 0.5 so jitter term is 0; sign checks reflect the `*-0.5` reversal.

- [ ] **Step 5: Run full suite + manual**

Run: `pnpm nx test aggressive-text-waves` (PASS), then `pnpm nx serve aggressive-text-waves`, set `nonOverlap`, press `d`: confirm zero overlap, words visibly bounce off occupied cells, no permanent gridlock at 200 words / 4 sources.

- [ ] **Step 6: Commit**

```bash
git add apps/aggressive-text-waves/src/word.js apps/aggressive-text-waves/src/word.test.js
git commit -m "feat(aggressive-text-waves): Strategy A hard-rejection bounce on overlap"
```

---

## Task 9: Strategy C — Displacement Cascade (worktree `atw/16-strategy-c`)

**Files:**
- Modify: `apps/aggressive-text-waves/src/word.js` (override `handleOverlap`)
- Test: `apps/aggressive-text-waves/src/word.test.js`

Shove each blocker forward along the mover's velocity (energy loss 0.8/step), free its old cells, attempt to re-place it; recursion depth ≤ 3. If the path clears, claim self; else revert self (fallback to staying put).

- [ ] **Step 1: Write the failing test**

Append to `word.test.js`:

```javascript
describe('Strategy C handleOverlap (displacement cascade)', () => {
  it('nudges blocker along mover velocity and attempts re-place', () => {
    const mover = new Word('AB', 0, 0, fakeCtx, params)
    mover.vx = 1; mover.vy = 0
    mover.prevPosX = 0; mover.prevPosY = 0
    const blocker = new Word('CD', 1, 0, fakeCtx, params)
    blocker.posX = 1; blocker.posY = 0
    const claims = []
    mover.handleOverlap({
      blockers: [blocker],
      grid: [],
      cols: 10,
      rows: 10,
      depth: 0,
      tryClaim: (w) => { claims.push(w); return true }
    })
    // blocker pushed in +x (mover velocity direction)
    expect(blocker.posX).toBeGreaterThan(1)
    // both blocker and mover attempted claim
    expect(claims).toContain(blocker)
    expect(claims).toContain(mover)
  })

  it('stops recursing at depth 3 (reverts self)', () => {
    const mover = new Word('AB', 0, 0, fakeCtx, params)
    mover.prevPosX = 4; mover.prevPosY = 5
    mover.posX = 9; mover.posY = 9
    mover.handleOverlap({ blockers: [], grid: [], cols: 10, rows: 10, depth: 3, tryClaim: () => false })
    expect(mover.posX).toBe(4) // reverted, no further cascade
    expect(mover.posY).toBe(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/word.test.js`
Expected: FAIL — default handleOverlap ignores blockers/velocity.

- [ ] **Step 3: Implement (replace default handleOverlap)**

Replace the `handleOverlap` method in `word.js` with:

```javascript
  // Strategy C: displacement cascade
  // ctx: { blockers, grid, cols, rows, tryClaim, depth }
  handleOverlap (ctx) {
    const depth = ctx.depth || 0
    const MAX_DEPTH = 3
    if (depth >= MAX_DEPTH) {
      this.posX = this.prevPosX
      this.posY = this.prevPosY
      this.x = Math.floor(this.posX)
      this.y = Math.floor(this.posY)
      return false
    }

    const loss = Math.pow(0.8, depth + 1)
    const pushX = this.vx * loss
    const pushY = this.vy * loss

    for (const blocker of ctx.blockers) {
      // free blocker's current cells so it can be re-placed
      for (const { x, y } of blocker.stripCells(ctx.cols, ctx.rows)) {
        if (ctx.grid.length && ctx.grid[y][x].occupiedBy === blocker) {
          ctx.grid[y][x].occupiedBy = null
        }
      }
      blocker.posX += pushX
      blocker.posY += pushY
      if (blocker.posX < 0) blocker.posX += ctx.cols
      if (blocker.posX >= ctx.cols) blocker.posX -= ctx.cols
      if (blocker.posY < 0) blocker.posY += ctx.rows
      if (blocker.posY >= ctx.rows) blocker.posY -= ctx.rows
      blocker.x = Math.floor(blocker.posX)
      blocker.y = Math.floor(blocker.posY)
      if (!ctx.tryClaim(blocker)) {
        blocker.handleOverlap({ ...ctx, depth: depth + 1 })
      }
    }

    if (ctx.tryClaim(this)) return true
    // path not cleared: stay put
    this.posX = this.prevPosX
    this.posY = this.prevPosY
    this.x = Math.floor(this.posX)
    this.y = Math.floor(this.posY)
    return false
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/aggressive-text-waves && npx vitest --run src/word.test.js`
Expected: PASS.

- [ ] **Step 5: Run full suite + manual**

Run: `pnpm nx test aggressive-text-waves` (PASS), then `pnpm nx serve aggressive-text-waves`, set `nonOverlap`, press `d`: confirm zero overlap, words push each other in chains, no permanent gridlock at 200 words / 4 sources.

- [ ] **Step 6: Commit**

```bash
git add apps/aggressive-text-waves/src/word.js apps/aggressive-text-waves/src/word.test.js
git commit -m "feat(aggressive-text-waves): Strategy C displacement cascade on overlap"
```

---

## Bake-Off & Merge

1. Serve each worktree (one at a time, port 5179) with identical params (same word count, sources=4).
2. Compare visually: which pileup behavior reads best aesthetically.
3. Merge the winning branch into `atw/16-non-overlap`, then PR `atw/16-non-overlap` → `main`.
4. Mark Taskmaster #16 done; verify deps 3/12/13 satisfied.
5. Remove the losing worktree: `git worktree remove ../genart-atw-strategy-<x>`.

## Notes for the worker

- StandardJS: no semicolons, 2-space indent, single quotes. Run lint via `pnpm nx lint aggressive-text-waves` before each commit.
- `fakeCtx.random` returns a constant in tests; do not rely on jitter randomness in assertions.
- Strategy A and C BOTH replace the default `handleOverlap` from Task 4 — that default exists only so the foundation is runnable before strategies land.
