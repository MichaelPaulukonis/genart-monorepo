/**
 * Performance Optimization Tests
 * 
 * Tests for performance features including:
 * - Debouncing
 * - Cache management
 * - Virtual scrolling
 * - Memory optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HistoryManager } from './HistoryManager.js'
import { ThumbnailGenerator } from './ThumbnailGenerator.js'

describe('Performance Optimizations', () => {
  describe('HistoryManager Performance', () => {
    let historyManager
    let mockP5
    let mockStateRefs

    beforeEach(() => {
      // Mock p5 instance
      mockP5 = {
        createGraphics: vi.fn(() => ({
          background: vi.fn(),
          image: vi.fn(),
          remove: vi.fn(),
          canvas: {
            toDataURL: vi.fn(() => 'data:image/png;base64,mock')
          }
        })),
        loadImage: vi.fn((path, success) => {
          setTimeout(() => success({ width: 100, height: 100 }), 0)
        }),
        color: vi.fn((c) => c),
        width: 800,
        height: 600
      }

      // Mock state refs
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
        imgs: ['test1.jpg', 'test2.jpg'],
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }, { name: 'Blue', color: '#0000FF' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }], ['Blue', { name: 'Blue', color: '#0000FF' }]])],
        backgroundModes: [
          { color: [0, 0, 0], blendModes: ['ADD'] },
          { color: [255, 255, 255], blendModes: ['MULTIPLY'] }
        ]
      }

      historyManager = new HistoryManager(mockP5, mockStateRefs)
    })

    it('should provide performance statistics', () => {
      // Capture some entries
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('manual')

      const stats = historyManager.getPerformanceStats()

      expect(stats).toHaveProperty('historySize')
      expect(stats).toHaveProperty('currentPosition')
      expect(stats).toHaveProperty('maxEntries')
      expect(stats).toHaveProperty('memoryUsage')
      expect(stats).toHaveProperty('thumbnailCache')

      expect(stats.historySize).toBe(2)
      expect(stats.memoryUsage).toHaveProperty('estimatedKB')
    })

    it('should estimate memory usage correctly', () => {
      // Add multiple entries
      for (let i = 0; i < 10; i++) {
        historyManager.captureCurrentState('manual')
      }

      const stats = historyManager.getPerformanceStats()

      expect(stats.historySize).toBe(10)
      expect(parseFloat(stats.memoryUsage.estimatedKB)).toBeGreaterThan(0)
    })

    it('should optimize history when requested', () => {
      // Fill history with entries
      for (let i = 0; i < 100; i++) {
        historyManager.captureCurrentState('manual')
      }

      expect(historyManager.history.length).toBe(100)

      // Optimize to 50 entries
      const removed = historyManager.optimizeHistory(50)

      expect(removed).toBe(50)
      expect(historyManager.history.length).toBe(50)
    })

    it('should not optimize if already below target', () => {
      historyManager.captureCurrentState('manual')
      historyManager.captureCurrentState('manual')

      const removed = historyManager.optimizeHistory(50)

      expect(removed).toBe(0)
      expect(historyManager.history.length).toBe(2)
    })

    it('should profile operations correctly', async () => {
      const operation = vi.fn(() => Promise.resolve('result'))

      const result = await historyManager.profileOperation('test-op', operation)

      expect(result).toBe('result')
      expect(operation).toHaveBeenCalled()
    })

    it('should handle profiling errors', async () => {
      const operation = vi.fn(() => Promise.reject(new Error('test error')))

      await expect(
        historyManager.profileOperation('test-op', operation)
      ).rejects.toThrow('test error')
    })
  })

  describe('ThumbnailGenerator Cache Performance', () => {
    let thumbnailGenerator
    let mockP5

    beforeEach(() => {
      mockP5 = {
        createGraphics: vi.fn(() => ({
          background: vi.fn(),
          image: vi.fn(),
          imageMode: vi.fn(),
          remove: vi.fn(),
          canvas: {
            toDataURL: vi.fn(() => 'data:image/png;base64,mock')
          },
          drawingContext: {
            globalCompositeOperation: ''
          }
        })),
        loadImage: vi.fn((path, success) => {
          setTimeout(() => success({ width: 100, height: 100 }), 0)
        }),
        color: vi.fn((c) => c),
        CENTER: 'center',
        ADD: 'ADD'
      }

      const mockStateRefs = {
        imgs: ['test1.jpg', 'test2.jpg'],
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }]])],
        backgroundModes: [{ color: [0, 0, 0], blendModes: ['ADD'] }]
      }

      thumbnailGenerator = new ThumbnailGenerator(mockP5, mockStateRefs, 120)
    })

    it('should track cache statistics', () => {
      const stats = thumbnailGenerator.getCacheStats()

      expect(stats).toHaveProperty('entries')
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('evictions')
    })

    it('should calculate hit rate correctly', async () => {
      const entry = {
        id: 'test-1',
        imageA: { filename: 'test1.jpg', colorName: 'Red', scale: 1.0 },
        imageB: { filename: 'test2.jpg', colorName: 'Red', scale: 1.0 },
        paletteIndex: 0,
        blendModeIndex: 0,
        backgroundModeIndex: 0
      }

      const renderContext = {
        imgs: ['test1.jpg', 'test2.jpg'],
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }]])],
        backgroundModes: [{ color: [0, 0, 0], blendModes: ['ADD'] }]
      }

      // First call - miss
      await thumbnailGenerator.generateThumbnail(entry, renderContext)
      
      // Second call - hit
      await thumbnailGenerator.generateThumbnail(entry, renderContext)

      const stats = thumbnailGenerator.getCacheStats()
      
      expect(stats.hits).toBeGreaterThan(0)
      expect(stats.hitRate).not.toBe('0%')
    })

    it('should cleanup old cache entries', () => {
      // Manually add entries to cache
      const cache = thumbnailGenerator.cache
      
      cache.set('old-1', 'data:image/png;base64,old1')
      cache.set('old-2', 'data:image/png;base64,old2')

      expect(cache.cache.size).toBe(2)

      // Cleanup entries older than 0ms (all entries)
      const result = thumbnailGenerator.cleanupCache(0)

      expect(result.removedCount).toBe(2)
      expect(cache.cache.size).toBe(0)
    })

    it('should optimize cache to target size', () => {
      const cache = thumbnailGenerator.cache

      // Add many entries
      for (let i = 0; i < 20; i++) {
        cache.set(`entry-${i}`, `data:image/png;base64,entry${i}`)
      }

      expect(cache.cache.size).toBe(20)

      // Optimize to 10 entries
      const result = thumbnailGenerator.optimizeCache(10)

      expect(result.removedCount).toBe(10)
      expect(cache.cache.size).toBe(10)
    })

    it('should not optimize if already below target', () => {
      const cache = thumbnailGenerator.cache
      
      cache.set('entry-1', 'data:image/png;base64,entry1')
      cache.set('entry-2', 'data:image/png;base64,entry2')

      const result = thumbnailGenerator.optimizeCache(10)

      expect(result.removedCount).toBe(0)
      expect(cache.cache.size).toBe(2)
    })
  })

  describe('Cache LRU Eviction', () => {
    let thumbnailGenerator
    let mockP5

    beforeEach(() => {
      mockP5 = {
        createGraphics: vi.fn(() => ({
          background: vi.fn(),
          image: vi.fn(),
          imageMode: vi.fn(),
          remove: vi.fn(),
          canvas: {
            toDataURL: vi.fn(() => 'data:image/png;base64,mock')
          },
          drawingContext: {
            globalCompositeOperation: ''
          }
        })),
        color: vi.fn((c) => c),
        CENTER: 'center'
      }

      thumbnailGenerator = new ThumbnailGenerator(mockP5, null, 120)
      // Set small cache size for testing
      thumbnailGenerator.cache.maxSize = 5
    })

    it('should evict least recently used entries when cache is full', () => {
      const cache = thumbnailGenerator.cache

      // Fill cache to max
      for (let i = 0; i < 5; i++) {
        cache.set(`entry-${i}`, `data:image/png;base64,entry${i}`)
      }

      expect(cache.cache.size).toBe(5)
      expect(cache.evictions).toBe(0)

      // Add one more - should evict oldest
      cache.set('entry-5', 'data:image/png;base64,entry5')

      expect(cache.cache.size).toBe(5)
      expect(cache.evictions).toBe(1)
      expect(cache.has('entry-0')).toBe(false) // Oldest should be evicted
      expect(cache.has('entry-5')).toBe(true) // Newest should be present
    })

    it('should move accessed entries to end (most recent)', () => {
      const cache = thumbnailGenerator.cache

      cache.set('entry-1', 'data:image/png;base64,entry1')
      cache.set('entry-2', 'data:image/png;base64,entry2')
      cache.set('entry-3', 'data:image/png;base64,entry3')

      // Access entry-1 to make it most recent
      cache.get('entry-1')

      // Fill cache
      cache.set('entry-4', 'data:image/png;base64,entry4')
      cache.set('entry-5', 'data:image/png;base64,entry5')

      // Add one more - should evict entry-2 (now oldest)
      cache.set('entry-6', 'data:image/png;base64,entry6')

      expect(cache.has('entry-1')).toBe(true) // Accessed, should still be there
      expect(cache.has('entry-2')).toBe(false) // Should be evicted
    })
  })
})
