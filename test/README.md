# Testing Infrastructure

This directory contains the Playwright testing infrastructure for p5.js canvas applications in the monorepo.

## Structure

```
test/
├── README.md                    # This file
├── utils/
│   └── p5-canvas-helpers.js     # Canvas testing utilities
└── examples/
    ├── canvas-smoke-test.spec.js      # Basic smoke tests
    ├── visual-regression-test.spec.js # Visual regression patterns
    └── interaction-test.spec.js       # Interaction testing patterns
```

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run tests (default: duo-chrome app)
npm run test:e2e

# Test specific app
TEST_APP=crude-collage-painter npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Update screenshots
npm run test:e2e:update
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Run tests with Playwright UI |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:update` | Update visual regression baselines |
| `npm run test:e2e:report` | Show test report |

## Testing Apps

Set the `TEST_APP` environment variable to test specific apps:

```bash
# Test duo-chrome (default)
npm run test:e2e

# Test crude-collage-painter
TEST_APP=crude-collage-painter npm run test:e2e

# Test those-shape-things
TEST_APP=those-shape-things npm run test:e2e

# Test computational-collage
TEST_APP=computational-collage npm run test:e2e
```

## Utilities

The `test/utils/p5-canvas-helpers.js` file provides specialized utilities for testing p5.js canvas applications:

- **Initialization**: `waitForP5Ready()`, `waitForCanvasRender()`, `waitForFontsLoaded()`
- **Canvas Data**: `getCanvasData()`, `getCanvasPixelData()`, `canvasHasContent()`
- **Interaction**: `simulatePaintGesture()`, `triggerKeyboardShortcut()`
- **Error Tracking**: `setupConsoleErrorTracking()`

## Example Tests

The `test/examples/` directory contains example test files demonstrating different testing patterns:

- **Smoke Tests** - Basic functionality verification
- **Visual Regression** - Screenshot comparison testing
- **Interaction Tests** - User interaction simulation

## Documentation

For comprehensive documentation, see:

- [Playwright Setup Guide](../docs/testing/playwright-setup.md)
- [Quick Reference](../docs/testing/quick-reference.md)

## Creating Tests for Your App

1. Create a new test file in your app directory or use the examples as templates
2. Import the utilities you need from `test/utils/p5-canvas-helpers.js`
3. Follow the patterns shown in the example files
4. Run your tests with `TEST_APP=your-app-name npm run test:e2e`

## CI Integration

The configuration is optimized for CI environments:

- Retries failed tests automatically
- Uses single worker to avoid conflicts
- Captures screenshots and videos on failure
- Generates HTML reports

## Troubleshooting

Common issues and solutions:

- **Canvas not found**: Check your canvas selector in `waitForP5Ready()`
- **Flaky visual tests**: Add appropriate timeouts and adjust tolerance
- **Console errors**: Use `setupConsoleErrorTracking()` before navigation
- **Tests fail in CI**: Adjust `maxDiffPixelRatio` for CI environments

For more troubleshooting tips, see the [Playwright Setup Guide](../docs/testing/playwright-setup.md#troubleshooting).