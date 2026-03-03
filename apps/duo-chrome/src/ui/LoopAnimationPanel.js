/**
 * Loop Animation UI Panel — V3 Transport Module
 *
 * Provides transport controls for the looped animation feature:
 * jog wheel for frame scrubbing, in/out markers, FPS selector,
 * playback controls, and sequence preview.
 *
 * Visual styling is in css/style.css.
 * A minimal <style> block is kept inline for computed-style values used in tests
 * (jsdom does not load external CSS files).
 *
 * Class names required by tests (DO NOT rename):
 *   .loop-animation-panel  — outer container (queried as panelElement)
 *   .loop-panel-section    — each control section (show/hide on enable)
 */

export class LoopAnimationPanel {
  constructor (controller, callbacks = {}) {
    this.controller = controller
    this.callbacks = callbacks
    this.panel = null
    this.elements = {}

    // In/out playback markers
    this.inPoint = 0
    this.outPoint = 0

    // Jog wheel drag state
    this._jogDragging = false
    this._jogStartY = 0
    this._jogStartFrame = 0
    this._jogPendingFrame = null
    this._jogRafPending = false
  }

  /**
   * Create and mount the control panel.
   * In V3 the mount target is always #loop-animation-panel (inside Signal Panel).
   * The rack-module wrapper + header are already in index.html;
   * we append our content after the existing header div.
   */
  mount (containerId = 'loop-animation-panel') {
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      document.body.appendChild(container)
    }

    // In V3, the container already has a rack-module__header child (from index.html).
    // We append our panel content (getHTML produces .loop-animation-panel) as a new child.
    const wrapper = document.createElement('div')
    wrapper.className = 'rack-module__body'
    wrapper.innerHTML = this.getHTML()
    container.appendChild(wrapper)

    this.panel = container
    this.cacheElements()
    this.attachEventListeners()
    this._attachJogWheel()

    return this.panel
  }

  /**
   * Cache references to frequently used elements.
   * NOTE: panelElement targets .loop-animation-panel (required by tests).
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
      helpText: this.panel.querySelector('[data-display="help-text"]'),
      // V3-specific
      jogWheel: this.panel.querySelector('.jog-wheel'),
      jogTick: this.panel.querySelector('.jog-tick'),
      jogFrameNum: this.panel.querySelector('[data-display="jog-frame"]'),
      timelineTrack: this.panel.querySelector('.loop-timeline__track'),
      timelineHead: this.panel.querySelector('.loop-timeline__head'),
      inMarker: this.panel.querySelector('.loop-timeline__marker[data-marker="in"]'),
      outMarker: this.panel.querySelector('.loop-timeline__marker[data-marker="out"]'),
      inValue: this.panel.querySelector('[data-display="in-point"]'),
      outValue: this.panel.querySelector('[data-display="out-point"]'),
      fpsBtns: this.panel.querySelectorAll('.loop-fps-btn')
    }
  }

  /**
   * Attach event listeners.
   */
  attachEventListeners () {
    // Stop events propagating outside the panel (prevents canvas interactions)
    if (this.panelElement) {
      ['mousedown', 'mouseup', 'click'].forEach(type => {
        this.panelElement.addEventListener(type, e => {
          e.stopPropagation()
          console.log('[LoopPanel] Panel bubble handler stopping propagation for:', type)
        }, false)
      })
    }

    // Toggle
    if (this.elements.toggleBtn) {
      this.elements.toggleBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation() })
      this.elements.toggleBtn.addEventListener('mouseup', e => { e.preventDefault(); e.stopPropagation() })
      this.elements.toggleBtn.addEventListener('click', e => {
        console.log('[LoopPanel] Toggle button clicked')
        e.preventDefault(); e.stopPropagation()
        if (this.controller.enabled) {
          this.controller.disable()
          if (this.callbacks.onLoopDisabled) this.callbacks.onLoopDisabled()
        } else {
          this.controller.enable()
          if (this.callbacks.onLoopEnabled) this.callbacks.onLoopEnabled()
        }
        this.updateToggleButton()
      })
    }

    // Loop length
    if (this.elements.loopLengthInput) {
      this.elements.loopLengthInput.addEventListener('change', e => {
        e.stopPropagation()
        const length = parseInt(e.target.value, 10)
        if (this.controller.setLoopLength(length)) {
          this.controller.generateWalk()
        } else {
          this.updateLoopLengthInput()
        }
      })
    }

    // Play / Pause
    if (this.elements.playPauseBtn) {
      this.elements.playPauseBtn.addEventListener('click', e => {
        e.stopPropagation()
        if (this.controller.isPlaying) {
          this.controller.pause()
        } else {
          this.controller.play()
        }
        this.updatePlaybackButtons()
      })
    }

    // Stop
    if (this.elements.stopBtn) {
      this.elements.stopBtn.addEventListener('click', e => {
        e.stopPropagation()
        if (this.controller.isSavingLoop) {
          this.controller.interruptSave()
        } else {
          this.controller.stop()
        }
        this.updatePlaybackButtons()
      })
    }

    // Save Loop
    if (this.elements.saveLoopBtn) {
      this.elements.saveLoopBtn.addEventListener('click', async e => {
        e.stopPropagation()
        console.log('[LoopPanel] Save Loop button clicked')
        await this.handleSaveLoop()
      })
    }

    // Refresh / Regenerate
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener('click', e => {
        e.stopPropagation()
        console.log('[LoopPanel] Refresh button clicked')
        this.handleRefresh()
      })
    }

    // Frame slider (hidden range — kept for test compatibility and as fallback)
    if (this.elements.frameSlider) {
      this.elements.frameSlider.addEventListener('input', e => {
        e.stopPropagation()
        const frame = parseInt(e.target.value, 10)
        this.controller.setFrame(frame)
        this._updateJogAngle(frame)
      })
    }

    // FPS slider (hidden range — kept for test compatibility)
    if (this.elements.fpsSlider) {
      this.elements.fpsSlider.addEventListener('input', e => {
        e.stopPropagation()
        const fps = parseInt(e.target.value, 10)
        this.controller.setFPS(fps)
        this.updateFPSDisplay()
      })
    }

    // FPS segmented buttons
    this.elements.fpsBtns?.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation()
        const fps = parseInt(btn.dataset.fps, 10)
        this.controller.setFPS(fps)
        // Sync hidden slider
        if (this.elements.fpsSlider) this.elements.fpsSlider.value = fps
        this.updateFPSDisplay()
      })
    })

    // In/Out set buttons
    const inBtn = this.panel.querySelector('[data-action="set-in"]')
    const outBtn = this.panel.querySelector('[data-action="set-out"]')
    if (inBtn) {
      inBtn.addEventListener('click', e => {
        e.stopPropagation()
        this.inPoint = this.controller.currentFrameIndex || 0
        this._updateInOutDisplay()
      })
    }
    if (outBtn) {
      outBtn.addEventListener('click', e => {
        e.stopPropagation()
        const total = this.controller.walk?.length || 1
        this.outPoint = Math.min(this.controller.currentFrameIndex || 0, total - 1)
        this._updateInOutDisplay()
      })
    }

    // Collapse buttons (rack-module level, outside .loop-animation-panel)
    const transportCollapse = document.getElementById('transport-collapse')
    if (transportCollapse) {
      transportCollapse.addEventListener('click', e => {
        e.stopPropagation()
        const module = document.getElementById('loop-animation-panel')
        module?.classList.toggle('is-collapsed')
        transportCollapse.textContent = module?.classList.contains('is-collapsed') ? '+' : '−'
      })
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (!this.controller.enabled) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (this.controller.isPlaying) { this.controller.pause() } else { this.controller.play() }
          this.updatePlaybackButtons()
          break
        case 'Escape':
          e.preventDefault()
          this.controller.stop()
          this.updatePlaybackButtons()
          break
        case ',':
          e.preventDefault()
          this._stepFrame(-1)
          break
        case '.':
          e.preventDefault()
          this._stepFrame(1)
          break
        case '<':
          e.preventDefault()
          this._stepFrame(-5)
          break
        case '>':
          e.preventDefault()
          this._stepFrame(5)
          break
      }
    })
  }

  /**
   * Attach jog wheel drag behaviour.
   * Vertical drag: drag up → advance frames, drag down → go back.
   */
  _attachJogWheel () {
    const wheel = this.elements.jogWheel
    if (!wheel) return

    wheel.addEventListener('mousedown', e => {
      e.preventDefault(); e.stopPropagation()
      this._jogDragging = true
      this._jogStartY = e.clientY
      this._jogStartFrame = this.controller.currentFrameIndex || 0
      wheel.classList.add('is-dragging')
    })

    document.addEventListener('mousemove', e => {
      if (!this._jogDragging) return
      const dy = this._jogStartY - e.clientY // drag up = advance frames
      const total = this.controller.walk?.length || 1
      const sensitivity = Math.max(1, total / 60) // pixels per frame
      const delta = Math.round(dy / sensitivity)
      const newFrame = ((this._jogStartFrame + delta) % total + total) % total

      // Update DOM immediately for snappy visual feedback
      this._updateJogAngle(newFrame)
      if (this.elements.frameSlider) this.elements.frameSlider.value = newFrame
      this._updateTimelineHead(newFrame)

      // Throttle the expensive image load to once per animation frame
      this._jogPendingFrame = newFrame
      if (!this._jogRafPending) {
        this._jogRafPending = true
        requestAnimationFrame(() => {
          this.controller.setFrame(this._jogPendingFrame)
          this._jogRafPending = false
        })
      }
    })

    // capture:true — fires before any stopPropagation in the bubble chain,
    // so releasing the mouse anywhere (including inside the panel) is detected.
    document.addEventListener('mouseup', () => {
      if (this._jogDragging) {
        this._jogDragging = false
        wheel.classList.remove('is-dragging')
        // Ensure the final resting frame is always rendered
        if (this._jogPendingFrame !== null) {
          this.controller.setFrame(this._jogPendingFrame)
          this._jogPendingFrame = null
        }
      }
    }, { capture: true })
  }

  /**
   * Step one or more frames (wrapping).
   */
  _stepFrame (delta) {
    const total = this.controller.walk?.length || 1
    const current = this.controller.currentFrameIndex || 0
    const next = ((current + delta) % total + total) % total
    this.controller.setFrame(next)
    this._updateJogAngle(next)
    if (this.elements.frameSlider) this.elements.frameSlider.value = next
    this._updateTimelineHead(next)
  }

  /**
   * Rotate the jog wheel tick mark to reflect frame position.
   */
  _updateJogAngle (frame) {
    const total = this.controller.walk?.length || 1
    const angle = (frame / total) * 360
    if (this.elements.jogTick) {
      this.elements.jogTick.style.transform = `rotate(${angle}deg)`
    }
    if (this.elements.jogFrameNum) {
      this.elements.jogFrameNum.textContent = String(frame + 1).padStart(3, '0')
    }
  }

  /**
   * Move the playhead on the mini timeline.
   */
  _updateTimelineHead (frame) {
    const total = this.controller.walk?.length || 1
    const pct = (frame / Math.max(1, total - 1)) * 100
    if (this.elements.timelineHead) {
      this.elements.timelineHead.style.left = `${pct}%`
    }
  }

  /**
   * Sync in/out display values and timeline markers.
   */
  _updateInOutDisplay () {
    const total = this.controller.walk?.length || 1

    if (this.elements.inValue) {
      this.elements.inValue.textContent = String(this.inPoint + 1).padStart(3, '0')
    }
    if (this.elements.outValue) {
      this.elements.outValue.textContent = String(this.outPoint + 1).padStart(3, '0')
    }

    // Timeline markers
    const inPct = (this.inPoint / Math.max(1, total - 1)) * 100
    const outPct = (this.outPoint / Math.max(1, total - 1)) * 100
    if (this.elements.inMarker) this.elements.inMarker.style.left = `${inPct}%`
    if (this.elements.outMarker) this.elements.outMarker.style.left = `${outPct}%`

    // Active range track
    if (this.elements.timelineTrack) {
      this.elements.timelineTrack.style.left = `${inPct}%`
      this.elements.timelineTrack.style.right = `${100 - outPct}%`
    }
  }

  /* ── Public update methods ─────────────────────────────────── */

  updateFrame (frame) {
    if (!frame) return
    console.log('[LoopPanel] updateFrame called with frame:', frame)

    const total = this.controller.walk ? this.controller.walk.length : 0
    const idx = this.controller.currentFrameIndex

    if (this.elements.frameCounter) {
      this.elements.frameCounter.textContent = `Frame ${idx + 1} / ${total}`
    }
    if (this.elements.frameSlider && this.controller.walk) {
      this.elements.frameSlider.max = total - 1
      this.elements.frameSlider.value = idx
    }

    this._updateJogAngle(idx)
    this._updateTimelineHead(idx)
    this.updatePreview(frame)
  }

  updatePreview (frame) {
    if (!this.elements.previewPair || !frame) return

    const { a, b } = frame.pair
    let aImg, bImg
    if (typeof a === 'number' && typeof b === 'number') {
      aImg = this.controller.imageSetA[a]
      bImg = this.controller.imageSetB[b]
    } else {
      aImg = a; bImg = b
    }
    aImg = aImg || '?'
    bImg = bImg || '?'

    // formatName: strip extension + tail-truncate; NO underscore replacement
    // (tests assert imageA_0 appears verbatim)
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

  updateToggleButton () {
    if (!this.elements.toggleBtn) return
    if (this.controller.isGenerating) {
      this.elements.toggleBtn.textContent = '⏳ Generating…'
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
    // Sync in/out to new walk size
    this.outPoint = Math.max(0, (range.current || 1) - 1)
    this._updateInOutDisplay()
  }

  updatePlaybackButtons () {
    if (this.elements.playPauseBtn) {
      const isDisabled = !this.controller.walk
      this.elements.playPauseBtn.disabled = isDisabled
      this.elements.playPauseBtn.classList.toggle('disabled', isDisabled)
      this.elements.playPauseBtn.classList.toggle('playing', this.controller.isPlaying)

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
      this.elements.stopBtn.textContent = this.controller.isSavingLoop ? '⏹ Cancel Save' : '⏹ Stop'
      this.elements.stopBtn.title = this.controller.isSavingLoop ? 'Cancel saving loop' : 'Stop (Escape)'
    }

    if (this.elements.saveLoopBtn) {
      const isDisabled = !this.controller.walk || this.controller.isPlaying || this.controller.isSavingLoop
      this.elements.saveLoopBtn.disabled = isDisabled
      this.elements.saveLoopBtn.classList.toggle('disabled', isDisabled)
      this.elements.saveLoopBtn.textContent = this.controller.isSavingLoop ? '⏳' : '💾'
    }

    if (this.elements.refreshBtn) {
      const isDisabled = !this.controller.walk || this.controller.isGenerating || this.controller.isPlaying || this.controller.isSavingLoop
      this.elements.refreshBtn.disabled = isDisabled
      this.elements.refreshBtn.classList.toggle('disabled', isDisabled)
    }
  }

  updateFPSDisplay () {
    const fps = this.controller.fps
    // Update segmented buttons
    this.elements.fpsBtns?.forEach(btn => {
      btn.classList.toggle('is-active', parseInt(btn.dataset.fps, 10) === fps)
    })
    // Update legacy text display
    if (this.elements.fpsValue) {
      this.elements.fpsValue.textContent = `${fps} FPS`
    }
  }

  setLoading (isLoading) {
    if (this.elements.loadingSpinner) {
      this.elements.loadingSpinner.style.display = isLoading ? 'block' : 'none'
    }
    ['loopLengthInput', 'playPauseBtn', 'stopBtn', 'saveLoopBtn', 'refreshBtn'].forEach(key => {
      if (this.elements[key]) this.elements[key].disabled = isLoading
    })
    this.updateToggleButton()
  }

  updateHelp () {
    if (!this.elements.helpText) return
    let text = ''
    if (!this.controller.enabled) {
      text = 'Enable loop mode to create seamless animated sequences.'
    } else if (!this.canGenerate()) {
      text = 'Need at least 3 unique images to generate a loop.'
    } else if (this.controller.isGenerating) {
      text = 'Generating animation sequence…'
    } else if (this.controller.lastGenerationError) {
      text = `Error: ${this.controller.lastGenerationError}`
    } else if (this.controller.lastGenerationMetadata?.isLoopFallback) {
      const { requestedLoopLength: req, achievedLoopLength: got } = this.controller.lastGenerationMetadata
      text = `Generated ${got} frames (requested ${req}).`
    } else if (!this.controller.walk) {
      text = 'Set loop length and generate.'
    } else if (this.controller.isPlaying) {
      text = 'Space: pause · Esc: stop · drag wheel to scrub'
    } else {
      text = 'Space: play · Esc: stop · Adjust FPS or length to regenerate'
    }
    console.log('[LoopPanel] updateHelp setting text:', text, 'isGenerating:', this.controller.isGenerating)
    this.elements.helpText.textContent = text
  }

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

  async handleSaveLoop () {
    if (!this.controller.walk || this.controller.walk.length === 0) {
      console.warn('[LoopPanel] No walk to save')
      return
    }
    if (this.controller.isSavingLoop) {
      console.warn('[LoopPanel] Save already in progress')
      return
    }
    console.log('[LoopPanel] Starting loop save…')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    try {
      await this.controller.saveLoop(
        async (frameIndex) => {
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

  handleRefresh () {
    if (!this.controller || this.controller.isGenerating) return
    this.controller.generateWalk()
  }

  destroy () {
    if (this.panel) this.panel.remove()
  }

  /**
   * Return the panel HTML.
   *
   * Class names required by tests — DO NOT rename:
   *   .loop-animation-panel  — outer container (panelElement)
   *   .loop-panel-section    — each control section
   *
   * Data attributes required by cacheElements() and tests:
   *   data-action="toggle|play-pause|stop|save-loop|refresh"
   *   data-input="loop-length|fps|frame-slider"
   *   data-display="frame-counter|fps-value|preview-pair|loading|help-text|loop-length-max"
   *
   * The minimal <style> block covers computed-style properties checked by tests
   * (jsdom does not load external CSS files).
   */
  getHTML () {
    return `
      <div class="loop-animation-panel">
        <style>
          /* Minimal rules for computed-style tests — jsdom ignores external CSS */
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

        <!-- Section 0: Toggle (always visible via :first-of-type) -->
        <div class="loop-panel-section">
          <button class="loop-toggle-btn" data-action="toggle">Enable Loop Mode</button>
        </div>

        <!-- Section 1: Loop Length -->
        <div class="loop-panel-section">
          <span class="loop-section-label">Loop Length</span>
          <div class="loop-length-row">
            <input type="number" class="loop-number-input" data-input="loop-length" min="3" max="100" value="5">
            <span class="loop-length-max" data-display="loop-length-max"></span>
          </div>
        </div>

        <!-- Section 2: Jog Wheel + In/Out -->
        <div class="loop-panel-section">
          <div class="jog-wheel-container">
            <svg class="jog-wheel" viewBox="-52 -52 104 104" width="110" height="110"
                 role="slider" aria-label="Frame scrub wheel">
              <!-- Outer ring -->
              <circle r="50" class="jog-outer"/>
              <!-- Tick marks around rim -->
              <g class="jog-ticks-minor">
                ${Array.from({ length: 24 }, (_, i) => {
                  const a = (i / 24) * 2 * Math.PI
                  const x1 = Math.sin(a) * 44; const y1 = -Math.cos(a) * 44
                  const x2 = Math.sin(a) * 49; const y2 = -Math.cos(a) * 49
                  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="jog-tick-minor"/>`
                }).join('')}
              </g>
              <!-- Inner platter -->
              <circle r="36" class="jog-inner"/>
              <!-- Position tick (rotates via JS) -->
              <line class="jog-tick" x1="0" y1="-36" x2="0" y2="-44"
                    style="transform-origin: 0 0; transform: rotate(0deg)"/>
            </svg>
            <div class="jog-frame-display">
              <span class="jog-frame-num led-display" data-display="jog-frame">001</span>
              <span class="jog-frame-label">FRAME</span>
            </div>
          <div class="jog-wheel-hint">DRAG ↕ TO SCRUB</div>
          </div>

          <!-- Hidden range for test compatibility -->
          <input type="range" class="loop-range" data-input="frame-slider"
                 min="0" max="100" value="0" style="display:none">

          <!-- In/Out markers -->
          <div class="loop-inout-row">
            <div class="loop-marker-group">
              <span class="loop-marker-label">IN</span>
              <span class="loop-marker-value" data-display="in-point">001</span>
              <button class="loop-marker-set-btn" data-action="set-in" title="Set In Point to current frame">SET</button>
            </div>
            <div class="loop-marker-group">
              <span class="loop-marker-label">OUT</span>
              <span class="loop-marker-value" data-display="out-point">001</span>
              <button class="loop-marker-set-btn" data-action="set-out" title="Set Out Point to current frame">SET</button>
            </div>
          </div>

          <!-- Mini timeline -->
          <div class="loop-timeline">
            <div class="loop-timeline__track"></div>
            <div class="loop-timeline__marker" data-marker="in" style="left:0%"></div>
            <div class="loop-timeline__marker" data-marker="out" style="left:100%"></div>
            <div class="loop-timeline__head" style="left:0%"></div>
          </div>
        </div>

        <!-- Section 3: FPS + Transport Controls -->
        <div class="loop-panel-section">
          <span class="loop-section-label">Speed</span>
          <div class="loop-fps-selector">
            <button class="loop-fps-btn" data-fps="8">8</button>
            <button class="loop-fps-btn is-active" data-fps="12">12</button>
            <button class="loop-fps-btn" data-fps="24">24</button>
            <button class="loop-fps-btn" data-fps="30">30</button>
          </div>
          <!-- Hidden slider for test compatibility -->
          <input type="range" class="loop-range" data-input="fps" min="1" max="60" value="12" style="display:none">
          <span class="loop-fps-value" data-display="fps-value" style="display:none">12 FPS</span>

          <span class="loop-section-label">Transport</span>
          <div class="loop-transport-row">
            <button class="loop-btn" data-action="play-pause" title="Play / Pause (Space)">▶</button>
            <button class="loop-btn" data-action="stop" title="Stop (Escape)">⏹</button>
            <button class="loop-btn" data-action="save-loop" title="Save all frames">💾</button>
            <button class="loop-btn" data-action="refresh" title="Regenerate loop">⟳</button>
          </div>
          <div class="loop-info-row">
            <span class="loop-info-value" data-display="frame-counter">Frame — / —</span>
          </div>
        </div>

        <!-- Section 4: Sequence Preview -->
        <div class="loop-panel-section">
          <span class="loop-section-label">Current Pair</span>
          <div data-display="preview-pair">
            <div class="loop-pair-item"><strong>A</strong> —</div>
            <div class="loop-pair-item"><strong>B</strong> —</div>
          </div>
        </div>

        <div class="loop-loading" data-display="loading">⏳ Generating…</div>
        <div class="loop-help" data-display="help-text"></div>
      </div>
    `
  }
}
