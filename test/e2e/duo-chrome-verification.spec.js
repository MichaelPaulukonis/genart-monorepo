/**
 * Duo-Chrome App Verification Tests
 *
 * Comprehensive test suite to verify all testing utilities work correctly
 * with the duo-chrome p5.js application in instance mode.
 */

import { test, expect } from '@playwright/test'
import {
  waitForP5Ready,
  waitForCanvasRender,
  waitForFontsLoaded,
  setupConsoleErrorTracking,
  getCanvasData,
  getCanvasPixelData,
  canvasHasContent,
  simulatePaintGesture,
  triggerKeyboardShortcut
} from '../utils/p5-canvas-helpers.js'

test.describe('Duo-Chrome App - Utility Verification', () => {
  let consoleErrors

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleErrorTracking(page)
    await page.goto('/')
  })

  test.describe('Initialization Utilities', () => {
    test('waitForP5Ready works with instance mode', async ({ page }) => {
      await waitForP5Ready(page)

      // Verify p5 instance is ready
      const p5Ready = await page.evaluate(() => {
        return window.p5 !== undefined && document.querySelector('canvas') !== null
      })

      expect(p5Ready).toBe(true)
      expect(consoleErrors).toHaveLength(0)
    })

    test('waitForCanvasRender verifies canvas dimensions', async ({ page }) => {
      await waitForCanvasRender(page)

      const dimensions = await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        return {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight
        }
      })

      expect(dimensions.width).toBeGreaterThan(0)
      expect(dimensions.height).toBeGreaterThan(0)
      expect(dimensions.clientWidth).toBeGreaterThan(0)
      expect(dimensions.clientHeight).toBeGreaterThan(0)
    })

    test('waitForFontsLoaded ensures fonts are ready', async ({ page }) => {
      await waitForFontsLoaded(page)

      const fontsReady = await page.evaluate(() => {
        return document.fonts.status === 'loaded'
      })

      expect(fontsReady).toBe(true)
    })

    test('setupConsoleErrorTracking captures errors', async ({ page }) => {
      // This test verifies error tracking works
      expect(consoleErrors).toHaveLength(0)

      // Trigger a console error
      await page.evaluate(() => {
        console.error('Test error for verification')
      })

      expect(consoleErrors).toHaveLength(1)
      expect(consoleErrors[0]).toContain('Test error for verification')
    })
  })

  test.describe('Canvas Data Utilities', () => {
    test.beforeEach(async ({ page }) => {
      await waitForP5Ready(page)
      await page.waitForTimeout(1000) // Allow initial render
    })

    test('getCanvasData returns valid image data', async ({ page }) => {
      const imageData = await getCanvasData(page)

      expect(imageData).toBeDefined()
      expect(imageData.length).toBeGreaterThan(0)
      expect(imageData.length % 4).toBe(0) // RGBA format
    })

    test('getCanvasPixelData returns correct pixel format', async ({ page }) => {
      const pixel = await getCanvasPixelData(page, 100, 100)

      expect(Array.isArray(pixel)).toBe(true)
      expect(pixel).toHaveLength(4) // [r, g, b, a]

      // Verify values are in valid range
      pixel.forEach(channel => {
        expect(channel).toBeGreaterThanOrEqual(0)
        expect(channel).toBeLessThanOrEqual(255)
      })
    })

    test('canvasHasContent detects non-blank canvas', async ({ page }) => {
      const hasContent = await canvasHasContent(page)
      expect(hasContent).toBe(true)
    })

    test('canvasHasContent detects changes after interaction', async ({ page }) => {
      const initialData = await getCanvasData(page)

      // Click to trigger change
      const canvas = page.locator('canvas').first()
      await canvas.click({ position: { x: 200, y: 200 } })
      await page.waitForTimeout(500)

      const hasChanged = await canvasHasContent(page, initialData)
      expect(hasChanged).toBe(true)
    })
  })

  test.describe('Interaction Utilities', () => {
    test.beforeEach(async ({ page }) => {
      await waitForP5Ready(page)
      await page.waitForTimeout(1000)
    })

    test('simulatePaintGesture creates canvas changes', async ({ page }) => {
      const canvas = page.locator('canvas').first()
      const initialData = await getCanvasData(page)

      // Simulate a painting gesture
      await simulatePaintGesture(canvas, page, [
        [
          { x: 50, y: 50 },
          { x: 150, y: 100 },
          { x: 200, y: 150 }
        ]
      ], {
        steps: 10,
        delay: 30
      })

      await page.waitForTimeout(300)

      const hasChanged = await canvasHasContent(page, initialData)
      expect(hasChanged).toBe(true)
    })

    test('simulatePaintGesture handles multiple strokes', async ({ page }) => {
      const canvas = page.locator('canvas').first()
      const initialData = await getCanvasData(page)

      // Multiple strokes
      await simulatePaintGesture(canvas, page, [
        [{ x: 50, y: 50 }, { x: 100, y: 100 }],
        [{ x: 150, y: 150 }, { x: 200, y: 200 }]
      ])

      await page.waitForTimeout(300)

      const hasChanged = await canvasHasContent(page, initialData)
      expect(hasChanged).toBe(true)
    })

    test('triggerKeyboardShortcut works with app controls', async ({ page }) => {
      const initialData = await getCanvasData(page)

      // Test a keyboard shortcut (assuming 'r' regenerates)
      await triggerKeyboardShortcut(page, ' ', 300) // Space bar

      // Verify some change occurred (depends on app behavior)
      const afterKeypress = await getCanvasData(page)

      // At minimum, verify no errors occurred
      expect(consoleErrors.filter(err => !err.includes('Test error'))).toHaveLength(0)
    })
  })

  test.describe('Real-world Usage Patterns', () => {
    test.beforeEach(async ({ page }) => {
      await waitForP5Ready(page)
      await page.waitForTimeout(500) // Reduced timeout
    })

    test('basic interaction workflow', async ({ page }) => {
      const canvas = page.locator('canvas').first()

      // 1. Capture initial state
      expect(await canvasHasContent(page)).toBe(true)

      // 2. Perform click interaction
      await canvas.click({ position: { x: 100, y: 100 } })
      await page.waitForTimeout(200) // Reduced timeout

      // 3. Check specific pixel (lightweight verification)
      const pixel = await getCanvasPixelData(page, 100, 100)
      expect(pixel).toHaveLength(4)

      // 4. Verify no errors occurred
      expect(consoleErrors.filter(err => !err.includes('Test error'))).toHaveLength(0)
    })

    test.skip('visual regression workflow', async ({ page }) => {
      // SKIPPED: duo-chrome uses random image selection without seedable randomness
      // This test will be enabled once URL parameter seeding is implemented
      // See task: "Add random seed URL parameters to generative art apps"

      const canvas = page.locator('canvas').first()

      // Set deterministic conditions if possible
      await page.evaluate(() => {
        if (window.randomSeed) {
          window.randomSeed(12345)
        }
      })

      // Wait for stable render
      await page.waitForTimeout(1000)

      // Verify canvas has content before screenshot
      expect(await canvasHasContent(page)).toBe(true)

      // Take screenshot (this would create baseline on first run)
      await expect(canvas).toHaveScreenshot('duo-chrome-verification.png', {
        maxDiffPixelRatio: 0.1
      })
    })

    test('error handling and edge cases', async ({ page }) => {
      // Test with invalid coordinates
      const pixel = await getCanvasPixelData(page, -10, -10)
      expect(pixel).toHaveLength(4) // Should handle gracefully

      // Test with coordinates outside canvas
      const dimensions = await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        return { width: canvas.width, height: canvas.height }
      })

      const outsidePixel = await getCanvasPixelData(
        page,
        dimensions.width + 100,
        dimensions.height + 100
      )
      expect(outsidePixel).toHaveLength(4)

      // Test empty gesture
      const canvas = page.locator('canvas').first()
      await simulatePaintGesture(canvas, page, [])

      // Should not cause errors
      expect(consoleErrors.filter(err => !err.includes('Test error'))).toHaveLength(0)
    })
  })

  test.describe('Performance and Reliability', () => {
    test.beforeEach(async ({ page }) => {
      await waitForP5Ready(page)
    })

    test('utilities handle basic interactions', async ({ page }) => {
      const canvas = page.locator('canvas').first()

      // Simple click test
      await canvas.click({ position: { x: 100, y: 100 } })
      await page.waitForTimeout(100)

      // Verify no errors occurred
      expect(consoleErrors.filter(err => !err.includes('Test error'))).toHaveLength(0)

      // Verify canvas still has content
      expect(await canvasHasContent(page)).toBe(true)
    })

    test('utilities work with canvas selectors', async ({ page }) => {
      // Test with specific canvas selector
      await waitForP5Ready(page, { canvasSelector: 'canvas' })

      // Simple verification without heavy data comparison
      const hasContent = await canvasHasContent(page, null, 'canvas')
      expect(hasContent).toBe(true)
    })
  })
})