/**
 * Property-Based Tests for ThumbnailGenerator
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid executions of the thumbnail generation system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { ThumbnailGenerator } from './ThumbnailGenerator.js'

/**
 * **Feature: duo-chrome-history-filmstrip, Property 6: Thumbnail generation determinism**
 *
 * Property: For any history entry, the thumbnail generation system should cache
 * results consistently, returning the same cached thumbnail for the same entry ID.
 *
 * Note: Full determinism of p5.js rendering is difficult to test with mocks.
 * This property tests the caching behavior which is the key mechanism for
 * ensuring consistent thumbnails in practice.
 *
 * **Validates: Requirements 2.2**
 */
describe('Property 6: Thumbnail caching consistency', () => {
  let mockP5
  let mockImage
  let globalRenderingOperations

  beforeEach(() => {
    // Mock image object
    mockImage = {
      width: 800,
      height: 600
    }

    // Mock p5 instance with deterministic behavior
    // Global counter to ensure each graphics object gets a unique but deterministic ID
    let graphicsCounter = 0
    
    mockP5 = {
      createGraphics: function (width, height) {
        // Each graphics object gets a unique ID for deterministic toDataURL
        const graphicsId = graphicsCounter++

        const mockGraphics = {
          width,
          height,
          background: vi.fn(),
          blendMode: vi.fn(),
          imageMode: vi.fn(),
          image: vi.fn(),
          remove: vi.fn(),
          canvas: {
            // Generate deterministic base64 based on graphics ID
            // This ensures the same entry always generates the same thumbnail
            toDataURL: vi.fn(() => {
              return `data:image/png;base64,thumbnail${graphicsId}`
            })
          },
          drawingContext: {
            globalCompositeOperation: ''
          }
        }

        return mockGraphics
      },
      loadImage: vi.fn((path, successCallback, errorCallback) => {
        // Simulate successful image load with deterministic data
        const mockImg = {
          width: 800,
          height: 600,
          path // Store path for deterministic behavior
        }
        setTimeout(() => successCallback(mockImg), 0)
      }),
      color: vi.fn((colorValue) => colorValue),
      CENTER: 'CENTER',
      ADD: 'ADD',
      MULTIPLY: 'MULTIPLY',
      SCREEN: 'SCREEN',
      OVERLAY: 'OVERLAY',
      DARKEN: 'DARKEN',
      LIGHTEN: 'LIGHTEN'
    }
  })

  it('should cache thumbnails and return the same result for the same entry', () => {
    fc.assert(
      fc.property(
        // Generate random history entries
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 20 }),
          imageA: fc.record({
            filename: fc.string({ minLength: 1, maxLength: 30 })
              .filter(s => s.trim().length > 0)
              .map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
            colorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
            scale: fc.float({ min: Math.fround(0.05), max: Math.fround(5.0), noNaN: true })
          }),
          imageB: fc.record({
            filename: fc.string({ minLength: 1, maxLength: 30 })
              .filter(s => s.trim().length > 0)
              .map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
            colorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
            scale: fc.float({ min: Math.fround(0.05), max: Math.fround(5.0), noNaN: true })
          }),
          paletteIndex: fc.integer({ min: 0, max: 3 }),
          blendModeIndex: fc.integer({ min: 0, max: 6 }),
          backgroundModeIndex: fc.integer({ min: 0, max: 2 })
        }),
        async (entry) => {
          // Create render context
          const mockRenderContext = {
            imgs: [entry.imageA.filename, entry.imageB.filename],
            ALL_PALETTES: [
              [
                { name: 'Red', color: '#FF0000' },
                { name: 'Blue', color: '#0000FF' },
                { name: 'Green', color: '#00FF00' },
                { name: 'Yellow', color: '#FFFF00' },
                { name: 'Black', color: '#000000' },
                { name: 'White', color: '#FFFFFF' }
              ],
              [
                { name: 'Red', color: '#FF0000' },
                { name: 'Blue', color: '#0000FF' },
                { name: 'Green', color: '#00FF00' },
                { name: 'Yellow', color: '#FFFF00' },
                { name: 'Black', color: '#000000' },
                { name: 'White', color: '#FFFFFF' }
              ],
              [
                { name: 'Red', color: '#FF0000' },
                { name: 'Blue', color: '#0000FF' },
                { name: 'Green', color: '#00FF00' },
                { name: 'Yellow', color: '#FFFF00' },
                { name: 'Black', color: '#000000' },
                { name: 'White', color: '#FFFFFF' }
              ],
              [
                { name: 'Red', color: '#FF0000' },
                { name: 'Blue', color: '#0000FF' },
                { name: 'Green', color: '#00FF00' },
                { name: 'Yellow', color: '#FFFF00' },
                { name: 'Black', color: '#000000' },
                { name: 'White', color: '#FFFFFF' }
              ]
            ],
            COLOR_MAPS: [
              new Map([
                ['Red', { name: 'Red', color: '#FF0000' }],
                ['Blue', { name: 'Blue', color: '#0000FF' }],
                ['Green', { name: 'Green', color: '#00FF00' }],
                ['Yellow', { name: 'Yellow', color: '#FFFF00' }],
                ['Black', { name: 'Black', color: '#000000' }],
                ['White', { name: 'White', color: '#FFFFFF' }]
              ]),
              new Map([
                ['Red', { name: 'Red', color: '#FF0000' }],
                ['Blue', { name: 'Blue', color: '#0000FF' }],
                ['Green', { name: 'Green', color: '#00FF00' }],
                ['Yellow', { name: 'Yellow', color: '#FFFF00' }],
                ['Black', { name: 'Black', color: '#000000' }],
                ['White', { name: 'White', color: '#FFFFFF' }]
              ]),
              new Map([
                ['Red', { name: 'Red', color: '#FF0000' }],
                ['Blue', { name: 'Blue', color: '#0000FF' }],
                ['Green', { name: 'Green', color: '#00FF00' }],
                ['Yellow', { name: 'Yellow', color: '#FFFF00' }],
                ['Black', { name: 'Black', color: '#000000' }],
                ['White', { name: 'White', color: '#FFFFFF' }]
              ]),
              new Map([
                ['Red', { name: 'Red', color: '#FF0000' }],
                ['Blue', { name: 'Blue', color: '#0000FF' }],
                ['Green', { name: 'Green', color: '#00FF00' }],
                ['Yellow', { name: 'Yellow', color: '#FFFF00' }],
                ['Black', { name: 'Black', color: '#000000' }],
                ['White', { name: 'White', color: '#FFFFFF' }]
              ])
            ],
            backgroundModes: [
              { color: [0, 0, 0], blendModes: ['ADD', 'MULTIPLY', 'SCREEN', 'OVERLAY', 'DARKEN', 'LIGHTEN', 'ADD'] },
              { color: [255, 255, 255], blendModes: ['ADD', 'MULTIPLY', 'SCREEN', 'OVERLAY', 'DARKEN', 'LIGHTEN', 'ADD'] },
              { color: [128, 128, 128], blendModes: ['ADD', 'MULTIPLY', 'SCREEN', 'OVERLAY', 'DARKEN', 'LIGHTEN', 'ADD'] }
            ]
          }

          // Create thumbnail generator
          const thumbnailGenerator = new ThumbnailGenerator(mockP5, 120)

          // Verify cache is initially empty
          expect(thumbnailGenerator.cache.has(entry.id)).toBe(false)

          // Generate thumbnail first time (should generate and cache)
          const thumbnail1 = await thumbnailGenerator.generateThumbnail(entry, mockRenderContext)

          // Verify thumbnail was cached
          expect(thumbnailGenerator.cache.has(entry.id)).toBe(true)

          // Generate thumbnail second time (should use cache, not regenerate)
          const thumbnail2 = await thumbnailGenerator.generateThumbnail(entry, mockRenderContext)

          // Verify both thumbnails are the same (from cache)
          // The cache returns the same string value
          expect(thumbnail1).toBe(thumbnail2)

          // Verify thumbnail is valid
          expect(thumbnail1).toBeDefined()
          expect(thumbnail1).toMatch(/^data:image\/png;base64,/)

          // Clear cache
          thumbnailGenerator.clearCache()

          // Verify cache is now empty
          expect(thumbnailGenerator.cache.has(entry.id)).toBe(false)

          // Generate again after cache clear (should regenerate)
          const thumbnail3 = await thumbnailGenerator.generateThumbnail(entry, mockRenderContext)

          // Verify it was cached again
          expect(thumbnailGenerator.cache.has(entry.id)).toBe(true)

          // Verify thumbnail is valid
          expect(thumbnail3).toBeDefined()
          expect(thumbnail3).toMatch(/^data:image\/png;base64,/)
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })

  it('should maintain separate caches across different generator instances', () => {
    fc.assert(
      fc.property(
        // Generate random history entries
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 20 }),
          imageA: fc.record({
            filename: fc.string({ minLength: 1, maxLength: 30 })
              .filter(s => s.trim().length > 0)
              .map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
            colorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
            scale: fc.float({ min: Math.fround(0.05), max: Math.fround(5.0), noNaN: true })
          }),
          imageB: fc.record({
            filename: fc.string({ minLength: 1, maxLength: 30 })
              .filter(s => s.trim().length > 0)
              .map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
            colorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
            scale: fc.float({ min: Math.fround(0.05), max: Math.fround(5.0), noNaN: true })
          }),
          paletteIndex: fc.integer({ min: 0, max: 3 }),
          blendModeIndex: fc.integer({ min: 0, max: 6 }),
          backgroundModeIndex: fc.integer({ min: 0, max: 2 })
        }),
        async (entry) => {
          // Create render context
          const mockRenderContext = {
            imgs: [entry.imageA.filename, entry.imageB.filename],
            ALL_PALETTES: [
              [
                { name: 'Red', color: '#FF0000' },
                { name: 'Blue', color: '#0000FF' },
                { name: 'Green', color: '#00FF00' },
                { name: 'Yellow', color: '#FFFF00' },
                { name: 'Black', color: '#000000' },
                { name: 'White', color: '#FFFFFF' }
              ],
              [
                { name: 'Red', color: '#FF0000' },
                { name: 'Blue', color: '#0000FF' },
                { name: 'Green', color: '#00FF00' },
                { name: 'Yellow', color: '#FFFF00' },
                { name: 'Black', color: '#000000' },
                { name: 'White', color: '#FFFFFF' }
              ],
              [
                { name: 'Red', color: '#FF0000' },
                { name: 'Blue', color: '#0000FF' },
                { name: 'Green', color: '#00FF00' },
                { name: 'Yellow', color: '#FFFF00' },
                { name: 'Black', color: '#000000' },
                { name: 'White', color: '#FFFFFF' }
              ],
              [
                { name: 'Red', color: '#FF0000' },
                { name: 'Blue', color: '#0000FF' },
                { name: 'Green', color: '#00FF00' },
                { name: 'Yellow', color: '#FFFF00' },
                { name: 'Black', color: '#000000' },
                { name: 'White', color: '#FFFFFF' }
              ]
            ],
            COLOR_MAPS: [
              new Map([
                ['Red', { name: 'Red', color: '#FF0000' }],
                ['Blue', { name: 'Blue', color: '#0000FF' }],
                ['Green', { name: 'Green', color: '#00FF00' }],
                ['Yellow', { name: 'Yellow', color: '#FFFF00' }],
                ['Black', { name: 'Black', color: '#000000' }],
                ['White', { name: 'White', color: '#FFFFFF' }]
              ]),
              new Map([
                ['Red', { name: 'Red', color: '#FF0000' }],
                ['Blue', { name: 'Blue', color: '#0000FF' }],
                ['Green', { name: 'Green', color: '#00FF00' }],
                ['Yellow', { name: 'Yellow', color: '#FFFF00' }],
                ['Black', { name: 'Black', color: '#000000' }],
                ['White', { name: 'White', color: '#FFFFFF' }]
              ]),
              new Map([
                ['Red', { name: 'Red', color: '#FF0000' }],
                ['Blue', { name: 'Blue', color: '#0000FF' }],
                ['Green', { name: 'Green', color: '#00FF00' }],
                ['Yellow', { name: 'Yellow', color: '#FFFF00' }],
                ['Black', { name: 'Black', color: '#000000' }],
                ['White', { name: 'White', color: '#FFFFFF' }]
              ]),
              new Map([
                ['Red', { name: 'Red', color: '#FF0000' }],
                ['Blue', { name: 'Blue', color: '#0000FF' }],
                ['Green', { name: 'Green', color: '#00FF00' }],
                ['Yellow', { name: 'Yellow', color: '#FFFF00' }],
                ['Black', { name: 'Black', color: '#000000' }],
                ['White', { name: 'White', color: '#FFFFFF' }]
              ])
            ],
            backgroundModes: [
              { color: [0, 0, 0], blendModes: ['ADD', 'MULTIPLY', 'SCREEN', 'OVERLAY', 'DARKEN', 'LIGHTEN', 'ADD'] },
              { color: [255, 255, 255], blendModes: ['ADD', 'MULTIPLY', 'SCREEN', 'OVERLAY', 'DARKEN', 'LIGHTEN', 'ADD'] },
              { color: [128, 128, 128], blendModes: ['ADD', 'MULTIPLY', 'SCREEN', 'OVERLAY', 'DARKEN', 'LIGHTEN', 'ADD'] }
            ]
          }

          // Create first thumbnail generator instance
          const generator1 = new ThumbnailGenerator(mockP5, 120)
          const thumbnail1 = await generator1.generateThumbnail(entry, mockRenderContext)

          // Verify first generator has it cached
          expect(generator1.cache.has(entry.id)).toBe(true)

          // Create second thumbnail generator instance (fresh instance with separate cache)
          const generator2 = new ThumbnailGenerator(mockP5, 120)

          // Verify second generator does NOT have it cached (separate cache)
          expect(generator2.cache.has(entry.id)).toBe(false)

          // Generate with second generator
          const thumbnail2 = await generator2.generateThumbnail(entry, mockRenderContext)

          // Verify second generator now has it cached
          expect(generator2.cache.has(entry.id)).toBe(true)

          // Verify both generators maintain independent caches
          expect(generator1.cache.has(entry.id)).toBe(true)
          expect(generator2.cache.has(entry.id)).toBe(true)

          // Clear first generator's cache
          generator1.clearCache()

          // Verify only first generator's cache was cleared
          expect(generator1.cache.has(entry.id)).toBe(false)
          expect(generator2.cache.has(entry.id)).toBe(true)

          // Verify thumbnails are valid
          expect(thumbnail1).toBeDefined()
          expect(thumbnail2).toBeDefined()
          expect(thumbnail1).toMatch(/^data:image\/png;base64,/)
          expect(thumbnail2).toMatch(/^data:image\/png;base64,/)
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })
})
