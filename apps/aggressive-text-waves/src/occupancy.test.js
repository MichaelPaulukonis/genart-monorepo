import { describe, it, expect } from 'vitest'
import { Cell } from './cell.js'
import { cellsFree, stampWord, resolveOccupancy } from './occupancy.js'
import { Word } from './word.js'

const fakeCtx = { random: () => 0.5, noise: () => 0.5 }
const wordParams = { verticalRatio: 0 }

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
  const w = new Word(text, x, y, fakeCtx, wordParams)
  w.x = x; w.y = y; w.isVertical = false
  return w
}

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

  it('nonOverlap mode: every occupied cell is consistent with its occupant', () => {
    const grid = makeGrid(10, 10)
    // overlapping + adjacent words competing for cells
    const words = [makeWord('AB', 0, 0), makeWord('CD', 0, 0), makeWord('EF', 1, 1)]
    words.forEach(w => { w.prevPosX = w.x; w.prevPosY = w.y })
    resolveOccupancy({ wordObjects: words, grid, cols: 10, rows: 10, overlapMode: 'nonOverlap' })
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const occ = grid[y][x].occupiedBy
        if (occ === null) continue
        // the occupant must actually cover this cell with the stamped letter — no cross-word contamination
        const owned = occ.stripCells(10, 10).find(c => c.x === x && c.y === y)
        expect(owned).toBeTruthy()
        expect(grid[y][x].letter).toBe(owned.char)
      }
    }
  })
})
