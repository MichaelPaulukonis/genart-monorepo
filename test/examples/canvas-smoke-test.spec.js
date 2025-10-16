/**
 * Canvas Smoke Test Example
 *
 * Demonstrates basic smoke testing for p5.js canvas applications.
 * These tests verify that the app loads correctly and the canvas is functional.
 */

import { test, expect } from '@playwright/test'
import {
  waitForP5Ready,
  waitForCanvasRender,
  setupConsoleErrorTracking
} from '../utils/p5-canvas-helpers.js'

test.describe('Canvas Smoke Tests', () => {
  let consoleErrors

  test.beforeEach(async ({ page }) => {
    // Track console errors before navigating
    consoleErrors = setupConsoleErrorTracking(page)
    await page.goto('/')
  })

  test('page loads without console errors', async ({ page }) => {
    await waitForP5Ready(page)
    expect(consoleErrors).toHaveLength(0)
  })

  test('canvas element exists and is visible', async ({ page }) => {
    await waitForCanvasRender(page)

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
  })

  test('canvas has valid dimensions', async ({ page }) => {
    await waitForCanvasRender(page)

    const dimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      return {
        width: canvas.width,
        height: canvas.height
      }
    })

    expect(dimensions.width).toBeGreaterThan(0)
    expect(dimensions.height).toBeGreaterThan(0)
  })

  test('canvas has 2d rendering context', async ({ page }) => {
    await waitForCanvasRender(page)

    const hasContext = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      const ctx = canvas.getContext('2d')
      return ctx !== null
    })

    expect(hasContext).toBe(true)
  })

  test('canvas accepts mouse events', async ({ page }) => {
    await waitForP5Ready(page)

    const canvas = page.locator('canvas').first()

    // Verify canvas can receive mouse events
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()

    // Click the canvas
    await canvas.click()

    // If the app has any visual feedback on click, you could verify it here
    // For example, checking if canvas content changed
    // This is just verifying the click doesn't cause errors
  })
})
