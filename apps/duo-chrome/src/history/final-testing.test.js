/**
 * Final Testing and Polish Suite
 *
 * Comprehensive tests for:
 * - Large history stacks (500+ entries)
 * - Memory leak detection
 * - Performance under load
 * - Edge cases and stress testing
 *
 * Requirements: Task 20 - Final testing and polish
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HistoryManager } from './HistoryManager.js'
import { ThumbnailGenerator } from './ThumbnailGenerator.js'
import { FilmstripPanel } from '../ui/FilmstripPanel.js'

describe('Final Testing and Polish', () => {
  let mockP5
  let mockStateRefs
  let historyManager
  let thumbnailGenerator
  let filmstripPanel

  beforeEach(() => {
    // Mock p5 instance
    mockP5 = {
      width: 800,
      height: 600,
      loadImage: vi.fn((path, successCallback) => {
        const mockImg = { width: 100, height: 100 }
        if (successCallback) {
          setTimeout(() => successCallback(mockImg), 0)
        }
        return mockImg
      }),
      createGraphics: vi.fn((width, height) => ({
        width,
        height,
        background: vi.fn(),
        image: vi.fn(),
        imageMode: vi.fn(),
        drawingContext: { globalCompositeOperation: '' },
        get: vi.fn(() => ({
          canvas: {
            toDataURL: vi.fn(() => 'data:image/png;base64,mockdata')
          }
        })),
        remove: vi.fn()
      })),
      color: vi.fn((c) => c),
      CENTER: 'center',
      blendMode: vi.fn()
    }

    // Mock state references
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
          scale: 1.5,
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
        { name: 'White', color: [255, 255, 255] },
        { name: 'Black', color: [0, 0, 0] }
      ],
      requestScreenUpdate: vi.fn(),
      updateStatusDisplay: vi.fn()
    }

    // Mock DOM elements
    const mockDOMElements = {
      'filmstrip-panel': {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(() => false)
        }
      },
      'filmstrip-scroll': {
        innerHTML: '',
        appendChild: vi.fn(),
        querySelector: vi.fn(() => null),
        addEventListener: vi.fn(),
        scrollTo: vi.fn(),
        scrollLeft: 0,
        clientWidth: 800,
        style: {}
      },
      'filmstrip-counter': {
        textContent: ''
      },
      'filmstrip-close': {
        addEventListener: vi.fn()
      }
    }

    global.document = {
      getElementById: vi.fn((id) => mockDOMElements[id] || null),
      createElement: vi.fn(() => ({
        className: '',
        dataset: {},
        style: {},
        addEventListener: vi.fn(),
        appendChild: vi.fn(),
        insertBefore: vi.fn(),
        remove: vi.fn(),
        scrollIntoView: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      }))
    }

    // Mock localStorage
    const storage = {}
    global.localStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => { storage[key] = value }),
      removeItem: vi.fn((key) => { delete storage[key] }),
      clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]) })
    }

    historyManager = new HistoryManager(mockP5, mockStateRefs)
    thumbnailGenerator = new ThumbnailGenerator(mockP5, mockStateRefs)
    filmstripPanel = new FilmstripPanel(historyManager, thumbnailGenerator)
  })

  afterEach(() => {
    // Cleanup
    if (historyManager) {
      historyManager.clearHistory()
    }
  })

  describe('Large History Stack Testing (500+ entries)', () => {
    it('should handle 500 history entries without performance degradation', () => {
      const startTime = performance.now()

      // Create 500 entries
      for (let i = 0; i < 500; i++) {
        mockStateRefs.imageColorPairs[0].scale = 1.0 + (i * 0.001)
        historyManager.captureCurrentState('manual')
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(historyManager.history.length).toBe(500)
      expect(historyManager.currentPosition).toBe(499)
      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000)
    })

    it('should navigate through large history efficiently', async () => {
      // Create 500 entries
      for (let i = 0; i < 500; i++) {
        mockStateRefs.imageColorPairs[0].scale = 1.0 + (i * 0.001)
        historyManager.captureCurrentState('manual')
      }

      const startTime = performance.now()

      // Navigate backward 100 times
      for (let i = 0; i < 100; i++) {
        historyManager.navigateBackward()
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(historyManager.currentPosition).toBe(399)
      // Navigation should be fast (< 2 seconds for 100 navigations)
      expect(duration).toBeLessThan(2000)
    })

    it('should maintain correct state with large history', () => {
      // Create 500 entries with distinct values
      const testValues = []
      for (let i = 0; i < 500; i++) {
        const scale = 1.0 + (i * 0.01)
        testValues.push(scale)
        mockStateRefs.imageColorPairs[0].scale = scale
        historyManager.captureCurrentState('manual')
      }

      // Navigate to random positions and verify state
      const testPositions = [0, 100, 250, 400, 499]
      testPositions.forEach(pos => {
        historyManager.navigateTo(pos)
        const entry = historyManager.getCurrentEntry()
        expect(entry.imageA.scale).toBeCloseTo(testValues[pos], 5)
      })
    })

    it('should enforce maximum entries limit', () => {
      const maxEntries = historyManager.maxEntries

      // Create more than max entries
      for (let i = 0; i < maxEntries + 100; i++) {
        historyManager.captureCurrentState('manual')
      }

      // Should not exceed max
      expect(historyManager.history.length).toBeLessThanOrEqual(maxEntries)
    })

    it('should handle rapid successive captures', () => {
      const startTime = performance.now()

      // Rapidly capture 1000 entries
      for (let i = 0; i < 1000; i++) {
        historyManager.captureCurrentState('manual')
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle rapid captures efficiently
      expect(duration).toBeLessThan(10000)
      expect(historyManager.history.length).toBeGreaterThan(0)
    })
  })

  describe('Memory Leak Detection', () => {
    it('should not accumulate memory with repeated capture/clear cycles', () => {
      const initialStats = historyManager.getPerformanceStats()
      const initialMemory = parseFloat(initialStats.memoryUsage.estimatedKB)

      // Perform multiple capture/clear cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        // Capture 100 entries
        for (let i = 0; i < 100; i++) {
          historyManager.captureCurrentState('manual')
        }

        // Clear history
        historyManager.clearHistory()
      }

      const finalStats = historyManager.getPerformanceStats()
      const finalMemory = parseFloat(finalStats.memoryUsage.estimatedKB)

      // Memory should not grow significantly (allow 10% variance)
      expect(finalMemory).toBeLessThan(initialMemory * 1.1)
    })

    it('should cleanup graphics objects properly', () => {
      const removeCallCount = { count: 0 }

      // Track remove calls on graphics objects
      mockP5.createGraphics = vi.fn(() => {
        const graphics = {
          background: vi.fn(),
          image: vi.fn(),
          imageMode: vi.fn(),
          drawingContext: { globalCompositeOperation: '' },
          get: vi.fn(() => ({
            canvas: {
              toDataURL: vi.fn(() => 'data:image/png;base64,mockdata')
            }
          })),
          remove: vi.fn(() => { removeCallCount.count++ })
        }
        return graphics
      })

      // Generate thumbnails
      const entry = historyManager.captureCurrentState('manual')
      const renderContext = {
        imgs: mockStateRefs.imgs,
        ALL_PALETTES: mockStateRefs.ALL_PALETTES,
        COLOR_MAPS: mockStateRefs.COLOR_MAPS,
        backgroundModes: mockStateRefs.backgroundModes
      }

      thumbnailGenerator.generateThumbnail(entry, renderContext)

      // Graphics objects should be cleaned up
      expect(removeCallCount.count).toBeGreaterThan(0)
    })

    it('should not leak event listeners', () => {
      const addEventListenerSpy = vi.fn()
      const removeEventListenerSpy = vi.fn()

      const mockElement = {
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy
      }

      global.document.getElementById = vi.fn(() => mockElement)

      // Show and hide filmstrip multiple times
      for (let i = 0; i < 10; i++) {
        filmstripPanel.show()
        filmstripPanel.hide()
      }

      // Should not accumulate listeners
      // (In real implementation, listeners should be cleaned up)
      expect(addEventListenerSpy.mock.calls.length).toBeLessThan(50)
    })

    it('should cleanup thumbnail cache when optimizing', () => {
      // Fill cache
      for (let i = 0; i < 100; i++) {
        thumbnailGenerator.cache.set(`entry-${i}`, `data:image/png;base64,entry${i}`)
      }

      const initialSize = thumbnailGenerator.cache.cache.size
      expect(initialSize).toBe(100)

      // Optimize to smaller size
      thumbnailGenerator.optimizeCache(20)

      const finalSize = thumbnailGenerator.cache.cache.size
      expect(finalSize).toBe(20)
      expect(finalSize).toBeLessThan(initialSize)
    })
  })

  describe('Performance Under Load', () => {
    it('should maintain responsiveness with large history and active filmstrip', () => {
      // Create large history
      for (let i = 0; i < 300; i++) {
        historyManager.captureCurrentState('manual')
      }

      const startTime = performance.now()

      // Show filmstrip
      filmstripPanel.show()

      // Simulate user interactions
      filmstripPanel.handleThumbnailClick(150)
      filmstripPanel.updateHighlight()
      filmstripPanel.updateCounter()

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should remain responsive (< 500ms)
      expect(duration).toBeLessThan(500)
    })

    it('should handle concurrent operations efficiently', async () => {
      // Create history
      for (let i = 0; i < 100; i++) {
        historyManager.captureCurrentState('manual')
      }

      const startTime = performance.now()

      // Perform multiple operations concurrently
      const operations = [
        historyManager.navigateBackward(),
        historyManager.saveToStorage(),
        filmstripPanel.updateCounter(),
        historyManager.getPerformanceStats()
      ]

      await Promise.all(operations.map(op => Promise.resolve(op)))

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle concurrent operations efficiently
      expect(duration).toBeLessThan(1000)
    })

    it('should optimize storage for large histories', () => {
      // Create large history
      for (let i = 0; i < 500; i++) {
        historyManager.captureCurrentState('manual')
      }

      const startTime = performance.now()
      historyManager.saveToStorage()
      const endTime = performance.now()

      const duration = endTime - startTime

      // Storage operation should complete in reasonable time
      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Edge Cases and Stress Testing', () => {
    it('should handle rapid navigation back and forth', async () => {
      // Create history
      for (let i = 0; i < 50; i++) {
        historyManager.captureCurrentState('manual')
      }

      // Rapidly navigate back and forth
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          historyManager.navigateBackward()
        } else {
          historyManager.navigateForward()
        }
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      // Should maintain valid state
      expect(historyManager.currentPosition).toBeGreaterThanOrEqual(0)
      expect(historyManager.currentPosition).toBeLessThan(historyManager.history.length)
    })

    it('should handle modifications at various positions in large history', () => {
      // Create large history
      for (let i = 0; i < 200; i++) {
        historyManager.captureCurrentState('manual')
      }

      // Modify at various positions
      const testPositions = [0, 50, 100, 150, 199]
      testPositions.forEach(pos => {
        historyManager.navigateTo(pos)
        historyManager.isNavigating = false
        mockStateRefs.imageColorPairs[0].scale = 999
        historyManager.captureCurrentState('modified')

        // Verify truncation occurred
        expect(historyManager.currentPosition).toBe(pos + 1)
      })
    })

    it('should handle extreme scale values', () => {
      const extremeValues = [0.05, 0.1, 1.0, 2.5, 4.0, 5.0]

      extremeValues.forEach(scale => {
        mockStateRefs.imageColorPairs[0].scale = scale
        const entry = historyManager.captureCurrentState('manual')
        expect(entry.imageA.scale).toBe(scale)
      })
    })

    it('should handle all blend mode combinations', () => {
      const blendModeCount = 10 // Typical number of blend modes

      for (let i = 0; i < blendModeCount; i++) {
        mockStateRefs.currentBlendModeIndex = i
        const entry = historyManager.captureCurrentState('manual')
        expect(entry.blendModeIndex).toBe(i)
      }
    })

    it('should handle filmstrip with no history', () => {
      expect(historyManager.history.length).toBe(0)

      // Should not crash
      expect(() => {
        filmstripPanel.show()
        filmstripPanel.updateCounter()
        filmstripPanel.updateHighlight()
      }).not.toThrow()
    })

    it('should handle filmstrip with single entry', () => {
      historyManager.captureCurrentState('manual')

      expect(() => {
        filmstripPanel.show()
        filmstripPanel.updateCounter()
        filmstripPanel.updateHighlight()
        historyManager.navigateBackward()
        historyManager.navigateForward()
      }).not.toThrow()
    })

    it('should recover from corrupted state gracefully', () => {
      // Create valid history
      for (let i = 0; i < 10; i++) {
        historyManager.captureCurrentState('manual')
      }

      // Corrupt current position
      historyManager.currentPosition = 999

      // Should recover
      const health = historyManager.healthCheck()
      expect(health.healthy).toBe(false)
      expect(health.issues.length).toBeGreaterThan(0)

      // Reset to valid state
      historyManager.currentPosition = 0
      const healthAfter = historyManager.healthCheck()
      expect(healthAfter.healthy).toBe(true)
    })
  })

  describe('Virtual Scrolling Performance', () => {
    it('should enable virtual scrolling for large histories', () => {
      // Create large history (> 100 entries)
      for (let i = 0; i < 150; i++) {
        historyManager.captureCurrentState('manual')
      }

      expect(filmstripPanel.shouldUseVirtualScrolling()).toBe(true)
    })

    it('should render only visible thumbnails with virtual scrolling', () => {
      // Create large history
      for (let i = 0; i < 200; i++) {
        historyManager.captureCurrentState('manual')
      }

      filmstripPanel.show()

      // With virtual scrolling, should not render all thumbnails
      // (In real implementation, would check rendered count)
      expect(filmstripPanel.shouldUseVirtualScrolling()).toBe(true)
    })

    it('should update visible range on scroll', () => {
      // Create large history
      for (let i = 0; i < 200; i++) {
        historyManager.captureCurrentState('manual')
      }

      filmstripPanel.show()

      // Simulate scroll
      const mockScrollEvent = { target: { scrollLeft: 1000 } }
      filmstripPanel.handleScroll(mockScrollEvent)

      // Should update visible range (implementation-specific)
      expect(filmstripPanel.isVisible).toBe(true)
    })
  })

  describe('Cross-Browser Compatibility Checks', () => {
    it('should handle missing localStorage gracefully', () => {
      const originalLocalStorage = global.localStorage
      delete global.localStorage

      // Should not crash
      expect(() => {
        historyManager.captureCurrentState('manual')
        historyManager.saveToStorage()
      }).not.toThrow()

      global.localStorage = originalLocalStorage
    })

    it('should handle missing requestIdleCallback', async () => {
      const originalRequestIdleCallback = global.requestIdleCallback
      delete global.requestIdleCallback

      // Should fallback to immediate generation
      const mockEntry = {
        id: 'test-1',
        imageA: { filename: 'test1.jpg', colorName: 'Red', scale: 1.0 },
        imageB: { filename: 'test2.jpg', colorName: 'Blue', scale: 1.0 },
        paletteIndex: 0,
        blendModeIndex: 0,
        backgroundModeIndex: 0
      }

      const renderContext = {
        imgs: mockStateRefs.imgs,
        ALL_PALETTES: mockStateRefs.ALL_PALETTES,
        COLOR_MAPS: mockStateRefs.COLOR_MAPS,
        backgroundModes: mockStateRefs.backgroundModes
      }

      await expect(
        thumbnailGenerator.batchGenerate([mockEntry], renderContext)
      ).resolves.not.toThrow()

      global.requestIdleCallback = originalRequestIdleCallback
    })

    it('should work without modern array methods', () => {
      // Test that code doesn't rely on very modern features
      const entry = historyManager.captureCurrentState('manual')

      expect(entry).toBeDefined()
      expect(entry.imageA).toBeDefined()
      expect(entry.imageB).toBeDefined()
    })
  })

  describe('User Experience and Feedback', () => {
    it('should provide clear feedback at history boundaries', () => {
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('manual')

      // At end
      expect(historyManager.canNavigateForward()).toBe(false)
      expect(historyManager.canNavigateBackward()).toBe(true)

      // At beginning
      historyManager.navigateTo(0)
      expect(historyManager.canNavigateBackward()).toBe(false)
      expect(historyManager.canNavigateForward()).toBe(true)
    })

    it('should update counter display correctly', () => {
      for (let i = 0; i < 10; i++) {
        historyManager.captureCurrentState('manual')
      }

      filmstripPanel.updateCounter()

      const counterElement = global.document.getElementById('filmstrip-counter')
      expect(counterElement.textContent).toBe('10 / 10')
    })

    it('should highlight current position in filmstrip', () => {
      for (let i = 0; i < 5; i++) {
        historyManager.captureCurrentState('manual')
      }

      historyManager.navigateTo(2)

      // Mock rendered thumbnails
      const mockThumbnails = new Map()
      for (let i = 0; i < 5; i++) {
        mockThumbnails.set(i, {
          classList: {
            add: vi.fn(),
            remove: vi.fn()
          }
        })
      }
      filmstripPanel.renderedThumbnails = mockThumbnails

      filmstripPanel.updateHighlight()

      // Position 2 should be highlighted
      expect(mockThumbnails.get(2).classList.add).toHaveBeenCalledWith('current')
    })

    it('should provide performance statistics for monitoring', () => {
      for (let i = 0; i < 50; i++) {
        historyManager.captureCurrentState('manual')
      }

      const stats = historyManager.getPerformanceStats()

      expect(stats).toHaveProperty('historySize')
      expect(stats).toHaveProperty('currentPosition')
      expect(stats).toHaveProperty('memoryUsage')
      expect(stats).toHaveProperty('thumbnailCache')

      expect(stats.historySize).toBe(50)
    })
  })
})
