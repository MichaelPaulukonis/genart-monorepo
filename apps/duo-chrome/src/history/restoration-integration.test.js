/**
 * Integration Tests for History Restoration
 *
 * These tests verify that the composition state restoration integrates correctly
 * with the image loading system.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HistoryManager } from './HistoryManager.js'
import { createHistoryEntry } from './HistoryEntry.js'

describe('Task 4: Composition State Restoration Integration', () => {
  let mockP5
  let mockStateRefs
  let historyManager
  let loadImageCallbacks

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock localStorage to prevent test pollution
    const storage = {}
    global.localStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => { storage[key] = value }),
      removeItem: vi.fn((key) => { delete storage[key] }),
      clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]) })
    }

    // Track loadImage callbacks for testing
    loadImageCallbacks = []

    // Create mock p5 instance with loadImage that captures callbacks
    mockP5 = {
      loadImage: vi.fn((path, successCallback, errorCallback) => {
        loadImageCallbacks.push({ path, successCallback, errorCallback })
        // Return a mock image object
        return { width: 100, height: 100 }
      }),
      createGraphics: vi.fn((width, height) => ({
        width,
        height,
        background: vi.fn(),
        image: vi.fn(),
        imageMode: vi.fn(),
        blendMode: vi.fn(),
        remove: vi.fn(),
        drawingContext: { globalCompositeOperation: '' }
      })),
      color: vi.fn((colorValue) => colorValue),
      width: 1000,
      height: 1000,
      CENTER: 'center',
      ADD: 'add',
      MULTIPLY: 'multiply',
      SCREEN: 'screen'
    }

    // Create mock state references
    mockStateRefs = {
      imageColorPairs: [
        {
          img: 'image1.jpg',
          color: { name: 'Red', color: '#FF0000' },
          scale: 1.0,
          layer: null
        },
        {
          img: 'image2.jpg',
          color: { name: 'Blue', color: '#0000FF' },
          scale: 1.0,
          layer: null
        }
      ],
      controlState: {
        imageIndices: [0, 1],
        activeImageIndex: 0,
        manualSizeControl: [false, false]
      },
      colorIndex: 0,
      currentBlendModeIndex: 0,
      currentBackgroundModeIndex: 0,
      imgs: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
      ALL_PALETTES: [
        [
          { name: 'Red', color: '#FF0000' },
          { name: 'Blue', color: '#0000FF' },
          { name: 'Green', color: '#00FF00' }
        ]
      ],
      COLOR_MAPS: [
        new Map([
          ['Red', { name: 'Red', color: '#FF0000' }],
          ['Blue', { name: 'Blue', color: '#0000FF' }],
          ['Green', { name: 'Green', color: '#00FF00' }]
        ])
      ],
      backgroundModes: [
        { name: 'White', color: [255, 255, 255], blendModes: ['ADD'] },
        { name: 'Black', color: [0, 0, 0], blendModes: ['MULTIPLY'] }
      ],
      requestScreenUpdate: vi.fn(),
      updateStatusDisplay: vi.fn()
    }

    // Create history manager
    historyManager = new HistoryManager(mockP5, mockStateRefs)

    // Capture initial state
    historyManager.captureCurrentState('initial')
    loadImageCallbacks = [] // Reset for tests
  })

  it('should call loadImage for both images when restoring from history', () => {
    // Set state to capture
    mockStateRefs.imageColorPairs[0].img = 'image2.jpg'
    mockStateRefs.imageColorPairs[0].scale = 1.5
    mockStateRefs.imageColorPairs[0].color = { name: 'Green', color: '#00FF00' }
    mockStateRefs.controlState.imageIndices[0] = 1

    mockStateRefs.imageColorPairs[1].img = 'image3.jpg'
    mockStateRefs.imageColorPairs[1].scale = 0.8
    mockStateRefs.imageColorPairs[1].color = { name: 'Red', color: '#FF0000' }
    mockStateRefs.controlState.imageIndices[1] = 2

    mockStateRefs.currentBlendModeIndex = 1
    mockStateRefs.controlState.activeImageIndex = 1

    // Capture entry (will be the second entry, root was first)
    historyManager.captureCurrentState('manual')

    // Navigate to the entry (which should trigger restoration)
    historyManager.navigateTo(1)

    // Verify loadImage was called twice (once for each image)
    expect(mockP5.loadImage).toHaveBeenCalledTimes(2)

    // Verify correct image paths were loaded
    // Note: index might be different if root also loaded images
    const lastCalls = loadImageCallbacks.slice(-2)
    expect(lastCalls[0].path).toBe('./images/image2.jpg')
    expect(lastCalls[1].path).toBe('./images/image3.jpg')
  })

  it('should restore state before loading images', () => {
    // Set state to capture
    mockStateRefs.imageColorPairs[0].img = 'image2.jpg'
    mockStateRefs.imageColorPairs[0].scale = 1.5
    mockStateRefs.imageColorPairs[0].color = { name: 'Green', color: '#00FF00' }
    mockStateRefs.controlState.imageIndices[0] = 1

    mockStateRefs.imageColorPairs[1].img = 'image3.jpg'
    mockStateRefs.imageColorPairs[1].scale = 0.8
    mockStateRefs.imageColorPairs[1].color = { name: 'Red', color: '#FF0000' }
    mockStateRefs.controlState.imageIndices[1] = 2

    mockStateRefs.currentBlendModeIndex = 2
    mockStateRefs.currentBackgroundModeIndex = 1
    mockStateRefs.controlState.activeImageIndex = 1

    // Capture entry
    historyManager.captureCurrentState('manual')

    // Navigate to the entry
    historyManager.navigateTo(1)

    // Verify state was restored
    expect(mockStateRefs.imageColorPairs[0].img).toBe('image2.jpg')
    expect(mockStateRefs.imageColorPairs[0].scale).toBe(1.5)
    expect(mockStateRefs.imageColorPairs[0].color.name).toBe('Green')

    expect(mockStateRefs.imageColorPairs[1].img).toBe('image3.jpg')
    expect(mockStateRefs.imageColorPairs[1].scale).toBe(0.8)
    expect(mockStateRefs.imageColorPairs[1].color.name).toBe('Red')

    expect(mockStateRefs.currentBlendModeIndex).toBe(2)
    expect(mockStateRefs.currentBackgroundModeIndex).toBe(1)
    expect(mockStateRefs.controlState.activeImageIndex).toBe(1)
  })

  it('should call requestScreenUpdate after both images are loaded', () => {
    // Capture root entry
    const entry = historyManager.history[0]

    // Navigate to the entry (triggers image loading)
    historyManager.navigateTo(0)

    // Verify requestScreenUpdate was not called yet (images not loaded)
    expect(mockStateRefs.requestScreenUpdate).not.toHaveBeenCalled()

    // Simulate first image loading
    const mockImg1 = { width: 100, height: 100 }
    const firstCallback = loadImageCallbacks[loadImageCallbacks.length - 2]
    firstCallback.successCallback(mockImg1)

    // Still should not be called (only 1 of 2 images loaded)
    expect(mockStateRefs.requestScreenUpdate).not.toHaveBeenCalled()

    // Simulate second image loading
    const mockImg2 = { width: 100, height: 100 }
    const secondCallback = loadImageCallbacks[loadImageCallbacks.length - 1]
    secondCallback.successCallback(mockImg2)

    // Now requestScreenUpdate should be called
    expect(mockStateRefs.requestScreenUpdate).toHaveBeenCalledTimes(1)
  })

  it('should call updateStatusDisplay after both images are loaded', () => {
    // Navigate to root entry
    historyManager.navigateTo(0)

    // Simulate both images loading
    const mockImg = { width: 100, height: 100 }
    const lastCalls = loadImageCallbacks.slice(-2)
    lastCalls[0].successCallback(mockImg)
    lastCalls[1].successCallback(mockImg)

    // Verify updateStatusDisplay was called
    expect(mockStateRefs.updateStatusDisplay).toHaveBeenCalledTimes(1)
  })

  it('should regenerate layers with correct colors when images load', () => {
    // Navigate to root entry
    historyManager.navigateTo(0)

    // Simulate images loading
    const mockImg = { width: 100, height: 100 }
    const lastCalls = loadImageCallbacks.slice(-2)
    lastCalls[0].successCallback(mockImg)
    lastCalls[1].successCallback(mockImg)

    // Verify createGraphics was called (for layer creation)
    expect(mockP5.createGraphics).toHaveBeenCalled()

    // Verify layers were created for both images
    expect(mockStateRefs.imageColorPairs[0].layer).not.toBeNull()
    expect(mockStateRefs.imageColorPairs[1].layer).not.toBeNull()
  })

  it('should handle image loading errors gracefully', () => {
    // Navigate to root entry
    historyManager.navigateTo(0)

    // Simulate first image failing to load
    const lastCalls = loadImageCallbacks.slice(-2)
    lastCalls[0].errorCallback(new Error('Image not found'))

    // Simulate second image loading successfully
    const mockImg = { width: 100, height: 100 }
    lastCalls[1].successCallback(mockImg)

    // Should still call requestScreenUpdate after both complete (even with error)
    expect(mockStateRefs.requestScreenUpdate).toHaveBeenCalledTimes(1)
  })

  it('should restore composition with various states', () => {
    // Test with different blend modes, background modes, and scales
    const testCases = [
      {
        blendModeIndex: 0,
        backgroundModeIndex: 0,
        scaleA: 0.5,
        scaleB: 2.0
      },
      {
        blendModeIndex: 3,
        backgroundModeIndex: 1,
        scaleA: 1.5,
        scaleB: 0.8
      },
      {
        blendModeIndex: 5,
        backgroundModeIndex: 0,
        scaleA: 0.05,
        scaleB: 5.0
      }
    ]

    testCases.forEach((testCase, index) => {
      // Reset mocks
      mockP5.loadImage.mockClear()
      mockStateRefs.requestScreenUpdate.mockClear()
      loadImageCallbacks = []

      // Set state to capture
      mockStateRefs.imageColorPairs[0].scale = testCase.scaleA
      mockStateRefs.imageColorPairs[1].scale = testCase.scaleB
      mockStateRefs.currentBlendModeIndex = testCase.blendModeIndex
      mockStateRefs.currentBackgroundModeIndex = testCase.backgroundModeIndex

      // Capture entry (will be entry at index 1+)
      historyManager.captureCurrentState('manual')
      const targetPos = historyManager.currentPosition

      // Navigate to the entry
      historyManager.navigateTo(targetPos)

      // Verify state was restored correctly
      expect(mockStateRefs.imageColorPairs[0].scale).toBe(testCase.scaleA)
      expect(mockStateRefs.imageColorPairs[1].scale).toBe(testCase.scaleB)
      expect(mockStateRefs.currentBlendModeIndex).toBe(testCase.blendModeIndex)
      expect(mockStateRefs.currentBackgroundModeIndex).toBe(testCase.backgroundModeIndex)

      // Simulate images loading
      const mockImg = { width: 100, height: 100 }
      const lastCalls = loadImageCallbacks.slice(-2)
      lastCalls[0].successCallback(mockImg)
      lastCalls[1].successCallback(mockImg)

      // Verify screen update was called
      expect(mockStateRefs.requestScreenUpdate).toHaveBeenCalled()
    })
  })
})
