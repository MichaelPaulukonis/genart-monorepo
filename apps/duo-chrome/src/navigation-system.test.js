/**
 * Navigation System Unit Tests
 *
 * Tests for array wraparound behavior, uniqueness enforcement between image pairs,
 * and index boundary handling for the duo-chrome interactive controls feature.
 *
 * Requirements tested: 2.3, 2.4, 2.5
 */

// Mock console for testing
const mockConsole = {
  log: () => { },
  warn: () => { }
}

// Test data structures
let imageColorPairs
let controlState
let imgs

// Initialize test environment
function initializeTestEnvironment() {
  // Create a smaller test image array for predictable testing
  imgs = [
    'test1.jpg',
    'test2.jpg',
    'test3.jpg',
    'test4.jpg',
    'test5.jpg'
  ]

  imageColorPairs = [
    { img: 'test1.jpg', color: { color: [255, 0, 0] }, layer: null, scale: 1.0 },
    { img: 'test2.jpg', color: { color: [0, 255, 0] }, layer: null, scale: 1.0 }
  ]

  controlState = {
    activeImageIndex: 0,
    manualSizeControl: [false, false],
    imageIndices: [0, 1], // test1.jpg at index 0, test2.jpg at index 1
    isManualMode: false
  }
}

// Navigation system functions (extracted from duo-chrome.js for testing)
function setImageIndex(imageIndex, arrayIndex) {
  if (imageIndex === 0 || imageIndex === 1) {
    controlState.imageIndices[imageIndex] = arrayIndex
    mockConsole.log(`Image ${imageIndex === 0 ? 'A' : 'B'} array index set to: ${arrayIndex}`)
  }
}

function navigateImage(imageIndex, direction) {
  if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
    mockConsole.warn('Invalid image index:', imageIndex)
    return false
  }

  const currentArrayIndex = controlState.imageIndices[imageIndex]
  let newArrayIndex

  // Calculate new index with wraparound logic
  if (direction === 'next' || direction === 1) {
    newArrayIndex = (currentArrayIndex + 1) % imgs.length
  } else if (direction === 'previous' || direction === -1) {
    newArrayIndex = (currentArrayIndex - 1 + imgs.length) % imgs.length
  } else {
    mockConsole.warn('Invalid direction:', direction)
    return false
  }

  // Ensure uniqueness - prevent both images from showing the same content
  const otherImageIndex = imageIndex === 0 ? 1 : 0
  const otherArrayIndex = controlState.imageIndices[otherImageIndex]

  // If the new index would conflict with the other image, skip to the next available
  if (newArrayIndex === otherArrayIndex) {
    // Continue in the same direction to find the next unique image
    if (direction === 'next' || direction === 1) {
      newArrayIndex = (newArrayIndex + 1) % imgs.length
    } else {
      newArrayIndex = (newArrayIndex - 1 + imgs.length) % imgs.length
    }

    // Safety check to prevent infinite loop (though unlikely with current image count)
    let attempts = 0
    while (newArrayIndex === otherArrayIndex && attempts < imgs.length) {
      if (direction === 'next' || direction === 1) {
        newArrayIndex = (newArrayIndex + 1) % imgs.length
      } else {
        newArrayIndex = (newArrayIndex - 1 + imgs.length) % imgs.length
      }
      attempts++
    }

    if (attempts >= imgs.length) {
      mockConsole.warn('Could not find unique image - all images may be in use')
      return false
    }
  }

  // Update the control state with new array index
  setImageIndex(imageIndex, newArrayIndex)

  // Get the new image filename
  const newImageFilename = imgs[newArrayIndex]

  mockConsole.log(`Image ${imageIndex === 0 ? 'A' : 'B'} navigated ${direction} to: ${newImageFilename} (index ${newArrayIndex})`)

  // Update the image filename in the pair
  imageColorPairs[imageIndex].img = newImageFilename

  return true
}

function setImageByIndex(imageIndex, arrayIndex) {
  if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
    mockConsole.warn('Invalid image index:', imageIndex)
    return false
  }

  if (arrayIndex < 0 || arrayIndex >= imgs.length) {
    mockConsole.warn('Invalid array index:', arrayIndex)
    return false
  }

  const newImageFilename = imgs[arrayIndex]

  // Update the image filename in the pair
  imageColorPairs[imageIndex].img = newImageFilename

  // Update control state
  setImageIndex(imageIndex, arrayIndex)

  mockConsole.log(`Image ${imageIndex === 0 ? 'A' : 'B'} set to: ${newImageFilename} (index ${arrayIndex})`)

  return true
}

// Test utilities
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${actual}`)
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message)
  }
}

// Test Suite
function runTests() {
  let testsPassed = 0
  let testsFailed = 0

  function runTest(testName, testFunction) {
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

  console.log('Running Navigation System Unit Tests...\n')

  // Test 1: Array Wraparound Behavior at Boundaries (Requirement 2.3, 2.4)
  runTest('Forward navigation wraparound at end of array', () => {
    // Set image A to the last index
    controlState.imageIndices[0] = imgs.length - 1 // index 4 (test5.jpg)
    controlState.imageIndices[1] = 0 // Keep image B at index 0 to avoid conflicts

    const result = navigateImage(0, 'next')

    assertTrue(result, 'Navigation should succeed')
    assertEqual(controlState.imageIndices[0], 1, 'Should wrap to index 1 (skipping 0 due to conflict)')
    assertEqual(imageColorPairs[0].img, 'test2.jpg', 'Should wrap to second image')
  })

  runTest('Backward navigation wraparound at beginning of array', () => {
    // Set image A to the first index
    controlState.imageIndices[0] = 0 // index 0 (test1.jpg)
    controlState.imageIndices[1] = 1 // Keep image B at index 1 to avoid conflicts

    const result = navigateImage(0, 'previous')

    assertTrue(result, 'Navigation should succeed')
    assertEqual(controlState.imageIndices[0], imgs.length - 1, 'Should wrap to last index (4)')
    assertEqual(imageColorPairs[0].img, 'test5.jpg', 'Should wrap to last image')
  })

  runTest('Forward navigation with numeric direction', () => {
    controlState.imageIndices[0] = 2 // index 2 (test3.jpg)
    controlState.imageIndices[1] = 0 // Keep image B at different index

    const result = navigateImage(0, 1) // Use numeric direction

    assertTrue(result, 'Navigation should succeed with numeric direction')
    assertEqual(controlState.imageIndices[0], 3, 'Should move to next index')
    assertEqual(imageColorPairs[0].img, 'test4.jpg', 'Should move to next image')
  })

  runTest('Backward navigation with numeric direction', () => {
    controlState.imageIndices[0] = 2 // index 2 (test3.jpg)
    controlState.imageIndices[1] = 0 // Keep image B at different index

    const result = navigateImage(0, -1) // Use numeric direction

    assertTrue(result, 'Navigation should succeed with numeric direction')
    assertEqual(controlState.imageIndices[0], 1, 'Should move to previous index')
    assertEqual(imageColorPairs[0].img, 'test2.jpg', 'Should move to previous image')
  })

  // Test 2: Uniqueness Enforcement Between Image Pairs (Requirement 2.5)
  runTest('Uniqueness enforcement - skip conflicting image forward', () => {
    // Set up scenario where next image would conflict
    controlState.imageIndices[0] = 0 // Image A at index 0 (test1.jpg)
    controlState.imageIndices[1] = 1 // Image B at index 1 (test2.jpg)

    const result = navigateImage(0, 'next')

    assertTrue(result, 'Navigation should succeed')
    assertEqual(controlState.imageIndices[0], 2, 'Should skip conflicting index 1 and go to index 2')
    assertEqual(imageColorPairs[0].img, 'test3.jpg', 'Should skip to non-conflicting image')
  })

  runTest('Uniqueness enforcement - skip conflicting image backward', () => {
    // Set up scenario where previous image would conflict
    controlState.imageIndices[0] = 2 // Image A at index 2 (test3.jpg)
    controlState.imageIndices[1] = 1 // Image B at index 1 (test2.jpg)

    const result = navigateImage(0, 'previous')

    assertTrue(result, 'Navigation should succeed')
    assertEqual(controlState.imageIndices[0], 0, 'Should skip conflicting index 1 and go to index 0')
    assertEqual(imageColorPairs[0].img, 'test1.jpg', 'Should skip to non-conflicting image')
  })

  runTest('Uniqueness enforcement with wraparound', () => {
    // Set up scenario where wraparound would cause conflict
    controlState.imageIndices[0] = imgs.length - 1 // Image A at last index (test5.jpg)
    controlState.imageIndices[1] = 0 // Image B at index 0 (test1.jpg)

    const result = navigateImage(0, 'next')

    assertTrue(result, 'Navigation should succeed')
    assertEqual(controlState.imageIndices[0], 1, 'Should wrap and skip conflicting index 0')
    assertEqual(imageColorPairs[0].img, 'test2.jpg', 'Should wrap to non-conflicting image')
  })

  runTest('Multiple conflict resolution', () => {
    // Create a scenario with minimal array to test multiple skips
    const originalImgs = imgs
    imgs = ['img1.jpg', 'img2.jpg', 'img3.jpg'] // Only 3 images

    controlState.imageIndices[0] = 0 // Image A at index 0
    controlState.imageIndices[1] = 1 // Image B at index 1

    const result = navigateImage(0, 'next')

    assertTrue(result, 'Navigation should succeed even with limited options')
    assertEqual(controlState.imageIndices[0], 2, 'Should find the only available unique image')

    // Restore original imgs array
    imgs = originalImgs
  })

  // Test 3: Index Boundary Handling and Error Recovery (Requirement 2.5)
  runTest('Invalid image index handling', () => {
    const result1 = navigateImage(-1, 'next')
    const result2 = navigateImage(2, 'next')
    const result3 = navigateImage(999, 'previous')

    assertFalse(result1, 'Should return false for negative image index')
    assertFalse(result2, 'Should return false for out-of-bounds image index')
    assertFalse(result3, 'Should return false for extremely large image index')
  })

  runTest('Invalid direction handling', () => {
    const result1 = navigateImage(0, 'invalid')
    const result2 = navigateImage(0, 2)
    const result3 = navigateImage(0, null)

    assertFalse(result1, 'Should return false for invalid string direction')
    assertFalse(result2, 'Should return false for invalid numeric direction')
    assertFalse(result3, 'Should return false for null direction')
  })

  runTest('setImageByIndex boundary handling', () => {
    const result1 = setImageByIndex(0, -1)
    const result2 = setImageByIndex(0, imgs.length)
    const result3 = setImageByIndex(-1, 0)
    const result4 = setImageByIndex(2, 0)

    assertFalse(result1, 'Should return false for negative array index')
    assertFalse(result2, 'Should return false for array index >= length')
    assertFalse(result3, 'Should return false for negative image index')
    assertFalse(result4, 'Should return false for image index >= pairs length')
  })

  runTest('setImageByIndex valid operation', () => {
    const result = setImageByIndex(0, 3)

    assertTrue(result, 'Should return true for valid indices')
    assertEqual(controlState.imageIndices[0], 3, 'Should update control state')
    assertEqual(imageColorPairs[0].img, 'test4.jpg', 'Should update image pair')
  })

  // Test 4: Edge Cases and Error Recovery
  runTest('Navigation with limited images - should cycle back to original', () => {
    // Simulate scenario where only 2 images exist and both are in use
    const originalImgs = imgs
    imgs = ['only1.jpg', 'only2.jpg'] // Only 2 images

    // Update imageColorPairs to match the reduced array
    imageColorPairs[0].img = 'only1.jpg'
    imageColorPairs[1].img = 'only2.jpg'

    controlState.imageIndices[0] = 0 // Image A at index 0
    controlState.imageIndices[1] = 1 // Image B at index 1

    // Try to navigate - should succeed and cycle back to original image
    const result = navigateImage(0, 'next')

    assertTrue(result, 'Navigation should succeed even with limited images')
    assertEqual(controlState.imageIndices[0], 0, 'Should cycle back to original image when no other options')
    assertEqual(imageColorPairs[0].img, 'only1.jpg', 'Should maintain the original image')

    // Restore original imgs array
    imgs = originalImgs
  })

  runTest('Navigation impossible with single image', () => {
    // Simulate scenario where only 1 image exists - navigation should fail
    const originalImgs = imgs
    imgs = ['single.jpg'] // Only 1 image

    // Both images would have to use the same image
    imageColorPairs[0].img = 'single.jpg'
    imageColorPairs[1].img = 'single.jpg'

    controlState.imageIndices[0] = 0 // Image A at index 0
    controlState.imageIndices[1] = 0 // Image B also at index 0 (same image)

    // Try to navigate - should fail because there's nowhere to go
    const result = navigateImage(0, 'next')

    assertFalse(result, 'Should return false when only one image exists')
    assertEqual(controlState.imageIndices[0], 0, 'Should maintain original index when navigation fails')

    // Restore original imgs array
    imgs = originalImgs
  })

  runTest('State consistency after failed navigation', () => {
    const originalIndex = controlState.imageIndices[0]
    const originalImg = imageColorPairs[0].img

    // Try invalid navigation
    navigateImage(-1, 'next')

    assertEqual(controlState.imageIndices[0], originalIndex, 'Index should remain unchanged after failed navigation')
    assertEqual(imageColorPairs[0].img, originalImg, 'Image should remain unchanged after failed navigation')
  })

  runTest('Wraparound calculation correctness', () => {
    // Test edge case calculations
    controlState.imageIndices[0] = 0
    controlState.imageIndices[1] = 2 // Avoid conflict

    // Navigate backward from index 0 - should wrap to last index
    navigateImage(0, 'previous')

    assertEqual(controlState.imageIndices[0], imgs.length - 1, 'Backward wraparound should calculate correctly')

    // Navigate forward from last index - should wrap to beginning (avoiding conflicts)
    controlState.imageIndices[0] = imgs.length - 1
    controlState.imageIndices[1] = 1 // Avoid conflict with index 0

    navigateImage(0, 'next')

    assertEqual(controlState.imageIndices[0], 0, 'Forward wraparound should calculate correctly')
  })

  // Summary
  console.log(`\nTest Results:`)
  console.log(`✓ Passed: ${testsPassed}`)
  console.log(`✗ Failed: ${testsFailed}`)
  console.log(`Total: ${testsPassed + testsFailed}`)

  if (testsFailed === 0) {
    console.log('\n🎉 All navigation system tests passed!')
    return true
  } else {
    console.log('\n❌ Some navigation system tests failed!')
    return false
  }
}

// Export for potential use in other test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTests,
    navigateImage,
    setImageByIndex,
    initializeTestEnvironment
  }
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const success = runTests()
  process.exit(success ? 0 : 1)
}