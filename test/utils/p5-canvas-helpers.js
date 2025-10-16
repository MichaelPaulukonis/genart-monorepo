/**
 * P5.js Canvas Testing Utilities
 *
 * Adapted from PolychromeText project for use with Vite-based p5.js apps.
 * These utilities help test p5.js canvas applications with Playwright.
 */

/**
 * Wait for p5.js instance to be fully initialized and ready.
 * Works with both global and instance mode p5.js.
 *
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {string} options.canvasSelector - CSS selector for canvas (default: 'canvas')
 * @param {number} options.timeout - Timeout in ms (default: 10000)
 */
export async function waitForP5Ready(page, options = {}) {
  const { canvasSelector = 'canvas', timeout = 10000 } = options

  await page.waitForFunction(
    (selector) => {
      const canvas = document.querySelector(selector)
      return canvas && canvas.width > 0 && canvas.height > 0
    },
    canvasSelector,
    { timeout }
  )
}

/**
 * Wait for basic canvas rendering to be ready.
 * Ensures canvas element exists and has valid dimensions.
 *
 * @param {Page} page - Playwright page object
 * @param {string} canvasSelector - CSS selector for canvas (default: 'canvas')
 */
export async function waitForCanvasRender(page, canvasSelector = 'canvas') {
  await page.waitForFunction(
    (selector) => {
      const canvas = document.querySelector(selector)
      return canvas && canvas.width > 0 && canvas.height > 0
    },
    canvasSelector
  )
}

/**
 * Wait for fonts to load (critical for text-based p5.js apps).
 *
 * @param {Page} page - Playwright page object
 */
export async function waitForFontsLoaded(page) {
  await page.waitForFunction(() => document.fonts.ready)
}

/**
 * Setup console error tracking for a page.
 * Call this before page.goto() to capture errors during page load.
 *
 * @param {Page} page - Playwright page object
 * @returns {Array} Array that will be populated with error messages
 *
 * @example
 * const errors = setupConsoleErrorTracking(page)
 * await page.goto('/')
 * // Later check: expect(errors).toHaveLength(0)
 */
export function setupConsoleErrorTracking(page) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  return errors
}

/**
 * Get full canvas image data.
 *
 * @param {Page} page - Playwright page object
 * @param {string} canvasSelector - CSS selector for canvas (default: 'canvas')
 * @returns {Promise<Uint8ClampedArray|null>} Canvas image data or null if canvas not found
 */
export async function getCanvasData(page, canvasSelector = 'canvas') {
  return await page.evaluate((selector) => {
    const canvas = document.querySelector(selector)
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data
  }, canvasSelector)
}

/**
 * Get pixel data from canvas at specific coordinates.
 * Useful for color verification tests.
 *
 * @param {Page} page - Playwright page object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} canvasSelector - CSS selector for canvas (default: 'canvas')
 * @returns {Promise<Array>} [r, g, b, a] array
 */
export async function getCanvasPixelData(page, x, y, canvasSelector = 'canvas') {
  return await page.evaluate(
    ({ selector, coords }) => {
      const canvas = document.querySelector(selector)
      const ctx = canvas.getContext('2d')
      const imageData = ctx.getImageData(coords.x, coords.y, 1, 1)
      return Array.from(imageData.data)
    },
    { selector: canvasSelector, coords: { x, y } }
  )
}

/**
 * Verify canvas has content (not blank or monochromatic).
 *
 * @param {Page} page - Playwright page object
 * @param {Uint8ClampedArray} initialImageData - Optional initial state to compare against
 * @param {string} canvasSelector - CSS selector for canvas (default: 'canvas')
 * @returns {Promise<boolean>} True if canvas has content
 */
export async function canvasHasContent(page, initialImageData = null, canvasSelector = 'canvas') {
  const currentImageData = await page.evaluate((selector) => {
    const canvas = document.querySelector(selector)
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data
  }, canvasSelector)

  if (!currentImageData) return false

  // If no initial image data provided, check for non-monochromatic content
  if (!initialImageData) {
    const firstPixelR = currentImageData[0]
    const firstPixelG = currentImageData[1]
    const firstPixelB = currentImageData[2]

    for (let i = 4; i < currentImageData.length; i += 4) {
      if (
        currentImageData[i] !== firstPixelR ||
        currentImageData[i + 1] !== firstPixelG ||
        currentImageData[i + 2] !== firstPixelB
      ) {
        return true // Found a pixel with different color
      }
    }
    return false // All pixels are the same color
  }

  // Compare current image data to initial snapshot
  if (currentImageData.length !== initialImageData.length) return true

  for (let i = 0; i < currentImageData.length; i++) {
    if (currentImageData[i] !== initialImageData[i]) {
      return true // Pixel data has changed
    }
  }

  return false // No change from initial state
}

/**
 * Simulate painting gestures on a canvas.
 * Supports multiple stroke paths with smooth interpolation between points.
 *
 * @param {Locator} canvas - Playwright Locator pointing to canvas element
 * @param {Page} page - Playwright page object
 * @param {Array<Array<{x: number, y: number}>>} paths - Array of stroke paths
 * @param {Object} options - Configuration options
 * @param {number} options.steps - Interpolation steps between points (default: 10)
 * @param {number} options.delay - Delay in ms between moves (default: 50)
 *
 * @example
 * const canvas = page.locator('canvas').first()
 * await simulatePaintGesture(canvas, page, [
 *   [{x: 50, y: 50}, {x: 200, y: 100}],  // First stroke
 *   [{x: 100, y: 150}, {x: 300, y: 200}] // Second stroke
 * ])
 */
export async function simulatePaintGesture(canvas, page, paths, options = {}) {
  const { steps = 10, delay = 50 } = options

  const box = await canvas.boundingBox()
  if (!box) throw new Error('Canvas not found or not visible')

  for (const path of paths) {
    if (path.length === 0) continue

    // Convert path to absolute screen coordinates
    const absPath = path.map((p) => ({
      x: box.x + p.x,
      y: box.y + p.y
    }))

    // Move to first point and press mouse down
    await page.mouse.move(absPath[0].x, absPath[0].y)
    await page.mouse.down()

    // Move through rest of points with interpolation
    for (let i = 1; i < absPath.length; i++) {
      const from = absPath[i - 1]
      const to = absPath[i]

      for (let step = 1; step <= steps; step++) {
        const t = step / steps
        const x = from.x + (to.x - from.x) * t
        const y = from.y + (to.y - from.y) * t
        await page.mouse.move(x, y)
        await page.waitForTimeout(delay)
      }
    }

    await page.mouse.up()
  }
}

/**
 * Trigger keyboard shortcuts.
 * Useful for testing p5.js apps with keyboard controls.
 *
 * @param {Page} page - Playwright page object
 * @param {string} key - Key to press
 * @param {number} delay - Delay after keypress in ms (default: 50)
 */
export async function triggerKeyboardShortcut(page, key, delay = 50) {
  await page.keyboard.press(key)
  await page.waitForTimeout(delay)
}
