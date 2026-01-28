/**
 * Closed walk generator for loopable animations.
 * Builds a sequence of ordered image pairs where consecutive states
 * share exactly one image index and the walk starts and ends on the same state.
 */

const DEFAULT_MAX_ATTEMPTS = 10

function countStates (imagesA, imagesB) {
  let count = 0
  imagesA.forEach(a => {
    imagesB.forEach(b => {
      if (a !== b) count += 1
    })
  })
  return count
}

function signature (imagesA, imagesB) {
  return `${imagesA.join('|')}::${imagesB.join('|')}`
}

export class ClosedWalkGenerator {
  constructor ({ images, imageSetA, imageSetB, loopLength, maxAttempts = DEFAULT_MAX_ATTEMPTS, rng = Math.random }) {
    this.imagesA = imageSetA || images || []
    this.imagesB = imageSetB || images || []
    this.loopLength = loopLength
    this.maxAttempts = maxAttempts
    this.rng = rng

    this.validateLoopLength(this.loopLength)
    const cacheKey = signature(this.imagesA, this.imagesB)
    if (!ClosedWalkGenerator.graphCache.has(cacheKey)) {
      ClosedWalkGenerator.graphCache.set(cacheKey, this.buildAdjacencyGraph())
    }
    this.graph = ClosedWalkGenerator.graphCache.get(cacheKey)
  }

  static graphCache = new Map()

  static validateLoopLengthStatic (imagesA, imagesB, loopLength) {
    if (!Array.isArray(imagesA) || !Array.isArray(imagesB)) {
      throw new Error('images must be arrays')
    }
    if (typeof loopLength !== 'number' || Number.isNaN(loopLength)) {
      throw new Error('loopLength must be a number')
    }
    if (loopLength < 3) {
      throw new Error('loopLength must be at least 3 to form a closed walk')
    }

    const uniqueImages = new Set([...imagesA, ...imagesB])
    if (uniqueImages.size < 3) {
      throw new Error('At least 3 unique images are required to build a loop')
    }

    const maxStates = countStates(imagesA, imagesB)
    // Need loopLength - 1 transitions through available states before closing to start
    if (loopLength - 1 > maxStates) {
      throw new Error(`loopLength too large for available images (max ${maxStates + 1})`)
    }

    return true
  }

  validateLoopLength (loopLength) {
    return ClosedWalkGenerator.validateLoopLengthStatic(this.imagesA, this.imagesB, loopLength)
  }

  buildAdjacencyGraph () {
    const states = []
    const adjacency = new Map()

    this.imagesA.forEach(a => {
      this.imagesB.forEach(b => {
        if (a === b) return
        const state = { a, b }
        states.push(state)
        adjacency.set(this.getStateKey(state), [])
      })
    })

    // Populate adjacency lists
    states.forEach(state => {
      const key = this.getStateKey(state)
      const neighbors = []
      states.forEach(candidate => {
        if (state === candidate) return
        if (this.areAdjacent(state, candidate)) {
          neighbors.push(candidate)
        }
      })
      adjacency.set(key, neighbors)
    })

    return { states, adjacency }
  }

  areAdjacent (state1, state2) {
    if (!state1 || !state2) return false
    if (state1.a === state1.b || state2.a === state2.b) return false

    const shareA = state1.a === state2.a || state1.a === state2.b
    const shareB = state1.b === state2.a || state1.b === state2.b
    return shareA !== shareB
  }

  getStateKey (state) {
    return `${state.a}|${state.b}`
  }

  getRandomState (states) {
    const index = Math.floor(this.rng() * states.length)
    return states[Math.max(0, Math.min(states.length - 1, index))]
  }

  selectNextState ({ current, neighbors, startState, visited, isClosingStep }) {
    let candidates = neighbors

    if (isClosingStep) {
      const closingCandidates = neighbors.filter(n => this.areAdjacent(n, startState))
      if (closingCandidates.length > 0) {
        candidates = closingCandidates
      }
    }

    const unvisited = candidates.filter(n => !visited.has(this.getStateKey(n)))
    const pool = unvisited.length > 0 ? unvisited : candidates

    if (pool.length === 0) return null
    return this.getRandomState(pool)
  }

  generate () {
    const { states, adjacency } = this.graph
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const startState = this.getRandomState(states)
      const visited = new Set()
      visited.add(this.getStateKey(startState))

      const walk = [startState]
      let failed = false

      while (walk.length < this.loopLength - 1) {
        const current = walk[walk.length - 1]
        const neighbors = adjacency.get(this.getStateKey(current)) || []
        const isClosingStep = walk.length === this.loopLength - 2
        const next = this.selectNextState({ current, neighbors, startState, visited, isClosingStep })
        if (!next) {
          failed = true
          break
        }
        walk.push(next)
        visited.add(this.getStateKey(next))
      }

      if (failed) continue

      const penultimate = walk[walk.length - 1]
      if (!this.areAdjacent(penultimate, startState)) {
        continue
      }

      walk.push(startState)

      return {
        walk,
        metadata: {
          loopLength: this.loopLength,
          attempts: attempt + 1,
          imageCountA: this.imagesA.length,
          imageCountB: this.imagesB.length,
          uniqueImages: new Set([...this.imagesA, ...this.imagesB]).size
        }
      }
    }

    throw new Error('Failed to generate a closed walk after maximum attempts')
  }
}

export function validateLoopLength (images, loopLength, imageSetB) {
  const imagesA = images || []
  const imagesB = imageSetB || imagesA
  return ClosedWalkGenerator.validateLoopLengthStatic(imagesA, imagesB, loopLength)
}

export function generateClosedWalk ({ images, loopLength, imageSetA, imageSetB, maxAttempts, rng } = {}) {
  const generator = new ClosedWalkGenerator({
    images,
    imageSetA,
    imageSetB,
    loopLength,
    maxAttempts,
    rng
  })
  const result = generator.generate()
  return formatWalkForAnimation(result.walk, result.metadata)
}

/**
 * Async version of generateClosedWalk that yields to the event loop.
 * Useful for large image sets where graph construction may take 100-200ms.
 * Calls onProgress callback during graph construction if provided.
 *
 * @param {Object} options - Same as generateClosedWalk
 * @param {Function} onProgress - Callback(phase) during graph building: 'preparing', 'generating', 'formatting'
 * @returns {Promise} Resolves to formatted animation sequence
 */
export async function generateClosedWalkAsync ({ images, loopLength, imageSetA, imageSetB, maxAttempts, rng, onProgress } = {}) {
  // Yield control to allow UI updates/spinner to render
  await new Promise(resolve => setTimeout(resolve, 0))

  if (onProgress) onProgress('preparing')

  const imagesA = imageSetA || images || []
  const imagesB = imageSetB || images || []

  // Check if graph is already cached
  const cacheKey = signature(imagesA, imagesB)
  let graphWasBuilt = false
  if (!ClosedWalkGenerator.graphCache.has(cacheKey)) {
    graphWasBuilt = true
    if (onProgress) onProgress('building-graph')
    // Yield again to allow rendering before expensive computation
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  if (onProgress) onProgress('generating')
  const result = generateClosedWalk({ images, loopLength, imageSetA, imageSetB, maxAttempts, rng })

  if (onProgress) onProgress('complete')
  return result
}

export function formatWalkForAnimation (walk, metadata = {}) {
  const frames = walk.map((pair, frameIndex) => ({
    frame: frameIndex,
    pair: { a: pair.a, b: pair.b },
    imageIndices: {
      aIndex: typeof pair.a === 'string' ? pair.a : pair.a,
      bIndex: typeof pair.b === 'string' ? pair.b : pair.b
    }
  }))

  return {
    frames,
    totalFrames: walk.length,
    isLoop: walk[0] === walk[walk.length - 1],
    metadata: {
      generatedAt: new Date().toISOString(),
      loopLength: metadata.loopLength,
      attempts: metadata.attempts,
      imageCountA: metadata.imageCountA,
      imageCountB: metadata.imageCountB,
      uniqueImages: metadata.uniqueImages,
      ...metadata
    }
  }
}
