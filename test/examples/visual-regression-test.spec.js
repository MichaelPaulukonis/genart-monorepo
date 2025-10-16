/**
 * Visual Regression Test Example
 *
 * Demonstrates visual regression testing for p5.js canvas applications.
 * Uses Playwright's screenshot comparison to detect visual changes.
 */

import { test, expect } from '@playwright/test'
import {
  waitForP5Ready,
  canvasHasContent
} from '../utils/p5-canvas-helpers.js'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForP5Ready(page)
  })

  test('initial canvas state matches snapshot', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // Wait for initial render to complete
    await page.waitForTimeout(1000)

    // Verify canvas has content before taking snapshot
    expect(await canvasHasContent(page)).toBe(true)

    // Compare canvas to baseline screenshot
    // maxDiffPixelRatio: 0.1 allows 10% pixel difference
    await expect(canvas).toHaveScreenshot('initial-state.png', {
      maxDiffPixelRatio: 0.1
    })
  })

  test('canvas state after interaction matches snapshot', async ({ page }) => {
    const canvas = page.locator('canvas').first()

    // Perform some interaction (e.g., click to regenerate)
    await canvas.click({ position: { x: 100, y: 100 } })

    // Wait for animation/rendering to complete
    await page.waitForTimeout(1000)

    // Take snapshot after interaction
    await expect(canvas).toHaveScreenshot('after-interaction.png', {
      maxDiffPixelRatio: 0.1
    })
  })

  test('full page layout matches snapshot', async ({ page }) => {
    // Wait for everything to load
    await page.waitForTimeout(1000)

    // Take full page screenshot
    await expect(page).toHaveScreenshot('full-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05
    })
  })

  test('canvas with specific parameters matches snapshot', async ({ page }) => {
    // Set specific parameters via page evaluation
    // (Adjust this based on your app's API)
    await page.evaluate(() => {
      // Example: Set deterministic seed for reproducible output
      if (window.randomSeed) {
        window.randomSeed(12345)
      }
    })

    const canvas = page.locator('canvas').first()
    await page.waitForTimeout(1000)

    await expect(canvas).toHaveScreenshot('deterministic-output.png', {
      maxDiffPixelRatio: 0.05
    })
  })
})
