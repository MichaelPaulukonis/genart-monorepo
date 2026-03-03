/**
 * Error Handling Tests for History System
 *
 * Tests the comprehensive error handling and edge cases
 * for the history management system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HistoryManager } from './HistoryManager.js'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

global.localStorage = localStorageMock

describe('HistoryManager Error Handling', () => {
  let mockP5
  let mockStateRefs
  let historyManager

  beforeEach(() => {
    // Mock p5 instance
    mockP5 = {
      createGraphics: vi.fn(() => ({
        background: vi.fn(),
        image: vi.fn(),
        remove: vi.fn(),
        canvas: {
          toDataURL: vi.fn(() => 'data:image/png;base64,mock')
        },
        drawingContext: {}
      })),
      loadImage: vi.fn(),
      color: vi.fn((c) => c),
      CENTER: 'CENTER',
      width: 800,
      height: 600
    }

    // Mock state references
    mockStateRefs = {
      imageColorPairs: [
        {
          img: 'test1.jpg',
          color: { name: 'Red', color: [255, 0, 0] },
          scale: 1.0,
          layer: null
        },
        {
          img: 'test2.jpg',
          color: { name: 'Blue', color: [0, 0, 255] },
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
      imgs: ['test1.jpg', 'test2.jpg', 'test3.jpg'],
      ALL_PALETTES: [
        [
          { name: 'Red', color: [255, 0, 0] },
          { name: 'Blue', color: [0, 0, 255] }
        ]
      ],
      COLOR_MAPS: [
        new Map([
          ['Red', { name: 'Red', color: [255, 0, 0] }],
          ['Blue', { name: 'Blue', color: [0, 0, 255] }]
        ])
      ],
      requestScreenUpdate: vi.fn(),
      updateStatusDisplay: vi.fn()
    }

    // Clear localStorage before each test
    localStorage.clear()

    historyManager = new HistoryManager(mockP5, mockStateRefs)

    // Spy on console.error to prevent test noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('localStorage Error Handling', () => {
    it('should handle localStorage not available', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.localStorage
      delete global.localStorage

      const result = historyManager.saveToStorage()

      expect(result).toBe(false)

      // Restore localStorage
      global.localStorage = originalLocalStorage
    })

    it('should handle localStorage quota exceeded', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const setItemSpy = vi.spyOn(global.localStorage, 'setItem')
      setItemSpy.mockImplementation(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      // Add some entries to history
      historyManager.captureCurrentState('manual')

      const result = historyManager.saveToStorage()

      expect(result).toBe(false)

      setItemSpy.mockRestore()
    })

    it('should handle SecurityError (private browsing)', () => {
      const setItemSpy = vi.spyOn(global.localStorage, 'setItem')
      setItemSpy.mockImplementation(() => {
        const error = new Error('SecurityError')
        error.name = 'SecurityError'
        throw error
      })

      const result = historyManager.saveToStorage()

      expect(result).toBe(false)

      setItemSpy.mockRestore()
    })
  })

  describe('Corrupted Storage Data Handling', () => {
    it('should handle corrupted JSON data', () => {
      localStorage.setItem('duo-chrome-history', 'invalid json {')

      const result = historyManager.loadFromStorage()

      expect(result).toBe(false)
      // Should have cleared corrupted data and re-seeded with fresh state
      const stored = localStorage.getItem('duo-chrome-history')
      expect(stored).not.toBeNull()
      const data = JSON.parse(stored)
      expect(data.nodes).toHaveLength(1)
    })

    it('should handle missing required graph fields', () => {
      localStorage.setItem('duo-chrome-history', JSON.stringify({
        version: 2
        // Missing nodes, rootId, currentId
      }))

      const result = historyManager.loadFromStorage()

      expect(result).toBe(false)
    })

    it('should handle invalid nodes structure', () => {
      localStorage.setItem('duo-chrome-history', JSON.stringify({
        version: 2,
        rootId: 'test-1',
        currentId: 'test-1',
        nodes: 'not an array'
      }))

      const result = historyManager.loadFromStorage()

      expect(result).toBe(false)
    })

    it('should reject graph with invalid pointers', () => {
      localStorage.setItem('duo-chrome-history', JSON.stringify({
        version: 2,
        rootId: 'root-id',
        currentId: 'missing-id',
        nodes: [
          { id: 'root-id', entry: {}, children: [] }
        ]
      }))

      const result = historyManager.loadFromStorage()

      expect(result).toBe(false)
      // Should have cleared history and re-seeded with fresh state
      const stored = localStorage.getItem('duo-chrome-history')
      expect(stored).not.toBeNull()
      const data = JSON.parse(stored)
      expect(data.nodes).toHaveLength(1)
    })
  })

  describe('Invalid Color Reference Handling', () => {
    it('should fallback to default color when color not found', () => {
      const entry = {
        id: 'test-1',
        timestamp: Date.now(),
        imageA: {
          index: 0,
          filename: 'test1.jpg',
          colorName: 'NonExistentColor', // Invalid color
          scale: 1.0
        },
        imageB: {
          index: 1,
          filename: 'test2.jpg',
          colorName: 'Blue',
          scale: 1.0
        },
        paletteIndex: 0,
        blendModeIndex: 0,
        backgroundModeIndex: 0,
        activeImageIndex: 0,
        source: 'manual'
      }

      // Should not throw error
      expect(() => {
        historyManager._restoreCompositionFromEntry(entry)
      }).not.toThrow()

      // Should have used fallback color
      expect(mockStateRefs.imageColorPairs[0].color).toBeDefined()
    })
  })

  describe('Invalid Index Validation', () => {
    it('should validate and correct invalid palette index', () => {
      const result = historyManager._validatePaletteIndex(999, mockStateRefs.ALL_PALETTES)
      expect(result).toBe(0) // Should fallback to 0
    })

    it('should validate and correct invalid blend mode index', () => {
      const result = historyManager._validateBlendModeIndex(999, 0)
      expect(result).toBe(0) // Should fallback to 0
    })

    it('should validate and correct invalid background mode index', () => {
      const result = historyManager._validateBackgroundModeIndex(999)
      expect(result).toBe(0) // Should fallback to 0
    })

    it('should validate and correct invalid active image index', () => {
      const result = historyManager._validateActiveImageIndex(999)
      expect(result).toBe(0) // Should fallback to 0
    })

    it('should validate and correct invalid image index', () => {
      const result = historyManager._validateImageIndex(999)
      expect(result).toBe(0) // Should fallback to 0
    })

    it('should validate and correct invalid scale value', () => {
      expect(historyManager._validateScale('invalid')).toBe(1.0)
      expect(historyManager._validateScale(-1)).toBe(1.0)
      expect(historyManager._validateScale(10)).toBe(1.0)
      expect(historyManager._validateScale(1.5)).toBe(1.5) // Valid
    })
  })

  describe('Error Logging', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error')
      const context = { test: 'data' }

      historyManager._logError('testOperation', error, context)

      const errorLog = historyManager.getErrorLog()
      expect(errorLog.length).toBe(1)
      expect(errorLog[0].context).toBe('testOperation')
      expect(errorLog[0].message).toBe('Test error')
      expect(errorLog[0].data).toEqual(context)
    })

    it('should maintain error counts by category', () => {
      historyManager._logError('saveToStorage', new Error('Storage error'))
      historyManager._logError('loadImage', new Error('Image error'))
      historyManager._logError('navigateTo', new Error('Navigation error'))

      const stats = historyManager.getErrorStats()
      expect(stats.errorCounts.storage).toBe(1)
      expect(stats.errorCounts.imageLoad).toBe(1)
      expect(stats.errorCounts.navigation).toBe(1)
    })

    it('should limit error log size', () => {
      // Add more than maxErrorLogSize errors
      for (let i = 0; i < 150; i++) {
        historyManager._logError('test', new Error(`Error ${i}`))
      }

      const errorLog = historyManager.getErrorLog()
      expect(errorLog.length).toBeLessThanOrEqual(historyManager.maxErrorLogSize)
    })

    it('should export error log as JSON', () => {
      historyManager._logError('test', new Error('Test error'))

      const exported = historyManager.exportErrorLog()
      const parsed = JSON.parse(exported)

      expect(parsed.errors).toBeDefined()
      expect(parsed.errorStats).toBeDefined()
      expect(parsed.historySize).toBeDefined()
    })
  })

  describe('Health Check', () => {
    it('should report healthy status when no issues', () => {
      const health = historyManager.healthCheck()

      expect(health.healthy).toBe(true)
      expect(health.issues.length).toBe(0)
    })

    it('should detect localStorage unavailability', () => {
      const originalLocalStorage = global.localStorage
      delete global.localStorage

      const health = historyManager.healthCheck()

      expect(health.healthy).toBe(false)
      expect(health.issues.some(issue => issue.includes('localStorage'))).toBe(true)

      global.localStorage = originalLocalStorage
    })

    it('should detect invalid current position', () => {
      // Add an entry to ensure we have nodes
      historyManager.captureCurrentState('manual')
      historyManager.currentId = 'invalid-id' // Set invalid ID directly

      const health = historyManager.healthCheck()

      expect(health.healthy).toBe(false)
      expect(health.issues.some(issue => issue.includes('pointer is invalid'))).toBe(true)
    })

    it('should warn about high error counts', () => {
      // Generate many errors
      for (let i = 0; i < 60; i++) {
        historyManager._logError('test', new Error(`Error ${i}`))
      }

      const health = historyManager.healthCheck()

      expect(health.warnings.some(warning => warning.includes('error count'))).toBe(true)
    })
  })
})
