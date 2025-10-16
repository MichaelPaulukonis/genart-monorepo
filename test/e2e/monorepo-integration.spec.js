/**
 * Monorepo Integration Test
 *
 * Verifies that the testing utilities work correctly with the monorepo structure
 * and can test different apps based on the TEST_APP environment variable.
 */

import { test, expect } from '@playwright/test'
import {
  waitForP5Ready,
  waitForCanvasRender,
  canvasHasContent,
  setupConsoleErrorTracking
} from '../utils/p5-canvas-helpers.js'

test.describe('Monorepo Integration', () => {
  let consoleErrors

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleErrorTracking(page)
    await page.goto('/')
  })

  test('app loads successfully', async ({ page }) => {
    await waitForP5Ready(page)
    expect(consoleErrors).toHaveLength(0)
  })

  test('canvas is properly initialized', async ({ page }) => {
    await waitForCanvasRender(page)

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    // Verify canvas has valid dimensions
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

  test('canvas has content after initialization', async ({ page }) => {
    const testApp = process.env.TEST_APP || 'duo-chrome'
    
    // Skip for apps not yet converted to instance mode
    if (testApp === 'computational-collage') {
      test.skip(true, 'Skipped: computational-collage not converted to instance mode yet')
    }

    await waitForP5Ready(page)

    // Wait for initial render with longer timeout for verification script
    await page.waitForTimeout(2000)

    // Additional wait for canvas to have actual content
    let hasContent = false
    let attempts = 0
    const maxAttempts = 5

    while (!hasContent && attempts < maxAttempts) {
      hasContent = await canvasHasContent(page)
      if (!hasContent) {
        await page.waitForTimeout(500)
        attempts++
      }
    }

    expect(hasContent).toBe(true)
  })

  test('utilities can import correctly', async ({ page }) => {
    const testApp = process.env.TEST_APP || 'duo-chrome'
    
    // Skip for apps with UI overlays that interfere with canvas interaction
    if (testApp === 'computational-collage') {
      test.skip(true, 'Skipped: computational-collage has overlay UI that interferes with canvas clicks')
    }

    // This test verifies that all utilities can be imported and used
    // without throwing errors in the monorepo context

    await waitForP5Ready(page)

    // Wait for app to be fully ready
    await page.waitForTimeout(1500)

    const canvas = page.locator('canvas').first()

    // Ensure canvas is ready for interaction
    await expect(canvas).toBeVisible()
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()

    // Test basic interaction
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(500)

    // Verify the interaction was processed without errors
    expect(consoleErrors).toHaveLength(0)
  })

  test('correct app is being tested', async ({ page }) => {
    // Verify we're testing the expected app based on TEST_APP env var
    const testApp = process.env.TEST_APP || 'duo-chrome'

    // Check page title or other app-specific indicators
    const title = await page.title()
    expect(title).toBeDefined()

    // Verify we're on the correct port
    const url = page.url()
    const expectedPorts = {
      'duo-chrome': '5173',
      'crude-collage-painter': '5174',
      'those-shape-things': '5175',
      'computational-collage': '5176'
    }

    const expectedPort = expectedPorts[testApp] || '5173'
    expect(url).toContain(`:${expectedPort}`)
  })
})
