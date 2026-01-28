/**
 * Loop Animation Controller
 *
 * Manages the looped animation state and playback for duo-chrome.
 * Handles walk generation, frame sequencing, playback control, and UI state.
 */

import { generateClosedWalkAsync, validateLoopLength } from './closed-walk'

export class LoopAnimationController {
  constructor (options = {}) {
    this.enabled = false
    this.isPlaying = false
    this.currentFrameIndex = 0
    this.fps = options.fps || 12
    this.frameDelay = 1000 / this.fps // milliseconds between frames
    this.lastFrameTime = 0

    this.walk = null // The animation sequence (frames array)
    this.imageSetA = options.imageSetA || []
    this.imageSetB = options.imageSetB || []

    this.requestedLoopLength = 5 // Default loop length
    this.maxLoopLength = 0 // Will be calculated based on image sets

    this.onFrameChange = options.onFrameChange || (() => {}) // Callback when frame changes
    this.onPlayStateChange = options.onPlayStateChange || (() => {}) // Callback when play/pause
    this.onGenerationProgress = options.onGenerationProgress || (() => {}) // Callback for progress

    this.animationFrameId = null
    this.isGenerating = false
  }

  /**
   * Update image sets and recalculate max loop length
   */
  setImageSets (imageSetA, imageSetB) {
    this.imageSetA = imageSetA || []
    this.imageSetB = imageSetB || []

    // Calculate maximum possible loop length
    const countStates = (a, b) => {
      let count = 0
      a.forEach(x => {
        b.forEach(y => {
          if (x !== y) count += 1
        })
      })
      return count
    }

    this.maxLoopLength = countStates(this.imageSetA, this.imageSetB)

    // Validate current loop length against new max
    if (this.requestedLoopLength > this.maxLoopLength) {
      this.requestedLoopLength = Math.max(3, Math.min(this.requestedLoopLength, this.maxLoopLength))
    }
  }

  /**
   * Set the desired loop length with validation
   */
  setLoopLength (length) {
    try {
      validateLoopLength(this.imageSetA, length, this.imageSetB)
      this.requestedLoopLength = length
      return true
    } catch (error) {
      console.warn('Invalid loop length:', error.message)
      return false
    }
  }

  /**
   * Get valid loop length range
   */
  getLoopLengthRange () {
    return {
      min: 3,
      max: this.maxLoopLength,
      current: this.requestedLoopLength
    }
  }

  /**
   * Enable loop mode and generate the animation walk
   */
  async enable () {
    if (this.enabled || this.isGenerating) return

    this.enabled = true
    console.log('[LoopAnimation] Enabled. Image sets:', {
      imageSetA: this.imageSetA.length,
      imageSetB: this.imageSetB.length
    })
    await this.generateWalk()
  }

  /**
   * Disable loop mode
   */
  disable () {
    this.enabled = false
    this.stop()
    this.walk = null
  }

  /**
   * Generate or regenerate the animation walk
   */
  async generateWalk () {
    if (this.isGenerating || this.imageSetA.length < 2 || this.imageSetB.length < 2) {
      console.warn('[LoopAnimation] Cannot generate walk:', {
        isGenerating: this.isGenerating,
        imageSetA: this.imageSetA.length,
        imageSetB: this.imageSetB.length
      })
      return
    }

    this.isGenerating = true
    this.onGenerationProgress('preparing')

    try {
      console.log('[LoopAnimation] Generating walk with loopLength:', this.requestedLoopLength)
      const result = await generateClosedWalkAsync({
        imageSetA: this.imageSetA,
        imageSetB: this.imageSetB,
        loopLength: this.requestedLoopLength,
        onProgress: (phase) => {
          console.log('[LoopAnimation] Generation phase:', phase)
          // Don't send 'complete' yet - wait until we've set the walk
          if (phase !== 'complete') {
            this.onGenerationProgress(phase)
          }
        }
      })

      console.log('[LoopAnimation] Walk generated:', result)
      this.walk = result.frames
      this.currentFrameIndex = 0
      this.isGenerating = false

      if (this.isPlaying) {
        this.play()
      } else {
        // Update UI with first frame
        this.onFrameChange(this.getCurrentFrame())
      }

      // Now send complete callback after state is updated
      this.onGenerationProgress('complete')
    } catch (error) {
      console.error('[LoopAnimation] Failed to generate walk:', error)
      this.walk = null
      this.isGenerating = false
      this.onGenerationProgress('error')
    }
  }

  /**
   * Get current frame data
   */
  getCurrentFrame () {
    if (!this.walk || this.walk.length === 0) return null
    return this.walk[this.currentFrameIndex]
  }

  /**
   * Start playback
   */
  play () {
    if (!this.walk || this.walk.length === 0 || this.isPlaying) return

    console.log('[LoopAnimation] play() called. Walk length:', this.walk.length)
    this.isPlaying = true
    this.lastFrameTime = Date.now()
    this.onPlayStateChange({ playing: true, frameIndex: this.currentFrameIndex })
    
    // Immediately show current frame
    this.onFrameChange(this.getCurrentFrame())

    const animate = () => {
      if (!this.isPlaying) return
      
      const now = Date.now()
      const elapsed = now - this.lastFrameTime

      if (elapsed >= this.frameDelay) {
        this.currentFrameIndex = (this.currentFrameIndex + 1) % this.walk.length
        this.lastFrameTime = now
        console.log('[LoopAnimation] Frame advance:', this.currentFrameIndex, '/', this.walk.length)
        this.onFrameChange(this.getCurrentFrame())
      }

      if (this.isPlaying) {
        this.animationFrameId = requestAnimationFrame(animate)
      }
    }

    this.animationFrameId = requestAnimationFrame(animate)
    console.log('[LoopAnimation] Animation loop started')
  }

  /**
   * Pause playback
   */
  pause () {
    if (!this.isPlaying) return

    this.isPlaying = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.onPlayStateChange({ playing: false, frameIndex: this.currentFrameIndex })
  }

  /**
   * Stop playback and reset to first frame
   */
  stop () {
    this.pause()
    this.currentFrameIndex = 0
    if (this.walk) {
      this.onFrameChange(this.getCurrentFrame())
    }
  }

  /**
   * Set playback speed (fps)
   */
  setFPS (fps) {
    this.fps = Math.max(1, Math.min(60, fps))
    this.frameDelay = 1000 / this.fps
  }

  /**
   * Jump to specific frame
   */
  setFrame (index) {
    if (!this.walk) return

    this.currentFrameIndex = Math.max(0, Math.min(index, this.walk.length - 1))
    this.onFrameChange(this.getCurrentFrame())
  }

  /**
   * Get animation info for display
   */
  getAnimationInfo () {
    return {
      enabled: this.enabled,
      playing: this.isPlaying,
      generating: this.isGenerating,
      currentFrame: this.currentFrameIndex,
      totalFrames: this.walk ? this.walk.length : 0,
      fps: this.fps,
      loopLength: this.requestedLoopLength,
      maxLoopLength: this.maxLoopLength,
      imageCountA: this.imageSetA.length,
      imageCountB: this.imageSetB.length
    }
  }

  /**
   * Cleanup resources
   */
  destroy () {
    this.stop()
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }
}
