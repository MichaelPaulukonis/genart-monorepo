/**
 * Tests for localStorage persistence functionality in HistoryManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HistoryManager } from './HistoryManager.js'

describe('HistoryManager - localStorage Persistence', () => {
  let historyManager
  let mockP5
  let mockStateRefs
  let originalLocalStorage

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = global.localStorage

    // Mock localStorage
    const storage = {}
    global.localStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => { storage[key] = value }),
      removeItem: vi.fn((key) => { delete storage[key] }),
      clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]) })
    }

    // Mock p5 instance
    mockP5 = {
      width: 800,
      height: 600,
      loadImage: vi.fn(),
      createGraphics: vi.fn(() => ({
        background: vi.fn(),
        image: vi.fn(),
        drawingContext: { globalCompositeOperation: '' }
      })),
      color: vi.fn((c) => c)
    }

    // Mock state references
    mockStateRefs = {
      imageColorPairs: [
        {
          img: 'test1.jpg',
          color: { name: 'Red', color: '#FF0000' },
          scale: 1.0,
          layer: null
        },
        {
          img: 'test2.jpg',
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
      currentBlendModeIndex: 2,
      currentBackgroundModeIndex: 1,
      imgs: ['test1.jpg', 'test2.jpg'],
      ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }, { name: 'Blue', color: '#0000FF' }]],
      COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }], ['Blue', { name: 'Blue', color: '#0000FF' }]])]
    }

    // Create history manager (will attempt to load from storage)
    historyManager = new HistoryManager(mockP5, mockStateRefs)
  })

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage
  })

  describe('saveToStorage', () => {
    it('should save history to localStorage with correct schema', () => {
      // Capture some entries
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('random')

      // Verify localStorage.setItem was called
      expect(localStorage.setItem).toHaveBeenCalled()

      // Get the saved data
      const savedData = JSON.parse(localStorage.getItem('duo-chrome-history'))

      // Verify schema
      expect(savedData).toHaveProperty('version', 1)
      expect(savedData).toHaveProperty('currentPosition')
      expect(savedData).toHaveProperty('entries')
      expect(savedData).toHaveProperty('lastModified')
      expect(savedData).toHaveProperty('maxEntries')

      // Verify data
      expect(savedData.entries).toHaveLength(2)
      expect(savedData.currentPosition).toBe(1)
      expect(savedData.maxEntries).toBe(500)
    })

    it('should handle storage quota exceeded error', () => {
      // Mock quota exceeded error
      localStorage.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      // Capture entry (will trigger save)
      const result = historyManager.captureCurrentState('manual')

      // Should still return the entry even if save failed
      expect(result).toBeTruthy()
    })

    it('should save automatically after capturing state', () => {
      const saveToStorageSpy = vi.spyOn(historyManager, 'saveToStorage')

      historyManager.captureCurrentState('manual')

      expect(saveToStorageSpy).toHaveBeenCalled()
    })
  })

  describe('loadFromStorage', () => {
    it('should load history from localStorage on initialization', () => {
      // Pre-populate localStorage
      const testData = {
        version: 1,
        currentPosition: 1,
        entries: [
          {
            id: 'test-1',
            timestamp: Date.now(),
            imageA: { index: 0, filename: 'test1.jpg', colorName: 'Red', scale: 1.0 },
            imageB: { index: 1, filename: 'test2.jpg', colorName: 'Blue', scale: 1.5 },
            paletteIndex: 0,
            blendModeIndex: 2,
            backgroundModeIndex: 1,
            activeImageIndex: 0,
            source: 'manual'
          },
          {
            id: 'test-2',
            timestamp: Date.now(),
            imageA: { index: 0, filename: 'test1.jpg', colorName: 'Red', scale: 1.2 },
            imageB: { index: 1, filename: 'test2.jpg', colorName: 'Blue', scale: 1.8 },
            paletteIndex: 0,
            blendModeIndex: 3,
            backgroundModeIndex: 0,
            activeImageIndex: 1,
            source: 'random'
          }
        ],
        lastModified: Date.now(),
        maxEntries: 500
      }

      localStorage.setItem('duo-chrome-history', JSON.stringify(testData))

      // Create new history manager (should load from storage)
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Verify history was loaded
      expect(newManager.history).toHaveLength(2)
      expect(newManager.currentPosition).toBe(1)
      expect(newManager.getCurrentEntry().id).toBe('test-2')
    })

    it('should handle missing storage gracefully', () => {
      // Ensure no stored data
      localStorage.getItem.mockReturnValue(null)

      // Create new history manager
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Should have empty history
      expect(newManager.history).toHaveLength(0)
      expect(newManager.currentPosition).toBe(-1)
    })

    it('should handle corrupted storage data', () => {
      // Set corrupted data
      localStorage.getItem.mockReturnValue('{ invalid json }')

      // Create new history manager (should handle error)
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Should have empty history
      expect(newManager.history).toHaveLength(0)
      expect(newManager.currentPosition).toBe(-1)

      // Should have cleared corrupted data
      expect(localStorage.removeItem).toHaveBeenCalledWith('duo-chrome-history')
    })

    it('should validate entries and skip invalid ones', () => {
      const testData = {
        version: 1,
        currentPosition: 0,
        entries: [
          {
            id: 'valid-1',
            timestamp: Date.now(),
            imageA: { index: 0, filename: 'test1.jpg', colorName: 'Red', scale: 1.0 },
            imageB: { index: 1, filename: 'test2.jpg', colorName: 'Blue', scale: 1.5 },
            paletteIndex: 0,
            blendModeIndex: 2,
            backgroundModeIndex: 1,
            activeImageIndex: 0,
            source: 'manual'
          },
          {
            // Invalid entry - missing required fields
            id: 'invalid-1',
            timestamp: Date.now()
          },
          {
            id: 'valid-2',
            timestamp: Date.now(),
            imageA: { index: 0, filename: 'test1.jpg', colorName: 'Red', scale: 1.2 },
            imageB: { index: 1, filename: 'test2.jpg', colorName: 'Blue', scale: 1.8 },
            paletteIndex: 0,
            blendModeIndex: 3,
            backgroundModeIndex: 0,
            activeImageIndex: 1,
            source: 'random'
          }
        ],
        lastModified: Date.now(),
        maxEntries: 500
      }

      localStorage.setItem('duo-chrome-history', JSON.stringify(testData))

      // Create new history manager
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Should have loaded only valid entries
      expect(newManager.history).toHaveLength(2)
      expect(newManager.history[0].id).toBe('valid-1')
      expect(newManager.history[1].id).toBe('valid-2')
    })

    it('should handle schema version mismatch', () => {
      const testData = {
        version: 999, // Future version
        currentPosition: 0,
        entries: [
          {
            id: 'test-1',
            timestamp: Date.now(),
            imageA: { index: 0, filename: 'test1.jpg', colorName: 'Red', scale: 1.0 },
            imageB: { index: 1, filename: 'test2.jpg', colorName: 'Blue', scale: 1.5 },
            paletteIndex: 0,
            blendModeIndex: 2,
            backgroundModeIndex: 1,
            activeImageIndex: 0,
            source: 'manual'
          }
        ],
        lastModified: Date.now(),
        maxEntries: 500
      }

      localStorage.setItem('duo-chrome-history', JSON.stringify(testData))

      // Create new history manager (should still try to load)
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Should have loaded the entry despite version mismatch
      expect(newManager.history).toHaveLength(1)
    })
  })

  describe('clearHistory', () => {
    it('should clear history from localStorage and memory', () => {
      // Capture some entries
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('random')

      // Clear history
      const result = historyManager.clearHistory()

      expect(result).toBe(true)
      expect(localStorage.removeItem).toHaveBeenCalledWith('duo-chrome-history')
    })

    it('should keep current composition as first entry', () => {
      // Capture entries and navigate
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('random')
      const currentEntry = historyManager.getCurrentEntry()

      // Clear history
      historyManager.clearHistory()

      // Should have one entry (the current one)
      expect(historyManager.history).toHaveLength(1)
      expect(historyManager.currentPosition).toBe(0)
      expect(historyManager.getCurrentEntry().id).toBe(currentEntry.id)
    })

    it('should handle empty history', () => {
      // Clear empty history
      const result = historyManager.clearHistory()

      expect(result).toBe(true)
      expect(historyManager.history).toHaveLength(0)
      expect(historyManager.currentPosition).toBe(-1)
    })
  })

  describe('Integration', () => {
    it('should persist history across manager instances', () => {
      // Capture entries in first manager
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('random')
      const firstEntry = historyManager.history[0]
      const secondEntry = historyManager.history[1]

      // Create new manager (should load from storage)
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Verify history was restored
      expect(newManager.history).toHaveLength(2)
      expect(newManager.currentPosition).toBe(1)
      expect(newManager.history[0].id).toBe(firstEntry.id)
      expect(newManager.history[1].id).toBe(secondEntry.id)
    })

    it('should maintain position after reload', () => {
      // Capture entries and navigate backward
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('random')
      historyManager.captureCurrentState('url')
      historyManager.navigateBackward()

      const position = historyManager.currentPosition

      // Create new manager
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Position should be restored
      expect(newManager.currentPosition).toBe(position)
    })
  })
})
