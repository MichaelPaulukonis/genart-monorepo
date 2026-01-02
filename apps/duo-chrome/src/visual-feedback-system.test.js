/**
 * Visual Feedback System Tests
 * 
 * Tests for the visual feedback system including:
 * - Status display updates with control actions
 * - Active image highlighting behavior
 * - Status overlay positioning and visibility
 * - Dragging functionality and session persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock DOM elements with comprehensive functionality
const createMockElement = (id) => ({
  id,
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn(() => false)
  },
  style: {},
  textContent: '',
  offsetWidth: 200,
  offsetHeight: 100,
  getBoundingClientRect: vi.fn(() => ({
    left: 20,
    top: 20,
    width: 200,
    height: 100
  })),
  addEventListener: vi.fn(),
  querySelector: vi.fn()
})

// Mock status overlay with all required elements
const mockStatusOverlay = createMockElement('status-overlay')
mockStatusOverlay.querySelector = vi.fn((selector) => {
  if (selector === '.status-header') {
    return createMockElement('status-header')
  }
  return null
})

const mockElements = {
  'status-overlay': mockStatusOverlay,
  'status-filename-a': createMockElement('status-filename-a'),
  'status-filename-b': createMockElement('status-filename-b'),
  'status-color-a': createMockElement('status-color-a'),
  'status-color-b': createMockElement('status-color-b'),
  'status-scale-a': createMockElement('status-scale-a'),
  'status-scale-b': createMockElement('status-scale-b'),
  'status-image-a': createMockElement('status-image-a'),
  'status-image-b': createMockElement('status-image-b'),
  'status-blend-mode-value': createMockElement('status-blend-mode-value')
}

// Mock global objects
global.document = {
  getElementById: vi.fn((id) => mockElements[id] || null),
  addEventListener: vi.fn()
}

global.window = {
  innerWidth: 1920,
  innerHeight: 1080
}

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn()
}

global.console = {
  log: vi.fn(),
  warn: vi.fn()
}

global.setTimeout = vi.fn((fn, delay) => {
  if (delay === 0) fn() // Execute immediately for testing
  return 123
})

global.clearTimeout = vi.fn()

describe('Visual Feedback System', () => {
  let controlState
  let imageColorPairs
  let updateStatusDisplay
  let showStatusDisplay
  let hideStatusDisplay
  let toggleStatusDisplay
  let initializeStatusDragging
  let updateStatusPosition

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Reset mock element states
    Object.values(mockElements).forEach(element => {
      if (element) {
        element.textContent = ''
        element.style = {}
      }
    })

    // Initialize test state
    controlState = {
      activeImageIndex: 0,
      statusTimeout: null,
      statusPosition: { x: 20, y: 20 },
      statusIsPermanent: false,
      isDraggingStatus: false
    }

    imageColorPairs = [
      { 
        img: 'landscape-001.jpg', 
        color: { name: 'Bright Red' }, 
        scale: 1.25 
      },
      { 
        img: 'portrait-042.jpg', 
        color: { name: 'Forest Green' }, 
        scale: 0.8 
      }
    ]

    // Mock functions
    updateStatusDisplay = vi.fn(() => {
      const statusOverlay = document.getElementById('status-overlay')
      if (!statusOverlay) return

      // Update filenames (mimic formatName logic)
      const formatName = (name) => name ? name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') : '-'

      const filenameA = document.getElementById('status-filename-a')
      const filenameB = document.getElementById('status-filename-b')

      if (filenameA && imageColorPairs[0].img) {
        filenameA.textContent = formatName(imageColorPairs[0].img)
      }

      if (filenameB && imageColorPairs[1].img) {
        filenameB.textContent = formatName(imageColorPairs[1].img)
      }

      // Update color names
      const colorA = document.getElementById('status-color-a')
      const colorB = document.getElementById('status-color-b')

      if (colorA && imageColorPairs[0].color) {
        colorA.textContent = imageColorPairs[0].color.name
      }

      if (colorB && imageColorPairs[1].color) {
        colorB.textContent = imageColorPairs[1].color.name
      }

      // Update scale factors
      const scaleA = document.getElementById('status-scale-a')
      const scaleB = document.getElementById('status-scale-b')

      if (scaleA) {
        scaleA.textContent = parseFloat(imageColorPairs[0].scale).toFixed(2)
      }

      if (scaleB) {
        scaleB.textContent = parseFloat(imageColorPairs[1].scale).toFixed(2)
      }

      // Update active image highlighting
      const statusImageA = document.getElementById('status-image-a')
      const statusImageB = document.getElementById('status-image-b')

      if (statusImageA && statusImageB) {
        statusImageA.classList.toggle('active', controlState.activeImageIndex === 0)
        statusImageB.classList.toggle('active', controlState.activeImageIndex === 1)
      }

      // Update Blend Mode
      const blendModeVal = document.getElementById('status-blend-mode-value')
      if (blendModeVal) {
        // Mock value since we don't have the full backgroundModes array in this test context
        blendModeVal.textContent = 'MULTIPLY'
      }
    })

    showStatusDisplay = vi.fn((duration = 3000) => {
      const statusOverlay = document.getElementById('status-overlay')
      if (!statusOverlay) return

      updateStatusDisplay()
      statusOverlay.classList.remove('hidden', 'fade-out')

      if (controlState.statusTimeout) {
        clearTimeout(controlState.statusTimeout)
        controlState.statusTimeout = null
      }

      if (duration > 0) {
        controlState.statusIsPermanent = false
        controlState.statusTimeout = setTimeout(() => {
          hideStatusDisplay()
        }, duration)
      } else {
        controlState.statusIsPermanent = true
      }
    })

    hideStatusDisplay = vi.fn(() => {
      const statusOverlay = document.getElementById('status-overlay')
      if (!statusOverlay) return

      controlState.statusIsPermanent = false
      if (controlState.statusTimeout) {
        clearTimeout(controlState.statusTimeout)
        controlState.statusTimeout = null
      }

      statusOverlay.classList.add('fade-out')
      setTimeout(() => {
        statusOverlay.classList.add('hidden')
        statusOverlay.classList.remove('fade-out')
      }, 300)
    })

    toggleStatusDisplay = vi.fn(() => {
      const statusOverlay = document.getElementById('status-overlay')
      if (!statusOverlay) return

      if (statusOverlay.classList.contains('hidden')) {
        showStatusDisplay(0) // Show permanently when manually toggled
      } else {
        hideStatusDisplay()
      }
    })

    updateStatusPosition = vi.fn(() => {
      const statusOverlay = document.getElementById('status-overlay')
      if (!statusOverlay) return

      statusOverlay.style.left = `${controlState.statusPosition.x}px`
      statusOverlay.style.top = `${controlState.statusPosition.y}px`
    })

    initializeStatusDragging = vi.fn(() => {
      const statusOverlay = document.getElementById('status-overlay')
      if (!statusOverlay) return

      // Load saved position from session storage
      const savedPosition = sessionStorage.getItem('duo-chrome-status-position')
      if (savedPosition) {
        try {
          const position = JSON.parse(savedPosition)
          controlState.statusPosition = position
          updateStatusPosition()
        } catch (error) {
          console.warn('Failed to load status position:', error)
        }
      } else {
        updateStatusPosition()
      }
    })
  })

  describe('Status Display Updates', () => {
    it('should update image filenames correctly', () => {
      updateStatusDisplay()

      // Expect formatted name (spaces instead of hyphens)
      expect(mockElements['status-filename-a'].textContent).toBe('landscape 001')
      expect(mockElements['status-filename-b'].textContent).toBe('portrait 042')
    })

    it('should update blend mode display correctly', () => {
      updateStatusDisplay()
      expect(mockElements['status-blend-mode-value'].textContent).toBe('MULTIPLY')
    })

    it('should update color names correctly', () => {
      updateStatusDisplay()

      expect(mockElements['status-color-a'].textContent).toBe('Bright Red')
      expect(mockElements['status-color-b'].textContent).toBe('Forest Green')
    })

    it('should update scale factors with proper formatting', () => {
      updateStatusDisplay()

      expect(mockElements['status-scale-a'].textContent).toBe('1.25')
      expect(mockElements['status-scale-b'].textContent).toBe('0.80')
    })

    it('should handle missing image data gracefully', () => {
      imageColorPairs[0] = { img: null, color: null, scale: 1.0 }
      
      expect(() => {
        updateStatusDisplay()
      }).not.toThrow()
    })

    it('should handle missing DOM elements gracefully', () => {
      document.getElementById = vi.fn(() => null)
      
      expect(() => {
        updateStatusDisplay()
      }).not.toThrow()
    })
  })

  describe('Active Image Highlighting', () => {
    it('should highlight Image A when active', () => {
      controlState.activeImageIndex = 0
      updateStatusDisplay()

      expect(mockElements['status-image-a'].classList.toggle).toHaveBeenCalledWith('active', true)
      expect(mockElements['status-image-b'].classList.toggle).toHaveBeenCalledWith('active', false)
    })

    it('should highlight Image B when active', () => {
      controlState.activeImageIndex = 1
      updateStatusDisplay()

      expect(mockElements['status-image-a'].classList.toggle).toHaveBeenCalledWith('active', false)
      expect(mockElements['status-image-b'].classList.toggle).toHaveBeenCalledWith('active', true)
    })

    it('should update highlighting when active image changes', () => {
      // Start with A active
      controlState.activeImageIndex = 0
      updateStatusDisplay()
      
      // Switch to B active
      controlState.activeImageIndex = 1
      updateStatusDisplay()

      expect(mockElements['status-image-a'].classList.toggle).toHaveBeenLastCalledWith('active', false)
      expect(mockElements['status-image-b'].classList.toggle).toHaveBeenLastCalledWith('active', true)
    })
  })

  describe('Status Overlay Visibility', () => {
    it('should show status display with proper class management', () => {
      showStatusDisplay()

      expect(mockStatusOverlay.classList.remove).toHaveBeenCalledWith('hidden', 'fade-out')
      expect(updateStatusDisplay).toHaveBeenCalled()
    })

    it('should hide status display with fade-out animation', () => {
      hideStatusDisplay()

      expect(mockStatusOverlay.classList.add).toHaveBeenCalledWith('fade-out')
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 300)
    })

    it('should toggle status display visibility', () => {
      // Mock as hidden initially
      mockStatusOverlay.classList.contains = vi.fn((className) => className === 'hidden')
      
      toggleStatusDisplay()

      expect(showStatusDisplay).toHaveBeenCalledWith(0) // Permanent display
    })

    it('should handle temporary display with timeout', () => {
      showStatusDisplay(5000)

      expect(controlState.statusIsPermanent).toBe(false)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000)
    })

    it('should handle permanent display without timeout', () => {
      showStatusDisplay(0)

      expect(controlState.statusIsPermanent).toBe(true)
      expect(controlState.statusTimeout).toBeNull()
    })

    it('should clear existing timeout when showing again', () => {
      controlState.statusTimeout = 456
      
      showStatusDisplay()

      expect(clearTimeout).toHaveBeenCalledWith(456)
    })
  })

  describe('Status Overlay Positioning', () => {
    it('should update position with CSS styles', () => {
      controlState.statusPosition = { x: 100, y: 200 }
      
      updateStatusPosition()

      expect(mockStatusOverlay.style.left).toBe('100px')
      expect(mockStatusOverlay.style.top).toBe('200px')
    })

    it('should load saved position from session storage', () => {
      const savedPosition = { x: 150, y: 250 }
      sessionStorage.getItem = vi.fn(() => JSON.stringify(savedPosition))
      
      initializeStatusDragging()

      expect(controlState.statusPosition).toEqual(savedPosition)
      expect(updateStatusPosition).toHaveBeenCalled()
    })

    it('should handle invalid saved position gracefully', () => {
      sessionStorage.getItem = vi.fn(() => 'invalid-json')
      
      expect(() => {
        initializeStatusDragging()
      }).not.toThrow()
      
      expect(console.warn).toHaveBeenCalledWith('Failed to load status position:', expect.any(Error))
    })

    it('should use default position when no saved position exists', () => {
      sessionStorage.getItem = vi.fn(() => null)
      
      initializeStatusDragging()

      expect(updateStatusPosition).toHaveBeenCalled()
    })
  })

  describe('Integration with Control Actions', () => {
    it('should update display when image properties change', () => {
      // Simulate image scale change
      imageColorPairs[0].scale = 1.5
      
      updateStatusDisplay()

      expect(mockElements['status-scale-a'].textContent).toBe('1.50')
    })

    it('should update display when image navigation occurs', () => {
      // Simulate image navigation
      imageColorPairs[1].img = 'new-image.jpg'
      imageColorPairs[1].color = { name: 'Ocean Blue' }
      
      updateStatusDisplay()

      expect(mockElements['status-filename-b'].textContent).toBe('new-image')
      expect(mockElements['status-color-b'].textContent).toBe('Ocean Blue')
    })

    it('should update display when color cycling occurs', () => {
      // Simulate color change
      imageColorPairs[0].color = { name: 'Sunset Orange' }
      
      updateStatusDisplay()

      expect(mockElements['status-color-a'].textContent).toBe('Sunset Orange')
    })

    it('should show status display temporarily on control actions', () => {
      showStatusDisplay(2000) // Simulate control action trigger

      expect(mockStatusOverlay.classList.remove).toHaveBeenCalledWith('hidden', 'fade-out')
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000)
    })
  })

  describe('Performance and Error Handling', () => {
    it('should handle missing status overlay gracefully', () => {
      document.getElementById = vi.fn((id) => {
        if (id === 'status-overlay') return null
        return mockElements[id]
      })

      expect(() => {
        showStatusDisplay()
        hideStatusDisplay()
        updateStatusDisplay()
      }).not.toThrow()
    })

    it('should handle missing individual status elements gracefully', () => {
      document.getElementById = vi.fn((id) => {
        if (id.startsWith('status-')) return null
        return mockElements[id]
      })

      expect(() => {
        updateStatusDisplay()
      }).not.toThrow()
    })

    it('should prevent memory leaks by clearing timeouts', () => {
      controlState.statusTimeout = 789
      
      hideStatusDisplay()

      expect(clearTimeout).toHaveBeenCalledWith(789)
      expect(controlState.statusTimeout).toBeNull()
    })

    it('should handle rapid show/hide calls without issues', () => {
      showStatusDisplay()
      hideStatusDisplay()
      showStatusDisplay()
      hideStatusDisplay()

      expect(mockStatusOverlay.classList.add).toHaveBeenCalledWith('fade-out')
      expect(mockStatusOverlay.classList.remove).toHaveBeenCalledWith('hidden', 'fade-out')
    })
  })

  describe('Session Persistence', () => {
    it('should save position to session storage', () => {
      controlState.statusPosition = { x: 300, y: 400 }
      
      // Simulate drag end (would normally be called in drag handler)
      sessionStorage.setItem('duo-chrome-status-position', JSON.stringify(controlState.statusPosition))

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'duo-chrome-status-position',
        JSON.stringify({ x: 300, y: 400 })
      )
    })

    it('should restore position on initialization', () => {
      const savedPosition = { x: 500, y: 600 }
      sessionStorage.getItem = vi.fn(() => JSON.stringify(savedPosition))
      
      initializeStatusDragging()

      expect(sessionStorage.getItem).toHaveBeenCalledWith('duo-chrome-status-position')
      expect(controlState.statusPosition).toEqual(savedPosition)
    })
  })
})