# Playwright Testing for p5.js Canvas Applications

This guide explains how to test p5.js canvas applications in the monorepo using Playwright and our custom testing utilities adapted from the PolychromeText project.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Testing Utilities](#testing-utilities)
- [Test Patterns](#test-patterns)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

Our testing infrastructure provides specialized utilities for testing p5.js canvas applications, including:

- **Canvas initialization verification** - Ensure p5.js is ready before testing
- **Visual regression testing** - Detect unintended visual changes
- **Interaction simulation** - Test mouse gestures and keyboard input
- **Pixel-level verification** - Verify specific colors and content
- **Console error tracking** - Catch JavaScript errors during tests

## Setup

### Prerequisites

```bash
# Install Playwright and browsers
npm install -D @playwright/test
npx playwright install
```

### Configuration

The monorepo includes a pre-configured `playwright.config.js` at the root level. Key features:

- **Multi-app support** - Test any app using the `TEST_APP` environment variable
- **Automatic dev server** - Starts the app before tests run
- **Visual regression** - Screenshot comparison with configurable thresholds
- **CI optimization** - Retries and single worker mode for CI environments

### Running Tests

```bash
# Test the default app (duo-chrome)
npx playwright test

# Test a specific app
TEST_APP=crude-collage-painter npx playwright test

# Run with UI mode for debugging
npx playwright test --ui

# Update visual regression baselines
npx playwright test --update-snapshots

# Run specific test file
npx playwright test test/examples/canvas-smoke-test.spec.js
```

## Testing Utilities

All utilities are available in `test/utils/p5-canvas-helpers.js`.

### P5.js Initialization

#### `waitForP5Ready(page, options)`

Wait for p5.js instance to be fully initialized and ready.

```javascript
import { waitForP5Ready } from '../utils/p5-canvas-helpers.js'

test('my test', async ({ page }) => {
  await page.goto('/')
  await waitForP5Ready(page)
  // Canvas is now ready for testing
})
```

**Options:**
- `canvasSelector` - CSS selector for canvas (default: `'canvas'`)
- `timeout` - Timeout in ms (default: `10000`)

#### `waitForCanvasRender(page, canvasSelector)`

Ensures canvas element exists and has valid dimensions.

```javascript
await waitForCanvasRender(page)
// Canvas has width > 0 and height > 0
```

#### `waitForFontsLoaded(page)`

Critical for text-based p5.js applications. Waits for all fonts to load.

```javascript
await waitForFontsLoaded(page)
// All fonts are ready
```

#### `setupConsoleErrorTracking(page)`

Track console errors during page load. Call **before** `page.goto()`.

```javascript
const errors = setupConsoleErrorTracking(page)
await page.goto('/')
await waitForP5Ready(page)

// Verify no errors occurred
expect(errors).toHaveLength(0)
```

### Canvas Interaction

#### `getCanvasData(page, canvasSelector)`

Get full canvas image data as `Uint8ClampedArray`.

```javascript
const imageData = await getCanvasData(page)
// Returns full canvas pixel data
```

#### `getCanvasPixelData(page, x, y, canvasSelector)`

Get pixel color at specific coordinates as `[r, g, b, a]` array.

```javascript
const pixel = await getCanvasPixelData(page, 100, 100)
// pixel = [255, 0, 0, 255] (red pixel)

expect(pixel[0]).toBeGreaterThan(200) // Red channel
```

#### `canvasHasContent(page, initialImageData, canvasSelector)`

Verify canvas has content (not blank or monochromatic).

```javascript
// Check if canvas has any content
const hasContent = await canvasHasContent(page)
expect(hasContent).toBe(true)

// Check if canvas changed from initial state
const initial = await getCanvasData(page)
await canvas.click()
const changed = await canvasHasContent(page, initial)
expect(changed).toBe(true)
```

#### `simulatePaintGesture(canvas, page, paths, options)`

Simulate realistic painting gestures with smooth interpolation.

```javascript
const canvas = page.locator('canvas').first()

// Single stroke
await simulatePaintGesture(canvas, page, [
  [
    { x: 50, y: 50 },
    { x: 200, y: 100 }
  ]
])

// Multiple strokes
await simulatePaintGesture(canvas, page, [
  [{ x: 50, y: 50 }, { x: 100, y: 100 }],  // First stroke
  [{ x: 150, y: 150 }, { x: 200, y: 200 }] // Second stroke
], {
  steps: 15,  // Interpolation steps between points
  delay: 30   // Delay in ms between moves
})
```

#### `triggerKeyboardShortcut(page, key, delay)`

Trigger keyboard shortcuts with optional delay.

```javascript
// Press 's' to save
await triggerKeyboardShortcut(page, 's', 300)

// Press 'r' to regenerate
await triggerKeyboardShortcut(page, 'r')
```

## Test Patterns

### Smoke Tests

Verify basic functionality - app loads, canvas exists, no errors.

```javascript
import { test, expect } from '@playwright/test'
import {
  waitForP5Ready,
  setupConsoleErrorTracking
} from '../utils/p5-canvas-helpers.js'

test.describe('Smoke Tests', () => {
  let consoleErrors

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleErrorTracking(page)
    await page.goto('/')
  })

  test('loads without errors', async ({ page }) => {
    await waitForP5Ready(page)
    expect(consoleErrors).toHaveLength(0)
  })

  test('canvas is visible', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
  })
})
```

### Visual Regression Tests

Detect unintended visual changes using screenshot comparison.

```javascript
import { test, expect } from '@playwright/test'
import { waitForP5Ready, canvasHasContent } from '../utils/p5-canvas-helpers.js'

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForP5Ready(page)
  })

  test('initial state matches baseline', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    
    // Wait for initial render
    await page.waitForTimeout(1000)
    
    // Verify canvas has content
    expect(await canvasHasContent(page)).toBe(true)
    
    // Compare to baseline
    await expect(canvas).toHaveScreenshot('initial-state.png', {
      maxDiffPixelRatio: 0.1  // Allow 10% difference
    })
  })

  test('deterministic output matches baseline', async ({ page }) => {
    // Set deterministic seed
    await page.evaluate(() => {
      if (window.randomSeed) {
        window.randomSeed(12345)
      }
    })
    
    const canvas = page.locator('canvas').first()
    await page.waitForTimeout(1000)
    
    await expect(canvas).toHaveScreenshot('deterministic.png', {
      maxDiffPixelRatio: 0.05  // Stricter tolerance
    })
  })
})
```

### Interaction Tests

Test user interactions like clicks, drags, and keyboard input.

```javascript
import { test, expect } from '@playwright/test'
import {
  waitForP5Ready,
  canvasHasContent,
  getCanvasData,
  simulatePaintGesture
} from '../utils/p5-canvas-helpers.js'

test.describe('Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForP5Ready(page)
  })

  test('click updates canvas', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    const initial = await getCanvasData(page)
    
    await canvas.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(300)
    
    const changed = await canvasHasContent(page, initial)
    expect(changed).toBe(true)
  })

  test('painting creates visible marks', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    const initial = await getCanvasData(page)
    
    await simulatePaintGesture(canvas, page, [
      [
        { x: 50, y: 50 },
        { x: 150, y: 100 }
      ]
    ])
    
    await page.waitForTimeout(300)
    const changed = await canvasHasContent(page, initial)
    expect(changed).toBe(true)
  })
})
```

### Pixel-Level Verification

Test specific colors or verify exact pixel values.

```javascript
test('draws red at click location', async ({ page }) => {
  const canvas = page.locator('canvas').first()
  
  await canvas.click({ position: { x: 100, y: 100 } })
  await page.waitForTimeout(300)
  
  const pixel = await getCanvasPixelData(page, 100, 100)
  
  // Verify red channel is dominant
  expect(pixel[0]).toBeGreaterThan(200)  // R
  expect(pixel[1]).toBeLessThan(100)     // G
  expect(pixel[2]).toBeLessThan(100)     // B
})
```

## Best Practices

### 1. Always Wait for P5.js Initialization

```javascript
// ✅ DO: Wait for p5.js to be ready
test('my test', async ({ page }) => {
  await page.goto('/')
  await waitForP5Ready(page)
  // Now safe to interact with canvas
})

// ❌ DON'T: Test immediately after goto
test('my test', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('canvas')
  await canvas.click() // May fail if p5 not ready
})
```

### 2. Track Console Errors

```javascript
// ✅ DO: Set up error tracking before navigation
test('my test', async ({ page }) => {
  const errors = setupConsoleErrorTracking(page)
  await page.goto('/')
  await waitForP5Ready(page)
  expect(errors).toHaveLength(0)
})
```

### 3. Use Appropriate Timeouts

```javascript
// ✅ DO: Use reasonable timeouts for rendering
await canvas.click()
await page.waitForTimeout(300) // Allow time for render

// ❌ DON'T: Use excessive timeouts
await page.waitForTimeout(5000) // Too long
```

### 4. Verify Canvas Has Content

```javascript
// ✅ DO: Verify canvas has content before screenshots
expect(await canvasHasContent(page)).toBe(true)
await expect(canvas).toHaveScreenshot('test.png')

// ❌ DON'T: Take screenshots of blank canvas
await expect(canvas).toHaveScreenshot('test.png')
```

### 5. Use Deterministic Seeds for Reproducibility

```javascript
// ✅ DO: Set seeds for consistent visual tests
await page.evaluate(() => {
  if (window.randomSeed) {
    window.randomSeed(12345)
  }
  if (window.noiseSeed) {
    window.noiseSeed(67890)
  }
})
```

### 6. Configure Visual Regression Tolerance

```javascript
// For generative art with slight variations
await expect(canvas).toHaveScreenshot('art.png', {
  maxDiffPixelRatio: 0.1  // Allow 10% difference
})

// For deterministic output
await expect(canvas).toHaveScreenshot('ui.png', {
  maxDiffPixelRatio: 0.01  // Strict 1% tolerance
})
```

### 7. Test Interactions Realistically

```javascript
// ✅ DO: Simulate realistic gestures
await simulatePaintGesture(canvas, page, [
  [{ x: 50, y: 50 }, { x: 100, y: 75 }, { x: 150, y: 100 }]
], {
  steps: 15,  // Smooth interpolation
  delay: 30   // Realistic timing
})

// ❌ DON'T: Use instant teleportation
await page.mouse.move(50, 50)
await page.mouse.move(150, 100) // Too abrupt
```

### 8. Organize Tests by Category

```
test/
├── e2e/
│   ├── smoke/           # Basic functionality
│   ├── visual/          # Visual regression
│   ├── interaction/     # User interactions
│   └── integration/     # Full workflows
└── utils/
    └── p5-canvas-helpers.js
```

## Examples

Complete example test files are available in `test/examples/`:

- **`canvas-smoke-test.spec.js`** - Basic smoke tests
- **`visual-regression-test.spec.js`** - Visual regression patterns
- **`interaction-test.spec.js`** - Interaction testing patterns

## Troubleshooting

### Canvas Not Found

```javascript
// Problem: Canvas selector doesn't match
await waitForP5Ready(page) // Fails

// Solution: Specify correct selector
await waitForP5Ready(page, { canvasSelector: '#myCanvas' })
```

### Flaky Visual Tests

```javascript
// Problem: Timing issues cause inconsistent screenshots
await expect(canvas).toHaveScreenshot('test.png')

// Solution: Wait for animations to complete
await page.waitForTimeout(1000)
await expect(canvas).toHaveScreenshot('test.png', {
  maxDiffPixelRatio: 0.1  // Add tolerance
})
```

### Console Errors Not Captured

```javascript
// Problem: Error tracking set up after navigation
await page.goto('/')
const errors = setupConsoleErrorTracking(page) // Too late

// Solution: Set up before navigation
const errors = setupConsoleErrorTracking(page)
await page.goto('/')
```

### Gesture Simulation Not Working

```javascript
// Problem: Canvas not visible or has no bounding box
await simulatePaintGesture(canvas, page, paths)

// Solution: Ensure canvas is visible first
await expect(canvas).toBeVisible()
const box = await canvas.boundingBox()
expect(box).not.toBeNull()
await simulatePaintGesture(canvas, page, paths)
```

### Tests Pass Locally But Fail in CI

```javascript
// Problem: Different rendering on CI
// Solution: Adjust tolerance and use CI-specific baselines

// playwright.config.js
use: {
  screenshot: {
    maxDiffPixelRatio: process.env.CI ? 0.15 : 0.1
  }
}
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Visual Comparisons Guide](https://playwright.dev/docs/test-snapshots)
- [p5.js Reference](https://p5js.org/reference/)

## Contributing

When adding new testing utilities:

1. Add comprehensive JSDoc documentation
2. Include usage examples in comments
3. Add corresponding example tests
4. Update this documentation
5. Test with multiple apps in the monorepo
