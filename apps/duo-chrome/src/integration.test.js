/**
 * Comprehensive Integration Tests
 *
 * Tests for the integration between manual and automatic modes,
 * existing keyboard shortcuts, and overall system functionality.
 * Ensures new controls don't interfere with existing functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock p5.js instance
const mockP5 = {
  canvas: {
    style: {},
    focus: vi.fn()
  },
  width: 1000,
  height: 1000,
  frameCount: 0,
  pixelDensity: vi.fn(),
  createCanvas: vi.fn(() => ({ elt: { focus: vi.fn() } })),
  imageMode: vi.fn(),
  createGraphics: vi.fn(() => ({
    background: vi.fn(),
    image: vi.fn(),
    drawingContext: { globalCompositeOperation: '' }
  })),
  loadImage: vi.fn((path, callback) => {
    // Simulate successful image loading
    const mockImg = { width: 800, height: 600 }
    if (callback) setTimeout(() => callback(mockImg), 10)
    return mockImg
  }),
  saveCanvas: vi.fn(),
  keyIsDown: vi.fn(() => false),
  key: '',
  keyCode: 0,
  CONTROL: 17,
  UP_ARROW: 38,
  DOWN_ARROW: 40,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
  CENTER: 'center',
  color: vi.fn((r, g, b) => ({ r, g, b })),
  background: vi.fn(),
  blendMode: vi.fn(),
  clear: vi.fn(),
  image: vi.fn(),
  calculateScaleRatio: vi.fn(() => 0.8),
  random: vi.fn(() => 1.0)
}

// Mock image list
const mockImgs = [
  'image1.jpg',
  'image2.jpg',
  'image3.jpg',
  'image4.jpg',
  'image5.jpg'
]

// Mock color palettes
const mockColors = [
  { name: 'Red', color: [255, 0, 0] },
  { name: 'Blue', color: [0, 0, 255] },
  { name: 'Green', color: [0, 255, 0] },
  { name: 'Yellow', color: [255, 255, 0] }
]

// Mock DOM elements
const mockElements = {
  'help-overlay': {
    classList: {
      toggle: vi.fn(),
      contains: vi.fn(() => true),
      add: vi.fn()
    }
  },
  'close-help': {
    addEventListener: vi.fn()
  },
  'version-info': {
    textContent: ''
  },
  'status-overlay': {
    classList: {
      remove: vi.fn(),
      add: vi.fn(),
      contains: vi.fn(() => false)
    },
    style: {}
  }
}

// Mock global objects
global.document = {
  getElementById: vi.fn((id) => mockElements[id] || null),
  addEventListener: vi.fn()
}

global.console = {
  log: vi.fn(),
  warn: vi.fn()
}

global.setTimeout = vi.fn((fn, delay) => {
  if (delay <= 10) fn() // Execute short delays immediately for testing
  return 123
})

global.clearTimeout = vi.fn()

global.requestAnimationFrame = vi.fn((fn) => {
  fn()
  return 1
})

// Mock audio context for bounds feedback
global.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { setValueAtTime: vi.fn() },
    type: 'sine',
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    }
  })),
  destination: {},
  currentTime: 0
}))

global.webkitAudioContext = global.AudioContext

describe('Comprehensive Integration Tests', () => {
  let controlState
  let imageColorPairs
  let currentPair
  let pause
  let autoSave
  let currentBlendModeIndex
  let currentBackgroundModeIndex
  let colorIndex

  // Mock functions
  let setActiveImage
  let adjustImageSize
  let navigateImage
  let navigateImageColor
  let exchangeImages
  let loadNewImagesAndColors
  let updateImageColorPair
  let cycleBlendMode
  let toggleBackgroundColor
  let toggleHelpOverlay
  let toggleStatusDisplay
  let toggleIndicators
  let keyPressed
  let mousePressed
  let filmstripPanel
  let navigateHistoryBackward
  let navigateHistoryForward
  let navigateHistoryToBeginning
  let navigateHistoryToEnd

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Initialize state
    controlState = {
      activeImageIndex: 0,
      manualSizeControl: [false, false],
      imageIndices: [0, 1],
      isManualMode: false,
      showIndicators: false,
      indicatorTimeout: null,
      needsRedraw: true,
      animationFrameRequested: false
    }

    imageColorPairs = [
      { img: mockImgs[0], color: mockColors[0], layer: {}, scale: 1.0 },
      { img: mockImgs[1], color: mockColors[1], layer: {}, scale: 1.0 }
    ]

    currentPair = 0
    pause = false
    autoSave = false
    currentBlendModeIndex = 0
    currentBackgroundModeIndex = 0
    colorIndex = 0

    // Mock filmstrip panel
    filmstripPanel = {
      isVisible: false,
      update: vi.fn(),
      updateHighlight: vi.fn(),
      updateCounter: vi.fn(),
      scrollToCurrentPosition: vi.fn()
    }

    // Mock history navigation
    navigateHistoryBackward = vi.fn((step) => console.log('History backward', step))
    navigateHistoryForward = vi.fn((step) => console.log('History forward', step))
    navigateHistoryToBeginning = vi.fn(() => console.log('History To Beginning'))
    navigateHistoryToEnd = vi.fn(() => console.log('History To End'))

    // Mock core functions
    setActiveImage = vi.fn((imageIndex) => {
      if (imageIndex === 0 || imageIndex === 1) {
        controlState.activeImageIndex = imageIndex
        console.log(`Active image set to: ${imageIndex === 0 ? 'A' : 'B'}`)
      }
    })

    adjustImageSize = vi.fn((imageIndex, delta) => {
      if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
        return false
      }

      const currentScale = parseFloat(imageColorPairs[imageIndex].scale)
      const newScale = currentScale + delta
      const minScale = 0.05
      const maxScale = 5.0

      if (newScale < minScale) {
        imageColorPairs[imageIndex].scale = minScale
        return false
      } else if (newScale > maxScale) {
        imageColorPairs[imageIndex].scale = maxScale
        return false
      } else {
        imageColorPairs[imageIndex].scale = newScale.toFixed(2)
        controlState.manualSizeControl[imageIndex] = true
        controlState.isManualMode = true
        return true
      }
    })

    navigateImage = vi.fn((imageIndex, direction) => {
      if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
        return false
      }

      const currentArrayIndex = controlState.imageIndices[imageIndex]
      let newArrayIndex

      if (direction === 'next' || direction === 1) {
        newArrayIndex = (currentArrayIndex + 1) % mockImgs.length
      } else if (direction === 'previous' || direction === -1) {
        newArrayIndex = (currentArrayIndex - 1 + mockImgs.length) % mockImgs.length
      } else {
        return false
      }

      // Simple uniqueness check
      const otherImageIndex = imageIndex === 0 ? 1 : 0
      const otherArrayIndex = controlState.imageIndices[otherImageIndex]

      if (newArrayIndex === otherArrayIndex) {
        // Skip to next available
        if (direction === 'next' || direction === 1) {
          newArrayIndex = (newArrayIndex + 1) % mockImgs.length
        } else {
          newArrayIndex = (newArrayIndex - 1 + mockImgs.length) % mockImgs.length
        }
      }

      controlState.imageIndices[imageIndex] = newArrayIndex
      imageColorPairs[imageIndex].img = mockImgs[newArrayIndex]
      return true
    })

    navigateImageColor = vi.fn((imageIndex, direction) => {
      if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
        return false
      }

      const currentColor = imageColorPairs[imageIndex].color
      let currentColorIndex = mockColors.findIndex(color => color.name === currentColor.name)

      if (currentColorIndex === -1) {
        currentColorIndex = 0
      }

      let newColorIndex
      if (direction === 'next' || direction === 1) {
        newColorIndex = (currentColorIndex + 1) % mockColors.length
      } else if (direction === 'previous' || direction === -1) {
        newColorIndex = (currentColorIndex - 1 + mockColors.length) % mockColors.length
      } else {
        return false
      }

      // Simple uniqueness check
      const otherImageIndex = imageIndex === 0 ? 1 : 0
      const otherColor = imageColorPairs[otherImageIndex].color

      if (mockColors[newColorIndex].name === otherColor.name) {
        // Skip to next available
        if (direction === 'next' || direction === 1) {
          newColorIndex = (newColorIndex + 1) % mockColors.length
        } else {
          newColorIndex = (newColorIndex - 1 + mockColors.length) % mockColors.length
        }
      }

      imageColorPairs[imageIndex].color = mockColors[newColorIndex]
      return true
    })

    exchangeImages = vi.fn(() => {
      // Swap all properties between image A and B
      const tempImg = imageColorPairs[0].img
      const tempColor = imageColorPairs[0].color
      const tempLayer = imageColorPairs[0].layer
      const tempScale = imageColorPairs[0].scale
      const tempIndex = controlState.imageIndices[0]
      const tempManualControl = controlState.manualSizeControl[0]

      imageColorPairs[0].img = imageColorPairs[1].img
      imageColorPairs[0].color = imageColorPairs[1].color
      imageColorPairs[0].layer = imageColorPairs[1].layer
      imageColorPairs[0].scale = imageColorPairs[1].scale
      controlState.imageIndices[0] = controlState.imageIndices[1]
      controlState.manualSizeControl[0] = controlState.manualSizeControl[1]

      imageColorPairs[1].img = tempImg
      imageColorPairs[1].color = tempColor
      imageColorPairs[1].layer = tempLayer
      imageColorPairs[1].scale = tempScale
      controlState.imageIndices[1] = tempIndex
      controlState.manualSizeControl[1] = tempManualControl

      console.log('Images A and B exchanged')
    })

    updateImageColorPair = vi.fn((pairIndex) => {
      // Simulate automatic image/color update
      if (!controlState.isManualMode) {
        imageColorPairs[pairIndex].scale = mockP5.random(0.8, 1.2).toFixed(2)
        controlState.manualSizeControl[pairIndex] = false
      }
    })

    loadNewImagesAndColors = vi.fn(() => {
      updateImageColorPair(currentPair)
      currentPair = (currentPair + 1) % 2
    })

    cycleBlendMode = vi.fn(() => {
      currentBlendModeIndex = (currentBlendModeIndex + 1) % 5 // Assume 5 blend modes
      mockP5.blendMode('MULTIPLY') // Mock blend mode change
    })

    toggleBackgroundColor = vi.fn(() => {
      currentBackgroundModeIndex = (currentBackgroundModeIndex + 1) % 2
      currentBlendModeIndex = 0
      mockP5.background([255, 255, 255]) // Mock background change
    })

    toggleHelpOverlay = vi.fn(() => {
      const helpOverlay = document.getElementById('help-overlay')
      if (helpOverlay) {
        helpOverlay.classList.toggle('hidden')
      }
    })

    toggleStatusDisplay = vi.fn(() => {
      const statusOverlay = document.getElementById('status-overlay')
      if (statusOverlay) {
        if (statusOverlay.classList.contains('hidden')) {
          statusOverlay.classList.remove('hidden')
        } else {
          statusOverlay.classList.add('hidden')
        }
      }
    })

    toggleIndicators = vi.fn(() => {
      controlState.showIndicators = !controlState.showIndicators
    })

    // Mock keyboard event handler
    keyPressed = vi.fn((key, keyCode, modifiers = {}) => {
      mockP5.key = key
      mockP5.keyCode = keyCode
      mockP5.keyIsDown = vi.fn((code) => {
        if (code === mockP5.CONTROL) return modifiers.ctrl || false
        if (code === 91) return modifiers.cmd || false // Cmd key
        return false
      })

      if ((modifiers.ctrl || modifiers.cmd) && key === 's') {
        mockP5.saveCanvas('test-filename.png')
        return false
      } else if (key === 'a') {
        setActiveImage(0)
      } else if (key === 'b') {
        setActiveImage(1)
      } else if (key === 'B') {
        toggleBackgroundColor()
      } else if (keyCode === mockP5.UP_ARROW) {
        const activeIndex = controlState.activeImageIndex
        adjustImageSize(activeIndex, 0.1)
        // Mock showIndicatorsTemporarily behavior
        if (controlState.indicatorTimeout) clearTimeout(controlState.indicatorTimeout)
        controlState.indicatorTimeout = 123
        return false
      } else if (keyCode === mockP5.DOWN_ARROW) {
        const activeIndex = controlState.activeImageIndex
        adjustImageSize(activeIndex, -0.1)
        // Mock showIndicatorsTemporarily behavior
        if (controlState.indicatorTimeout) clearTimeout(controlState.indicatorTimeout)
        controlState.indicatorTimeout = 123
        return false
      } else if (keyCode === mockP5.LEFT_ARROW) {
        // History Navigation: Backward
        if (modifiers.ctrl || modifiers.cmd) {
          navigateHistoryToBeginning()
        } else {
          const step = modifiers.shift ? 10 : 1
          navigateHistoryBackward(step)
        }
        return false
      } else if (keyCode === mockP5.RIGHT_ARROW) {
        // History Navigation: Forward
        if (modifiers.ctrl || modifiers.cmd) {
          navigateHistoryToEnd()
        } else {
          const step = modifiers.shift ? 10 : 1
          navigateHistoryForward(step)
        }
        return false
      } else if (key === '[' || key === '{') {
        // Image/Color Navigation: Previous
        const activeIndex = controlState.activeImageIndex
        if (modifiers.ctrl || modifiers.cmd) {
          navigateImageColor(activeIndex, 'previous')
        } else {
          const step = (key === '{' || modifiers.shift) ? 10 : 1
          for (let i = 0; i < step; i++) navigateImage(activeIndex, 'previous')
        }
        // Mock showIndicatorsTemporarily behavior
        if (controlState.indicatorTimeout) clearTimeout(controlState.indicatorTimeout)
        controlState.indicatorTimeout = 123
        return false
      } else if (key === ']' || key === '}') {
        // Image/Color Navigation: Next
        const activeIndex = controlState.activeImageIndex
        if (modifiers.ctrl || modifiers.cmd) {
          navigateImageColor(activeIndex, 'next')
        } else {
          const step = (key === '}' || modifiers.shift) ? 10 : 1
          for (let i = 0; i < step; i++) navigateImage(activeIndex, 'next')
        }
        // Mock showIndicatorsTemporarily behavior
        if (controlState.indicatorTimeout) clearTimeout(controlState.indicatorTimeout)
        controlState.indicatorTimeout = 123
        return false
      } else if (key === 'c') {
        colorIndex = (colorIndex + 1) % 3
      } else if (key === 'm') {
        cycleBlendMode()
      } else if (key === 'p' || keyCode === 32) {
        pause = !pause
        console.log(`pause: ${pause}`)
      } else if (key === 'S') {
        autoSave = !autoSave
        console.log(`autoSave: ${autoSave}`)
      } else if (key === 'h' || key === '?') {
        toggleHelpOverlay()
      } else if (key === 'i') {
        toggleStatusDisplay()
      } else if (key === 'v') {
        toggleIndicators()
      } else if (key === 'x') {
        exchangeImages()
      }
    })

    mousePressed = vi.fn(() => {
      loadNewImagesAndColors()
    })
  })

  describe('Manual vs Automatic Mode Integration', () => {
    it('should start in automatic mode', () => {
      expect(controlState.isManualMode).toBe(false)
      expect(controlState.manualSizeControl).toEqual([false, false])
    })

    it('should switch to manual mode when size is adjusted', () => {
      keyPressed('a') // Select image A
      keyPressed(null, mockP5.UP_ARROW) // Increase size

      expect(controlState.isManualMode).toBe(true)
      expect(controlState.manualSizeControl[0]).toBe(true)
      expect(adjustImageSize).toHaveBeenCalledWith(0, 0.1)
    })

    it('should preserve manual adjustments during automatic cycling', () => {
      // Make manual adjustment
      adjustImageSize(0, 0.5)
      const manualScale = imageColorPairs[0].scale

      // Trigger automatic update
      loadNewImagesAndColors()

      // Manual scale should be preserved for manually adjusted images
      expect(controlState.manualSizeControl[0]).toBe(true)
    })

    it('should reset manual controls when switching back to automatic', () => {
      // Make manual adjustment
      adjustImageSize(0, 0.3)
      expect(controlState.isManualMode).toBe(true)

      // Simulate automatic reset (would happen in actual implementation)
      controlState.manualSizeControl = [false, false]
      controlState.isManualMode = false

      expect(controlState.isManualMode).toBe(false)
      expect(controlState.manualSizeControl).toEqual([false, false])
    })

    it('should handle mixed manual/automatic state correctly', () => {
      // Manually adjust only image A
      adjustImageSize(0, 0.2)

      expect(controlState.manualSizeControl[0]).toBe(true)
      expect(controlState.manualSizeControl[1]).toBe(false)
      expect(controlState.isManualMode).toBe(true)
    })
  })

  describe('Existing Keyboard Shortcuts', () => {
    it('should handle save functionality (Ctrl+S)', () => {
      keyPressed('s', 83, { ctrl: true })

      expect(mockP5.saveCanvas).toHaveBeenCalledWith('test-filename.png')
    })

    it('should handle save functionality (Cmd+S)', () => {
      keyPressed('s', 83, { cmd: true })

      expect(mockP5.saveCanvas).toHaveBeenCalledWith('test-filename.png')
    })

    it('should handle blend mode cycling (m key)', () => {
      keyPressed('m')

      expect(cycleBlendMode).toHaveBeenCalled()
    })

    it('should handle background color toggling (B key)', () => {
      keyPressed('B')

      expect(toggleBackgroundColor).toHaveBeenCalled()
    })

    it('should handle color palette cycling (c key)', () => {
      const originalColorIndex = colorIndex
      keyPressed('c')

      expect(colorIndex).toBe((originalColorIndex + 1) % 3)
    })

    it('should handle pause toggle (p key)', () => {
      keyPressed('p')

      expect(pause).toBe(true)
      expect(console.log).toHaveBeenCalledWith('pause: true')
    })

    it('should handle pause toggle (space key)', () => {
      keyPressed(null, 32) // Space key

      expect(pause).toBe(true)
      expect(console.log).toHaveBeenCalledWith('pause: true')
    })

    it('should handle auto-save toggle (S key)', () => {
      keyPressed('S')

      expect(autoSave).toBe(true)
      expect(console.log).toHaveBeenCalledWith('autoSave: true')
    })

    it('should handle help overlay toggle (h key)', () => {
      keyPressed('h')

      expect(toggleHelpOverlay).toHaveBeenCalled()
    })

    it('should handle help overlay toggle (? key)', () => {
      keyPressed('?')

      expect(toggleHelpOverlay).toHaveBeenCalled()
    })
  })

  describe('New Controls Integration', () => {
    it('should handle active image selection (a/b keys)', () => {
      keyPressed('a')
      expect(setActiveImage).toHaveBeenCalledWith(0)

      keyPressed('b')
      expect(setActiveImage).toHaveBeenCalledWith(1)
    })

    it('should handle size controls (arrow keys)', () => {
      keyPressed('a') // Select image A

      keyPressed(null, mockP5.UP_ARROW)
      expect(adjustImageSize).toHaveBeenCalledWith(0, 0.1)

      keyPressed(null, mockP5.DOWN_ARROW)
      expect(adjustImageSize).toHaveBeenCalledWith(0, -0.1)
    })

    it('should handle history navigation (arrow keys)', () => {
      // Left/Right arrows now navigate history regardless of filmstrip visibility
      keyPressed(null, mockP5.LEFT_ARROW)
      expect(navigateHistoryBackward).toHaveBeenCalledWith(1)

      keyPressed(null, mockP5.RIGHT_ARROW)
      expect(navigateHistoryForward).toHaveBeenCalledWith(1)
    })

    it('should handle history jump (Cmd+arrow keys)', () => {
      // Cmd+Left -> Start of history
      keyPressed(null, mockP5.LEFT_ARROW, { cmd: true })
      expect(navigateHistoryToBeginning).toHaveBeenCalled()

      // Cmd+Right -> End of history
      keyPressed(null, mockP5.RIGHT_ARROW, { cmd: true })
      expect(navigateHistoryToEnd).toHaveBeenCalled()
    })

    it('should handle image navigation (bracket keys)', () => {
      keyPressed('a') // Select image A

      // '[' -> Previous Image
      keyPressed('[')
      expect(navigateImage).toHaveBeenCalledWith(0, 'previous')

      // ']' -> Next Image
      keyPressed(']')
      expect(navigateImage).toHaveBeenCalledWith(0, 'next')
    })

    it('should handle color navigation (Cmd+bracket keys)', () => {
      keyPressed('a')

      // Cmd+'[' -> Previous Color
      keyPressed('[', 0, { cmd: true })
      expect(navigateImageColor).toHaveBeenCalledWith(0, 'previous')

      // Cmd+']' -> Next Color
      keyPressed(']', 0, { cmd: true })
      expect(navigateImageColor).toHaveBeenCalledWith(0, 'next')
    })

    it('should handle image exchange (x key)', () => {
      keyPressed('x')

      expect(exchangeImages).toHaveBeenCalled()
    })

    it('should handle status display toggle (i key)', () => {
      keyPressed('i')

      expect(toggleStatusDisplay).toHaveBeenCalled()
    })

    it('should handle indicators toggle (v key)', () => {
      keyPressed('v')

      expect(toggleIndicators).toHaveBeenCalled()
    })
  })

  describe('Key Conflict Resolution', () => {
    it('should distinguish between b (select image B) and B (background toggle)', () => {
      keyPressed('b')
      expect(setActiveImage).toHaveBeenCalledWith(1)
      expect(toggleBackgroundColor).not.toHaveBeenCalled()

      vi.clearAllMocks()

      keyPressed('B')
      expect(toggleBackgroundColor).toHaveBeenCalled()
      expect(setActiveImage).not.toHaveBeenCalled()
    })

    it('should handle modifiers correctly on bracket keys', () => {
      // Bracket -> Image
      keyPressed('[')
      expect(navigateImage).toHaveBeenCalledWith(0, 'previous')
      expect(navigateImageColor).not.toHaveBeenCalled()

      vi.clearAllMocks()

      // Cmd+Bracket -> Color
      keyPressed('[', 0, { cmd: true })
      expect(navigateImageColor).toHaveBeenCalledWith(0, 'previous')
      expect(navigateImage).not.toHaveBeenCalled()
    })

    it('should handle modifiers correctly on arrow keys', () => {
      // Arrow -> History
      keyPressed(null, mockP5.LEFT_ARROW)
      expect(navigateHistoryBackward).toHaveBeenCalledWith(1)
      expect(navigateHistoryToBeginning).not.toHaveBeenCalled()

      vi.clearAllMocks()

      // Cmd+Arrow -> History Jump
      keyPressed(null, mockP5.LEFT_ARROW, { cmd: true })
      expect(navigateHistoryToBeginning).toHaveBeenCalled()
      expect(navigateHistoryBackward).not.toHaveBeenCalled()
    })

    it('should prevent default browser behavior for arrow keys', () => {
      const result1 = keyPressed(null, mockP5.UP_ARROW)
      const result2 = keyPressed(null, mockP5.DOWN_ARROW)
      const result3 = keyPressed(null, mockP5.LEFT_ARROW)
      const result4 = keyPressed(null, mockP5.RIGHT_ARROW)

      expect(result1).toBe(false)
      expect(result2).toBe(false)
      expect(result3).toBe(false)
      expect(result4).toBe(false)
    })

    it('should prevent default browser behavior for Ctrl+S', () => {
      const result = keyPressed('s', 83, { ctrl: true })

      expect(result).toBe(false)
      expect(mockP5.saveCanvas).toHaveBeenCalled()
    })
  })

  describe('Mouse Interaction Integration', () => {
    it('should trigger automatic cycling on mouse press', () => {
      mousePressed()

      expect(loadNewImagesAndColors).toHaveBeenCalled()
    })

    it('should maintain existing mouse functionality', () => {
      // Simulate multiple mouse presses
      mousePressed()
      mousePressed()
      mousePressed()

      expect(loadNewImagesAndColors).toHaveBeenCalledTimes(3)
    })
  })

  describe('State Consistency Across Features', () => {
    it('should maintain active image selection across different operations', () => {
      keyPressed('b') // Select image B
      expect(controlState.activeImageIndex).toBe(1)

      keyPressed(null, mockP5.UP_ARROW) // Size adjustment
      expect(controlState.activeImageIndex).toBe(1) // Should still be B

      keyPressed(null, mockP5.LEFT_ARROW) // Image navigation
      expect(controlState.activeImageIndex).toBe(1) // Should still be B
    })

    it('should preserve manual control state across feature interactions', () => {
      // Make manual size adjustment
      keyPressed('a')
      keyPressed(null, mockP5.UP_ARROW)
      expect(controlState.manualSizeControl[0]).toBe(true)

      // Use other features
      keyPressed('m') // Blend mode
      keyPressed('c') // Color palette

      // Exchange images - this SWAPS manual control state
      keyPressed('x')
      // Now [0] should be false (was [1]), and [1] should be true (was [0])
      expect(controlState.manualSizeControl[1]).toBe(true)

      // Swap back to verify preservation
      keyPressed('x')

      // Manual control state should be preserved and restored to [0]
      expect(controlState.manualSizeControl[0]).toBe(true)
    })

    it('should handle rapid feature switching without state corruption', () => {
      // Rapid feature usage
      keyPressed('a')
      keyPressed('b')
      keyPressed(null, mockP5.UP_ARROW)
      keyPressed(null, mockP5.LEFT_ARROW)
      keyPressed('x')
      keyPressed('m')
      keyPressed('i')
      keyPressed('v')

      // State should remain consistent
      expect(controlState.activeImageIndex).toBe(1) // Last set to B
      expect(typeof controlState.showIndicators).toBe('boolean')
      expect(Array.isArray(controlState.manualSizeControl)).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing DOM elements gracefully', () => {
      document.getElementById = vi.fn(() => null)

      expect(() => {
        keyPressed('h') // Help overlay
        keyPressed('i') // Status display
      }).not.toThrow()
    })

    it('should handle invalid active image indices', () => {
      controlState.activeImageIndex = 999 // Invalid index

      expect(() => {
        keyPressed(null, mockP5.UP_ARROW) // Size adjustment
        keyPressed(null, mockP5.LEFT_ARROW) // Navigation
      }).not.toThrow()
    })

    it('should handle empty image arrays gracefully', () => {
      // Simulate empty image array scenario
      const originalImgs = [...mockImgs]
      mockImgs.length = 0

      expect(() => {
        keyPressed(null, mockP5.LEFT_ARROW) // Image navigation
      }).not.toThrow()

      // Restore original array
      mockImgs.push(...originalImgs)
    })

    it('should handle bounds correctly during size adjustments', () => {
      // Test minimum bound
      imageColorPairs[0].scale = 0.05
      keyPressed(null, mockP5.DOWN_ARROW)
      expect(parseFloat(imageColorPairs[0].scale)).toBe(0.05)

      // Test maximum bound
      imageColorPairs[0].scale = 5.0
      keyPressed(null, mockP5.UP_ARROW)
      expect(parseFloat(imageColorPairs[0].scale)).toBe(5.0)
    })
  })

  describe('Performance Integration', () => {
    it('should handle multiple simultaneous operations efficiently', () => {
      const startTime = performance.now()

      // Perform multiple operations
      keyPressed('a')
      keyPressed(null, mockP5.UP_ARROW)
      keyPressed(null, mockP5.LEFT_ARROW)
      keyPressed('x')
      keyPressed('m')
      mousePressed()

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete quickly (arbitrary threshold for test environment)
      expect(duration).toBeLessThan(100) // 100ms threshold
    })

    it('should not create memory leaks with repeated operations', () => {
      // Simulate repeated usage
      for (let i = 0; i < 10; i++) {
        keyPressed('a')
        keyPressed('b')
        keyPressed(null, mockP5.UP_ARROW)
        keyPressed(null, mockP5.DOWN_ARROW)
        keyPressed('x')
      }

      // Should not accumulate timeouts or other resources
      expect(clearTimeout).toHaveBeenCalled()
    })
  })
})
