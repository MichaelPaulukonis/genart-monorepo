import { describe, it, expect } from 'vitest'
import { Word } from '../word.js'
import { rejectBounce } from './reject-bounce.js'

const fakeCtx = { random: () => 0.5, noise: () => 0.5 }
const params = { verticalRatio: 0 }

describe('rejectBounce strategy', () => {
  it('reverts position to prevPos', () => {
    const w = new Word('AB', 0, 0, fakeCtx, params)
    w.prevPosX = 2; w.prevPosY = 3
    w.posX = 5; w.posY = 6
    rejectBounce(w, { tryClaim: () => true })
    expect(w.posX).toBe(2)
    expect(w.posY).toBe(3)
    expect(w.x).toBe(2)
    expect(w.y).toBe(3)
  })

  it('reverses and halves velocity (jitter is 0 when random()===0.5)', () => {
    const w = new Word('AB', 0, 0, fakeCtx, params)
    w.vx = 0.4; w.vy = -0.2
    rejectBounce(w, { tryClaim: () => true })
    expect(w.vx).toBeCloseTo(-0.2)
    expect(w.vy).toBeCloseTo(0.1)
  })

  it('reverses velocity sign', () => {
    const w = new Word('AB', 0, 0, fakeCtx, params)
    w.vx = 0.4; w.vy = -0.2
    rejectBounce(w, { tryClaim: () => true })
    expect(w.vx).toBeLessThan(0)
    expect(w.vy).toBeGreaterThan(0)
  })

  it('returns true when tryClaim succeeds', () => {
    const w = new Word('AB', 0, 0, fakeCtx, params)
    expect(rejectBounce(w, { tryClaim: () => true })).toBe(true)
  })

  it('returns false when tryClaim fails', () => {
    const w = new Word('AB', 0, 0, fakeCtx, params)
    expect(rejectBounce(w, { tryClaim: () => false })).toBe(false)
  })
})
