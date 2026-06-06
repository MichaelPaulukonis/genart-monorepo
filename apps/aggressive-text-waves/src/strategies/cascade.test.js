import { describe, it, expect } from 'vitest'
import { Word } from '../word.js'
import { Cell } from '../cell.js'
import { cascade } from './cascade.js'

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

describe('cascade strategy', () => {
  it('nudges a blocker forward along the mover velocity and re-places, returns true', () => {
    const grid = makeGrid(10, 10)
    const mover = makeWord('AB', 0, 0)
    mover.vx = 1; mover.vy = 0
    mover.prevPosX = 0; mover.prevPosY = 0
    const blocker = makeWord('CD', 1, 0)
    blocker.posX = 1; blocker.posY = 0
    const claims = []
    const result = cascade(mover, {
      blockers: [blocker],
      grid,
      cols: 10,
      rows: 10,
      depth: 0,
      tryClaim: (w) => { claims.push(w); return true }
    })
    expect(blocker.posX).toBeGreaterThan(1) // pushed +x (loss 0.8 => +0.8)
    expect(claims).toContain(blocker)
    expect(claims).toContain(mover)
    expect(result).toBe(true)
  })

  it('stops at MAX_DEPTH (3): reverts and returns false', () => {
    const w = makeWord('AB', 0, 0)
    w.prevPosX = 4; w.prevPosY = 5
    w.posX = 9; w.posY = 9
    const result = cascade(w, { blockers: [], grid: [], cols: 10, rows: 10, depth: 3, tryClaim: () => false })
    expect(w.posX).toBe(4)
    expect(w.posY).toBe(5)
    expect(result).toBe(false)
  })

  it('reverts and returns false when the mover cannot claim after clearing', () => {
    const w = makeWord('AB', 0, 0)
    w.prevPosX = 1; w.prevPosY = 2
    w.posX = 7; w.posY = 8
    const result = cascade(w, { blockers: [], grid: [], cols: 10, rows: 10, depth: 0, tryClaim: () => false })
    expect(w.posX).toBe(1)
    expect(w.posY).toBe(2)
    expect(result).toBe(false)
  })
})
