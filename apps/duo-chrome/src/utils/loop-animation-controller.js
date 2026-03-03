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
    this.fps = options.fps || 4
    this.frameDelay = 1000 / this.fps // milliseconds between frames
    this.lastFrameTime = 0

    this.walk = null // The animation sequence (frames array)
    this.imageSetA = options.imageSetA || []
    this.imageSetB = options.imageSetB || []

    this.requestedLoopLength = 50 // Default loop length
    this.maxLoopLength = 0 // Will be calculated based on image sets

    this.onFrameChange = options.onFrameChange || (() => {}) // Callback when frame changes
    this.onPlayStateChange = options.onPlayStateChange || (() => {}) // Callback when play/pause
    this.onGenerationProgress = options.onGenerationProgress || (() => {}) // Callback for progress

    this.useFallback = options.useFallback !== undefined ? options.useFallback : true
    this.lastGenerationMetadata = null
    this.lastGenerationError = null

    this.animationFrameId = null
    this.isGenerating = false
    this.isSavingLoop = false

    // Start state for walk generation (optional - if set, walk starts adjacent to this state)
    this.desiredStartState = options.desiredStartState || null

    // Calculate max loop length if image sets were provided in options
    if (this.imageSetA.length > 0 && this.imageSetB.length > 0) {
      this.setImageSets(this.imageSetA, this.imageSetB)
    }
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
      if (typeof length !== 'number' || Number.isNaN(length) || length < 3) {
        return false
      }
      // `requestedLoopLength` represents unique visible frames.
      // Closed-walk generation needs one additional terminal frame to close the cycle.
      validateLoopLength(this.imageSetA, length + 1, this.imageSetB)
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
   * Set the desired start state for walk generation
   * When set, the generated walk will start with a state adjacent to this start state
   */
  setDesiredStartState (imageAIndex, imageBIndex) {
    if (typeof imageAIndex === 'number' && typeof imageBIndex === 'number') {
      this.desiredStartState = { a: imageAIndex, b: imageBIndex }
      console.log('[LoopAnimation] Desired start state set to:', this.desiredStartState)
    } else {
      this.desiredStartState = null
    }
  }

  /**
   * Enable loop mode and generate the animation walk
   */
  async enable () {
    if (this.enabled || this.isGenerating) return

    this.enabled = true
    console.log('[LoopAnimation] Enable called, isPlaying:', this.isPlaying)
    // Pause playback when enabling loop mode so user can configure settings
    if (this.isPlaying) {
      console.log('[LoopAnimation] Pausing playback before generating walk')
      this.pause()
      // Notify UI of pause state
      this.onPlayStateChange({ playing: false, frameIndex: this.currentFrameIndex })
    }
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
    const requestedVisibleLength = this.requestedLoopLength

    try {
      console.log('[LoopAnimation] Generating walk with loopLength:', this.requestedLoopLength, 'desiredStartState:', this.desiredStartState)
      const result = await generateClosedWalkAsync({
        imageSetA: this.imageSetA,
        imageSetB: this.imageSetB,
        // Generate with explicit closing frame, then trim duplicate terminal frame
        // so UI/export frame counts match requested unique loop length.
        loopLength: this.requestedLoopLength + 1,
        useFallback: this.useFallback,
        desiredStartState: this.desiredStartState,
        onProgress: (phase) => {
          console.log('[LoopAnimation] Generation phase:', phase)
          // Don't send 'complete' yet - wait until we've set the walk
          if (phase !== 'complete') {
            this.onGenerationProgress(phase)
          }
        }
      })

      console.log('[LoopAnimation] Walk generated:', result)
      const generatedFrames = Array.isArray(result.frames) ? result.frames : []
      const firstFrame = generatedFrames[0]
      const lastFrame = generatedFrames[generatedFrames.length - 1]
      const hasDuplicatedClosure =
        generatedFrames.length > 1 &&
        firstFrame?.pair?.a === lastFrame?.pair?.a &&
        firstFrame?.pair?.b === lastFrame?.pair?.b

      this.walk = hasDuplicatedClosure ? generatedFrames.slice(0, -1) : generatedFrames
      this.currentFrameIndex = 0
      this.isGenerating = false

      const metadata = { ...result.metadata }
      metadata.requestedLoopLength = requestedVisibleLength
      metadata.achievedLoopLength = this.walk.length
      metadata.isLoopFallback = metadata.achievedLoopLength !== requestedVisibleLength

      this.lastGenerationMetadata = metadata
      this.lastGenerationError = null

      if (metadata.isLoopFallback && metadata.achievedLoopLength !== this.requestedLoopLength) {
        this.requestedLoopLength = metadata.achievedLoopLength
      }

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
      this.lastGenerationError = error.message || String(error)
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
      savingLoop: this.isSavingLoop,
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
   * Save entire loop as individual frames
   * @param {Function} saveFrameCallback - Callback to save current frame (index, frame) => void
   * @param {Function} onProgress - Progress callback (current, total) => void
   * @returns {Promise} Resolves when save completes or is interrupted
   */
  async saveLoop (saveFrameCallback, onProgress = () => {}) {
    if (!this.walk || this.walk.length === 0) {
      throw new Error('No walk to save')
    }

    this.isSavingLoop = true
    const wasPlaying = this.isPlaying

    // Don't pause playback - we need isPlaying=true for onFrameChange to load images
    // Instead, we'll manually load frames by calling onFrameChange
    if (wasPlaying) {
      this.pause()
    }

    try {
      for (let i = 0; i < this.walk.length; i++) {
        // Check if save was interrupted
        if (!this.isSavingLoop) {
          console.log('[LoopAnimation] Save interrupted at frame', i)
          break
        }

        // Update to this frame
        this.currentFrameIndex = i
        const frame = this.getCurrentFrame()

        // Trigger frame change - this starts loading the images
        // But we need to ensure images load even when not playing
        this.onFrameChange(frame)

        // Report progress
        onProgress(i + 1, this.walk.length)

        // Wait for images to load and render before saving
        // This delay allows p5.js to complete the draw cycle with new images
        await new Promise(resolve => setTimeout(resolve, 500))

        // Call the save callback AFTER the delay
        await saveFrameCallback(i, frame)
      }

      console.log('[LoopAnimation] Save complete')
    } finally {
      this.isSavingLoop = false

      // Resume playback if it was playing before
      if (wasPlaying) {
        this.play()
      }
    }
  }

  /**
   * Interrupt ongoing loop save
   */
  interruptSave () {
    this.isSavingLoop = false
  }

  /**
   * Cleanup resources
   */
  destroy () {
    this.stop()
    this.interruptSave()
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }
}
