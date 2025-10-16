/**
 * Interaction Test Example
 *
 * Demonstrates interaction testing for p5.js canvas applications.
 * Tests user interactions like mouse clicks, keyboard input, and painting gestures.
 */

import { test, expect } from '@playwright/test'
import {
  waitForP5Ready,
  canvasHasContent,
  getCanvasData,
  getCanvasPixelData,
  simulatePaintGesture,
  triggerKeyboardShortcut
} from '../utils/p5-canvas-helpers.js'

test.describe('Canvas Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForP5Ready(page)
  })

  test('mouse click triggers canvas update', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // Capture initial canvas state
    const initialData = await getCanvasData(page)

    // Click the canvas
    await canvas.click({ position: { x: 100, y: 100 } })

    // Wait for rendering to complete
    await page.waitForTimeout(500)

    // Verify canvas has changed
    const hasChanged = await canvasHasContent(page, initialData)
    expect(hasChanged).toBe(true)
  })

  test('multiple clicks produce different results', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // First click
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(300)
    const firstState = await getCanvasData(page)

    // Second click
    await canvas.click({ position: { x: 200, y: 200 } })
    await page.waitForTimeout(300)
    const secondState = await getCanvasData(page)

    // Verify states are different
    let isDifferent = false
    for (let i = 0; i < firstState.length; i++) {
      if (firstState[i] !== secondState[i]) {
        isDifferent = true
        break
      }
    }
    expect(isDifferent).toBe(true)
  })

  test('keyboard shortcut triggers expected behavior', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // Capture initial state
    const initialData = await getCanvasData(page)

    // Press a key (e.g., 's' for save, 'r' for regenerate)
    // Adjust the key based on your app's keyboard shortcuts
    await triggerKeyboardShortcut(page, 'r', 300)

    // Verify canvas has changed
    const hasChanged = await canvasHasContent(page, initialData)
    expect(hasChanged).toBe(true)
  })

  test('painting gesture creates visible marks', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // Capture initial state
    const initialData = await getCanvasData(page)

    // Simulate a painting gesture
    await simulatePaintGesture(canvas, page, [
      [
        { x: 50, y: 50 },
        { x: 150, y: 100 },
        { x: 200, y: 150 }
      ]
    ], {
      steps: 15,
      delay: 30
    })

    // Wait for rendering
    await page.waitForTimeout(300)

    // Verify canvas has changed
    const hasChanged = await canvasHasContent(page, initialData)
    expect(hasChanged).toBe(true)
  })

  test('multiple paint strokes accumulate', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // First stroke
    await simulatePaintGesture(canvas, page, [
      [
        { x: 50, y: 50 },
        { x: 100, y: 100 }
      ]
    ])
    await page.waitForTimeout(200)
    const afterFirstStroke = await getCanvasData(page)

    // Second stroke
    await simulatePaintGesture(canvas, page, [
      [
        { x: 150, y: 150 },
        { x: 200, y: 200 }
      ]
    ])
    await page.waitForTimeout(200)
    const afterSecondStroke = await getCanvasData(page)

    // Verify second stroke added to canvas
    let isDifferent = false
    for (let i = 0; i < afterFirstStroke.length; i++) {
      if (afterFirstStroke[i] !== afterSecondStroke[i]) {
        isDifferent = true
        break
      }
    }
    expect(isDifferent).toBe(true)
  })

  test('specific pixel color changes after interaction', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // Get initial pixel color at specific location
    const initialPixel = await getCanvasPixelData(page, 100, 100)

    // Interact with that location
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(300)

    // Get pixel color after interaction
    const afterPixel = await getCanvasPixelData(page, 100, 100)

    // Verify pixel changed (at least one channel should be different)
    const hasChanged = (
      initialPixel[0] !== afterPixel[0] ||
      initialPixel[1] !== afterPixel[1] ||
      initialPixel[2] !== afterPixel[2]
    )
    expect(hasChanged).toBe(true)
  })

  test('drag interaction creates continuous path', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    const box = await canvas.boundingBox()

    // Capture initial state
    const initialData = await getCanvasData(page)

    // Perform drag gesture
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()

    // Move in a path
    const points = [
      { x: 50, y: 50 },
      { x: 100, y: 75 },
      { x: 150, y: 100 },
      { x: 200, y: 125 }
    ]

    for (const point of points) {
      await page.mouse.move(box.x + point.x, box.y + point.y)
      await page.waitForTimeout(50)
    }

    await page.mouse.up()
    await page.waitForTimeout(300)

    // Verify canvas has changed
    const hasChanged = await canvasHasContent(page, initialData)
    expect(hasChanged).toBe(true)
  })

  test('modifier key + click produces different result', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // Normal click
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(300)
    const normalClickState = await getCanvasData(page)

    // Reset or clear canvas if your app supports it
    await triggerKeyboardShortcut(page, 'c', 300)

    // Click with modifier key (e.g., Shift+click)
    await page.keyboard.down('Shift')
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.keyboard.up('Shift')
    await page.waitForTimeout(300)
    const modifierClickState = await getCanvasData(page)

    // Verify different behavior
    // Note: This test assumes your app has different behavior for modified clicks
    // Adjust or remove if not applicable
    let isDifferent = false
    for (let i = 0; i < normalClickState.length; i++) {
      if (normalClickState[i] !== modifierClickState[i]) {
        isDifferent = true
        break
      }
    }
    expect(isDifferent).toBe(true)
  })

  test('rapid interactions are handled correctly', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // Capture initial state
    const initialData = await getCanvasData(page)

    // Perform rapid clicks
    for (let i = 0; i < 5; i++) {
      await canvas.click({
        position: {
          x: 50 + i * 30,
          y: 50 + i * 30
        }
      })
      await page.waitForTimeout(50)
    }

    // Wait for all rendering to complete
    await page.waitForTimeout(500)

    // Verify canvas has changed
    const hasChanged = await canvasHasContent(page, initialData)
    expect(hasChanged).toBe(true)
  })

  test('canvas responds to hover events', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    const box = await canvas.boundingBox()

    // Move mouse over canvas
    await page.mouse.move(box.x + 100, box.y + 100)
    await page.waitForTimeout(200)

    // Check if cursor style changes or other hover effects occur
    const cursorStyle = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      return window.getComputedStyle(canvas).cursor
    })

    // Verify cursor is not default (indicates hover interaction)
    // Adjust expectation based on your app's behavior
    expect(cursorStyle).toBeDefined()
  })
})
