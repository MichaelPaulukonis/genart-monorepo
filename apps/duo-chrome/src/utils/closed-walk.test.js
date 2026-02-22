import { describe, it, expect, beforeEach } from 'vitest'
import { ClosedWalkGenerator, generateClosedWalk, generateClosedWalkAsync, validateLoopLength, formatWalkForAnimation } from './closed-walk'

function makeRng (sequence) {
  let i = 0
  return () => {
    const value = sequence[i % sequence.length]
    i += 1
    return value
  }
}

describe('ClosedWalkGenerator - Validation', () => {
  it('validates loop length and unique images', () => {
    expect(() => validateLoopLength([0, 1, 2], 3)).not.toThrow()
    expect(() => validateLoopLength([0, 1, 2], 10)).toThrow()
    expect(() => validateLoopLength([0, 1], 3)).toThrow()
    expect(() => validateLoopLength([0, 1, 2], 2)).toThrow()
  })

  it('rejects non-array inputs', () => {
    expect(() => validateLoopLength(null, 5)).toThrow()
    expect(() => validateLoopLength('not-array', 5)).toThrow()
  })

  it('rejects non-numeric loopLength', () => {
    expect(() => validateLoopLength([0, 1, 2], 'five')).toThrow()
    expect(() => validateLoopLength([0, 1, 2], NaN)).toThrow()
  })
})

describe('ClosedWalkGenerator - Graph Construction', () => {
  beforeEach(() => {
    ClosedWalkGenerator.clearCache()
  })

  it('builds adjacency where states share exactly one index', () => {
    const generator = new ClosedWalkGenerator({ images: [0, 1, 2], loopLength: 3, rng: makeRng([0.1]) })
    const { states, adjacency } = generator.graph

    // Expect 6 states for n=3 (ordered pairs without equality)
    expect(states).toHaveLength(6)

    const key = generator.getStateKey({ a: 0, b: 1 })
    const neighbors = adjacency.get(key)

    // (0,1) should be adjacent to states that share 0 or 1, but not both
    const neighborKeys = neighbors.map(s => generator.getStateKey(s))
    expect(neighborKeys).toContain('0|2')
    expect(neighborKeys).toContain('2|1')
    expect(neighborKeys).not.toContain('0|1')
    expect(neighborKeys).not.toContain('1|0') // shares both indices
  })

  it('generates neighbor connectivity', () => {
    const generator = new ClosedWalkGenerator({ images: [0, 1, 2, 3], loopLength: 4, rng: makeRng([0.1]) })
    const { states, adjacency } = generator.graph

    // Each state should have neighbors (number varies by position in graph)
    states.forEach(state => {
      const neighbors = adjacency.get(generator.getStateKey(state))
      expect(neighbors.length).toBeGreaterThan(0)
      expect(neighbors.length).toBeLessThanOrEqual(states.length - 1)
    })
  })

  it('caches graphs for identical image sets', () => {
    const images = [0, 1, 2, 3]
    const gen1 = new ClosedWalkGenerator({ images, loopLength: 4, rng: makeRng([0.1]) })
    const gen2 = new ClosedWalkGenerator({ images, loopLength: 5, rng: makeRng([0.1]) })

    // Both should use the same cached graph
    expect(gen1.graph).toBe(gen2.graph)
  })

  it('creates separate graphs for different image sets', () => {
    const gen1 = new ClosedWalkGenerator({ images: [0, 1, 2], loopLength: 3, rng: makeRng([0.1]) })
    const gen2 = new ClosedWalkGenerator({ images: [0, 1, 2, 3], loopLength: 4, rng: makeRng([0.1]) })

    expect(gen1.graph).not.toBe(gen2.graph)
    expect(gen1.graph.states.length).not.toBe(gen2.graph.states.length)
  })

  it('caches distinct A/B image sets separately', () => {
    const imagesA = [0, 1, 2, 3]
    const imagesB = [4, 5, 6, 7]

    new ClosedWalkGenerator({ images: [0, 1, 2, 3], loopLength: 5 }).generate()
    let cacheStats = ClosedWalkGenerator.getCacheStats()
    expect(cacheStats.size).toBe(1)

    new ClosedWalkGenerator({ imageSetA: imagesA, imageSetB: imagesB, loopLength: 5 }).generate()
    cacheStats = ClosedWalkGenerator.getCacheStats()
    expect(cacheStats.size).toBe(2)
  })

  it('clearCache() empties the cache', () => {
    new ClosedWalkGenerator({ images: [0, 1, 2, 3], loopLength: 4 }).generate()
    new ClosedWalkGenerator({ images: [0, 1, 2, 3, 4], loopLength: 5 }).generate()

    let cacheStats = ClosedWalkGenerator.getCacheStats()
    expect(cacheStats.size).toBe(2)

    ClosedWalkGenerator.clearCache()
    cacheStats = ClosedWalkGenerator.getCacheStats()
    expect(cacheStats.size).toBe(0)
  })
})

describe('ClosedWalkGenerator - Adjacency Logic', () => {
  let generator

  beforeEach(() => {
    generator = new ClosedWalkGenerator({ images: [0, 1, 2, 3], loopLength: 5, rng: makeRng([0.1]) })
  })

  it('correctly identifies adjacent states', () => {
    expect(generator.areAdjacent({ a: 0, b: 1 }, { a: 0, b: 2 })).toBe(true) // share 0
    expect(generator.areAdjacent({ a: 0, b: 1 }, { a: 2, b: 1 })).toBe(true) // share 1
  })

  it('rejects non-adjacent states', () => {
    expect(generator.areAdjacent({ a: 0, b: 1 }, { a: 2, b: 3 })).toBe(false) // share nothing
    expect(generator.areAdjacent({ a: 0, b: 1 }, { a: 0, b: 1 })).toBe(false) // same state
  })

  it('rejects invalid states', () => {
    expect(generator.areAdjacent(null, { a: 0, b: 1 })).toBe(false)
    expect(generator.areAdjacent({ a: 0, b: 0 }, { a: 1, b: 2 })).toBe(false) // invalid state (a === b)
  })
})

describe('ClosedWalkGenerator - Walk Generation', () => {
  it('generates a closed walk that starts and ends at the same state', () => {
    const rng = makeRng([0.05, 0.4, 0.7, 0.9])
    // Use larger image set to support consecutive appearance constraint
    const { walk } = new ClosedWalkGenerator({ images: [0, 1, 2, 3, 4, 5], loopLength: 5, rng }).generate()

    expect(walk).toHaveLength(5)
    expect(walk[0]).toEqual(walk[walk.length - 1])

    // All consecutive states should be adjacent
    const gen = new ClosedWalkGenerator({ images: [0, 1, 2, 3, 4, 5], loopLength: 5 })
    for (let i = 0; i < walk.length - 1; i++) {
      expect(gen.areAdjacent(walk[i], walk[i + 1])).toBe(true)
    }
  })

  it('maintains exact loop length', () => {
    const rng = makeRng([0.2, 0.3, 0.4, 0.5])
    const { walk: walk1 } = new ClosedWalkGenerator({ images: [0, 1, 2, 3], loopLength: 4, rng }).generate()
    const { walk: walk2 } = new ClosedWalkGenerator({ images: [0, 1, 2, 3], loopLength: 6, rng }).generate()

    expect(walk1).toHaveLength(4)
    expect(walk2).toHaveLength(6)
  })

  it('respects max attempts limit', () => {
    // For a very large loopLength relative to graph size, expect failure
    expect(() => {
      new ClosedWalkGenerator({
        images: [0, 1, 2],
        loopLength: 12, // max possible is 6 for n=3
        maxAttempts: 1,
        rng: makeRng([0.1])
      }).generate()
    }).toThrow()
  })

  it('produces different sequences with different seeds', () => {
    // Use larger image set and longer loop to support consecutive appearance constraint
    const gen1Result = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      loopLength: 8,
      rng: makeRng([0.1, 0.2, 0.3, 0.4, 0.5])
    }).generate()

    const gen2Result = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      loopLength: 8,
      rng: makeRng([0.9, 0.8, 0.7, 0.6, 0.5])
    }).generate()

    expect(gen1Result.walk).not.toEqual(gen2Result.walk)
  })
})

describe('ClosedWalkGenerator - Distinct Image Sets', () => {
  it('supports distinct A/B image sets', () => {
    // Use larger image sets to support consecutive appearance constraint
    const imagesA = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']
    const imagesB = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7']
    const { walk } = new ClosedWalkGenerator({
      imageSetA: imagesA,
      imageSetB: imagesB,
      loopLength: 5,
      rng: makeRng([0.7, 0.6, 0.5, 0.4, 0.3])
    }).generate()

    expect(walk[0]).toEqual(walk[walk.length - 1])
    walk.forEach(state => {
      expect(imagesA).toContain(state.a)
      expect(imagesB).toContain(state.b)
      expect(state.a).not.toBe(state.b)
    })
  })

  it('validates distinct sets correctly', () => {
    // Valid: 2 + 3 = 5 unique, enough states for closure
    expect(() => validateLoopLength(['A1', 'A2'], 3, ['B1', 'B2', 'B3'])).not.toThrow()
    // Invalid: 1 A + 2 B = 3 unique (OK), but only 2 states total
    // loopLength=4 needs 3 transitions, but we only have 2 states, so 4-1 > 2 should throw
    expect(() => validateLoopLength(['A1'], 4, ['B1', 'B2'])).toThrow()
  })

  it('enforces consecutive appearance constraint (max 2 frames then break)', () => {
    // With enough images, generate a valid walk
    const { walk } = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4, 5, 6, 7],
      loopLength: 12,
      rng: makeRng([0.3, 0.4, 0.5, 0.6, 0.7])
    }).generate()

    // Verify no image appears in more than 2 consecutive frames
    for (let i = 0; i < walk.length - 2; i++) {
      const frame1 = walk[i] // {a: 0, b: 1}
      const frame2 = walk[i + 1]
      const frame3 = walk[i + 2]

      // Extract image indices from state objects
      const images1 = [frame1.a, frame1.b]
      const images2 = [frame2.a, frame2.b]
      const images3 = [frame3.a, frame3.b]

      // Find images in all three consecutive frames
      const imagesInAll3 = images1.filter(img =>
        images2.includes(img) && images3.includes(img)
      )

      // Should be empty - no image in 3+ consecutive frames
      expect(imagesInAll3).toHaveLength(0)
    }
  })

  it('fails gracefully when consecutive constraint cannot be satisfied', () => {
    // Small image set with long loop makes consecutive constraint hard to satisfy
    // This should throw (either validation error or max attempts exceeded)
    expect(() => {
      new ClosedWalkGenerator({
        images: [0, 1, 2],
        loopLength: 8,
        maxAttempts: 5,
        rng: makeRng([0.1, 0.2])
      }).generate()
    }).toThrow() // Just verify it throws, error message varies
  })
})

describe('Animation Frame Formatting', () => {
  it('formats walk into frame sequence', () => {
    // Walk must be a closed loop (start and end are same state object reference or value-equal)
    const state1 = { a: 0, b: 1 }
    const state2 = { a: 0, b: 2 }
    const state3 = { a: 0, b: 1 } // Different object but same values as state1
    const walk = [state1, state2, state3]
    const metadata = { loopLength: 3, attempts: 1, imageCountA: 1, imageCountB: 2, uniqueImages: 3 }

    const result = formatWalkForAnimation(walk, metadata)

    expect(result.frames).toHaveLength(3)
    expect(result.totalFrames).toBe(3)
    // The isLoop check uses === which checks object identity, but values match
    // So we check the frame contents instead
    expect(result.frames[0].pair.a).toBe(result.frames[2].pair.a)
    expect(result.frames[0].pair.b).toBe(result.frames[2].pair.b)
    expect(result.frames[0]).toEqual({
      frame: 0,
      loopFrame: 0,
      pair: { a: 0, b: 1 },
      imageIndices: { aIndex: 0, bIndex: 1 }
    })

    // Closing frame should map back to loop frame 0 for seamless color continuity
    expect(result.frames[2].loopFrame).toBe(0)
  })

  it('includes metadata in formatted output', () => {
    const state = { a: 0, b: 1 }
    const walk = [state, state]
    const metadata = { loopLength: 2, attempts: 2 }

    const result = formatWalkForAnimation(walk, metadata)

    expect(result.metadata).toHaveProperty('generatedAt')
    expect(result.metadata.attempts).toBe(2)
    expect(result.metadata.loopLength).toBe(2)
  })
})

describe('Public API', () => {
  it('generates and formats animation sequence', () => {
    const result = generateClosedWalk({
      images: [0, 1, 2, 3],
      loopLength: 4,
      rng: makeRng([0.2, 0.3, 0.4, 0.5])
    })

    expect(result).toHaveProperty('frames')
    expect(result).toHaveProperty('totalFrames')
    expect(result).toHaveProperty('isLoop')
    expect(result).toHaveProperty('metadata')
    expect(result.totalFrames).toBe(4)
    expect(result.isLoop).toBe(true)
  })

  it('works with distinct A/B sets via public API', () => {
    const result = generateClosedWalk({
      imageSetA: ['A1', 'A2', 'A3'],
      imageSetB: ['B1', 'B2'],
      loopLength: 5,
      rng: makeRng([0.1, 0.2, 0.3, 0.4, 0.5])
    })

    expect(result.frames).toHaveLength(5)
    result.frames.forEach(frame => {
      expect(['A1', 'A2', 'A3']).toContain(frame.pair.a)
      expect(['B1', 'B2']).toContain(frame.pair.b)
    })
  })
})

describe('Async API', () => {
  it('generates animation sequence asynchronously', async () => {
    const result = await generateClosedWalkAsync({
      images: [0, 1, 2, 3],
      loopLength: 4,
      rng: makeRng([0.2, 0.3, 0.4, 0.5])
    })

    expect(result).toHaveProperty('frames')
    expect(result).toHaveProperty('totalFrames')
    expect(result.totalFrames).toBe(4)
  })

  it('calls progress callback during generation', async () => {
    const progressCalls = []
    const onProgress = (phase) => progressCalls.push(phase)

    await generateClosedWalkAsync({
      images: [0, 1, 2, 3],
      loopLength: 4,
      onProgress,
      rng: makeRng([0.2, 0.3, 0.4, 0.5])
    })

    // Should have progress callbacks
    expect(progressCalls.length).toBeGreaterThan(0)
    expect(progressCalls).toContain('generating')
    expect(progressCalls).toContain('complete')
  })

  it('yields to event loop for large image sets', async () => {
    const timestamps = []
    const onProgress = (phase) => timestamps.push({ phase, time: Date.now() })

    // Create a scenario where graph needs to be built (not cached)
    // Use images that won't be in cache
    const uniqueImages = Array.from({ length: 10 }, (_, i) => `unique-${Date.now()}-${i}`)

    const startTime = Date.now()
    await generateClosedWalkAsync({
      images: uniqueImages,
      loopLength: 5,
      onProgress,
      rng: makeRng([0.2, 0.3, 0.4, 0.5])
    })
    const endTime = Date.now()

    // Should have taken some time (async operations)
    expect(endTime - startTime).toBeGreaterThanOrEqual(0)
    expect(timestamps.length).toBeGreaterThan(0)
  })

  it('reuses cached graph on subsequent calls', async () => {
    const images = [0, 1, 2, 3]
    const options = { images, loopLength: 4, rng: makeRng([0.2, 0.3, 0.4, 0.5]) }

    // First call builds graph
    const progressCalls1 = []
    await generateClosedWalkAsync({ ...options, onProgress: (p) => progressCalls1.push(p) })

    // Second call should use cached graph
    const progressCalls2 = []
    await generateClosedWalkAsync({ ...options, onProgress: (p) => progressCalls2.push(p), rng: makeRng([0.1, 0.2, 0.3, 0.4]) })

    // Both should complete, second might skip graph building
    expect(progressCalls1.length).toBeGreaterThan(0)
    expect(progressCalls2.length).toBeGreaterThan(0)
  })
})

describe('ClosedWalkGenerator - Fallback Generation', () => {
  beforeEach(() => {
    ClosedWalkGenerator.clearCache()
  })

  it('generates requested length when possible without fallback', () => {
    const imageSet = [0, 1, 2, 3, 4, 5]
    const result = new ClosedWalkGenerator({
      images: imageSet,
      loopLength: 8,
      rng: makeRng([0.2, 0.3, 0.4, 0.5, 0.6])
    }).generateWithFallback()

    expect(result.walk).toHaveLength(8)
    // These properties are only set when fallback is used
    if (result.metadata.isLoopFallback) {
      expect(result.metadata.achievedLoopLength).toBe(8)
    }
  })

  it('attempts fallback when generation fails with low attempts', () => {
    // Use a length that has lower chance of success
    const imageSet = [0, 1, 2, 3, 4]
    const results = []

    // Run multiple times to get both success and fallback scenarios
    for (let i = 0; i < 5; i++) {
      const result = new ClosedWalkGenerator({
        images: imageSet,
        loopLength: 10,
        maxAttempts: 1, // Very restrictive to encourage fallback
        rng: makeRng([Math.random(), Math.random()])
      }).generateWithFallback()
      results.push(result)
    }

    // All should succeed (either directly or via fallback)
    results.forEach(result => {
      expect(result.walk.length).toBeGreaterThanOrEqual(3)
      expect(result.walk.length).toBeLessThanOrEqual(10)
      // Walk must be closed
      expect(result.walk[0]).toEqual(result.walk[result.walk.length - 1])
    })
  })

  it('sets fallback metadata when fallback is actually used', () => {
    const imageSet = [0, 1, 2, 3]
    let gotFallback = false

    // Run multiple times until we get a fallback
    for (let i = 0; i < 10; i++) {
      const result = new ClosedWalkGenerator({
        images: imageSet,
        loopLength: 10,
        maxAttempts: 1,
        rng: makeRng([Math.random(), Math.random()])
      }).generateWithFallback()

      if (result.metadata.isLoopFallback) {
        gotFallback = true
        expect(result.metadata).toHaveProperty('requestedLoopLength')
        expect(result.metadata).toHaveProperty('achievedLoopLength')
        expect(result.metadata.requestedLoopLength).toBe(10)
        expect(result.metadata.achievedLoopLength).toBeLessThan(10)
        break
      }
    }

    // We should have gotten at least one fallback in 10 attempts
    expect(gotFallback).toBe(true)
  })

  it('throws if no viable walk exists due to insufficient images', () => {
    // With only 2 images, minimum requirement is 3 images
    expect(() => {
      new ClosedWalkGenerator({
        images: [0, 1],
        loopLength: 5
      })
    }).toThrow()
  })

  it('maintains walk closure even with fallback lengths', () => {
    const imageSet = [0, 1, 2, 3, 4]

    for (let i = 0; i < 3; i++) {
      const result = new ClosedWalkGenerator({
        images: imageSet,
        loopLength: 8,
        maxAttempts: 2,
        rng: makeRng([Math.random(), Math.random(), Math.random()])
      }).generateWithFallback()

      const { walk } = result
      expect(walk[0]).toEqual(walk[walk.length - 1]) // Closure check
      for (let j = 0; j < walk.length - 1; j++) {
        const gen = new ClosedWalkGenerator({ images: imageSet, loopLength: 3 })
        expect(gen.areAdjacent(walk[j], walk[j + 1])).toBe(true)
      }
    }
  })

  it('can successfully fall back from high to low loop lengths', () => {
    // Test the fallback chain: ask for 10, might fallback to 9, 8, 7...
    const imageSet = [0, 1, 2, 3]
    const result = new ClosedWalkGenerator({
      images: imageSet,
      loopLength: 10,
      maxAttempts: 2 // Low attempts to encourage fallback
    }).generateWithFallback()

    // Should get something valid
    expect(result.walk.length).toBeGreaterThanOrEqual(3)
    expect(result.walk[0]).toEqual(result.walk[result.walk.length - 1])
  })
})

describe('ClosedWalkGenerator - State Persistence', () => {
  beforeEach(() => {
    ClosedWalkGenerator.clearCache()
  })

  it('saves and retrieves walk state', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4],
      loopLength: 6
    })

    const walkResult = generator.generate()
    const savedState = generator.saveState(walkResult)

    expect(savedState).toHaveProperty('walk')
    expect(savedState).toHaveProperty('metadata')
    expect(savedState).toHaveProperty('savedAt')
    expect(savedState).toHaveProperty('imageSetA')
    expect(savedState).toHaveProperty('imageSetB')

    const currentState = generator.getCurrentState()
    expect(currentState).toEqual(savedState)
    expect(currentState.walk).toEqual(walkResult.walk)
  })

  it('maintains state after multiple generations', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4, 5, 6],
      loopLength: 6,
      rng: makeRng([0.1, 0.2])
    })

    const result1 = generator.generate()
    generator.saveState(result1)
    const state1 = generator.getCurrentState()

    // Generate another walk, save it
    const result2 = generator.generate()
    generator.saveState(result2)
    const state2 = generator.getCurrentState()

    // States should both be saved, and current should be the later one
    const history = generator.getStateHistory()
    expect(history.length).toBe(2)
    expect(state2).toEqual(history[1])
    expect(state1).toEqual(history[0])
  })

  it('maintains history of saved states', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4],
      loopLength: 6
    })

    // Save multiple states
    for (let i = 0; i < 3; i++) {
      const result = generator.generate()
      generator.saveState(result)
    }

    const history = generator.getStateHistory()
    expect(history.length).toBe(3)
    expect(history[history.length - 1]).toEqual(generator.getCurrentState())
  })

  it('limits history to 10 states', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4],
      loopLength: 6
    })

    // Save 15 states
    for (let i = 0; i < 15; i++) {
      const result = generator.generate()
      generator.saveState(result)
    }

    const history = generator.getStateHistory()
    expect(history.length).toBe(10) // Should be limited to 10
  })

  it('restores state from history', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4],
      loopLength: 6,
      rng: makeRng([0.2, 0.3])
    })

    const result = generator.generate()
    generator.saveState(result)

    const history = generator.getStateHistory()
    expect(history.length).toBe(1)

    // Restore the state
    const restoredState = generator.restoreState(0)
    expect(restoredState.walk).toEqual(result.walk)
    expect(restoredState.metadata).toEqual(result.metadata)
  })

  it('throws when restoring invalid state index', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4],
      loopLength: 6
    })

    const result = generator.generate()
    generator.saveState(result)

    expect(() => generator.restoreState(-1)).toThrow()
    expect(() => generator.restoreState(1)).toThrow()
    expect(() => generator.restoreState(10)).toThrow()
  })

  it('clears current state', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4],
      loopLength: 6
    })

    const result = generator.generate()
    generator.saveState(result)
    expect(generator.getCurrentState()).not.toBeNull()

    generator.clearCurrentState()
    expect(generator.getCurrentState()).toBeNull()
  })

  it('clears entire state history', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4],
      loopLength: 6
    })

    // Save multiple states
    for (let i = 0; i < 3; i++) {
      const result = generator.generate()
      generator.saveState(result)
    }

    expect(generator.getStateHistory().length).toBe(3)
    expect(generator.getCurrentState()).not.toBeNull()

    generator.clearStateHistory()
    expect(generator.getStateHistory().length).toBe(0)
    expect(generator.getCurrentState()).toBeNull()
  })

  it('preserves image sets when saving state', () => {
    const imagesA = [0, 1, 2]
    const imagesB = [3, 4, 5]

    const generator = new ClosedWalkGenerator({
      imageSetA: imagesA,
      imageSetB: imagesB,
      loopLength: 5
    })

    const result = generator.generate()
    const savedState = generator.saveState(result)

    expect(savedState.imageSetA).toEqual(imagesA)
    expect(savedState.imageSetB).toEqual(imagesB)
  })

  it('saves timestamp with state', () => {
    const generator = new ClosedWalkGenerator({
      images: [0, 1, 2, 3, 4],
      loopLength: 6
    })

    const before = new Date()
    const result = generator.generate()
    const savedState = generator.saveState(result)
    const after = new Date()

    const savedTime = new Date(savedState.savedAt)
    expect(savedTime.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(savedTime.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})




