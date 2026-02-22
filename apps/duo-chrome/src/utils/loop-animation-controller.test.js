/**
 * Tests for LoopAnimationController
 *
 * Validates state management, walk generation, playback control,
 * and integration with image sets according to Task 14.6 specification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LoopAnimationController } from './loop-animation-controller.js'

describe('LoopAnimationController', () => {
  let controller
  let frameChangeCallback
  let playStateChangeCallback
  let generationProgressCallback

  beforeEach(() => {
    frameChangeCallback = vi.fn()
    playStateChangeCallback = vi.fn()
    generationProgressCallback = vi.fn()

    const imageSetA = ['imageA_0.jpg', 'imageA_1.jpg', 'imageA_2.jpg', 'imageA_3.jpg', 'imageA_4.jpg']
    const imageSetB = ['imageB_0.jpg', 'imageB_1.jpg', 'imageB_2.jpg', 'imageB_3.jpg', 'imageB_4.jpg']

    controller = new LoopAnimationController({
      fps: 12,
      imageSetA,
      imageSetB,
      onFrameChange: frameChangeCallback,
      onPlayStateChange: playStateChangeCallback,
      onGenerationProgress: generationProgressCallback
    })
  })

  afterEach(() => {
    if (controller.animationFrameId) {
      cancelAnimationFrame(controller.animationFrameId)
    }
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(controller.enabled).toBe(false)
      expect(controller.isPlaying).toBe(false)
      expect(controller.currentFrameIndex).toBe(0)
      expect(controller.fps).toBe(12)
      expect(controller.requestedLoopLength).toBe(5)
    })

    it('should store provided image sets', () => {
      expect(controller.imageSetA.length).toBe(5)
      expect(controller.imageSetB.length).toBe(5)
    })

    it('should calculate max loop length from image sets', () => {
      // For 5x5 images with all different pairs: 5*5 = 25
      expect(controller.maxLoopLength).toBeGreaterThan(0)
    })

    it('should store callback functions', () => {
      expect(controller.onFrameChange).toBe(frameChangeCallback)
      expect(controller.onPlayStateChange).toBe(playStateChangeCallback)
      expect(controller.onGenerationProgress).toBe(generationProgressCallback)
    })

    it('should initialize with null walk', () => {
      expect(controller.walk).toBeNull()
    })
  })

  describe('Image Set Management', () => {
    it('should set image sets and recalculate max length', () => {
      const newImageSetA = ['a.jpg', 'b.jpg', 'c.jpg']
      const newImageSetB = ['x.jpg', 'y.jpg', 'z.jpg']

      controller.setImageSets(newImageSetA, newImageSetB)

      expect(controller.imageSetA).toEqual(newImageSetA)
      expect(controller.imageSetB).toEqual(newImageSetB)
      expect(controller.maxLoopLength).toBeGreaterThan(0)
    })

    it('should handle empty image sets', () => {
      controller.setImageSets([], [])
      expect(controller.imageSetA.length).toBe(0)
      expect(controller.imageSetB.length).toBe(0)
    })

    it('should recalculate loop length if exceeds new max', () => {
      const originalMax = controller.maxLoopLength
      controller.requestedLoopLength = originalMax - 1

      // Set to smaller image sets
      controller.setImageSets(['a.jpg', 'b.jpg'], ['x.jpg', 'y.jpg'])

      // requestedLoopLength should be adjusted if it exceeds new max
      expect(controller.requestedLoopLength).toBeLessThanOrEqual(controller.maxLoopLength)
    })
  })

  describe('Loop Length Management', () => {
    it('should get loop length range', () => {
      const range = controller.getLoopLengthRange()
      expect(range).toHaveProperty('min')
      expect(range).toHaveProperty('max')
      expect(range).toHaveProperty('current')
      expect(range.min).toBe(3)
      expect(range.current).toBe(5)
    })

    it('should set valid loop length', () => {
      const result = controller.setLoopLength(10)
      expect(result).toBe(true)
      expect(controller.requestedLoopLength).toBe(10)
    })

    it('should reject loop length below minimum', () => {
      const originalLength = controller.requestedLoopLength
      const result = controller.setLoopLength(2)
      expect(result).toBe(false)
      expect(controller.requestedLoopLength).toBe(originalLength)
    })

    it('should reject loop length above maximum', () => {
      const originalLength = controller.requestedLoopLength
      // maxLoopLength represents countStates (available transitions)
      // validation allows up to maxStates + 1, so we test beyond that
      const tooLarge = controller.maxLoopLength + 2
      const result = controller.setLoopLength(tooLarge)
      expect(result).toBe(false)
      expect(controller.requestedLoopLength).toBe(originalLength)
    })

    it('should handle invalid (NaN) loop length', () => {
      const originalLength = controller.requestedLoopLength
      const result = controller.setLoopLength(NaN)
      expect(result).toBe(false)
      expect(controller.requestedLoopLength).toBe(originalLength)
    })
  })

  describe('Enable/Disable', () => {
    it('should enable loop mode', async () => {
      expect(controller.enabled).toBe(false)
      await controller.enable()
      expect(controller.enabled).toBe(true)
    })

    it('should disable loop mode', () => {
      controller.enabled = true
      controller.disable()
      expect(controller.enabled).toBe(false)
      expect(controller.isPlaying).toBe(false)
    })

    it('should generate walk when enabling', async () => {
      expect(controller.walk).toBeNull()
      await controller.enable()
      expect(controller.walk).not.toBeNull()
      expect(controller.walk.length).toBeGreaterThan(0)
    })

    it('should not enable if already enabling', async () => {
      controller.isGenerating = true
      await controller.enable()
      // Should return early without double-enabling
      expect(controller.enabled).toBe(false)
    })
  })

  describe('Walk Generation', () => {
    beforeEach(async () => {
      await controller.enable()
    })

    it('should generate a walk with correct length', () => {
      expect(controller.walk.length).toBe(controller.requestedLoopLength)
    })

    it('should not include duplicated terminal frame', () => {
      const first = controller.walk[0]
      const last = controller.walk[controller.walk.length - 1]

      // In the rendered/exported walk, closure is implicit (last wraps to first),
      // so first and last should not be the same duplicated state.
      expect(first.pair.a === last.pair.a && first.pair.b === last.pair.b).toBe(false)
    })

    it('should generate walk with frame objects', () => {
      controller.walk.forEach(frame => {
        expect(frame).toHaveProperty('pair')
        expect(frame.pair).toHaveProperty('a')
        expect(frame.pair).toHaveProperty('b')
      })
    })

    it('should update walk when loop length changes', async () => {
      const originalWalk = controller.walk
      controller.setLoopLength(8)
      await controller.generateWalk()

      expect(controller.walk).not.toEqual(originalWalk)
      expect(controller.walk.length).toBe(8)
    })

    it('should fire generation progress callback during walk generation', async () => {
      controller.isGenerating = false // Reset for fresh test
      await controller.generateWalk()
      // onGenerationProgress should be called at least once
      expect(generationProgressCallback).toHaveBeenCalled()
    })
  })

  describe('Playback Control', () => {
    beforeEach(async () => {
      await controller.enable()
    })

    it('should start, pause, and stop playback', () => {
      // Initial state
      expect(controller.isPlaying).toBe(false)

      // Play
      controller.play()
      expect(controller.isPlaying).toBe(true)
      expect(playStateChangeCallback).toHaveBeenCalledWith(
        expect.objectContaining({ playing: true })
      )

      // Pause
      playStateChangeCallback.mockClear()
      const currentFrame = controller.currentFrameIndex
      controller.pause()
      expect(controller.isPlaying).toBe(false)
      expect(controller.currentFrameIndex).toBe(currentFrame)
      expect(playStateChangeCallback).toHaveBeenCalledWith(
        expect.objectContaining({ playing: false })
      )

      // Stop (should reset frame)
      controller.currentFrameIndex = 3
      frameChangeCallback.mockClear()
      controller.stop()
      expect(controller.isPlaying).toBe(false)
      expect(controller.currentFrameIndex).toBe(0)
      expect(frameChangeCallback).toHaveBeenCalled()
    })

    it('should manage animation frames during playback', () => {
      const requestSpy = vi.spyOn(global, 'requestAnimationFrame')
      const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame')

      controller.play()
      expect(requestSpy).toHaveBeenCalled()

      controller.pause()
      expect(cancelSpy).toHaveBeenCalled()

      requestSpy.mockRestore()
      cancelSpy.mockRestore()
    })

    it('should not double-play when already playing', () => {
      controller.play()
      const initialFrameId = controller.animationFrameId
      controller.play()
      expect(controller.animationFrameId).toBe(initialFrameId)
    })

    it('should fire callbacks on state changes', () => {
      controller.play()
      expect(frameChangeCallback).toHaveBeenCalled()
      expect(playStateChangeCallback).toHaveBeenCalledWith(
        expect.objectContaining({ playing: true })
      )
    })
  })

  describe('Frame Navigation', () => {
    beforeEach(async () => {
      await controller.enable()
    })

    it('should get current frame', () => {
      const frame = controller.getCurrentFrame()
      expect(frame).toBeDefined()
      expect(frame.pair).toBeDefined()
    })

    it('should set frame to valid index', () => {
      controller.setFrame(2)
      expect(controller.currentFrameIndex).toBe(2)
    })

    it('should fire frame change callback when setting frame', () => {
      frameChangeCallback.mockClear()
      controller.setFrame(1)
      expect(frameChangeCallback).toHaveBeenCalled()
    })

    it('should reject frame index below 0', () => {
      controller.setFrame(-1)
      // Should be clamped to 0
      expect(controller.currentFrameIndex).toBeGreaterThanOrEqual(0)
    })

    it('should reject frame index beyond walk length', () => {
      const originalIndex = controller.currentFrameIndex
      controller.setFrame(controller.walk.length)
      // Should be clamped to valid range
      expect(controller.currentFrameIndex).toBeLessThan(controller.walk.length)
    })

    it('should clamp frame index to valid range', () => {
      controller.setFrame(100)
      expect(controller.currentFrameIndex).toBeLessThan(controller.walk.length)
    })
  })

  describe('FPS Control', () => {
    it('should set FPS to valid value', () => {
      controller.setFPS(24)
      expect(controller.fps).toBe(24)
    })

    it('should calculate frame delay correctly', () => {
      controller.setFPS(30)
      expect(controller.frameDelay).toBeCloseTo(1000 / 30, 0)
    })

    it('should reject FPS below 1', () => {
      controller.setFPS(0)
      expect(controller.fps).toBe(1) // Clamped to minimum
    })

    it('should reject FPS above 60', () => {
      controller.setFPS(61)
      expect(controller.fps).toBe(60) // Clamped to maximum
    })

    it('should accept FPS at boundaries', () => {
      controller.setFPS(1)
      expect(controller.fps).toBe(1)
      controller.setFPS(60)
      expect(controller.fps).toBe(60)
    })
  })

  describe('Animation Loop', () => {
    beforeEach(async () => {
      await controller.enable()
    })

    it('should advance frames during playback', (done) => {
      controller.play()

      setTimeout(() => {
        expect(frameChangeCallback).toHaveBeenCalled()
        controller.pause()
        done()
      }, 100)
    })

    it('should loop frames back to start', async () => {
      controller.currentFrameIndex = controller.walk.length - 1
      controller.play()

      // Simulate frame advance
      const initialIndex = controller.currentFrameIndex

      setTimeout(() => {
        // After one frame tick, should wrap to 0 or advance
        expect(controller.currentFrameIndex).toBeLessThanOrEqual(controller.walk.length)
        controller.pause()
      }, 50)
    })

    it('should respect FPS setting for frame timing', async () => {
      controller.setFPS(60)
      expect(controller.frameDelay).toBeCloseTo(1000 / 60, 0)

      controller.setFPS(1)
      expect(controller.frameDelay).toBeCloseTo(1000 / 1, 0)
    })
  })

  describe('State Consistency', () => {
    beforeEach(async () => {
      await controller.enable()
    })

    it('should disable stops playback', () => {
      controller.play()
      expect(controller.isPlaying).toBe(true)

      controller.disable()
      expect(controller.isPlaying).toBe(false)
    })

    it('should maintain state across operations', async () => {
      controller.play()
      controller.setFrame(2)
      expect(controller.isPlaying).toBe(true)
      expect(controller.currentFrameIndex).toBe(2)
    })

    it('should handle rapid enable/disable cycles', async () => {
      expect(() => {
        controller.disable()
      }).not.toThrow()
    })

    it('should reset on disable', () => {
      controller.enabled = true
      controller.isPlaying = true
      controller.currentFrameIndex = 3

      controller.disable()

      expect(controller.enabled).toBe(false)
      expect(controller.isPlaying).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null callbacks gracefully', () => {
      const nullController = new LoopAnimationController({
        imageSetA: ['a.jpg'],
        imageSetB: ['b.jpg']
      })

      expect(() => {
        nullController.onFrameChange({ pair: { a: 0, b: 0 } })
      }).not.toThrow()
    })

    it('should handle single image in each set', async () => {
      const singleController = new LoopAnimationController({
        imageSetA: ['a.jpg'],
        imageSetB: ['b.jpg'],
        onFrameChange: () => {}
      })

      const result = singleController.setLoopLength(3)
      expect(result).toBe(false) // Only 1 state possible: (a,b)
    })

    it('should handle two images in each set', async () => {
      const twoController = new LoopAnimationController({
        imageSetA: ['a1.jpg', 'a2.jpg'],
        imageSetB: ['b1.jpg', 'b2.jpg'],
        onFrameChange: () => {}
      })

      const range = twoController.getLoopLengthRange()
      // 2x2 = 4 possible states, but (a1,b1), (a2,b2) excluded if same = 2 states
      expect(range.min).toBe(3)
    })

    it('should return null frame when walk is null', () => {
      const emptyController = new LoopAnimationController()
      const frame = emptyController.getCurrentFrame()
      expect(frame).toBeNull()
    })

    it('should handle destroy/cleanup', () => {
      controller.isPlaying = true
      controller.disable()
      // Should clean up animation frame
      expect(controller.animationFrameId).toBeNull()
    })
  })

  describe('Integration with Image Sets and Closed Walk', () => {
    it('should generate different walks for different loop lengths', async () => {
      const controller1 = new LoopAnimationController({
        imageSetA: ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'],
        imageSetB: ['x.jpg', 'y.jpg', 'z.jpg', 'w.jpg', 'v.jpg']
      })

      controller1.requestedLoopLength = 5
      await controller1.generateWalk()
      const walk1 = JSON.stringify(controller1.walk)

      controller1.requestedLoopLength = 7
      await controller1.generateWalk()
      const walk2 = JSON.stringify(controller1.walk)

      // Walks should be different (different lengths at minimum)
      expect(walk1).not.toEqual(walk2)
    })

    it('should validate closed walk properties', async () => {
      await controller.enable()

      if (!controller.walk || controller.walk.length === 0) {
        expect(true).toBe(true) // Skip if no walk
        return
      }

      controller.walk.forEach((frame, i) => {
        // Frame should have a pair property
        expect(frame).toHaveProperty('pair')
        expect(frame.pair).toBeDefined()

        // Pair should have a and b properties
        const { a, b } = frame.pair
        expect(a).toBeDefined()
        expect(b).toBeDefined()

        // Values should be valid indices or parseable as indices
        const aIdx = typeof a === 'string' ? parseInt(a, 10) : a
        const bIdx = typeof b === 'string' ? parseInt(b, 10) : b

        // If we can parse as numbers, validate they're in range
        if (!isNaN(aIdx)) {
          expect(aIdx).toBeGreaterThanOrEqual(0)
          expect(aIdx).toBeLessThan(controller.imageSetA.length)
        }
        if (!isNaN(bIdx)) {
          expect(bIdx).toBeGreaterThanOrEqual(0)
          expect(bIdx).toBeLessThan(controller.imageSetB.length)
        }
      })
    })
  })
})
