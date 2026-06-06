import { describe, it, expect } from 'vitest'
import { Cell } from './cell.js'
import { cellsFree, stampWord } from './occupancy.js'
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
