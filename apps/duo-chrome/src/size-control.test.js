/**
 * Size Control Unit Tests
 *
 * Tests for bounds enforcement, increment/decrement behavior, and scale clamping logic
 * for the duo-chrome interactive controls feature.
 *
 * Requirements tested: 1.3, 1.4, 1.5
 */

// Mock console for testing
const mockConsole = {
  log: () => { },
  warn: () => { }
}

// Test data structures
let imageColorPairs
let controlState

// Initialize test environment
function initializeTestEnvironment () {
  imageColorPairs = [
    { img: 'test1.jpg', color: { color: [255, 0, 0] }, layer: null, scale: 1.0 },
    { img: 'test2.jpg', color: { color: [0, 255, 0] }, layer: null, scale: 1.0 }
  ]

  controlState = {
    activeImageIndex: 0,
    manualSizeControl: [false, false],
    imageIndices: [0, 1],
    isManualMode: false
  }
}

// Size control functions (extracted from duo-chrome.js for testing)
function setManualSizeControl (imageIndex, isManual) {
  if (imageIndex === 0 || imageIndex === 1) {
    controlState.manualSizeControl[imageIndex] = isManual
    if (isManual) {
      controlState.isManualMode = true
    }
  }
}

function provideBoundsFeedback (boundType) {
  // Simplified feedback for testing (no DOM manipulation)
  mockConsole.log(`Bounds feedback: ${boundType}`)
}

function adjustImageSize (imageIndex, delta) {
  if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
    mockConsole.warn('Invalid image index:', imageIndex)
    return false
  }

  const currentScale = parseFloat(imageColorPairs[imageIndex].scale)
  const newScale = currentScale + delta
  const minScale = 0.05
  const maxScale = 5.0

  // Bounds checking with feedback
  if (newScale < minScale) {
    imageColorPairs[imageIndex].scale = minScale
    setManualSizeControl(imageIndex, true)
    mockConsole.log(`Image ${imageIndex === 0 ? 'A' : 'B'} reached minimum size (${minScale})`)
    provideBoundsFeedback('minimum')
    return false
  } else if (newScale > maxScale) {
    imageColorPairs[imageIndex].scale = maxScale
    setManualSizeControl(imageIndex, true)
    mockConsole.log(`Image ${imageIndex === 0 ? 'A' : 'B'} reached maximum size (${maxScale})`)
    provideBoundsFeedback('maximum')
    return false
  } else {
    imageColorPairs[imageIndex].scale = parseFloat(newScale.toFixed(2))
    setManualSizeControl(imageIndex, true)
    mockConsole.log(`Image ${imageIndex === 0 ? 'A' : 'B'} scale adjusted to: ${imageColorPairs[imageIndex].scale}`)
    return true
  }
}

// Test utilities
function assertEqual (actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${actual}`)
  }
}

function assertAlmostEqual (actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: Expected ${expected} ± ${tolerance}, got ${actual}`)
  }
}

function assertTrue (condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertFalse (condition, message) {
  if (condition) {
    throw new Error(message)
  }
}

// Test Suite
function runTests () {
  let testsPassed = 0
  let testsFailed = 0

  function runTest (testName, testFunction) {
    try {
      initializeTestEnvironment()
      testFunction()
      console.log(`✓ ${testName}`)
      testsPassed++
    } catch (error) {
      console.error(`✗ ${testName}: ${error.message}`)
      testsFailed++
    }
  }

  console.log('Running Size Control Unit Tests...\n')

  // Test 1: Bounds Enforcement - Minimum Scale Limit (Requirement 1.3)
  runTest('Minimum scale limit enforcement', () => {
    // Test decreasing below minimum
    imageColorPairs[0].scale = 0.1
    const result = adjustImageSize(0, -0.1)

    assertFalse(result, 'Should return false when hitting minimum bound')
    assertEqual(imageColorPairs[0].scale, 0.05, 'Scale should be clamped to minimum (0.05)')
    assertTrue(controlState.manualSizeControl[0], 'Manual control should be activated')
  })

  // Test 2: Bounds Enforcement - Maximum Scale Limit (Requirement 1.4)
  runTest('Maximum scale limit enforcement', () => {
    // Test increasing above maximum
    imageColorPairs[0].scale = 4.9
    const result = adjustImageSize(0, 0.2)

    assertFalse(result, 'Should return false when hitting maximum bound')
    assertEqual(imageColorPairs[0].scale, 5.0, 'Scale should be clamped to maximum (5.0)')
    assertTrue(controlState.manualSizeControl[0], 'Manual control should be activated')
  })

  // Test 3: Increment Behavior with Various Delta Values (Requirement 1.5)
  runTest('Increment behavior with positive delta', () => {
    imageColorPairs[0].scale = 1.0
    const result = adjustImageSize(0, 0.1)

    assertTrue(result, 'Should return true for valid increment')
    assertAlmostEqual(imageColorPairs[0].scale, 1.1, 0.001, 'Scale should increase by delta')
    assertTrue(controlState.manualSizeControl[0], 'Manual control should be activated')
  })

  runTest('Decrement behavior with negative delta', () => {
    imageColorPairs[0].scale = 1.0
    const result = adjustImageSize(0, -0.1)

    assertTrue(result, 'Should return true for valid decrement')
    assertAlmostEqual(imageColorPairs[0].scale, 0.9, 0.001, 'Scale should decrease by delta')
    assertTrue(controlState.manualSizeControl[0], 'Manual control should be activated')
  })

  runTest('Large increment behavior', () => {
    imageColorPairs[0].scale = 1.0
    const result = adjustImageSize(0, 1.5)

    assertTrue(result, 'Should return true for large valid increment')
    assertAlmostEqual(imageColorPairs[0].scale, 2.5, 0.001, 'Scale should increase by large delta')
  })

  runTest('Large decrement behavior', () => {
    imageColorPairs[0].scale = 2.0
    const result = adjustImageSize(0, -0.8)

    assertTrue(result, 'Should return true for large valid decrement')
    assertAlmostEqual(imageColorPairs[0].scale, 1.2, 0.001, 'Scale should decrease by large delta')
  })

  // Test 4: Scale Clamping Logic Edge Cases (Requirement 1.5)
  runTest('Exact minimum boundary', () => {
    imageColorPairs[0].scale = 0.05
    const result = adjustImageSize(0, -0.01)

    assertFalse(result, 'Should return false when already at minimum')
    assertEqual(imageColorPairs[0].scale, 0.05, 'Scale should remain at minimum')
  })

  runTest('Exact maximum boundary', () => {
    imageColorPairs[0].scale = 5.0
    const result = adjustImageSize(0, 0.01)

    assertFalse(result, 'Should return false when already at maximum')
    assertEqual(imageColorPairs[0].scale, 5.0, 'Scale should remain at maximum')
  })

  runTest('Just below minimum boundary', () => {
    imageColorPairs[0].scale = 0.06
    const result = adjustImageSize(0, -0.02)

    assertFalse(result, 'Should return false when going below minimum')
    assertEqual(imageColorPairs[0].scale, 0.05, 'Scale should be clamped to minimum')
  })

  runTest('Just above maximum boundary', () => {
    imageColorPairs[0].scale = 4.99
    const result = adjustImageSize(0, 0.02)

    assertFalse(result, 'Should return false when going above maximum')
    assertEqual(imageColorPairs[0].scale, 5.0, 'Scale should be clamped to maximum')
  })

  // Test 5: Invalid Input Handling
  runTest('Invalid image index handling', () => {
    const result1 = adjustImageSize(-1, 0.1)
    const result2 = adjustImageSize(2, 0.1)

    assertFalse(result1, 'Should return false for negative index')
    assertFalse(result2, 'Should return false for out-of-bounds index')
  })

  runTest('Zero delta handling', () => {
    const initialScale = 1.5
    imageColorPairs[0].scale = initialScale
    const result = adjustImageSize(0, 0)

    assertTrue(result, 'Should return true for zero delta')
    assertEqual(imageColorPairs[0].scale, initialScale, 'Scale should remain unchanged with zero delta')
  })

  // Test 6: Precision and Rounding
  runTest('Decimal precision handling', () => {
    imageColorPairs[0].scale = 1.0
    adjustImageSize(0, 0.123456789)

    assertAlmostEqual(imageColorPairs[0].scale, 1.12, 0.001, 'Scale should be rounded to 2 decimal places')
  })

  runTest('Multiple small increments', () => {
    imageColorPairs[0].scale = 1.0

    // Apply multiple small increments
    for (let i = 0; i < 5; i++) {
      adjustImageSize(0, 0.01)
    }

    assertAlmostEqual(imageColorPairs[0].scale, 1.05, 0.001, 'Multiple small increments should accumulate correctly')
  })

  // Test 7: State Management
  runTest('Manual control state activation', () => {
    controlState.manualSizeControl[0] = false
    controlState.isManualMode = false

    adjustImageSize(0, 0.1)

    assertTrue(controlState.manualSizeControl[0], 'Manual control should be activated for adjusted image')
    assertTrue(controlState.isManualMode, 'Global manual mode should be activated')
  })

  runTest('Independent image control', () => {
    // Adjust first image
    adjustImageSize(0, 0.2)

    // Second image should remain unaffected
    assertEqual(imageColorPairs[1].scale, 1.0, 'Second image scale should remain unchanged')
    assertFalse(controlState.manualSizeControl[1], 'Second image manual control should remain false')
  })

  // Summary
  console.log('\nTest Results:')
  console.log(`✓ Passed: ${testsPassed}`)
  console.log(`✗ Failed: ${testsFailed}`)
  console.log(`Total: ${testsPassed + testsFailed}`)

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!')
    return true
  } else {
    console.log('\n❌ Some tests failed!')
    return false
  }
}

// Export for potential use in other test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTests,
    adjustImageSize,
    initializeTestEnvironment
  }
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const success = runTests()
  process.exit(success ? 0 : 1)
}
