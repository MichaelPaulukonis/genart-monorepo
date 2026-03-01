/**
 * Loop Animation UI Panel
 *
 * Provides UI controls for the looped animation feature.
 * Includes toggle, loop length input, playback controls, FPS slider, and frame counter.
 *
 * Visual styling is in css/style.css (.loop-animation-panel, .loop-panel-section, etc.)
 * A minimal <style> block is kept inline for computed-style values used in tests.
 */

export class LoopAnimationPanel {
  constructor (controller, callbacks = {}) {
    this.controller = controller
    this.callbacks = callbacks
    this.panel = null
    this.elements = {}
  }

  /**
   * Create and mount the control panel
   */
  mount (containerId = 'loop-animation-panel') {
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      document.body.appendChild(container)
    }

    container.innerHTML = this.getHTML()
    this.panel = container
    this.cacheElements()
    this.attachEventListeners()

    return this.panel
  }

  /**
   * Cache references to frequently used elements
   */
  cacheElements () {
    this.panelElement = this.panel.querySelector('.loop-animation-panel')
    this.elements = {
      toggleBtn: this.panel.querySelector('[data-action="toggle"]'),
      loopLengthInput: this.panel.querySelector('[data-input="loop-length"]'),
      loopLengthMax: this.panel.querySelector('[data-display="loop-length-max"]'),
      playPauseBtn: this.panel.querySelector('[data-action="play-pause"]'),
      stopBtn: this.panel.querySelector('[data-action="stop"]'),
      saveLoopBtn: this.panel.querySelector('[data-action="save-loop"]'),
      refreshBtn: this.panel.querySelector('[data-action="refresh"]'),
      frameCounter: this.panel.querySelector('[data-display="frame-counter"]'),
      frameSlider: this.panel.querySelector('[data-input="frame-slider"]'),
      fpsSlider: this.panel.querySelector('[data-input="fps"]'),
      fpsValue: this.panel.querySelector('[data-display="fps-value"]'),
      previewPair: this.panel.querySelector('[data-display="preview-pair"]'),
      loadingSpinner: this.panel.querySelector('[data-display="loading"]'),
      helpText: this.panel.querySelector('[data-display="help-text"]')
    }
  }

  /**
   * Attach event listeners to controls
   */
  attachEventListeners () {
    // Panel-level bubble handler: block events from propagating OUTSIDE the panel
    if (this.panelElement) {
      ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        this.panelElement.addEventListener(eventType, (e) => {
          e.stopPropagation()
          console.log('[LoopPanel] Panel bubble handler stopping propagation for:', eventType)
        }, false)
      })
    }

    // Toggle button
    if (this.elements.toggleBtn) {
      this.elements.toggleBtn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      this.elements.toggleBtn.addEventListener('mouseup', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      this.elements.toggleBtn.addEventListener('click', (e) => {
        console.log('[LoopPanel] Toggle button clicked')
        e.preventDefault()
        e.stopPropagation()
        if (this.controller.enabled) {
          this.controller.disable()
          if (this.callbacks.onLoopDisabled) {
            this.callbacks.onLoopDisabled()
          }
        } else {
          this.controller.enable()
          if (this.callbacks.onLoopEnabled) {
            this.callbacks.onLoopEnabled()
          }
        }
        this.updateToggleButton()
      })
    }

    // Loop length input
    if (this.elements.loopLengthInput) {
      this.elements.loopLengthInput.addEventListener('change', (e) => {
        e.stopPropagation()
        const length = parseInt(e.target.value, 10)
        if (this.controller.setLoopLength(length)) {
          this.controller.generateWalk()
        } else {
          this.updateLoopLengthInput()
        }
      })
    }

    // Playback controls
    if (this.elements.playPauseBtn) {
      this.elements.playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this.controller.isPlaying) {
          this.controller.pause()
        } else {
          this.controller.play()
        }
        this.updatePlaybackButtons()
      })
    }

    if (this.elements.stopBtn) {
      this.elements.stopBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this.controller.isSavingLoop) {
          this.controller.interruptSave()
        } else {
          this.controller.stop()
        }
        this.updatePlaybackButtons()
      })
    }

    // Save Loop button
    if (this.elements.saveLoopBtn) {
      this.elements.saveLoopBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        console.log('[LoopPanel] Save Loop button clicked')
        await this.handleSaveLoop()
      })
    }

    // Refresh/Regenerate button
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        console.log('[LoopPanel] Refresh button clicked')
        this.handleRefresh()
      })
    }

    // Frame slider
    if (this.elements.frameSlider) {
      this.elements.frameSlider.addEventListener('input', (e) => {
        e.stopPropagation()
        const frame = parseInt(e.target.value, 10)
        this.controller.setFrame(frame)
      })
    }

    // FPS slider
    if (this.elements.fpsSlider) {
      this.elements.fpsSlider.addEventListener('input', (e) => {
        e.stopPropagation()
        const fps = parseInt(e.target.value, 10)
        this.controller.setFPS(fps)
        this.updateFPSDisplay()
      })
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.controller.enabled) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (this.controller.isPlaying) {
            this.controller.pause()
          } else {
            this.controller.play()
          }
          this.updatePlaybackButtons()
          break
        case 'Escape':
          e.preventDefault()
          this.controller.stop()
          this.updatePlaybackButtons()
          break
      }
    })
  }

  /**
   * Update UI when frame changes
   */
  updateFrame (frame) {
    if (!frame) return

    console.log('[LoopPanel] updateFrame called with frame:', frame)

    if (this.elements.frameCounter) {
      const total = this.controller.walk ? this.controller.walk.length : 0
      this.elements.frameCounter.textContent = `Frame ${this.controller.currentFrameIndex + 1} / ${total}`
    }

    if (this.elements.frameSlider && this.controller.walk) {
      this.elements.frameSlider.max = this.controller.walk.length - 1
      this.elements.frameSlider.value = this.controller.currentFrameIndex
    }

    this.updatePreview(frame)
  }

  /**
   * Update preview panel with current frame's image pair
   */
  updatePreview (frame) {
    if (!this.elements.previewPair || !frame) return

    const { a, b } = frame.pair

    let aImg, bImg
    if (typeof a === 'number' && typeof b === 'number') {
      aImg = this.controller.imageSetA[a]
      bImg = this.controller.imageSetB[b]
    } else {
      aImg = a
      bImg = b
    }

    aImg = aImg || '?'
    bImg = bImg || '?'

    const formatName = (name) => {
      if (!name || name === '?') return '?'
      const base = String(name).replace(/\.[^/.]+$/, '')
      return base.length > 22 ? '\u2026' + base.slice(-20) : base
    }

    this.elements.previewPair.innerHTML = `
      <div class="loop-pair-item" title="${aImg}"><strong>A</strong> ${formatName(aImg)}</div>
      <div class="loop-pair-item" title="${bImg}"><strong>B</strong> ${formatName(bImg)}</div>
    `
  }

  /**
   * Update toggle button state
   */
  updateToggleButton () {
    if (!this.elements.toggleBtn) return

    if (this.controller.isGenerating) {
      this.elements.toggleBtn.textContent = '⏳ Generating loop...'
      this.elements.toggleBtn.disabled = true
      if (this.panelElement) this.panelElement.classList.add('enabled')
    } else if (this.controller.enabled) {
      this.elements.toggleBtn.textContent = '✓ Loop Enabled'
      this.elements.toggleBtn.disabled = false
      this.elements.toggleBtn.classList.add('active')
      if (this.panelElement) this.panelElement.classList.add('enabled')
      this.updateLoopLengthInput()
    } else {
      this.elements.toggleBtn.textContent = 'Enable Loop Mode'
      this.elements.toggleBtn.disabled = false
      this.elements.toggleBtn.classList.remove('active')
      if (this.panelElement) this.panelElement.classList.remove('enabled')
    }
  }

  getUniqueImageCount () {
    return new Set([...this.controller.imageSetA, ...this.controller.imageSetB]).size
  }

  canGenerate () {
    return this.getUniqueImageCount() >= 3
  }

  /**
   * Update loop length input and max value display
   */
  updateLoopLengthInput () {
    if (!this.elements.loopLengthInput) return

    const range = this.controller.getLoopLengthRange()
    this.elements.loopLengthInput.min = range.min
    this.elements.loopLengthInput.max = range.max
    this.elements.loopLengthInput.value = range.current

    if (this.elements.loopLengthMax) {
      this.elements.loopLengthMax.textContent = `(max: ${range.max})`
    }

    this.elements.loopLengthInput.disabled = !this.canGenerate() || this.controller.isGenerating
  }

  /**
   * Update playback button states
   */
  updatePlaybackButtons () {
    if (this.elements.playPauseBtn) {
      const isDisabled = !this.controller.walk
      this.elements.playPauseBtn.disabled = isDisabled
      this.elements.playPauseBtn.classList.toggle('disabled', isDisabled)

      if (this.controller.isPlaying) {
        this.elements.playPauseBtn.textContent = '⏸ Pause'
        this.elements.playPauseBtn.title = 'Pause (Space)'
      } else {
        this.elements.playPauseBtn.textContent = '▶ Play'
        this.elements.playPauseBtn.title = 'Play (Space)'
      }
      console.log('[LoopPanel] updatePlaybackButtons:', { isDisabled, isPlaying: this.controller.isPlaying, hasWalk: !!this.controller.walk })
    }

    if (this.elements.stopBtn) {
      const isDisabled = !this.controller.walk && !this.controller.isSavingLoop
      this.elements.stopBtn.disabled = isDisabled
      this.elements.stopBtn.classList.toggle('disabled', isDisabled)

      if (this.controller.isSavingLoop) {
        this.elements.stopBtn.textContent = '⏹ Cancel Save'
        this.elements.stopBtn.title = 'Cancel saving loop'
      } else {
        this.elements.stopBtn.textContent = '⏹ Stop'
        this.elements.stopBtn.title = 'Stop (Escape)'
      }
    }

    if (this.elements.saveLoopBtn) {
      const isDisabled = !this.controller.walk || this.controller.isPlaying || this.controller.isSavingLoop
      this.elements.saveLoopBtn.disabled = isDisabled
      this.elements.saveLoopBtn.classList.toggle('disabled', isDisabled)

      if (this.controller.isSavingLoop) {
        this.elements.saveLoopBtn.textContent = '⏳ Saving...'
      } else {
        this.elements.saveLoopBtn.textContent = '💾 Save Loop'
      }
    }

    if (this.elements.refreshBtn) {
      const isDisabled = !this.controller.walk || this.controller.isGenerating || this.controller.isPlaying || this.controller.isSavingLoop
      this.elements.refreshBtn.disabled = isDisabled
      this.elements.refreshBtn.classList.toggle('disabled', isDisabled)
    }
  }

  /**
   * Handle save loop button click
   */
  async handleSaveLoop () {
    if (!this.controller.walk || this.controller.walk.length === 0) {
      console.warn('[LoopPanel] No walk to save')
      return
    }

    if (this.controller.isSavingLoop) {
      console.warn('[LoopPanel] Save already in progress')
      return
    }

    console.log('[LoopPanel] Starting loop save...')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

    try {
      await this.controller.saveLoop(
        async (frameIndex, frame) => {
          if (this.callbacks.onSaveFrame) {
            const filename = `loop-${timestamp}-frame-${(frameIndex + 1).toString().padStart(3, '0')}`
            console.log(`[LoopPanel] Saving frame ${frameIndex + 1}/${this.controller.walk.length}: ${filename}`)
            await this.callbacks.onSaveFrame(filename)
          }
        },
        (current, total) => {
          console.log(`[LoopPanel] Progress: ${current}/${total}`)
          this.updateFrame()
          this.updatePlaybackButtons()
        }
      )
      console.log('[LoopPanel] Loop save complete')
    } catch (error) {
      console.error('[LoopPanel] Error saving loop:', error)
    } finally {
      this.updatePlaybackButtons()
    }
  }

  /**
   * Update FPS display
   */
  updateFPSDisplay () {
    if (this.elements.fpsValue) {
      this.elements.fpsValue.textContent = `${this.controller.fps} FPS`
    }
  }

  /**
   * Show/hide loading spinner
   */
  setLoading (isLoading) {
    if (this.elements.loadingSpinner) {
      this.elements.loadingSpinner.style.display = isLoading ? 'block' : 'none'
    }

    if (this.elements.loopLengthInput) {
      this.elements.loopLengthInput.disabled = isLoading
    }
    if (this.elements.playPauseBtn) {
      this.elements.playPauseBtn.disabled = isLoading
    }
    if (this.elements.stopBtn) {
      this.elements.stopBtn.disabled = isLoading
    }
    if (this.elements.saveLoopBtn) {
      this.elements.saveLoopBtn.disabled = isLoading
    }
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.disabled = isLoading
    }

    this.updateToggleButton()
  }

  /**
   * Update help text based on current state
   */
  updateHelp () {
    if (!this.elements.helpText) return

    let newText = ''
    if (!this.controller.enabled) {
      newText = 'Enable loop mode to create seamless animated sequences from image pairs.'
    } else if (!this.canGenerate()) {
      newText = 'Need at least 3 unique images to generate a loop.'
    } else if (this.controller.isGenerating) {
      newText = 'Generating animation sequence...'
    } else if (this.controller.lastGenerationError) {
      newText = `Generation failed: ${this.controller.lastGenerationError}`
    } else if (this.controller.lastGenerationMetadata?.isLoopFallback) {
      const requested = this.controller.lastGenerationMetadata.requestedLoopLength
      const achieved = this.controller.lastGenerationMetadata.achievedLoopLength
      newText = `Generated ${achieved} frames (requested ${requested}).`
    } else if (!this.controller.walk) {
      newText = 'Set loop length and generate the animation.'
    } else if (this.controller.isPlaying) {
      newText = 'Space: pause | Esc: stop | Drag slider to scrub'
    } else {
      newText = 'Space: play | Esc: stop | Adjust FPS or loop length to regenerate'
    }

    console.log('[LoopPanel] updateHelp setting text:', newText, 'isGenerating:', this.controller.isGenerating)
    this.elements.helpText.textContent = newText
  }

  /**
   * Update all UI elements based on controller state
   */
  updateAll () {
    console.log('[LoopPanel] updateAll called. Controller state:', {
      enabled: this.controller.enabled,
      walk: this.controller.walk ? this.controller.walk.length : null,
      isGenerating: this.controller.isGenerating
    })
    this.updateToggleButton()
    this.updateLoopLengthInput()
    this.updatePlaybackButtons()
    this.updateFPSDisplay()
    this.updateHelp()

    if (this.controller.walk) {
      this.updateFrame(this.controller.getCurrentFrame())
    }
  }

  /**
   * Return the panel HTML.
   *
   * Class names used by tests are preserved:
   *   .loop-animation-panel  — outer container (panelElement)
   *   .loop-panel-section    — each control section (shown/hidden on enable)
   *
   * The minimal <style> block covers computed-style properties checked by tests.
   * All visual styling is in css/style.css.
   */
  getHTML () {
    return `
      <div class="loop-animation-panel">
        <style>
          /* Minimal rules needed for computed-style tests (jsdom doesn't load external CSS) */
          .loop-animation-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100;
            pointer-events: auto;
          }
          .loop-animation-panel * { pointer-events: auto; }
          .loop-panel-section { display: none; }
          .loop-panel-section:first-of-type { display: block; }
          .loop-animation-panel.enabled .loop-panel-section { display: block; }
        </style>

        <div class="loop-panel__header">
          <span class="loop-panel__title">Loop Animation</span>
        </div>

        <div class="loop-panel__body">
          <!-- Toggle (always visible via :first-of-type) -->
          <div class="loop-panel-section">
            <button class="loop-toggle-btn" data-action="toggle">Enable Loop Mode</button>
          </div>

          <!-- Loop Length -->
          <div class="loop-panel-section">
            <span class="loop-section-label">Loop Length</span>
            <div class="loop-length-row">
              <input type="number" class="loop-number-input" data-input="loop-length" min="3" max="100" value="5">
              <span class="loop-length-max" data-display="loop-length-max"></span>
            </div>
          </div>

          <!-- Playback -->
          <div class="loop-panel-section">
            <span class="loop-section-label">Playback</span>
            <div class="loop-controls">
              <button class="loop-btn" data-action="play-pause" title="Play / Pause (Space)">▶ Play</button>
              <button class="loop-btn" data-action="stop" title="Stop (Escape)">⏹ Stop</button>
              <button class="loop-btn" data-action="save-loop" title="Save all frames as individual images">💾 Save Loop</button>
              <button class="loop-btn" data-action="refresh" title="Regenerate loop with current settings">⟳ Refresh</button>
            </div>
            <input type="range" class="loop-range" data-input="frame-slider" min="0" max="100" value="0">
            <div class="loop-info-row">
              <span class="loop-info-label">Frame</span>
              <span class="loop-info-value" data-display="frame-counter">—</span>
            </div>
          </div>

          <!-- Speed -->
          <div class="loop-panel-section">
            <span class="loop-section-label">Speed</span>
            <div class="loop-fps-row">
              <input type="range" class="loop-range" data-input="fps" min="1" max="60" value="12">
              <span class="loop-fps-value" data-display="fps-value">12 FPS</span>
            </div>
          </div>

          <!-- Current Pair -->
          <div class="loop-panel-section">
            <span class="loop-section-label">Current Pair</span>
            <div data-display="preview-pair">
              <div class="loop-pair-item"><strong>A</strong> —</div>
              <div class="loop-pair-item"><strong>B</strong> —</div>
            </div>
          </div>

          <div class="loop-loading" data-display="loading">⏳ Generating...</div>
          <div class="loop-help" data-display="help-text"></div>
        </div>
      </div>
    `
  }

  /**
   * Handle refresh/regenerate button click
   */
  handleRefresh () {
    if (!this.controller || this.controller.isGenerating) return
    this.controller.generateWalk()
  }

  /**
   * Destroy the panel and cleanup
   */
  destroy () {
    if (this.panel) {
      this.panel.remove()
    }
  }
}
