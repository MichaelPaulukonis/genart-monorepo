# Playwright Testing Quick Reference

Quick reference for testing p5.js canvas applications in the monorepo.

## Running Tests

```bash
# Run all tests (default app: duo-chrome)
npx playwright test

# Test specific app
TEST_APP=crude-collage-painter npx playwright test

# Run with UI
npx playwright test --ui

# Update screenshots
npx playwright test --update-snapshots

# Run specific test
npx playwright test test/examples/canvas-smoke-test.spec.js

# Debug mode
npx playwright test --debug
```

## Common Imports

```javascript
import { test, expect } from '@playwright/test'
import {
  // Initialization
  waitForP5Ready,
  waitForCanvasRender,
  waitForFontsLoaded,
  setupConsoleErrorTracking,
  
  // Canvas Data
  getCanvasData,
  getCanvasPixelData,
  canvasHasContent,
  
  // Interaction
  simulatePaintGesture,
  triggerKeyboardShortcut
} from '../utils/p5-canvas-helpers.js'
```

## Test Template

```javascript
import { test, expect } from '@playwright/test'
import { waitForP5Ready } from '../utils/p5-canvas-helpers.js'

test.describe('My Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForP5Ready(page)
  })

  test('my test', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    // Your test code here
  })
})
```

## Common Patterns

### Smoke Test
```javascript
test('loads without errors', async ({ page }) => {
  const errors = setupConsoleErrorTracking(page)
  await page.goto('/')
  await waitForP5Ready(page)
  expect(errors).toHaveLength(0)
})
```

### Visual Regression
```javascript
test('matches baseline', async ({ page }) => {
  const canvas = page.locator('canvas').first()
  await page.waitForTimeout(1000)
  await expect(canvas).toHaveScreenshot('baseline.png', {
    maxDiffPixelRatio: 0.1
  })
})
```

### Click Interaction
```javascript
test('click updates canvas', async ({ page }) => {
  const canvas = page.locator('canvas').first()
  const initial = await getCanvasData(page)
  
  await canvas.click({ position: { x: 100, y: 100 } })
  await page.waitForTimeout(300)
  
  expect(await canvasHasContent(page, initial)).toBe(true)
})
```

### Paint Gesture
```javascript
test('painting works', async ({ page }) => {
  const canvas = page.locator('canvas').first()
  
  await simulatePaintGesture(canvas, page, [
    [{ x: 50, y: 50 }, { x: 150, y: 100 }]
  ])
  
  await page.waitForTimeout(300)
  expect(await canvasHasContent(page)).toBe(true)
})
```

### Keyboard Shortcut
```javascript
test('keyboard shortcut works', async ({ page }) => {
  const initial = await getCanvasData(page)
  
  await triggerKeyboardShortcut(page, 's', 300)
  
  expect(await canvasHasContent(page, initial)).toBe(true)
})
```

### Pixel Color Check
```javascript
test('draws correct color', async ({ page }) => {
  const canvas = page.locator('canvas').first()
  await canvas.click({ position: { x: 100, y: 100 } })
  await page.waitForTimeout(300)
  
  const [r, g, b, a] = await getCanvasPixelData(page, 100, 100)
  expect(r).toBeGreaterThan(200) // Red channel
})
```

## Utility Functions

| Function | Purpose | Usage |
|----------|---------|-------|
| `waitForP5Ready(page, options)` | Wait for p5.js initialization | `await waitForP5Ready(page)` |
| `waitForCanvasRender(page, selector)` | Wait for canvas to have dimensions | `await waitForCanvasRender(page)` |
| `waitForFontsLoaded(page)` | Wait for fonts to load | `await waitForFontsLoaded(page)` |
| `setupConsoleErrorTracking(page)` | Track console errors | `const errors = setupConsoleErrorTracking(page)` |
| `getCanvasData(page, selector)` | Get full canvas image data | `const data = await getCanvasData(page)` |
| `getCanvasPixelData(page, x, y, selector)` | Get pixel color at coordinates | `const [r,g,b,a] = await getCanvasPixelData(page, 100, 100)` |
| `canvasHasContent(page, initial, selector)` | Check if canvas has content | `const hasContent = await canvasHasContent(page)` |
| `simulatePaintGesture(canvas, page, paths, options)` | Simulate painting | `await simulatePaintGesture(canvas, page, [[{x:50,y:50},{x:100,y:100}]])` |
| `triggerKeyboardShortcut(page, key, delay)` | Press keyboard key | `await triggerKeyboardShortcut(page, 's', 300)` |

## Configuration Options

### waitForP5Ready Options
```javascript
await waitForP5Ready(page, {
  canvasSelector: 'canvas',  // CSS selector
  timeout: 10000             // Timeout in ms
})
```

### simulatePaintGesture Options
```javascript
await simulatePaintGesture(canvas, page, paths, {
  steps: 10,   // Interpolation steps
  delay: 50    // Delay between moves (ms)
})
```

### Screenshot Options
```javascript
await expect(canvas).toHaveScreenshot('name.png', {
  maxDiffPixelRatio: 0.1,  // 10% difference allowed
  threshold: 0.2,          // Color difference threshold
  animations: 'disabled'   // Disable animations
})
```

## Debugging

```bash
# Run with headed browser
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Show test report
npx playwright show-report

# Generate trace
npx playwright test --trace on
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Canvas not found | Use correct selector: `waitForP5Ready(page, { canvasSelector: '#myCanvas' })` |
| Flaky visual tests | Add timeout: `await page.waitForTimeout(1000)` and increase tolerance |
| Console errors not captured | Call `setupConsoleErrorTracking(page)` **before** `page.goto()` |
| Gesture not working | Verify canvas is visible: `await expect(canvas).toBeVisible()` |
| Tests fail in CI | Adjust tolerance: `maxDiffPixelRatio: process.env.CI ? 0.15 : 0.1` |

## App Ports

| App | Port |
|-----|------|
| duo-chrome | 5173 |
| crude-collage-painter | 5174 |
| those-shape-things | 5175 |
| computational-collage | 5176 |

## Example Test Files

- `test/examples/canvas-smoke-test.spec.js` - Smoke tests
- `test/examples/visual-regression-test.spec.js` - Visual regression
- `test/examples/interaction-test.spec.js` - Interaction tests

## More Information

See [playwright-setup.md](./playwright-setup.md) for comprehensive documentation.
