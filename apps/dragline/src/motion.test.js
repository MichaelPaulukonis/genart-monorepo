import { describe, it, expect, vi } from 'vitest'
import { createMotionSystem, MOTION_CONFIG, velocityFriction, easeTween } from './motion.js'

// Deterministic rng: yields supplied values in order, then repeats.
function seqRng (values) {
  let i = 0
  return () => values[i++ % values.length]
}

const cfg = { ...MOTION_CONFIG, friction: 0.9, settleEpsilon: 0.05 }

const makeGrid = () => ({ cols: 40, rows: 30, cellSize: 15 })
const makeBlocks = () => [
  { x: 5, y: 5, w: 4, h: 3 },
  { x: 20, y: 10, w: 6, h: 2 }
]

function build (overrides = {}) {
  const blocks = overrides.blocks ?? makeBlocks()
  return createMotionSystem({
    grid: makeGrid(),
    getBlocks: () => blocks,
    requestDisplay: vi.fn(),
    rng: () => 0.5,
    ...overrides
  })
}

describe('MOTION_CONFIG', () => {
  it('defines the required numeric tuning fields', () => {
    for (const k of ['minSpeed', 'maxSpeed', 'friction', 'settleEpsilon', 'minDuration', 'maxDuration']) {
      expect(typeof MOTION_CONFIG[k]).toBe('number')
    }
  })
})

describe('createMotionSystem', () => {
  it('is inactive before any impulse', () => {
    expect(build().isActive()).toBe(false)
  })

  it('exposes the first strategy name by default', () => {
    expect(build().strategyName()).toBe('velocity-friction')
  })

  it('cycles through strategies and wraps around', () => {
    const m = build()
    expect(m.strategyName()).toBe('velocity-friction')
    m.cycleStrategy()
    expect(m.strategyName()).toBe('ease-tween')
    m.cycleStrategy()
    expect(m.strategyName()).toBe('velocity-friction')
  })

  it('becomes active after impulse', () => {
    const m = build()
    m.impulse()
    expect(m.isActive()).toBe(true)
  })

  it('settles and goes inactive after enough update frames', () => {
    const m = build()
    m.impulse()
    let frames = 0
    while (m.update() && frames < 10000) frames++
    expect(frames).toBeLessThan(10000)
    expect(m.isActive()).toBe(false)
  })

  it('treats impulse with zero blocks as a no-op', () => {
    const m = build({ blocks: [] })
    m.impulse()
    expect(m.isActive()).toBe(false)
  })

  it('finishes the current throw under its own strategy when cycled mid-flight', () => {
    const blocks = makeBlocks()
    const m = build({ blocks })
    m.impulse() // velocity-friction
    m.update()
    m.cycleStrategy() // select ease-tween for NEXT throw
    let frames = 0
    while (m.update() && frames < 10000) frames++
    expect(frames).toBeLessThan(10000)
    for (const b of blocks) {
      expect(Number.isFinite(b.x)).toBe(true)
      expect(Number.isFinite(b.y)).toBe(true)
    }
    expect(m.strategyName()).toBe('ease-tween') // next throw will use the cycled one
  })
})

describe('velocityFriction strategy', () => {
  const grid = { cols: 40, rows: 30, cellSize: 15 }
  const area = () => ({ x: 5, y: 5, w: 4, h: 3 })

  it('seeds float position from the block and a velocity within [minSpeed, maxSpeed]', () => {
    const a = area()
    const state = velocityFriction.init(a, grid, () => 0.5, cfg)
    expect(state.fx).toBe(5)
    expect(state.fy).toBe(5)
    const speed = Math.hypot(state.vx, state.vy)
    expect(speed).toBeGreaterThanOrEqual(cfg.minSpeed - 1e-9)
    expect(speed).toBeLessThanOrEqual(cfg.maxSpeed + 1e-9)
  })

  it('advances the block by its velocity each step and writes rounded grid coords', () => {
    const a = area()
    const state = { vx: 1, vy: 0, fx: 5, fy: 5 }
    const done = velocityFriction.step(a, state, grid, cfg)
    expect(state.fx).toBeCloseTo(6, 5)
    expect(a.x).toBe(6)
    expect(done).toBe(false)
  })

  it('bounces off the right edge: inverts vx and clamps inside bounds', () => {
    const a = area() // w = 4, so max x = cols - w = 36
    const state = { vx: 2, vy: 0, fx: 35, fy: 5 }
    velocityFriction.step(a, state, grid, cfg)
    expect(state.vx).toBeLessThan(0)
    expect(state.fx).toBeLessThanOrEqual(36)
    expect(a.x).toBeLessThanOrEqual(36)
  })

  it('bounces off the left edge: inverts vx and clamps at zero', () => {
    const a = area()
    const state = { vx: -2, vy: 0, fx: 1, fy: 5 }
    velocityFriction.step(a, state, grid, cfg)
    expect(state.vx).toBeGreaterThan(0)
    expect(state.fx).toBeGreaterThanOrEqual(0)
    expect(a.x).toBeGreaterThanOrEqual(0)
  })

  it('applies friction so speed decays each step', () => {
    const a = area()
    const state = { vx: 1, vy: 0, fx: 10, fy: 10 }
    velocityFriction.step(a, state, grid, cfg)
    expect(Math.abs(state.vx)).toBeLessThan(1)
  })

  it('reports done once speed drops below settleEpsilon, within bounded frames', () => {
    const a = area()
    const state = velocityFriction.init(a, grid, seqRng([0.3, 1]), cfg)
    let frames = 0
    let done = false
    while (!done && frames < 1000) {
      done = velocityFriction.step(a, state, grid, cfg)
      frames++
    }
    expect(done).toBe(true)
    expect(Math.hypot(state.vx, state.vy)).toBeLessThan(cfg.settleEpsilon)
    expect(frames).toBeLessThan(1000)
  })

  it('keeps the block within grid bounds on every frame', () => {
    const a = area()
    const state = { vx: 3, vy: 2.5, fx: a.x, fy: a.y }
    for (let f = 0; f < 500; f++) {
      velocityFriction.step(a, state, grid, cfg)
      expect(a.x).toBeGreaterThanOrEqual(0)
      expect(a.x).toBeLessThanOrEqual(grid.cols - a.w)
      expect(a.y).toBeGreaterThanOrEqual(0)
      expect(a.y).toBeLessThanOrEqual(grid.rows - a.h)
    }
  })
})

describe('easeTween strategy', () => {
  const grid = { cols: 40, rows: 30, cellSize: 15 }
  const area = () => ({ x: 5, y: 5, w: 4, h: 3 })

  it('picks an in-bounds target, a duration within range, and records the start', () => {
    const a = area()
    const state = easeTween.init(a, grid, () => 1, cfg)
    expect(state.targetX).toBeGreaterThanOrEqual(0)
    expect(state.targetX).toBeLessThanOrEqual(grid.cols - a.w)
    expect(state.targetY).toBeGreaterThanOrEqual(0)
    expect(state.targetY).toBeLessThanOrEqual(grid.rows - a.h)
    expect(state.duration).toBeGreaterThanOrEqual(cfg.minDuration)
    expect(state.duration).toBeLessThanOrEqual(cfg.maxDuration)
    expect(state.startX).toBe(5)
    expect(state.startY).toBe(5)
  })

  it('lands exactly on the target on the final frame and reports done', () => {
    const a = area()
    const state = { targetX: 30, targetY: 20, startX: 5, startY: 5, duration: 3, elapsed: 0 }
    let done = false
    for (let f = 0; f < 3; f++) done = easeTween.step(a, state, grid, cfg)
    expect(a.x).toBe(30)
    expect(a.y).toBe(20)
    expect(done).toBe(true)
  })

  it('is not done before the duration elapses', () => {
    const a = area()
    const state = { targetX: 30, targetY: 20, startX: 5, startY: 5, duration: 3, elapsed: 0 }
    const done = easeTween.step(a, state, grid, cfg)
    expect(done).toBe(false)
  })

  it('applies an ease-out cubic curve (decelerating)', () => {
    // duration 2, after 1 frame t = 0.5, ease = 1 - (1-0.5)^3 = 0.875
    const a = { x: 0, y: 0, w: 1, h: 1 }
    const state = { targetX: 8, targetY: 0, startX: 0, startY: 0, duration: 2, elapsed: 0 }
    easeTween.step(a, state, grid, cfg)
    expect(a.x).toBe(7) // round(8 * 0.875) = round(7) = 7
  })

  it('keeps the block within grid bounds on every frame', () => {
    const a = area()
    const state = easeTween.init(a, grid, seqRng([1, 1, 0.5]), cfg)
    let done = false
    let frames = 0
    while (!done && frames < 1000) {
      done = easeTween.step(a, state, grid, cfg)
      expect(a.x).toBeGreaterThanOrEqual(0)
      expect(a.x).toBeLessThanOrEqual(grid.cols - a.w)
      expect(a.y).toBeGreaterThanOrEqual(0)
      expect(a.y).toBeLessThanOrEqual(grid.rows - a.h)
      frames++
    }
    expect(done).toBe(true)
  })

  it('lands immediately when duration is degenerate (<= 0) without NaN', () => {
    const a = area()
    const state = { targetX: 12, targetY: 8, startX: 5, startY: 5, duration: 0, elapsed: 0 }
    const done = easeTween.step(a, state, grid, cfg)
    expect(done).toBe(true)
    expect(a.x).toBe(12)
    expect(a.y).toBe(8)
  })
})

describe('strategy config edge cases', () => {
  const grid = { cols: 40, rows: 30, cellSize: 15 }
  const area = () => ({ x: 10, y: 10, w: 4, h: 3 })

  it('velocity-friction settles in one step when friction is 0', () => {
    const a = area()
    const state = { vx: 1.5, vy: 1.2, fx: a.x, fy: a.y }
    const done = velocityFriction.step(a, state, grid, { friction: 0, settleEpsilon: 0.05 })
    expect(done).toBe(true)
    expect(state.vx).toBe(0)
    expect(state.vy).toBe(0)
  })

  it('velocity-friction never settles when friction is >= 1 (documents the footgun)', () => {
    const a = area()
    const state = { vx: 1, vy: 0, fx: a.x, fy: a.y }
    let done = false
    for (let f = 0; f < 200 && !done; f++) {
      done = velocityFriction.step(a, state, grid, { friction: 1, settleEpsilon: 0.05 })
    }
    expect(done).toBe(false)
  })
})
