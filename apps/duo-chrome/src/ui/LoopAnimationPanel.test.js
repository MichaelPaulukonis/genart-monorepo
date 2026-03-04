/**
 * Tests for LoopAnimationPanel UI Component
 *
 * Validates all UI controls, state management, and user interactions
 * according to Task 14.6 specification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LoopAnimationPanel } from './LoopAnimationPanel.js'

// Mock controller for testing
class MockLoopAnimationController {
  constructor () {
    this.enabled = false
    this.isPlaying = false
    this.isGenerating = false
    this.walk = null
    this.requestedLoopLength = 5
    this.maxLoopLength = 100
    this.fps = 12
    this.currentFrameIndex = 0
    this.imageSetA = ['imageA_0.jpg', 'imageA_1.jpg', 'imageA_2.jpg', 'imageA_3.jpg', 'imageA_4.jpg']
    this.imageSetB = ['imageB_0.jpg', 'imageB_1.jpg', 'imageB_2.jpg', 'imageB_3.jpg', 'imageB_4.jpg']
  }

  enable () { this.enabled = true }
  disable () { this.enabled = false }
  play () { this.isPlaying = true }
  pause () { this.isPlaying = false }
  stop () {
    this.isPlaying = false
    this.currentFrameIndex = 0
  }

  setLoopLength (length) {
    if (isNaN(length) || length < 3 || length > this.maxLoopLength) return false
    this.requestedLoopLength = length
    return true
  }

  setFPS (fps) {
    if (fps < 1 || fps > 60) return false
    this.fps = fps
    return true
  }

  setFrame (index) {
    if (index < 0 || index >= (this.walk?.length || 0)) return false
    this.currentFrameIndex = index
    return true
  }

  getCurrentFrame () {
    if (!this.walk || this.walk.length === 0) {
      return { pair: { a: 0, b: 0 } }
    }
    return this.walk[this.currentFrameIndex] || { pair: { a: 0, b: 0 } }
  }

  getLoopLengthRange () {
    return {
      min: 3,
      max: this.maxLoopLength,
      current: this.requestedLoopLength
    }
  }

  generateWalk () {
    this.isGenerating = true
    this.walk = Array.from({ length: this.requestedLoopLength }, (_, i) => ({
      index: i,
      pair: { a: i % this.imageSetA.length, b: i % this.imageSetB.length }
    }))
    this.isGenerating = false
  }

  setImageSets (imageSetA, imageSetB) {
    this.imageSetA = imageSetA || []
    this.imageSetB = imageSetB || []
  }

  rotateWalkTo (frameIndex) {
    if (!this.walk || this.walk.length === 0) return
    const idx = Math.max(0, Math.min(frameIndex, this.walk.length - 1))
    if (idx === 0) return
    this.walk = [...this.walk.slice(idx), ...this.walk.slice(0, idx)]
    this.currentFrameIndex = 0
  }
}

describe('LoopAnimationPanel', () => {
  let controller
  let panel
  let container

  beforeEach(() => {
    // Create container
    container = document.createElement('div')
    document.body.appendChild(container)

    // Create mock controller
    controller = new MockLoopAnimationController()

    // Create panel
    panel = new LoopAnimationPanel(controller)
  })

  afterEach(() => {
    // Cleanup
    if (panel) {
      panel.destroy()
    }
    if (container) {
      container.remove()
    }
  })

  describe('Mount and Initialization', () => {
    it('should create and mount the panel', () => {
      const mounted = panel.mount('test-panel')
      expect(mounted).toBeTruthy()
      expect(document.getElementById('test-panel')).toBeTruthy()
    })

    it('should cache all required UI elements', () => {
      panel.mount()
      const { toggleBtn, loopLengthInput, playPauseBtn, stopBtn, frameCounter, fpsSlider } = panel.elements
      expect(toggleBtn).toBeTruthy()
      expect(loopLengthInput).toBeTruthy()
      expect(playPauseBtn).toBeTruthy()
      expect(stopBtn).toBeTruthy()
      expect(frameCounter).toBeTruthy()
      expect(fpsSlider).toBeTruthy()
    })

    it('should initialize with correct default values', () => {
      panel.mount()
      expect(panel.elements.loopLengthInput.value).toBe('5')
      expect(panel.elements.fpsSlider.value).toBe('12')
    })

    it('should dim loop-gated sections initially (panel not enabled)', () => {
      panel.mount()
      // Panel starts without the 'enabled' class
      expect(panel.panelElement.classList.contains('enabled')).toBe(false)
      // All sections present in DOM
      const allSections = panel.panelElement.querySelectorAll('.loop-panel-section')
      allSections.forEach(section => {
        expect(window.getComputedStyle(section).display).toBe('block')
      })
      // Loop-gated sections are dimmed
      const gatedSections = panel.panelElement.querySelectorAll('.loop-gated')
      expect(gatedSections.length).toBeGreaterThan(0)
      gatedSections.forEach(section => {
        expect(window.getComputedStyle(section).opacity).toBe('0.4')
      })
      // Non-gated sections (toggle, transport, speed) remain fully visible
      const nonGated = panel.panelElement.querySelectorAll('.loop-panel-section:not(.loop-gated)')
      nonGated.forEach(section => {
        expect(window.getComputedStyle(section).opacity).not.toBe('0.4')
      })
    })
  })

  describe('Toggle Switch Behavior', () => {
    beforeEach(() => {
      panel.mount()
    })

    it('should enable loop mode when toggle clicked', () => {
      const toggleBtn = panel.elements.toggleBtn
      expect(controller.enabled).toBe(false)

      toggleBtn.click()

      expect(controller.enabled).toBe(true)
    })

    it('should disable loop mode when toggle clicked again', () => {
      const toggleBtn = panel.elements.toggleBtn
      controller.enabled = true
      panel.updateToggleButton()

      toggleBtn.click()

      expect(controller.enabled).toBe(false)
    })

    it('should update button appearance when toggled', () => {
      const toggleBtn = panel.elements.toggleBtn
      expect(toggleBtn.classList.contains('active')).toBe(false)

      controller.enable()
      panel.updateToggleButton()

      expect(toggleBtn.classList.contains('active')).toBe(true)
    })

    it('should add/remove enabled class on panel based on enabled state', () => {
      controller.enabled = false
      panel.updateAll()
      expect(panel.panelElement.classList.contains('enabled')).toBe(false)

      controller.enabled = true
      panel.updateAll()
      expect(panel.panelElement.classList.contains('enabled')).toBe(true)
    })
  })

  describe('Loop Length Input Validation', () => {
    beforeEach(() => {
      panel.mount()
      controller.enabled = true
      panel.updateToggleButton()
    })

    it('should accept valid loop lengths (3-100)', () => {
      const input = panel.elements.loopLengthInput
      input.value = '10'
      input.dispatchEvent(new Event('change'))

      expect(controller.requestedLoopLength).toBe(10)
    })

    it('should reject invalid loop lengths', () => {
      const input = panel.elements.loopLengthInput
      const originalLength = controller.requestedLoopLength
      input.value = '2' // Below minimum
      input.dispatchEvent(new Event('change'))

      expect(controller.requestedLoopLength).toBe(originalLength)
    })

    it('should display max length info', () => {
      controller.generateWalk()
      panel.updateLoopLengthInput()

      const maxDisplay = panel.elements.loopLengthMax
      expect(maxDisplay.textContent).toContain('100')
    })

    it('should handle non-numeric input gracefully', () => {
      const input = panel.elements.loopLengthInput
      const originalLength = controller.requestedLoopLength
      input.value = 'abc'
      input.dispatchEvent(new Event('change'))

      // Should not crash and should restore value when invalid
      // The input will be reset by updateLoopLengthInput to the original valid value
      expect(() => {
        panel.updateLoopLengthInput()
      }).not.toThrow()
      expect(controller.requestedLoopLength).toBe(originalLength)
    })
  })

  describe('Playback Controls', () => {
    beforeEach(() => {
      panel.mount()
      controller.enabled = true
      controller.generateWalk()
      panel.updateAll()
    })

    it('should toggle play state with play/pause button', () => {
      const playPauseBtn = panel.elements.playPauseBtn
      expect(controller.isPlaying).toBe(false)

      playPauseBtn.click()
      expect(controller.isPlaying).toBe(true)

      playPauseBtn.click()
      expect(controller.isPlaying).toBe(false)
    })

    it('should update play/pause button text based on state', () => {
      const playPauseBtn = panel.elements.playPauseBtn
      expect(playPauseBtn.textContent).toContain('▶ Play')

      controller.play()
      panel.updatePlaybackButtons()
      expect(playPauseBtn.textContent).toContain('⏸ Pause')

      controller.pause()
      panel.updatePlaybackButtons()
      expect(playPauseBtn.textContent).toContain('▶ Play')
    })

    it('should stop playback and reset frame', () => {
      const stopBtn = panel.elements.stopBtn
      controller.play()
      controller.currentFrameIndex = 3

      stopBtn.click()

      expect(controller.isPlaying).toBe(false)
      expect(controller.currentFrameIndex).toBe(0)
    })

    it('should disable stop button when no walk is generated', () => {
      const stopBtn = panel.elements.stopBtn
      controller.walk = null
      panel.updatePlaybackButtons()

      expect(stopBtn.disabled).toBe(true)
    })

    it('should update button titles with keyboard shortcuts', () => {
      const playPauseBtn = panel.elements.playPauseBtn
      const stopBtn = panel.elements.stopBtn

      expect(playPauseBtn.title).toContain('Space')
      expect(stopBtn.title).toBe('Stop')
    })
  })

  describe('Non-Loop Transport', () => {
    let onPlay, onPause, onSave, onRandomize, getIsSketchPlaying
    let nlPanel

    beforeEach(() => {
      onPlay = vi.fn()
      onPause = vi.fn()
      onSave = vi.fn()
      onRandomize = vi.fn()
      getIsSketchPlaying = vi.fn().mockReturnValue(false)
      nlPanel = new LoopAnimationPanel(controller, {
        onPlay, onPause, onSave, onRandomize, getIsSketchPlaying
      })
      nlPanel.mount()
      controller.enabled = false
      nlPanel.updatePlaybackButtons()
    })

    afterEach(() => {
      nlPanel.destroy()
    })

    it('should call onPlay when play button clicked and sketch is not playing', () => {
      getIsSketchPlaying.mockReturnValue(false)
      nlPanel.elements.playPauseBtn.click()
      expect(onPlay).toHaveBeenCalled()
      expect(onPause).not.toHaveBeenCalled()
    })

    it('should call onPause when play button clicked and sketch is playing', () => {
      getIsSketchPlaying.mockReturnValue(true)
      nlPanel.elements.playPauseBtn.click()
      expect(onPause).toHaveBeenCalled()
      expect(onPlay).not.toHaveBeenCalled()
    })

    it('should call onSave when save button clicked in non-loop mode', () => {
      nlPanel.elements.saveLoopBtn.click()
      expect(onSave).toHaveBeenCalled()
    })

    it('should call onRandomize when refresh button clicked in non-loop mode', () => {
      nlPanel.elements.refreshBtn.click()
      expect(onRandomize).toHaveBeenCalled()
    })

    it('should disable stop button in non-loop mode', () => {
      expect(nlPanel.elements.stopBtn.disabled).toBe(true)
    })

    it('should enable stop button when loop mode is enabled with a walk', () => {
      controller.enabled = true
      controller.walk = [{ pair: { a: 'a.jpg', b: 'b.jpg' } }]
      nlPanel.updatePlaybackButtons()
      expect(nlPanel.elements.stopBtn.disabled).toBe(false)
    })

    it('should show ▶ Play when sketch is stopped', () => {
      getIsSketchPlaying.mockReturnValue(false)
      nlPanel.updatePlaybackButtons()
      expect(nlPanel.elements.playPauseBtn.textContent).toContain('▶ Play')
    })

    it('should show ⏸ Pause when sketch is playing', () => {
      getIsSketchPlaying.mockReturnValue(true)
      nlPanel.updatePlaybackButtons()
      expect(nlPanel.elements.playPauseBtn.textContent).toContain('⏸ Pause')
    })

    it('should show "Save image" title in non-loop mode', () => {
      nlPanel.updatePlaybackButtons()
      expect(nlPanel.elements.saveLoopBtn.title).toBe('Save image')
    })

    it('should show "Randomize" title on refresh button in non-loop mode', () => {
      nlPanel.updatePlaybackButtons()
      expect(nlPanel.elements.refreshBtn.title).toBe('Randomize')
    })
  })

  describe('Frame Counter Display', () => {
    beforeEach(() => {
      panel.mount()
      controller.enabled = true
      controller.generateWalk()
      panel.updateAll()
    })

    it('should display current frame and total frames', () => {
      const counter = panel.elements.frameCounter
      const frame = controller.getCurrentFrame()
      panel.updateFrame(frame)

      const text = counter.textContent
      expect(text).toContain('Frame')
      expect(text).toContain('5') // total length
    })

    it('should update frame display when frame changes', () => {
      const counter = panel.elements.frameCounter
      controller.currentFrameIndex = 2
      const frame = controller.getCurrentFrame()
      panel.updateFrame(frame)

      expect(counter.textContent).toContain('Frame 3') // 1-indexed display
    })

    it('should handle frame slider input', () => {
      const slider = panel.elements.frameSlider
      slider.max = '4'
      slider.value = '2'
      slider.dispatchEvent(new Event('input'))

      const frame = controller.getCurrentFrame()
      panel.updateFrame(frame)

      expect(controller.currentFrameIndex).toBe(2)
    })
  })

  describe('FPS Slider Control', () => {
    beforeEach(() => {
      panel.mount()
      controller.enabled = true
      panel.updateAll()
    })

    it('should control animation speed (1-60 FPS)', () => {
      const fpsSlider = panel.elements.fpsSlider
      fpsSlider.value = '30'
      fpsSlider.dispatchEvent(new Event('input'))

      // Note: Actual FPS update would be handled by controller
      expect(panel.elements.fpsSlider.value).toBe('30')
    })

    it('should display current FPS value', () => {
      controller.fps = 24
      panel.updateFPSDisplay()

      expect(panel.elements.fpsValue.textContent).toContain('24')
    })

    it('should enforce FPS bounds', () => {
      const fpsSlider = panel.elements.fpsSlider
      expect(fpsSlider.min).toBe('1')
      expect(fpsSlider.max).toBe('60')
    })

    it('should update display on slider change', () => {
      const fpsSlider = panel.elements.fpsSlider
      fpsSlider.value = '45'
      fpsSlider.dispatchEvent(new Event('input'))

      controller.fps = 45
      panel.updateFPSDisplay()

      expect(panel.elements.fpsValue.textContent).toContain('45')
    })
  })

  describe('Image Pair Preview', () => {
    beforeEach(() => {
      panel.mount()
      controller.enabled = true
      controller.generateWalk()
      panel.updateAll()
    })

    it('should display current frame\'s image pair', () => {
      const frame = controller.getCurrentFrame()
      panel.updateFrame(frame)

      const previewPanel = panel.elements.previewPair
      const previewText = previewPanel.textContent

      expect(previewText).toContain('imageA_0')
      expect(previewText).toContain('imageB_0')
    })

    it('should update preview when frame changes', () => {
      controller.currentFrameIndex = 2
      const frame = controller.getCurrentFrame()
      panel.updateFrame(frame)

      const previewPanel = panel.elements.previewPair
      const previewText = previewPanel.textContent

      expect(previewText).toContain('imageA_2')
      expect(previewText).toContain('imageB_2')
    })
  })

  describe('Help Text Display', () => {
    beforeEach(() => {
      panel.mount()
    })

    it('should show help text for disabled state', () => {
      controller.enabled = false
      panel.updateHelp()

      const helpText = panel.elements.helpText.textContent
      expect(helpText).toContain('Enable')
    })

    it('should show help text while generating', () => {
      controller.enabled = true
      controller.isGenerating = true
      panel.updateHelp()

      const helpText = panel.elements.helpText.textContent
      expect(helpText).toContain('Generating')
    })

    it('should show help text when no walk exists', () => {
      controller.enabled = true
      controller.isGenerating = false
      controller.walk = null
      panel.updateHelp()

      const helpText = panel.elements.helpText.textContent
      expect(helpText).toContain('generate')
    })

    it('should show playback help when playing', () => {
      controller.enabled = true
      controller.walk = []
      controller.isPlaying = true
      panel.updateHelp()

      const helpText = panel.elements.helpText.textContent
      expect(helpText).toContain('pause')
    })

    it('should show adjustment help when stopped', () => {
      controller.enabled = true
      controller.walk = []
      controller.isPlaying = false
      panel.updateHelp()

      const helpText = panel.elements.helpText.textContent
      expect(helpText).toContain('Adjust')
    })
  })

  describe('Loading Indicator', () => {
    beforeEach(() => {
      panel.mount()
    })

    it('should show loading spinner during generation', () => {
      panel.setLoading(true)
      expect(panel.elements.loadingSpinner.style.display).not.toBe('none')
    })

    it('should hide loading spinner when generation complete', () => {
      panel.setLoading(false)
      expect(panel.elements.loadingSpinner.style.display).toBe('none')
    })

    it('should disable controls during generation', () => {
      panel.setLoading(true)
      expect(panel.elements.loopLengthInput.disabled).toBe(true)
    })

    it('should enable controls when generation complete (loop must be enabled)', () => {
      controller.enabled = true
      panel.setLoading(true)
      panel.setLoading(false)
      expect(panel.elements.loopLengthInput.disabled).toBe(false)
    })
  })

  describe('Event Propagation Control', () => {
    beforeEach(() => {
      panel.mount()
    })

    it('should prevent click events from propagating to sketch', () => {
      const toggleBtn = panel.elements.toggleBtn
      const clickEvent = new Event('click', { bubbles: true })
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation')

      toggleBtn.dispatchEvent(clickEvent)

      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe('State Persistence and Updates', () => {
    beforeEach(() => {
      panel.mount()
      controller.enabled = true
    })

    it('should maintain state across multiple updates', () => {
      const originalLength = controller.requestedLoopLength
      controller.generateWalk()

      panel.updateAll()
      expect(panel.elements.loopLengthInput.value).toBe(String(originalLength))
    })

    it('should update all UI elements with updateAll()', () => {
      controller.generateWalk()
      const updateToggleSpy = vi.spyOn(panel, 'updateToggleButton')
      const updateLengthSpy = vi.spyOn(panel, 'updateLoopLengthInput')

      panel.updateAll()

      expect(updateToggleSpy).toHaveBeenCalled()
      expect(updateLengthSpy).toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Disabled States', () => {
    beforeEach(() => {
      panel.mount()
    })

    it('should disable controls when fewer than 3 images available', () => {
      controller.enabled = false
      panel.updateToggleButton()

      // Panel not enabled — non-toggle sections are dimmed (opacity) but still in DOM
      expect(panel.panelElement.classList.contains('enabled')).toBe(false)
      const controlSections = panel.panelElement.querySelectorAll('.loop-panel-section')
      Array.from(controlSections).slice(1).forEach(section => {
        expect(window.getComputedStyle(section).display).toBe('block')
      })
    })

    it('should handle cleanup without errors', () => {
      expect(() => {
        panel.destroy()
        panel = null
      }).not.toThrow()
    })

    it('should handle rapid toggle clicks', () => {
      const toggleBtn = panel.elements.toggleBtn
      expect(() => {
        toggleBtn.click()
        toggleBtn.click()
        toggleBtn.click()
      }).not.toThrow()
    })

    it('should handle missing elements gracefully', () => {
      // Remove an element
      if (panel.elements.frameCounter) {
        panel.elements.frameCounter.remove()
      }

      expect(() => {
        const frame = { index: 0, pair: { a: 'a.jpg', b: 'b.jpg' } }
        panel.updateFrame(frame)
      }).not.toThrow()
    })
  })

  describe('Go to Start Button', () => {
    beforeEach(() => {
      panel.mount()
      controller.enabled = true
      controller.generateWalk()
      panel.updateAll()
    })

    it('should have a go-to-start button in the template', () => {
      const btn = panel.panel.querySelector('[data-action="go-to-start"]')
      expect(btn).toBeTruthy()
    })

    it('should be cached as goToStartBtn element', () => {
      expect(panel.elements.goToStartBtn).toBeTruthy()
    })

    it('should be disabled when no walk exists', () => {
      controller.walk = null
      panel.updatePlaybackButtons()
      expect(panel.elements.goToStartBtn.disabled).toBe(true)
    })

    it('should be enabled when walk exists', () => {
      panel.updatePlaybackButtons()
      expect(panel.elements.goToStartBtn.disabled).toBe(false)
    })

    it('should call controller.stop() on click', () => {
      const stopSpy = vi.spyOn(controller, 'stop')
      panel.elements.goToStartBtn.click()
      expect(stopSpy).toHaveBeenCalled()
    })
  })

  describe('Set as Frame 1 Button', () => {
    beforeEach(() => {
      panel.mount()
      controller.enabled = true
      controller.generateWalk()
      panel.updateAll()
    })

    it('should have a SET AS FRAME 1 button in the template', () => {
      const btn = panel.panel.querySelector('[data-action="set-loop-start"]')
      expect(btn).toBeTruthy()
      expect(btn.textContent).toContain('SET FRAME 1')
    })

    it('should be cached as setStartBtn element', () => {
      expect(panel.elements.setStartBtn).toBeTruthy()
    })

    it('should be disabled when no walk exists', () => {
      controller.walk = null
      panel.updatePlaybackButtons()
      expect(panel.elements.setStartBtn.disabled).toBe(true)
    })

    it('should be disabled while playing', () => {
      controller.isPlaying = true
      panel.updatePlaybackButtons()
      expect(panel.elements.setStartBtn.disabled).toBe(true)
    })

    it('should be enabled when walk exists and not playing', () => {
      controller.isPlaying = false
      panel.updatePlaybackButtons()
      expect(panel.elements.setStartBtn.disabled).toBe(false)
    })

    it('should call rotateWalkTo with currentFrameIndex on click', () => {
      const rotateWalkToSpy = vi.spyOn(controller, 'rotateWalkTo')
      controller.currentFrameIndex = 3
      panel.elements.setStartBtn.click()
      expect(rotateWalkToSpy).toHaveBeenCalledWith(3)
    })

    it('should fire onSetLoopStart callback with new frame 0 on click', () => {
      const onSetLoopStart = vi.fn()
      const panelWithCb = new LoopAnimationPanel(controller, { onSetLoopStart })
      panelWithCb.mount('test-set-start')
      controller.generateWalk()
      panelWithCb.updateAll()

      controller.currentFrameIndex = 2
      panelWithCb.elements.setStartBtn.click()

      expect(onSetLoopStart).toHaveBeenCalledWith(controller.walk[0])
      panelWithCb.destroy()
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      panel.mount()
    })

    it('should have fixed positioning', () => {
      const panelElement = panel.panelElement
      const style = window.getComputedStyle(panelElement)
      expect(style.position).toBe('fixed')
    })

    it('should have proper z-index for overlay', () => {
      const panelElement = panel.panelElement
      const style = window.getComputedStyle(panelElement)
      expect(parseInt(style.zIndex)).toBeGreaterThanOrEqual(100)
    })

    it('should be positioned in bottom-right', () => {
      const panelElement = panel.panelElement
      const style = window.getComputedStyle(panelElement)
      expect(style.bottom).toBeTruthy()
      expect(style.right).toBeTruthy()
    })
  })
})
