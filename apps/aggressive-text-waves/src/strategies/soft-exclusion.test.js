import { describe, it, expect } from 'vitest'
import { Word } from '../word.js'
import { softExclusion } from './soft-exclusion.js'

const fakeCtx = { random: () => 0.5, noise: () => 0.5 }
const params = { verticalRatio: 0 }

describe('softExclusion strategy', () => {
  it('pushes velocity away from a blocker (inverse-square repulsion)', () => {
    const w = new Word('AB', 5, 5, fakeCtx, params)
    w.posX = 5; w.posY = 5; w.vx = 0; w.vy = 0
    const blocker = new Word('CD', 3, 5, fakeCtx, params) // to the left (lower x)
    blocker.posX = 3; blocker.posY = 5
    softExclusion(w, { blockers: [blocker], tryClaim: () => false })
    // word right of blocker (dx = +2) -> repelled in +x, no y component
    expect(w.vx).toBeGreaterThan(0)
    expect(w.vy).toBeCloseTo(0)
  })

  it('returns true when the claim succeeds', () => {
    const w = new Word('AB', 5, 5, fakeCtx, params)
    expect(softExclusion(w, { blockers: [], tryClaim: () => true })).toBe(true)
  })

  it('reverts and returns false when the claim fails', () => {
    const w = new Word('AB', 5, 5, fakeCtx, params)
    w.prevPosX = 1; w.prevPosY = 2
    w.posX = 9; w.posY = 9
    const result = softExclusion(w, { blockers: [], tryClaim: () => false })
    expect(result).toBe(false)
    expect(w.posX).toBe(1)
    expect(w.posY).toBe(2)
  })
})
