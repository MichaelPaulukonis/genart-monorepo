// Automated block-movement system for dragline.
//
// Pure logic, framework-agnostic. The p5 sketch drives it from `p.draw` and
// triggers it from `p.keyPressed`. Blocks stay plain integer-grid objects;
// per-block kinematic state lives in an internal Map so save/JSON is unaffected.

export const MOTION_CONFIG = {
  minSpeed: 0.4, // cells per frame
  maxSpeed: 1.6, // cells per frame
  friction: 0.92, // velocity multiplier per frame
  settleEpsilon: 0.05, // speed below which a block is considered stopped
  minDuration: 30, // ease-tween glide length, frames
  maxDuration: 90 // ease-tween glide length, frames
}

// Strategy interface: { name, init(area, grid, rng, config) -> state,
//                       step(area, state, grid, config) -> done }

// Random initial velocity, friction decay, bounce off canvas edges.
export const velocityFriction = {
  name: 'velocity-friction',
  init (area, grid, rng, config) {
    const angle = rng() * Math.PI * 2
    const speed = config.minSpeed + rng() * (config.maxSpeed - config.minSpeed)
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      fx: area.x,
      fy: area.y
    }
  },
  step (area, state, grid, config) {
    state.fx += state.vx
    state.fy += state.vy

    const maxX = grid.cols - area.w
    const maxY = grid.rows - area.h

    if (state.fx < 0) { state.fx = 0; state.vx = -state.vx } else if (state.fx > maxX) { state.fx = maxX; state.vx = -state.vx }
    if (state.fy < 0) { state.fy = 0; state.vy = -state.vy } else if (state.fy > maxY) { state.fy = maxY; state.vy = -state.vy }

    state.vx *= config.friction
    state.vy *= config.friction

    area.x = Math.round(state.fx)
    area.y = Math.round(state.fy)

    return Math.hypot(state.vx, state.vy) < config.settleEpsilon
  }
}

// Random pre-clamped target + duration, ease-out cubic glide to an exact stop.
export const easeTween = {
  name: 'ease-tween',
  init (area, grid, rng, config) {
    const maxX = grid.cols - area.w
    const maxY = grid.rows - area.h
    return {
      targetX: Math.round(rng() * maxX),
      targetY: Math.round(rng() * maxY),
      startX: area.x,
      startY: area.y,
      duration: config.minDuration + Math.round(rng() * (config.maxDuration - config.minDuration)),
      elapsed: 0
    }
  },
  step (area, state, _grid, _config) {
    state.elapsed += 1
    const t = Math.min(1, state.elapsed / state.duration)
    const e = 1 - Math.pow(1 - t, 3) // easeOutCubic
    area.x = Math.round(state.startX + (state.targetX - state.startX) * e)
    area.y = Math.round(state.startY + (state.targetY - state.startY) * e)
    return t >= 1
  }
}

const STRATEGIES = [velocityFriction, easeTween]

export function createMotionSystem ({ grid, getBlocks, requestDisplay, rng = Math.random, config = MOTION_CONFIG }) {
  let strategyIndex = 0
  let active = false
  let runningStrategy = null // strategy driving the current animation
  const states = new Map() // area -> kinematic state

  const strategy = () => STRATEGIES[strategyIndex]

  function impulse () {
    states.clear()
    // Capture the strategy now so cycling mid-flight can't feed a block's
    // state into a different strategy's step (which would produce NaN).
    runningStrategy = strategy()
    const blocks = getBlocks() || []
    for (const area of blocks) {
      states.set(area, runningStrategy.init(area, grid, rng, config))
    }
    active = states.size > 0
  }

  function update () {
    if (!active) return false
    for (const [area, state] of states) {
      const done = runningStrategy.step(area, state, grid, config)
      if (done) states.delete(area)
    }
    active = states.size > 0
    requestDisplay()
    return active
  }

  return {
    impulse,
    update,
    isActive: () => active,
    cycleStrategy: () => { strategyIndex = (strategyIndex + 1) % STRATEGIES.length },
    strategyName: () => strategy().name
  }
}
