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
      expect(savedData).toHaveProperty('version', 2)
      expect(savedData).toHaveProperty('rootId')
      expect(savedData).toHaveProperty('currentId')
      expect(savedData).toHaveProperty('nodes')
      expect(savedData).toHaveProperty('lastModified')

      // Verify data
      expect(savedData.nodes).toHaveLength(2)
      expect(savedData.rootId).toBeTruthy()
      expect(savedData.currentId).toBeTruthy()
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
      const entry1 = {
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
      const entry2 = {
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

      // Construct v2 graph data
      const testData = {
        version: 2,
        rootId: 'test-1',
        currentId: 'test-2',
        nodes: [
          {
            id: 'test-1',
            entry: entry1,
            parentId: null,
            children: ['test-2'],
            activeChildId: 'test-2',
            timestamp: entry1.timestamp
          },
          {
            id: 'test-2',
            entry: entry2,
            parentId: 'test-1',
            children: [],
            activeChildId: null,
            timestamp: entry2.timestamp
          }
        ],
        lastModified: Date.now()
      }

      localStorage.setItem('duo-chrome-history', JSON.stringify(testData))

      // Create new history manager (should load from storage)
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Verify history was loaded
      expect(newManager.nodes.size).toBe(2)
      expect(newManager.currentId).toBe('test-2')
      expect(newManager.history).toHaveLength(2)
      expect(newManager.getCurrentEntry().id).toBe('test-2')
    })

    it('should handle missing storage gracefully', () => {
      // Ensure no stored data
      localStorage.getItem.mockReturnValue(null)

      // Create new history manager
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Should have empty history
      expect(newManager.nodes.size).toBe(0)
    })

    it('should handle corrupted storage data', () => {
      // Set corrupted data
      localStorage.getItem.mockReturnValue('{ invalid json }')

      // Create new history manager (should handle error)
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Should have default history
      expect(newManager.nodes.size).toBe(1)

      // Should have cleared corrupted data
      expect(localStorage.removeItem).toHaveBeenCalledWith('duo-chrome-history')
    })

    it('should reject invalid graph structure (missing root/current)', () => {
      const testData = {
        version: 2,
        rootId: 'missing-node',
        currentId: 'test-1',
        nodes: [
          { id: 'test-1', entry: {}, parentId: null, children: [] }
        ]
      }

      localStorage.setItem('duo-chrome-history', JSON.stringify(testData))

      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Should have failed validation and cleared history
      expect(newManager.nodes.size).toBe(1) // clearHistory creates one initial entry
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
      expect(historyManager.nodes.size).toBe(1) // Creates new initial entry
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
      // New entry ID will be different, but state should match
      const newEntry = historyManager.getCurrentEntry()
      expect(newEntry.imageA.filename).toBe(currentEntry.imageA.filename)
      expect(newEntry.imageB.filename).toBe(currentEntry.imageB.filename)
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
      expect(newManager.nodes.size).toBeGreaterThanOrEqual(2)
      expect(newManager.currentId).toBe(secondEntry.id)
      
      // Check that the reloaded graph contains the original entries
      const loadedEntry1 = newManager.nodes.get(firstEntry.id).entry
      expect(loadedEntry1.imageA.filename).toBe(firstEntry.imageA.filename)
    })

    it('should maintain position after reload', () => {
      // Capture entries and navigate backward
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('random')
      historyManager.captureCurrentState('url')
      historyManager.navigateBackward()

      const currentId = historyManager.currentId

      // Create new manager
      const newManager = new HistoryManager(mockP5, mockStateRefs)

      // Position should be restored
      expect(newManager.currentId).toBe(currentId)
    })
  })
})