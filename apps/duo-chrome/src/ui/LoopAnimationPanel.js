/**
 * Loop Animation UI Panel
 *
 * Provides UI controls for the looped animation feature.
 * Includes toggle, loop length input, playback controls, FPS slider, and frame counter.
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
  mount(containerId = 'loop-animation-panel') {
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
  cacheElements() {
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
  attachEventListeners() {
    // Panel-level bubble handler: block events from propagating OUTSIDE the panel
    // Uses bubble phase so child elements get the event first
    if (this.panelElement) {
      ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        this.panelElement.addEventListener(eventType, (e) => {
          // Stop propagation in bubble phase - event has already reached target
          e.stopPropagation()
          console.log('[LoopPanel] Panel bubble handler stopping propagation for:', eventType)
        }, false) // bubble phase (false or omitted) - fires AFTER child handlers
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

    // Loop length input - removed because panel handler now covers it
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
        // If saving, interrupt the save
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
        case ' ': // Space to play/pause
          e.preventDefault()
          if (this.controller.isPlaying) {
            this.controller.pause()
          } else {
            this.controller.play()
          }
          this.updatePlaybackButtons()
          break
        case 'Escape': // Escape to stop
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
  updateFrame(frame) {
    if (!frame) return

    console.log('[LoopPanel] updateFrame called with frame:', frame)

    // Update frame counter
    if (this.elements.frameCounter) {
      const total = this.controller.walk ? this.controller.walk.length : 0
      this.elements.frameCounter.textContent = `Frame ${this.controller.currentFrameIndex + 1} / ${total}`
    }

    // Update frame slider
    if (this.elements.frameSlider && this.controller.walk) {
      this.elements.frameSlider.max = this.controller.walk.length - 1
      this.elements.frameSlider.value = this.controller.currentFrameIndex
    }

    // Update preview
    this.updatePreview(frame)
  }

  /**
   * Update preview panel with current frame's image pair
   */
  updatePreview(frame) {
    if (!this.elements.previewPair || !frame) return

    const { a, b } = frame.pair

    // Handle both index-based and filename-based pair values
    let aImg, bImg

    // If a and b are numbers (indices), look them up in imageSetA/B
    if (typeof a === 'number' && typeof b === 'number') {
      aImg = this.controller.imageSetA[a]
      bImg = this.controller.imageSetB[b]
    } else {
      // If a and b are already filenames, use them directly
      aImg = a
      bImg = b
    }

    aImg = aImg || '?'
    bImg = bImg || '?'

    const formatName = (name) => {
      if (!name || name === '?') return '?'
      return String(name).replace(/\.[^/.]+$/, '').substring(0, 20)
    }

    this.elements.previewPair.innerHTML = `
      <div class="preview-item">
        <strong>A:</strong> ${formatName(aImg)}
      </div>
      <div class="preview-item">
        <strong>B:</strong> ${formatName(bImg)}
      </div>
    `
  }

  /**
   * Update toggle button state
   */
  updateToggleButton() {
    if (!this.elements.toggleBtn) return

    if (this.controller.isGenerating) {
      // Show generating status during walk generation
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
  updateLoopLengthInput() {
    if (!this.elements.loopLengthInput) return

    const range = this.controller.getLoopLengthRange()
    this.elements.loopLengthInput.min = range.min
    this.elements.loopLengthInput.max = range.max
    this.elements.loopLengthInput.value = range.current

    if (this.elements.loopLengthMax) {
      this.elements.loopLengthMax.textContent = `(max: ${range.max})`
    }

    // Disable if not enough images
    this.elements.loopLengthInput.disabled = !this.canGenerate() || this.controller.isGenerating
  }

  /**
   * Update playback button states
   */
  updatePlaybackButtons() {
    if (this.elements.playPauseBtn) {
      const isDisabled = !this.controller.walk
      this.elements.playPauseBtn.disabled = isDisabled
      this.elements.playPauseBtn.classList.toggle('disabled', isDisabled)

      // Update text based on playing state
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
      // Stop button stays enabled during save to allow interruption
      const isDisabled = !this.controller.walk && !this.controller.isSavingLoop
      this.elements.stopBtn.disabled = isDisabled
      this.elements.stopBtn.classList.toggle('disabled', isDisabled)
      
      // Update text during save
      if (this.controller.isSavingLoop) {
        this.elements.stopBtn.textContent = '⏹ Cancel Save'
        this.elements.stopBtn.title = 'Cancel saving loop'
      } else {
        this.elements.stopBtn.textContent = '⏹ Stop'
        this.elements.stopBtn.title = 'Stop (Escape)'
      }
    }

    if (this.elements.saveLoopBtn) {
      // Enable when walk exists and not playing/saving
      const isDisabled = !this.controller.walk || this.controller.isPlaying || this.controller.isSavingLoop
      this.elements.saveLoopBtn.disabled = isDisabled
      this.elements.saveLoopBtn.classList.toggle('disabled', isDisabled)
      
      // Update text during save
      if (this.controller.isSavingLoop) {
        this.elements.saveLoopBtn.textContent = '⏳ Saving...'
      } else {
        this.elements.saveLoopBtn.textContent = '💾 Save Loop'
      }
    }

    if (this.elements.refreshBtn) {
      // Enable when walk exists and not generating/playing/saving
      const isDisabled = !this.controller.walk || this.controller.isGenerating || this.controller.isPlaying || this.controller.isSavingLoop
      this.elements.refreshBtn.disabled = isDisabled
      this.elements.refreshBtn.classList.toggle('disabled', isDisabled)
    }
  }

  /**
   * Handle save loop button click
   */
  async handleSaveLoop() {
    if (!this.controller.walk || this.controller.walk.length === 0) {
      console.warn('[LoopPanel] No walk to save')
      return
    }

    if (this.controller.isSavingLoop) {
      console.warn('[LoopPanel] Save already in progress')
      return
    }

    console.log('[LoopPanel] Starting loop save...')
    
    // Generate timestamp once for all frames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    
    try {
      await this.controller.saveLoop(
        async (frameIndex, frame) => {
          // Call the save callback from duo-chrome
          if (this.callbacks.onSaveFrame) {
            const filename = `loop-${timestamp}-frame-${(frameIndex + 1).toString().padStart(3, '0')}`
            console.log(`[LoopPanel] Saving frame ${frameIndex + 1}/${this.controller.walk.length}: ${filename}`)
            await this.callbacks.onSaveFrame(filename)
          }
        },
        (current, total) => {
          // Update progress in frame counter
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
  updateFPSDisplay() {
    if (this.elements.fpsValue) {
      this.elements.fpsValue.textContent = `${this.controller.fps} FPS`
    }
  }

  /**
   * Show/hide loading spinner
   */
  setLoading(isLoading) {
    if (this.elements.loadingSpinner) {
      this.elements.loadingSpinner.style.display = isLoading ? 'block' : 'none'
    }

    // Disable controls during generation
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

    // Update toggle button text to show generating status
    this.updateToggleButton()
  }

  /**
   * Update help text based on current state
   */
  updateHelp() {
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
  updateAll() {
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
   * Get HTML for the control panel
   */
  getHTML() {
    return `
      <div class="loop-animation-panel">
        <style>
          .loop-animation-panel {
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(100, 100, 100, 0.5);
            border-radius: 8px;
            padding: 16px;
            color: #fff;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-width: 320px;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }

          .loop-animation-panel.enabled {
            border-color: rgba(76, 175, 80, 0.5);
          }

          .loop-panel-section {
            margin-bottom: 16px;
            display: none;
          }

          .loop-animation-panel.enabled .loop-panel-section {
            display: block;
          }

          .loop-panel-section:first-of-type {
            display: block;
          }

          .loop-panel-label {
            display: block;
            margin-bottom: 6px;
            font-weight: bold;
            color: #4CAF50;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 1px;
          }

          [data-action="toggle"] {
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
            color: #fff;
            border: 1px solid #444;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s ease;
          }

          [data-action="toggle"]:hover {
            background: linear-gradient(135deg, #3d3d3d, #2a2a2a);
            border-color: #666;
          }

          [data-action="toggle"].active {
            background: linear-gradient(135deg, #4CAF50, #388E3C);
            border-color: #4CAF50;
          }

          .loop-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
          }

          .loop-controls button {
            padding: 8px 6px;
            background: #2d2d2d;
            color: #fff;
            border: 1px solid #444;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s ease;
          }

          .loop-controls button:hover:not(:disabled) {
            background: #3d3d3d;
            border-color: #666;
          }

          .loop-controls button:disabled,
          .loop-controls button.disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .loop-controls button.active {
            background: #4CAF50;
            border-color: #4CAF50;
          }

          input[type="range"] {
            width: 100%;
            height: 4px;
            border-radius: 2px;
            background: #333;
            outline: none;
            -webkit-appearance: none;
          }

          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 6px;
            background: #4CAF50;
            cursor: pointer;
          }

          input[type="range"]::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 6px;
            background: #4CAF50;
            cursor: pointer;
            border: none;
          }

          input[type="number"] {
            width: 100%;
            padding: 6px;
            background: #2d2d2d;
            color: #fff;
            border: 1px solid #444;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
          }

          input[type="number"]:disabled {
            opacity: 0.5;
          }

          .loop-info {
            background: rgba(0, 0, 0, 0.3);
            padding: 8px;
            border-radius: 3px;
            margin-bottom: 8px;
            font-size: 11px;
            line-height: 1.5;
          }

          .preview-item {
            padding: 4px 0;
            border-bottom: 1px solid #333;
          }

          .preview-item:last-child {
            border-bottom: none;
          }

          [data-display="loading"] {
            display: none;
            text-align: center;
            color: #4CAF50;
            margin: 8px 0;
            font-size: 11px;
          }

          [data-display="help-text"] {
            display: block;
            color: #999;
            font-size: 10px;
            line-height: 1.4;
            font-style: italic;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #333;
          }

          .loop-animation-panel {
            pointer-events: auto !important;
          }

          .loop-animation-panel * {
            pointer-events: auto !important;
          }
        </style>

        <div class="loop-panel-section">
          <button data-action="toggle">Enable Loop Mode</button>
        </div>

        <div class="loop-panel-section">
          <label class="loop-panel-label">Loop Length</label>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <input type="number" data-input="loop-length" min="3" max="100" value="5" style="flex: 1;">
            <span data-display="loop-length-max" style="align-self: center; color: #999; font-size: 10px;"></span>
          </div>
        </div>

        <div class="loop-panel-section">
          <label class="loop-panel-label">Playback</label>
          <div class="loop-controls">
            <button data-action="play-pause" title="Play / Pause (Space)">▶ Play</button>
            <button data-action="stop" title="Stop (Escape)">⏹ Stop</button>
            <button data-action="save-loop" title="Save all frames as individual images">💾 Save Loop</button>
            <button data-action="refresh" title="Regenerate loop with current settings">🔄 Refresh</button>
            <div style="grid-column: 1 / -1;"></div>
            <input type="range" data-input="frame-slider" min="0" max="100" value="0" style="grid-column: 1 / -1;">
          </div>
          <div class="loop-info">
            <strong>Frame:</strong> <span data-display="frame-counter">—</span>
          </div>
        </div>

        <div class="loop-panel-section">
          <label class="loop-panel-label">Speed</label>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <input type="range" data-input="fps" min="1" max="60" value="12" style="flex: 1;">
            <span data-display="fps-value">12 FPS</span>
          </div>
        </div>

        <div class="loop-panel-section">
          <label class="loop-panel-label">Current Pair</label>
          <div class="loop-info" data-display="preview-pair">
            <div class="preview-item"><strong>A:</strong> —</div>
            <div class="preview-item"><strong>B:</strong> —</div>
          </div>
        </div>

        <div data-display="loading">⏳ Generating...</div>
        <span data-display="help-text"></span>
      </div>
    `
  }

  /**
   * Handle refresh/regenerate button click
   */
  handleRefresh() {
    if (!this.controller || this.controller.isGenerating) return
    // Preserve current state (loop mode, fps, etc.) and regenerate
    this.controller.generateWalk()
  }

  /**
   * Destroy the panel and cleanup
   */
  destroy() {
    if (this.panel) {
      this.panel.remove()
    }
  }
}
