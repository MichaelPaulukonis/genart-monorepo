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

  it('wraps vertically on rows', () => {
    const w = new Word('AB', 0, 9, fakeCtx, params)
    w.x = 0; w.y = 9; w.isVertical = true
    expect(w.stripCells(10, 10)).toEqual([
      { x: 0, y: 9, char: 'A' },
      { x: 0, y: 0, char: 'B' }
    ])
  })
})

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
