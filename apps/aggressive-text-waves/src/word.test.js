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
    expect(left.vx).toBeLessThan(0)
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
    a.xoff = 10; b.xoff = 5
    a._applySeparation([a, b])
    expect(a.vx).toBeCloseTo(2 * 0.2)
    expect(a.vy).toBe(0)
  })

  it('pushes a horizontal word away from a crossing vertical word\'s center', () => {
    // v occupies x=5, y=[3,7); h occupies x=[5,8), y=3 -> touches() returns 1 (crossing)
    // h center = (6.5, 3.5), v center = (5.5, 5) -> dx=+1.0, dy=-1.5
    // push direction is away from v's center: +x (right) and -y (up)
    const v = makeWord('ABCD', 5, 3, true)
    const h = makeWord('XYZ', 5, 3, false)
    h._applySeparation([h, v])
    expect(h.vx).toBeGreaterThan(0)
    expect(h.vy).toBeLessThan(0)
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
