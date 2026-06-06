import { describe, it, expect } from 'vitest'
import { Word } from '../word.js'
import { Cell } from '../cell.js'
import { borderDensity, crystallizePostResolve, crystallize } from './crystallize.js'

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

function occupy (grid, coords) {
  for (const [x, y] of coords) grid[y][x].occupiedBy = {}
}

describe('borderDensity', () => {
  it('is 0 when no neighbors are occupied', () => {
    const grid = makeGrid(10, 10)
    expect(borderDensity(makeWord('A', 5, 5), grid, 10, 10)).toBe(0)
  })

  it('counts occupied fraction of the 8-neighborhood (single-cell word)', () => {
    const grid = makeGrid(10, 10)
    // 4 of the 8 neighbors of (5,5) occupied -> 0.5
    occupy(grid, [[4, 4], [5, 4], [6, 4], [4, 5]])
    expect(borderDensity(makeWord('A', 5, 5), grid, 10, 10)).toBeCloseTo(0.5)
  })

  it('wraps at edges without error', () => {
    const grid = makeGrid(10, 10)
    occupy(grid, [[9, 9], [0, 9], [1, 9]]) // neighbors of (0,0) wrap to row/col 9
    const d = borderDensity(makeWord('A', 0, 0), grid, 10, 10)
    expect(d).toBeGreaterThan(0)
    expect(d).toBeLessThanOrEqual(1)
  })

  it('excludes the word strip cells from the border', () => {
    const grid = makeGrid(10, 10)
    const w = makeWord('AB', 5, 5) // strip (5,5),(6,5)
    // mark the strip cells occupied; they must NOT count toward border density
    occupy(grid, [[5, 5], [6, 5]])
    expect(borderDensity(w, grid, 10, 10)).toBe(0)
  })
})

describe('crystallizePostResolve', () => {
  it('locks an unlocked word when density >= 0.6', () => {
    const grid = makeGrid(10, 10)
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) grid[y][x].occupiedBy = {}
    const w = makeWord('A', 5, 5)
    w.isLocked = false
    crystallizePostResolve([w], grid, 10, 10)
    expect(w.isLocked).toBe(true)
  })

  it('melts a locked word when density < 0.4', () => {
    const grid = makeGrid(10, 10) // empty -> density 0
    const w = makeWord('A', 5, 5)
    w.isLocked = true
    crystallizePostResolve([w], grid, 10, 10)
    expect(w.isLocked).toBe(false)
  })

  it('dead band 0.4-0.6: does not change lock state either way', () => {
    const grid = makeGrid(10, 10)
    occupy(grid, [[4, 4], [5, 4], [6, 4], [4, 5]]) // density 0.5 for (5,5)
    const unlocked = makeWord('A', 5, 5); unlocked.isLocked = false
    const locked = makeWord('A', 5, 5); locked.isLocked = true
    crystallizePostResolve([unlocked, locked], grid, 10, 10)
    expect(unlocked.isLocked).toBe(false) // 0.5 < 0.6, stays unlocked
    expect(locked.isLocked).toBe(true) // 0.5 >= 0.4, stays locked
  })
})

describe('crystallize handleOverlap', () => {
  it('reverts and returns false (locking handled post-resolve)', () => {
    const w = makeWord('AB', 9, 9)
    w.prevPosX = 1; w.prevPosY = 2
    w.posX = 9; w.posY = 9
    expect(crystallize(w, {})).toBe(false)
    expect(w.posX).toBe(1)
    expect(w.posY).toBe(2)
  })
})
