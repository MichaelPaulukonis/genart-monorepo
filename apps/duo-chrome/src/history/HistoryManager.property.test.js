/**
 * Property-Based Tests for HistoryManager
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid executions of the history system.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { HistoryManager } from './HistoryManager.js'
import { validateHistoryEntry } from './HistoryEntry.js'

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

/**
 * **Feature: duo-chrome-history-filmstrip, Property 1: History capture completeness**
 *
 * Property: For any composition state change, capturing the state should produce
 * a history entry that contains all parameters necessary to recreate that exact composition.
 *
 * **Validates: Requirements 1.2**
 */
describe('Property 1: History capture completeness', () => {
  it('should capture all necessary parameters for any composition state', () => {
    fc.assert(
      fc.property(
        // Generate random composition states
        fc.record({
          // Image A parameters
          imageAIndex: fc.integer({ min: 0, max: 99 }),
          imageAFilename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
          imageAColorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
          imageAScale: fc.float({ min: Math.fround(0.051), max: Math.fround(5.0), noNaN: true }),

          // Image B parameters
          imageBIndex: fc.integer({ min: 0, max: 99 }),
          imageBFilename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
          imageBColorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
          imageBScale: fc.float({ min: Math.fround(0.051), max: Math.fround(5.0), noNaN: true }),

          // Visual settings
          paletteIndex: fc.integer({ min: 0, max: 3 }),
          blendModeIndex: fc.integer({ min: 0, max: 5 }),
          backgroundModeIndex: fc.integer({ min: 0, max: 5 }),
          activeImageIndex: fc.constantFrom(0, 1),

          // Source type
          source: fc.constantFrom('manual', 'random', 'url', 'modified')
        }),
        (compositionState) => {
          // Create mock p5 instance
          const mockP5 = {}

          // Create mock state references that match the composition state
          const mockStateRefs = {
            imageColorPairs: [
              {
                img: compositionState.imageAFilename,
                color: { name: compositionState.imageAColorName },
                scale: compositionState.imageAScale
              },
              {
                img: compositionState.imageBFilename,
                color: { name: compositionState.imageBColorName },
                scale: compositionState.imageBScale
              }
            ],
            controlState: {
              imageIndices: [compositionState.imageAIndex, compositionState.imageBIndex],
              activeImageIndex: compositionState.activeImageIndex,
              manualSizeControl: [false, false]
            },
            colorIndex: compositionState.paletteIndex,
            currentBlendModeIndex: compositionState.blendModeIndex,
            currentBackgroundModeIndex: compositionState.backgroundModeIndex,
            imgs: [],
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
            ]
          }

          // Create history manager
          const historyManager = new HistoryManager(mockP5, mockStateRefs)

          // Capture the current state
          const entry = historyManager.captureCurrentState(compositionState.source)

          // Verify entry was created
          expect(entry).not.toBeNull()

          // Verify entry is valid according to our validation function
          expect(validateHistoryEntry(entry)).toBe(true)

          // Verify all required fields are present
          expect(entry).toHaveProperty('id')
          expect(entry).toHaveProperty('timestamp')
          expect(entry).toHaveProperty('imageA')
          expect(entry).toHaveProperty('imageB')
          expect(entry).toHaveProperty('paletteIndex')
          expect(entry).toHaveProperty('blendModeIndex')
          expect(entry).toHaveProperty('backgroundModeIndex')
          expect(entry).toHaveProperty('activeImageIndex')
          expect(entry).toHaveProperty('source')

          // Verify Image A parameters are captured correctly
          expect(entry.imageA).toHaveProperty('index')
          expect(entry.imageA).toHaveProperty('filename')
          expect(entry.imageA).toHaveProperty('colorName')
          expect(entry.imageA).toHaveProperty('scale')
          expect(entry.imageA.index).toBe(compositionState.imageAIndex)
          expect(entry.imageA.filename).toBe(compositionState.imageAFilename)
          expect(entry.imageA.colorName).toBe(compositionState.imageAColorName)
          expect(entry.imageA.scale).toBeCloseTo(compositionState.imageAScale, 5)

          // Verify Image B parameters are captured correctly
          expect(entry.imageB).toHaveProperty('index')
          expect(entry.imageB).toHaveProperty('filename')
          expect(entry.imageB).toHaveProperty('colorName')
          expect(entry.imageB).toHaveProperty('scale')
          expect(entry.imageB.index).toBe(compositionState.imageBIndex)
          expect(entry.imageB.filename).toBe(compositionState.imageBFilename)
          expect(entry.imageB.colorName).toBe(compositionState.imageBColorName)
          expect(entry.imageB.scale).toBeCloseTo(compositionState.imageBScale, 5)

          // Verify visual settings are captured correctly
          expect(entry.paletteIndex).toBe(compositionState.paletteIndex)
          expect(entry.blendModeIndex).toBe(compositionState.blendModeIndex)
          expect(entry.backgroundModeIndex).toBe(compositionState.backgroundModeIndex)
          expect(entry.activeImageIndex).toBe(compositionState.activeImageIndex)

          // Verify source is captured correctly
          expect(entry.source).toBe(compositionState.source)

          // Verify timestamp is reasonable (within last second)
          const now = Date.now()
          expect(entry.timestamp).toBeGreaterThan(now - 1000)
          expect(entry.timestamp).toBeLessThanOrEqual(now)

          // Verify ID is unique and properly formatted
          expect(entry.id).toMatch(/^\d+-[a-z0-9]+$/)
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })
})

/**
 * **Feature: duo-chrome-history-filmstrip, Property 2: Navigation preserves state**
 *
 * Property: For any history entry, navigating to that entry and then capturing
 * the current state should produce an entry with identical parameters
 * (excluding timestamp and source).
 *
 * **Validates: Requirements 3.5**
 */
describe('Property 2: Navigation preserves state', () => {
  it('should preserve all composition parameters when navigating to a history entry', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a random history stack with multiple entries
        fc.array(
          fc.record({
            imageAIndex: fc.integer({ min: 0, max: 99 }),
            imageAFilename: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0).map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
            imageAColorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
            imageAScale: fc.float({ min: Math.fround(0.051), max: Math.fround(5.0), noNaN: true }),
            imageBIndex: fc.integer({ min: 0, max: 99 }),
            imageBFilename: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0).map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
            imageBColorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
            imageBScale: fc.float({ min: Math.fround(0.051), max: Math.fround(5.0), noNaN: true }),
            paletteIndex: fc.integer({ min: 0, max: 3 }),
            blendModeIndex: fc.integer({ min: 0, max: 5 }),
            backgroundModeIndex: fc.integer({ min: 0, max: 1 }),
            activeImageIndex: fc.constantFrom(0, 1),
            source: fc.constantFrom('manual', 'random', 'url')
          }),
          { minLength: 1, maxLength: 20 }
        ),
        // Generate a random position to navigate to
        fc.integer({ min: 0, max: 19 }),
        async (historyEntries, targetPositionRaw) => {
          // Clamp target position to valid range
          const targetPosition = Math.min(targetPositionRaw, historyEntries.length - 1)

          // Create mock p5 instance with necessary methods
          const mockP5 = {
            loadImage: (path, successCallback) => {
              // Simulate successful image loading
              const mockImg = { width: 100, height: 100 }
              // Call success callback asynchronously to simulate real behavior
              setTimeout(() => successCallback(mockImg), 0)
            },
            createGraphics: (width, height) => ({
              width,
              height,
              background: () => {},
              image: () => {},
              drawingContext: { globalCompositeOperation: '' }
            }),
            color: (colorValue) => colorValue,
            width: 1000,
            height: 1000
          }

          // Create mock state references with proper color maps
          const mockStateRefs = {
            imageColorPairs: [
              { img: 'initial1.jpg', color: { name: 'Red', color: '#FF0000' }, scale: 1.0, layer: null },
              { img: 'initial2.jpg', color: { name: 'Blue', color: '#0000FF' }, scale: 1.0, layer: null }
            ],
            controlState: {
              imageIndices: [0, 1],
              activeImageIndex: 0,
              manualSizeControl: [false, false]
            },
            colorIndex: 0,
            currentBlendModeIndex: 0,
            currentBackgroundModeIndex: 0,
            imgs: Array(100).fill('test.jpg'),
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
            requestScreenUpdate: () => {},
            updateStatusDisplay: () => {}
          }

          // Clear any existing storage to start fresh
          localStorage.clear()

          // Create history manager
          const historyManager = new HistoryManager(mockP5, mockStateRefs)

          // Build history stack by capturing each generated entry
          for (const entryData of historyEntries) {
            // Update mock state to match the entry data
            mockStateRefs.imageColorPairs[0].img = entryData.imageAFilename
            mockStateRefs.imageColorPairs[0].color = { name: entryData.imageAColorName, color: '#000000' }
            mockStateRefs.imageColorPairs[0].scale = entryData.imageAScale
            mockStateRefs.imageColorPairs[1].img = entryData.imageBFilename
            mockStateRefs.imageColorPairs[1].color = { name: entryData.imageBColorName, color: '#000000' }
            mockStateRefs.imageColorPairs[1].scale = entryData.imageBScale
            mockStateRefs.controlState.imageIndices = [entryData.imageAIndex, entryData.imageBIndex]
            mockStateRefs.controlState.activeImageIndex = entryData.activeImageIndex
            mockStateRefs.colorIndex = entryData.paletteIndex
            mockStateRefs.currentBlendModeIndex = entryData.blendModeIndex
            mockStateRefs.currentBackgroundModeIndex = entryData.backgroundModeIndex

            // Capture the state
            historyManager.captureCurrentState(entryData.source)
          }

          // Get the original entry at the target position
          const originalEntry = historyManager.history[targetPosition]

          // Navigate to the target position
          const navigateSuccess = historyManager.navigateTo(targetPosition)
          expect(navigateSuccess).toBe(true)

          // Wait for async image loading to complete
          await new Promise(resolve => setTimeout(resolve, 10))

          // Verify state was restored correctly (before capturing)
          expect(mockStateRefs.imageColorPairs[0].img).toBe(originalEntry.imageA.filename)
          expect(mockStateRefs.imageColorPairs[0].scale).toBeCloseTo(originalEntry.imageA.scale, 5)
          expect(mockStateRefs.imageColorPairs[0].color.name).toBe(originalEntry.imageA.colorName)
          expect(mockStateRefs.imageColorPairs[1].img).toBe(originalEntry.imageB.filename)
          expect(mockStateRefs.imageColorPairs[1].scale).toBeCloseTo(originalEntry.imageB.scale, 5)
          expect(mockStateRefs.imageColorPairs[1].color.name).toBe(originalEntry.imageB.colorName)
          expect(mockStateRefs.colorIndex).toBe(originalEntry.paletteIndex)
          expect(mockStateRefs.currentBlendModeIndex).toBe(originalEntry.blendModeIndex)
          expect(mockStateRefs.currentBackgroundModeIndex).toBe(originalEntry.backgroundModeIndex)
          expect(mockStateRefs.controlState.activeImageIndex).toBe(originalEntry.activeImageIndex)
          expect(mockStateRefs.controlState.imageIndices[0]).toBe(originalEntry.imageA.index)
          expect(mockStateRefs.controlState.imageIndices[1]).toBe(originalEntry.imageB.index)

          // Now capture the current state (after navigation)
          // This should produce an entry identical to the original (except timestamp and source)
          const capturedEntry = historyManager.captureCurrentState('manual')

          // Verify the captured entry is not null
          expect(capturedEntry).not.toBeNull()

          // Compare all parameters (excluding timestamp, source, and id)
          // Image A parameters
          expect(capturedEntry.imageA.index).toBe(originalEntry.imageA.index)
          expect(capturedEntry.imageA.filename).toBe(originalEntry.imageA.filename)
          expect(capturedEntry.imageA.colorName).toBe(originalEntry.imageA.colorName)
          expect(capturedEntry.imageA.scale).toBeCloseTo(originalEntry.imageA.scale, 5)

          // Image B parameters
          expect(capturedEntry.imageB.index).toBe(originalEntry.imageB.index)
          expect(capturedEntry.imageB.filename).toBe(originalEntry.imageB.filename)
          expect(capturedEntry.imageB.colorName).toBe(originalEntry.imageB.colorName)
          expect(capturedEntry.imageB.scale).toBeCloseTo(originalEntry.imageB.scale, 5)

          // Visual settings
          expect(capturedEntry.paletteIndex).toBe(originalEntry.paletteIndex)
          expect(capturedEntry.blendModeIndex).toBe(originalEntry.blendModeIndex)
          expect(capturedEntry.backgroundModeIndex).toBe(originalEntry.backgroundModeIndex)
          expect(capturedEntry.activeImageIndex).toBe(originalEntry.activeImageIndex)

          // Verify timestamp and source are different (as expected)
          expect(capturedEntry.timestamp).toBeGreaterThanOrEqual(originalEntry.timestamp)
          expect(capturedEntry.id).not.toBe(originalEntry.id)
          // Source will be 'manual' for the captured entry, which may differ from original
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })
})

/**
 * **Feature: duo-chrome-history-filmstrip, Property 3: History position bounds**
 *
 * Property: For any history stack state, the current position should always be
 * >= 0 and < total entries, or -1 if history is empty.
 *
 * **Validates: Requirements 3.3, 3.4**
 */
describe('Property 3: History position bounds', () => {
  it('should maintain valid position bounds for any sequence of operations', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of random operations
        fc.array(
          fc.record({
            operation: fc.constantFrom('capture', 'navigateBackward', 'navigateForward', 'navigateTo'),
            // For navigateTo, we'll generate a target position (will be clamped to valid range)
            targetPosition: fc.integer({ min: -5, max: 20 }),
            // Composition state for capture operations
            compositionState: fc.record({
              imageAIndex: fc.integer({ min: 0, max: 99 }),
              imageAFilename: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0).map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
              imageAColorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
              imageAScale: fc.float({ min: Math.fround(0.051), max: Math.fround(5.0), noNaN: true }),
              imageBIndex: fc.integer({ min: 0, max: 99 }),
              imageBFilename: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0).map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
              imageBColorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
              imageBScale: fc.float({ min: Math.fround(0.051), max: Math.fround(5.0), noNaN: true }),
              paletteIndex: fc.integer({ min: 0, max: 3 }),
              blendModeIndex: fc.integer({ min: 0, max: 5 }),
              backgroundModeIndex: fc.integer({ min: 0, max: 3 }),
              activeImageIndex: fc.constantFrom(0, 1)
            })
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (operations) => {
          // Create mock p5 instance
          const mockP5 = {}

          // Create mock state references with proper color maps for all palettes
          const mockStateRefs = {
            imageColorPairs: [
              { img: 'test1.jpg', color: { name: 'Red' }, scale: 1.0 },
              { img: 'test2.jpg', color: { name: 'Blue' }, scale: 1.0 }
            ],
            controlState: {
              imageIndices: [0, 1],
              activeImageIndex: 0,
              manualSizeControl: [false, false]
            },
            colorIndex: 0,
            currentBlendModeIndex: 0,
            currentBackgroundModeIndex: 0,
            imgs: Array(100).fill('test.jpg'),
            ALL_PALETTES: [
              [{ name: 'Red' }, { name: 'Blue' }, { name: 'Green' }],
              [{ name: 'Red' }, { name: 'Blue' }, { name: 'Green' }],
              [{ name: 'Red' }, { name: 'Blue' }, { name: 'Green' }],
              [{ name: 'Red' }, { name: 'Blue' }, { name: 'Green' }],
              [{ name: 'Red' }, { name: 'Blue' }, { name: 'Green' }],
              [{ name: 'Red' }, { name: 'Blue' }, { name: 'Green' }]
            ],
            COLOR_MAPS: [
              new Map([
                ['Red', { name: 'Red' }],
                ['Blue', { name: 'Blue' }],
                ['Green', { name: 'Green' }],
                ['Yellow', { name: 'Yellow' }],
                ['Black', { name: 'Black' }],
                ['White', { name: 'White' }]
              ]),
              new Map([
                ['Red', { name: 'Red' }],
                ['Blue', { name: 'Blue' }],
                ['Green', { name: 'Green' }],
                ['Yellow', { name: 'Yellow' }],
                ['Black', { name: 'Black' }],
                ['White', { name: 'White' }]
              ]),
              new Map([
                ['Red', { name: 'Red' }],
                ['Blue', { name: 'Blue' }],
                ['Green', { name: 'Green' }],
                ['Yellow', { name: 'Yellow' }],
                ['Black', { name: 'Black' }],
                ['White', { name: 'White' }]
              ]),
              new Map([
                ['Red', { name: 'Red' }],
                ['Blue', { name: 'Blue' }],
                ['Green', { name: 'Green' }],
                ['Yellow', { name: 'Yellow' }],
                ['Black', { name: 'Black' }],
                ['White', { name: 'White' }]
              ]),
              new Map([
                ['Red', { name: 'Red' }],
                ['Blue', { name: 'Blue' }],
                ['Green', { name: 'Green' }]
              ]),
              new Map([
                ['Red', { name: 'Red' }],
                ['Blue', { name: 'Blue' }],
                ['Green', { name: 'Green' }]
              ])
            ]
          }

          // Create history manager
          const historyManager = new HistoryManager(mockP5, mockStateRefs)

          // Execute each operation and verify position bounds after each one
          for (const op of operations) {
            const totalEntriesBefore = historyManager.getTotalEntries()

            switch (op.operation) {
              case 'capture':
                // Update mock state with the composition state
                mockStateRefs.imageColorPairs[0].img = op.compositionState.imageAFilename
                mockStateRefs.imageColorPairs[0].color = { name: op.compositionState.imageAColorName }
                mockStateRefs.imageColorPairs[0].scale = op.compositionState.imageAScale
                mockStateRefs.imageColorPairs[1].img = op.compositionState.imageBFilename
                mockStateRefs.imageColorPairs[1].color = { name: op.compositionState.imageBColorName }
                mockStateRefs.imageColorPairs[1].scale = op.compositionState.imageBScale
                mockStateRefs.controlState.imageIndices = [op.compositionState.imageAIndex, op.compositionState.imageBIndex]
                mockStateRefs.controlState.activeImageIndex = op.compositionState.activeImageIndex
                mockStateRefs.colorIndex = op.compositionState.paletteIndex
                mockStateRefs.currentBlendModeIndex = op.compositionState.blendModeIndex
                mockStateRefs.currentBackgroundModeIndex = op.compositionState.backgroundModeIndex

                historyManager.captureCurrentState('manual')
                break

              case 'navigateBackward':
                historyManager.navigateBackward()
                break

              case 'navigateForward':
                historyManager.navigateForward()
                break

              case 'navigateTo':
                // Only navigate if we have history
                if (totalEntriesBefore > 0) {
                  // Clamp target position to valid range
                  const validPosition = Math.max(0, Math.min(op.targetPosition, totalEntriesBefore - 1))
                  historyManager.navigateTo(validPosition)
                }
                break
            }

            // Verify position bounds after operation
            const totalEntries = historyManager.getTotalEntries()
            const currentPosition = historyManager.currentPosition

            if (totalEntries === 0) {
              // Empty history: position must be -1
              expect(currentPosition).toBe(-1)
            } else {
              // Non-empty history: position must be in valid range [0, totalEntries - 1]
              expect(currentPosition).toBeGreaterThanOrEqual(0)
              expect(currentPosition).toBeLessThan(totalEntries)
            }

            // Additional invariant: getCurrentPosition() should be consistent
            const displayPosition = historyManager.getCurrentPosition()
            if (totalEntries === 0) {
              expect(displayPosition).toBe(0)
            } else {
              expect(displayPosition).toBe(currentPosition + 1)
            }

            // Verify canNavigateBackward/Forward are consistent with position
            if (totalEntries === 0) {
              expect(historyManager.canNavigateBackward()).toBe(false)
              expect(historyManager.canNavigateForward()).toBe(false)
            } else {
              expect(historyManager.canNavigateBackward()).toBe(currentPosition > 0)
              expect(historyManager.canNavigateForward()).toBe(currentPosition < totalEntries - 1)
            }
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })
})

/**
 * **Feature: duo-chrome-history-filmstrip, Property 5: Storage round-trip consistency**
 *
 * Property: For any history stack, saving to storage and then loading should
 * produce an equivalent history stack with the same entries and current position.
 *
 * **Validates: Requirements 7.2, 7.3**
 */
describe('Property 5: Storage round-trip consistency', () => {
  it('should preserve all history data when saving and loading from storage', () => {
    fc.assert(
      fc.property(
        // Generate a random history stack with multiple entries
        fc.array(
          fc.record({
            imageAIndex: fc.integer({ min: 0, max: 99 }),
            imageAFilename: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0).map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
            imageAColorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
            imageAScale: fc.float({ min: Math.fround(0.051), max: Math.fround(5.0), noNaN: true }),
            imageBIndex: fc.integer({ min: 0, max: 99 }),
            imageBFilename: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0).map(s => `${s.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`),
            imageBColorName: fc.constantFrom('Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'),
            imageBScale: fc.float({ min: Math.fround(0.051), max: Math.fround(5.0), noNaN: true }),
            paletteIndex: fc.integer({ min: 0, max: 3 }),
            blendModeIndex: fc.integer({ min: 0, max: 5 }),
            backgroundModeIndex: fc.integer({ min: 0, max: 1 }),
            activeImageIndex: fc.constantFrom(0, 1),
            source: fc.constantFrom('manual', 'random', 'url', 'modified')
          }),
          { minLength: 1, maxLength: 50 }
        ),
        // Generate a random position within the history
        fc.integer({ min: 0, max: 49 }),
        (historyEntries, targetPositionRaw) => {
          // Clamp target position to valid range
          const targetPosition = Math.min(targetPositionRaw, historyEntries.length - 1)

          // Create mock p5 instance
          const mockP5 = {}

          // Create mock state references
          const mockStateRefs = {
            imageColorPairs: [
              { img: 'initial1.jpg', color: { name: 'Red' }, scale: 1.0 },
              { img: 'initial2.jpg', color: { name: 'Blue' }, scale: 1.0 }
            ],
            controlState: {
              imageIndices: [0, 1],
              activeImageIndex: 0,
              manualSizeControl: [false, false]
            },
            colorIndex: 0,
            currentBlendModeIndex: 0,
            currentBackgroundModeIndex: 0,
            imgs: Array(100).fill('test.jpg')
          }

          // Create first history manager and build history stack
          const historyManager1 = new HistoryManager(mockP5, mockStateRefs)

          // Clear any existing storage to start fresh
          localStorage.removeItem(historyManager1.storageKey)

          // Build history stack by capturing each generated entry
          for (const entryData of historyEntries) {
            // Update mock state to match the entry data
            mockStateRefs.imageColorPairs[0].img = entryData.imageAFilename
            mockStateRefs.imageColorPairs[0].color = { name: entryData.imageAColorName }
            mockStateRefs.imageColorPairs[0].scale = entryData.imageAScale
            mockStateRefs.imageColorPairs[1].img = entryData.imageBFilename
            mockStateRefs.imageColorPairs[1].color = { name: entryData.imageBColorName }
            mockStateRefs.imageColorPairs[1].scale = entryData.imageBScale
            mockStateRefs.controlState.imageIndices = [entryData.imageAIndex, entryData.imageBIndex]
            mockStateRefs.controlState.activeImageIndex = entryData.activeImageIndex
            mockStateRefs.colorIndex = entryData.paletteIndex
            mockStateRefs.currentBlendModeIndex = entryData.blendModeIndex
            mockStateRefs.currentBackgroundModeIndex = entryData.backgroundModeIndex

            // Capture the state
            historyManager1.captureCurrentState(entryData.source)
          }

          // Navigate to the target position
          historyManager1.navigateTo(targetPosition)

          // Save the original state
          const originalHistory = historyManager1.history
          const originalPosition = historyManager1.currentPosition
          const originalTotalEntries = historyManager1.getTotalEntries()

          // Save to storage
          const saveSuccess = historyManager1.saveToStorage()
          expect(saveSuccess).toBe(true)

          // Create a second history manager (simulating a fresh page load)
          const historyManager2 = new HistoryManager(mockP5, mockStateRefs)

          // Verify the second manager loaded the history from storage
          expect(historyManager2.getTotalEntries()).toBe(originalTotalEntries)
          expect(historyManager2.currentPosition).toBe(originalPosition)

          // Verify each entry was preserved correctly
          for (let i = 0; i < originalHistory.length; i++) {
            const originalEntry = originalHistory[i]
            const loadedEntry = historyManager2.history[i]

            // Verify entry structure
            expect(loadedEntry).toBeDefined()
            expect(validateHistoryEntry(loadedEntry)).toBe(true)

            // Verify all fields match (excluding timestamp which may have minor differences due to serialization)
            expect(loadedEntry.id).toBe(originalEntry.id)
            expect(loadedEntry.timestamp).toBe(originalEntry.timestamp)

            // Image A parameters
            expect(loadedEntry.imageA.index).toBe(originalEntry.imageA.index)
            expect(loadedEntry.imageA.filename).toBe(originalEntry.imageA.filename)
            expect(loadedEntry.imageA.colorName).toBe(originalEntry.imageA.colorName)
            expect(loadedEntry.imageA.scale).toBeCloseTo(originalEntry.imageA.scale, 5)

            // Image B parameters
            expect(loadedEntry.imageB.index).toBe(originalEntry.imageB.index)
            expect(loadedEntry.imageB.filename).toBe(originalEntry.imageB.filename)
            expect(loadedEntry.imageB.colorName).toBe(originalEntry.imageB.colorName)
            expect(loadedEntry.imageB.scale).toBeCloseTo(originalEntry.imageB.scale, 5)

            // Visual settings
            expect(loadedEntry.paletteIndex).toBe(originalEntry.paletteIndex)
            expect(loadedEntry.blendModeIndex).toBe(originalEntry.blendModeIndex)
            expect(loadedEntry.backgroundModeIndex).toBe(originalEntry.backgroundModeIndex)
            expect(loadedEntry.activeImageIndex).toBe(originalEntry.activeImageIndex)

            // Source
            expect(loadedEntry.source).toBe(originalEntry.source)

            // Thumbnail (should be null for both since we don't generate thumbnails in this test)
            expect(loadedEntry.thumbnail).toBe(originalEntry.thumbnail)
          }

          // Verify navigation state is preserved
          expect(historyManager2.canNavigateBackward()).toBe(historyManager1.canNavigateBackward())
          expect(historyManager2.canNavigateForward()).toBe(historyManager1.canNavigateForward())
          expect(historyManager2.getCurrentPosition()).toBe(historyManager1.getCurrentPosition())

          // Verify current entry is the same
          const originalCurrentEntry = historyManager1.getCurrentEntry()
          const loadedCurrentEntry = historyManager2.getCurrentEntry()

          if (originalCurrentEntry && loadedCurrentEntry) {
            expect(loadedCurrentEntry.id).toBe(originalCurrentEntry.id)
            expect(loadedCurrentEntry.imageA.filename).toBe(originalCurrentEntry.imageA.filename)
            expect(loadedCurrentEntry.imageB.filename).toBe(originalCurrentEntry.imageB.filename)
          }

          // Clean up storage after test
          localStorage.removeItem(historyManager1.storageKey)
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })
})
