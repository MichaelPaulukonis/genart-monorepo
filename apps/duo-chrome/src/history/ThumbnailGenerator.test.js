/**
 * ThumbnailGenerator Tests
 *
 * Tests for thumbnail generation system including:
 * - Basic thumbnail generation
 * - LRU cache behavior
 * - Error handling
 * - Batch generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ThumbnailGenerator } from './ThumbnailGenerator.js'

describe('ThumbnailGenerator', () => {
  let mockP5
  let mockGraphics
  let thumbnailGenerator

  beforeEach(() => {
    // Mock p5.Graphics
    mockGraphics = {
      background: vi.fn(),
      blendMode: vi.fn(),
      imageMode: vi.fn(),
      image: vi.fn(),
      remove: vi.fn(),
      canvas: {
        toDataURL: vi.fn(() => 'data:image/png;base64,mockBase64Data')
      },
      drawingContext: {
        globalCompositeOperation: ''
      }
    }

    // Mock p5 instance
    mockP5 = {
      createGraphics: vi.fn(() => mockGraphics),
      loadImage: vi.fn((path, success) => {
        // Simulate successful image load
        const mockImage = {
          width: 800,
          height: 600
        }
        setTimeout(() => success(mockImage), 0)
      }),
      color: vi.fn((colorValue) => colorValue),
      CENTER: 'CENTER',
      ADD: 'ADD',
      MULTIPLY: 'MULTIPLY'
    }

    thumbnailGenerator = new ThumbnailGenerator(mockP5, 120)
  })

  describe('Basic Functionality', () => {
    it('should initialize with correct thumbnail size', () => {
      expect(thumbnailGenerator.thumbnailSize).toBe(120)
      expect(thumbnailGenerator.cache).toBeDefined()
    })

    it('should generate thumbnail for valid entry', async () => {
      const mockEntry = {
        id: 'test-entry-1',
        imageA: {
          filename: 'image1.jpg',
          colorName: 'Red',
          scale: 1.0
        },
        imageB: {
          filename: 'image2.jpg',
          colorName: 'Blue',
          scale: 1.0
        },
        paletteIndex: 0,
        blendModeIndex: 0,
        backgroundModeIndex: 0
      }

      const mockRenderContext = {
        imgs: ['image1.jpg', 'image2.jpg'],
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }, { name: 'Blue', color: '#0000FF' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }], ['Blue', { name: 'Blue', color: '#0000FF' }]])],
        backgroundModes: [
          { color: [0, 0, 0], blendModes: ['ADD'] },
          { color: [255, 255, 255], blendModes: ['MULTIPLY'] }
        ]
      }

      const thumbnail = await thumbnailGenerator.generateThumbnail(mockEntry, mockRenderContext)

      expect(thumbnail).toBe('data:image/png;base64,mockBase64Data')
      expect(mockP5.createGraphics).toHaveBeenCalled()
      expect(mockGraphics.background).toHaveBeenCalled()
    })

    it('should handle missing images gracefully', async () => {
      const mockEntry = {
        id: 'test-entry-2',
        imageA: {
          filename: 'nonexistent.jpg',
          colorName: 'Red',
          scale: 1.0
        },
        imageB: {
          filename: 'image2.jpg',
          colorName: 'Blue',
          scale: 1.0
        },
        paletteIndex: 0,
        blendModeIndex: 0,
        backgroundModeIndex: 0
      }

      const mockRenderContext = {
        imgs: ['image2.jpg'], // Missing image1.jpg
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }, { name: 'Blue', color: '#0000FF' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }], ['Blue', { name: 'Blue', color: '#0000FF' }]])],
        backgroundModes: [
          { color: [0, 0, 0], blendModes: ['ADD'] }
        ]
      }

      const thumbnail = await thumbnailGenerator.generateThumbnail(mockEntry, mockRenderContext)

      // Should return placeholder thumbnail
      expect(thumbnail).toBeDefined()
      expect(thumbnailGenerator.errorCount).toBeGreaterThan(0)
    })
  })

  describe('LRU Cache', () => {
    it('should cache generated thumbnails', async () => {
      const mockEntry = {
        id: 'test-entry-3',
        imageA: { filename: 'image1.jpg', colorName: 'Red', scale: 1.0 },
        imageB: { filename: 'image2.jpg', colorName: 'Blue', scale: 1.0 },
        paletteIndex: 0,
        blendModeIndex: 0,
        backgroundModeIndex: 0
      }

      const mockRenderContext = {
        imgs: ['image1.jpg', 'image2.jpg'],
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }, { name: 'Blue', color: '#0000FF' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }], ['Blue', { name: 'Blue', color: '#0000FF' }]])],
        backgroundModes: [{ color: [0, 0, 0], blendModes: ['ADD'] }]
      }

      // First generation
      await thumbnailGenerator.generateThumbnail(mockEntry, mockRenderContext)
      const createGraphicsCallCount = mockP5.createGraphics.mock.calls.length

      // Second generation should use cache
      await thumbnailGenerator.generateThumbnail(mockEntry, mockRenderContext)

      // Should not create new graphics (using cached version)
      expect(mockP5.createGraphics.mock.calls.length).toBe(createGraphicsCallCount)
    })

    it('should evict least recently used entries when cache is full', async () => {
      // Create generator with small cache size
      const smallCacheGenerator = new ThumbnailGenerator(mockP5, 120)
      smallCacheGenerator.cache.maxSize = 2 // Only allow 2 entries

      const mockRenderContext = {
        imgs: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }]])],
        backgroundModes: [{ color: [0, 0, 0], blendModes: ['ADD'] }]
      }

      // Generate 3 thumbnails (should evict first one)
      await smallCacheGenerator.generateThumbnail(
        { id: 'entry-1', imageA: { filename: 'image1.jpg', colorName: 'Red', scale: 1.0 }, imageB: { filename: 'image2.jpg', colorName: 'Red', scale: 1.0 }, paletteIndex: 0, blendModeIndex: 0, backgroundModeIndex: 0 },
        mockRenderContext
      )
      await smallCacheGenerator.generateThumbnail(
        { id: 'entry-2', imageA: { filename: 'image2.jpg', colorName: 'Red', scale: 1.0 }, imageB: { filename: 'image3.jpg', colorName: 'Red', scale: 1.0 }, paletteIndex: 0, blendModeIndex: 0, backgroundModeIndex: 0 },
        mockRenderContext
      )
      await smallCacheGenerator.generateThumbnail(
        { id: 'entry-3', imageA: { filename: 'image3.jpg', colorName: 'Red', scale: 1.0 }, imageB: { filename: 'image1.jpg', colorName: 'Red', scale: 1.0 }, paletteIndex: 0, blendModeIndex: 0, backgroundModeIndex: 0 },
        mockRenderContext
      )

      const stats = smallCacheGenerator.getCacheStats()
      expect(stats.entries).toBe(2) // Should only have 2 entries
      expect(smallCacheGenerator.cache.has('entry-1')).toBe(false) // First entry should be evicted
      expect(smallCacheGenerator.cache.has('entry-2')).toBe(true)
      expect(smallCacheGenerator.cache.has('entry-3')).toBe(true)
    })

    it('should clear cache when requested', async () => {
      const mockEntry = {
        id: 'test-entry-4',
        imageA: { filename: 'image1.jpg', colorName: 'Red', scale: 1.0 },
        imageB: { filename: 'image2.jpg', colorName: 'Blue', scale: 1.0 },
        paletteIndex: 0,
        blendModeIndex: 0,
        backgroundModeIndex: 0
      }

      const mockRenderContext = {
        imgs: ['image1.jpg', 'image2.jpg'],
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }, { name: 'Blue', color: '#0000FF' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }], ['Blue', { name: 'Blue', color: '#0000FF' }]])],
        backgroundModes: [{ color: [0, 0, 0], blendModes: ['ADD'] }]
      }

      await thumbnailGenerator.generateThumbnail(mockEntry, mockRenderContext)
      expect(thumbnailGenerator.cache.has('test-entry-4')).toBe(true)

      thumbnailGenerator.clearCache()
      expect(thumbnailGenerator.cache.has('test-entry-4')).toBe(false)
    })
  })

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', () => {
      const stats = thumbnailGenerator.getCacheStats()

      expect(stats).toHaveProperty('entries')
      expect(stats).toHaveProperty('sizeBytes')
      expect(stats).toHaveProperty('sizeMB')
      expect(stats).toHaveProperty('maxEntries')
      expect(stats).toHaveProperty('maxSizeMB')
      expect(stats).toHaveProperty('errorCount')
    })
  })

  describe('Batch Generation', () => {
    it('should generate thumbnails for multiple entries', async () => {
      const mockEntries = [
        { id: 'batch-1', imageA: { filename: 'image1.jpg', colorName: 'Red', scale: 1.0 }, imageB: { filename: 'image2.jpg', colorName: 'Blue', scale: 1.0 }, paletteIndex: 0, blendModeIndex: 0, backgroundModeIndex: 0 },
        { id: 'batch-2', imageA: { filename: 'image2.jpg', colorName: 'Blue', scale: 1.0 }, imageB: { filename: 'image1.jpg', colorName: 'Red', scale: 1.0 }, paletteIndex: 0, blendModeIndex: 0, backgroundModeIndex: 0 }
      ]

      const mockRenderContext = {
        imgs: ['image1.jpg', 'image2.jpg'],
        ALL_PALETTES: [[{ name: 'Red', color: '#FF0000' }, { name: 'Blue', color: '#0000FF' }]],
        COLOR_MAPS: [new Map([['Red', { name: 'Red', color: '#FF0000' }], ['Blue', { name: 'Blue', color: '#0000FF' }]])],
        backgroundModes: [{ color: [0, 0, 0], blendModes: ['ADD'] }]
      }

      let progressCalls = 0
      const onProgress = (completed, total) => {
        progressCalls++
        expect(completed).toBeLessThanOrEqual(total)
      }

      await thumbnailGenerator.batchGenerate(mockEntries, mockRenderContext, onProgress)

      expect(progressCalls).toBeGreaterThan(0)
      expect(thumbnailGenerator.cache.has('batch-1')).toBe(true)
      expect(thumbnailGenerator.cache.has('batch-2')).toBe(true)
    })
  })
})
