/**
 * Closed walk generator for loopable animations.
 * Builds a sequence of ordered image pairs where consecutive states
 * share exactly one image index and the walk starts and ends on the same state.
 * Enforces that no image appears in more than 2 consecutive frames,
 * allowing images to reappear later but preventing continuous chains.
 */

const DEFAULT_MAX_ATTEMPTS = 1000

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

    // State persistence
    this.currentState = null // Stores current generated walk state
    this.stateHistory = [] // History of generated walks for regeneration

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

  selectNextState ({ current, neighbors, startState, visited, isClosingStep, walk }) {
    let candidates = neighbors

    if (isClosingStep) {
      const closingCandidates = neighbors.filter(n => this.areAdjacent(n, startState))
      if (closingCandidates.length > 0) {
        candidates = closingCandidates
      }
    }

    // Prevent images from appearing in more than 2 consecutive frames
    // Check the last 2 frames: if an image appeared in both, it cannot appear in the next frame
    if (walk && walk.length >= 2) {
      const prevFrame = walk[walk.length - 2]
      const prevImages = new Set([prevFrame.a, prevFrame.b])
      const currentImages = new Set([current.a, current.b])
      
      // Find images that appeared in both previous and current frames
      const consecutiveImages = new Set()
      for (const img of prevImages) {
        if (currentImages.has(img)) {
          consecutiveImages.add(img)
        }
      }
      
      // Filter out candidates that contain any image that appeared in last 2 frames
      if (consecutiveImages.size > 0) {
        candidates = candidates.filter(candidate => {
          return !consecutiveImages.has(candidate.a) && !consecutiveImages.has(candidate.b)
        })
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
        const next = this.selectNextState({ current, neighbors, startState, visited, isClosingStep, walk })
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

      // Verify closing the loop doesn't create a 3+ consecutive appearance
      // Check if startState images appeared in both of the last 2 frames
      if (walk.length >= 2) {
        const lastFrame = walk[walk.length - 1]
        const secondLastFrame = walk[walk.length - 2]
        const lastImages = new Set([lastFrame.a, lastFrame.b])
        const secondLastImages = new Set([secondLastFrame.a, secondLastFrame.b])
        
        // Find images in both last frames
        const consecutiveInLast = new Set()
        for (const img of lastImages) {
          if (secondLastImages.has(img)) {
            consecutiveInLast.add(img)
          }
        }
        
        // If startState contains an image that appeared in last 2 frames, can't close
        if (consecutiveInLast.has(startState.a) || consecutiveInLast.has(startState.b)) {
          continue
        }
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

  /**
   * Generate a closed walk with automatic fallback to shorter lengths if requested length is impossible.
   * Attempts to generate the requested loop length. If that fails after max attempts,
   * automatically tries progressively shorter lengths to find the longest viable loop.
   * 
   * @returns {Object} Walk result with metadata including actual loopLength achieved
   * @throws Only if no valid closed walk can be generated at any length
   */
  generateWithFallback () {
    const minLoopLength = 3
    const requestedLength = this.loopLength
    let lastError = null

    // Try requested length first
    try {
      return this.generate()
    } catch (error) {
      lastError = error
    }

    // Fallback: try progressively shorter lengths
    for (let tryLength = requestedLength - 1; tryLength >= minLoopLength; tryLength--) {
      try {
        // Temporarily set shorter loop length
        this.loopLength = tryLength

        const result = this.generate()
        
        // Restore original length in metadata for reference
        result.metadata.requestedLoopLength = requestedLength
        result.metadata.achievedLoopLength = tryLength
        result.metadata.isLoopFallback = tryLength < requestedLength

        return result
      } catch (error) {
        // Continue trying shorter lengths
        lastError = error
      }
    }

    // If we get here, no viable walk exists at any length
    throw new Error(`Could not generate any closed walk between lengths 3 and ${requestedLength}: ${lastError?.message || 'Unknown error'}`)
  }

  /**
   * Save the current walk state to the instance for later retrieval
   * @param {Object} walkResult - Result from generate() or generateWithFallback()
   * @returns {Object} The saved state
   */
  saveState (walkResult) {
    const state = {
      walk: walkResult.walk,
      metadata: { ...walkResult.metadata },
      savedAt: new Date().toISOString(),
      imageSetA: [...this.imagesA],
      imageSetB: [...this.imagesB]
    }

    this.currentState = state
    this.stateHistory.push(state)

    // Keep history limited to last 10 states
    if (this.stateHistory.length > 10) {
      this.stateHistory.shift()
    }

    return state
  }

  /**
   * Get the current saved walk state
   * @returns {Object|null} Current state or null if no state saved
   */
  getCurrentState () {
    return this.currentState
  }

  /**
   * Get the history of saved states
   * @returns {Array} Array of previous states
   */
  getStateHistory () {
    return this.stateHistory
  }

  /**
   * Clear the current state
   */
  clearCurrentState () {
    this.currentState = null
  }

  /**
   * Clear all state history
   */
  clearStateHistory () {
    this.currentState = null
    this.stateHistory = []
  }

  /**
   * Restore a previous state from history
   * @param {number} index - Index in history (0 = oldest, length-1 = newest)
   * @returns {Object} The restored state
   * @throws If index is out of bounds
   */
  restoreState (index) {
    if (index < 0 || index >= this.stateHistory.length) {
      throw new Error(`Invalid state history index: ${index}. Valid range: 0-${this.stateHistory.length - 1}`)
    }
    this.currentState = this.stateHistory[index]
    return this.currentState
  }


  /**
   * Clear the adjacency graph cache
   * Useful for memory management and testing
   */
  static clearCache () {
    ClosedWalkGenerator.graphCache.clear()
  }

  /**
   * Get cache statistics for debugging
   * @returns {Object} Cache stats including size and entries
   */
  static getCacheStats () {
    return {
      size: ClosedWalkGenerator.graphCache.size,
      entries: Array.from(ClosedWalkGenerator.graphCache.keys())
    }
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
  if (!ClosedWalkGenerator.graphCache.has(cacheKey)) {
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
  const isClosingFrame = (frameIndex) => {
    if (walk.length < 2 || frameIndex !== walk.length - 1) return false
    const first = walk[0]
    const last = walk[frameIndex]
    return first && last && first.a === last.a && first.b === last.b
  }

  const frames = walk.map((pair, frameIndex) => ({
    frame: frameIndex,
    loopFrame: isClosingFrame(frameIndex) ? 0 : frameIndex,
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
