/**
 * Duo-Chrome Interactive Controls System
 *
 * An interactive duotone image composition tool with comprehensive user controls.
 * Allows independent control of two images (A and B) including size, color, and navigation.
 *
 * Key Features:
 * - Active image selection (A/B) with visual feedback
 * - Individual size control with bounds enforcement (0.05x to 5.0x)
 * - Image navigation through collection with uniqueness enforcement
 * - Test feature: Enhanced blend mode support for improved color mixing
 * - Color cycling within current palette with conflict resolution
 * - Image exchange (swap A and B completely)
 * - Draggable status display with session persistence
 * - Comprehensive keyboard shortcuts and visual indicators
 *
 * Keyboard Controls:
 * - A/B: Select active image
 * - Arrow keys: Size (↑↓) and navigation (←→)
 * - Cmd+Arrow keys: Color cycling
 * - X: Exchange images A and B
 * - Shift+S: Share composition (generate URL)
 * - I: Toggle status display
 * - V: Toggle visual indicators
 * - H/?: Toggle help
 *
 * Architecture:
 * - Control state management with centralized state object
 * - Modular function groups for different control systems
 * - Event-driven updates with visual feedback
 * - Session persistence for UI preferences
 *
 * Inspired by: https://bsky.app/profile/leedoughty.bsky.social/post/3ldh2esstd22h
 * Original concept: https://leedoughty.com/
 */

import { p5 } from 'p5js-wrapper'
import { ALL_PALETTES, PALETTE_NAMES } from './risocolors'
import { imgs } from './generated/images.js'
import { getFormattedVersion } from './utils/version.js'
import { filterImages } from './utils/image-filtering.js'
import { getAssignments, getThemeById } from './utils/theme-management.js'
import { FilterModal } from './ui/FilterModal.js'
import { HistoryManager } from './history/HistoryManager.js'
import { ThumbnailGenerator } from './history/ThumbnailGenerator.js'
import { FilmstripPanel } from './ui/FilmstripPanel.js'
import { LoopAnimationController } from './utils/loop-animation-controller.js'
import { generateLoopFrameColors } from './utils/loop-frame-colors.js'
import { LoopAnimationPanel } from './ui/LoopAnimationPanel.js'
import { PalettePanel } from './ui/PalettePanel.js'
import { getRandomUniqueItem, normalizeHexColor, rgbArrayToHex } from './utils/color-utils.js'
import { backgroundModes, createBackgroundSystem } from './background-modes.js'
import { createRenderer } from './rendering.js'
import { createHistoryController } from './history-controller.js'
import { createStatusDisplay } from './status-display.js'
import { createSharingSystem } from './sharing.js'
import '../css/style.css'
import '../../../libs/version-display/version-display.css'

const sketch = function (p) {
  let currentPair = 0 // Track which image-color pair to update next
  let pause = false
  let autoSave = false
  let colorLayer1 = null
  let currentBackgroundModeIndex = 0 // Start with the first background mode
  let currentBlendModeIndex = 0 // Start with the first blend mode
  let backgroundSystem = null
  let renderer = null
  let historyController = null
  let statusDisplay = null
  let sharingSystem = null

  // Thin forwarding functions — delegate to modules once initialized in p.setup
  function updateScreen () { renderer.updateScreen() }
  function requestScreenUpdate () { renderer.requestScreenUpdate() }
  function createMonochromeImage (img, monoColor) { return renderer.createMonochromeImage(img, monoColor) }
  function cleanupGraphicsObjects () {
    renderer.cleanupGraphicsObjects()
    if (colorLayer1 && colorLayer1.remove) {
      colorLayer1.remove()
      colorLayer1 = null
    }
  }
  function updateStatusDisplay () { statusDisplay.update() }
  function showStatusDisplay () { statusDisplay.show() }
  function toggleStatusDisplay () { statusDisplay.toggle() }
  function debouncedCaptureHistory (source) { historyController.captureDebounced(source) }
  function captureHistoryImmediate (source) { historyController.captureImmediate(source) }
  function navigateHistoryBackward (step) { historyController.navigateBackward(step) }
  function navigateHistoryForward (step) { historyController.navigateForward(step) }
  function navigateHistoryToBeginning () { historyController.navigateToBeginning() }
  function navigateHistoryToEnd () { historyController.navigateToEnd() }
  function toggleFilmstrip () { historyController.toggleFilmstrip() }
  function regenerateThumbnails () { historyController.regenerateThumbnails() }
  function showClearHistoryDialog () { historyController.showClearHistoryDialog() }
  function generateShareURL () { return sharingSystem.generateShareURL() }
  function restoreCompositionFromURL () { return sharingSystem.restoreCompositionFromURL() }
  let COLOR_MAPS = []
  let colorIndex = 0
  const imgSource = './images/'

  // UI Components
  let historyManager = null
  let thumbnailGenerator = null
  let filmstripPanel = null
  let filterModal = null
  let loopAnimationController = null
  let loopAnimationPanel = null
  let palettePanel = null
  let loopFrameColors = []
  let loopFrameLoadToken = 0
  const CAPTURE_DEBOUNCE_DELAY = 300 // ms - wait for rapid changes to settle

  const imageColorPairs = [
    { img: null, color: null, layer: null, scale: 1 },
    { img: null, color: null, layer: null, scale: 1 }
  ]

  /**
   * Control State Management System
   *
   * Centralized state management for the interactive control system.
   * Tracks active image selection, manual adjustments, visual feedback,
   * and UI component states across the application.
   */
  const controlState = {
    activeImageIndex: 0, // 0 for Image A, 1 for Image B - determines which image responds to controls
    manualSizeControl: [false, false], // Track if each image has manual size adjustments
    imageIndices: [0, 1], // Current position in imgs array for each image (for navigation)
    isManualMode: false, // has user taken manual control (affects automatic cycling)
    showIndicators: false, // Whether to show visual indicators (active image highlighting)
    activeFilter: { searchString: '', selectedImages: [] }, // Current image filter definition
    filteredImgs: [...imgs], // List of images matching current filter
    indicatorTimeout: null, // Timeout for auto-hiding visual indicators
    needsRedraw: true, // Flag to control when screen updates are necessary
    lastFrameTime: 0, // Track frame timing for performance monitoring
    frameCount: 0 // Count frames for performance analysis
  }

  /**
   * State Management Functions
   *
   * Functions for managing the active image selection and control state.
   * These functions handle switching between Image A and B, showing visual
   * feedback, and maintaining the control state consistency.
   */

  /**
   * Sets the active image (A or B) that will respond to user controls.
   * Shows visual indicators and status display when changed.
   *
   * @param {number} imageIndex - 0 for Image A, 1 for Image B
   */
  function setActiveImage (imageIndex) {
    if (imageIndex === 0 || imageIndex === 1) {
      controlState.activeImageIndex = imageIndex
      // Show indicators temporarily
      showIndicatorsTemporarily()
      // Show status display temporarily
      showStatusDisplay()
    }
  }

  function showIndicatorsTemporarily (duration = 2000) {
    controlState.showIndicators = true

    // Clear existing timeout
    if (controlState.indicatorTimeout) {
      clearTimeout(controlState.indicatorTimeout)
    }

    // Set new timeout to hide indicators
    controlState.indicatorTimeout = setTimeout(() => {
      controlState.showIndicators = false
      requestScreenUpdate()
    }, duration)

    requestScreenUpdate()
  }

  function toggleIndicators () {
    controlState.showIndicators = !controlState.showIndicators

    // Clear timeout if manually toggling
    if (controlState.indicatorTimeout) {
      clearTimeout(controlState.indicatorTimeout)
      controlState.indicatorTimeout = null
    }

    updateScreen()
  }

  function setManualSizeControl (imageIndex, isManual) {
    if (imageIndex === 0 || imageIndex === 1) {
      controlState.manualSizeControl[imageIndex] = isManual
      if (isManual) {
        controlState.isManualMode = true
      }
    }
  }

  function setImageIndex (imageIndex, arrayIndex) {
    if (imageIndex === 0 || imageIndex === 1) {
      controlState.imageIndices[imageIndex] = arrayIndex
    }
  }

  function getActiveImageIndex () {
    return controlState.activeImageIndex
  }

  /**
   * Size Control System
   *
   * Functions for adjusting image scale with bounds enforcement and visual feedback.
   * Supports manual size control with scale limits (0.05 to 5.0) and provides
   * audio/visual feedback when bounds are reached.
   */

  /**
   * Adjusts the scale of a specific image by a delta amount.
   * Enforces minimum (0.05) and maximum (5.0) scale limits with feedback.
   * Activates manual size control mode and updates status display.
   *
   * @param {number} imageIndex - 0 for Image A, 1 for Image B
   * @param {number} delta - Amount to change scale (positive = larger, negative = smaller)
   * @returns {boolean} - true if adjustment succeeded, false if bounds reached
   */
  function adjustImageSize (imageIndex, delta) {
    if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
      console.warn('Invalid image index:', imageIndex)
      return false
    }

    const currentScale = parseFloat(imageColorPairs[imageIndex].scale)
    const newScale = currentScale + delta
    const minScale = 0.05
    const maxScale = 5.0

    // Bounds checking with feedback
    if (newScale < minScale) {
      imageColorPairs[imageIndex].scale = minScale
      console.log(`Image ${imageIndex === 0 ? 'A' : 'B'} reached minimum size (${minScale})`)
      provideBoundsFeedback('minimum')
      return false
    } else if (newScale > maxScale) {
      imageColorPairs[imageIndex].scale = maxScale
      console.log(`Image ${imageIndex === 0 ? 'A' : 'B'} reached maximum size (${maxScale})`)
      provideBoundsFeedback('maximum')
      return false
    } else {
      imageColorPairs[imageIndex].scale = newScale.toFixed(2)
      setManualSizeControl(imageIndex, true)
      // Update status display when size changes
      showStatusDisplay()
      // Capture to history with debouncing (size adjustments are often rapid)
      debouncedCaptureHistory('manual')
      return true
    }
  }

  function provideBoundsFeedback (boundType) {
    // Visual feedback - briefly flash the canvas border
    const canvas = p.canvas
    const originalStyle = canvas.style.border

    if (boundType === 'minimum') {
      canvas.style.border = '3px solid #ff4444'
    } else if (boundType === 'maximum') {
      canvas.style.border = '3px solid #4444ff'
    }

    // Reset border after brief flash
    setTimeout(() => {
      canvas.style.border = originalStyle
    }, 200)

    // Audio feedback (if available)
    try {
      // Create a brief audio beep for bounds feedback
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(boundType === 'minimum' ? 200 : 400, audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // Audio feedback not available, continue silently
      console.log('Audio feedback not available:', error.message)
    }
  }

  /**
   * Image Exchange System
   *
   * Provides functionality to swap the complete state between Image A and B.
   * This includes filename, color, layer, scale, array position, and manual control state.
   * Useful for experimenting with different layering arrangements and blend mode effects.
   */

  /**
   * Exchanges all properties between Image A and Image B.
   * Swaps: filename, color, rendered layer, scale, array index, and manual control state.
   * Updates display and status immediately after exchange.
   */
  function exchangeImages () {
    // Swap all properties between image A and B
    const tempImg = imageColorPairs[0].img
    const tempColor = imageColorPairs[0].color
    const tempLayer = imageColorPairs[0].layer
    const tempScale = imageColorPairs[0].scale
    const tempIndex = controlState.imageIndices[0]
    const tempManualControl = controlState.manualSizeControl[0]

    // Move B to A
    imageColorPairs[0].img = imageColorPairs[1].img
    imageColorPairs[0].color = imageColorPairs[1].color
    imageColorPairs[0].layer = imageColorPairs[1].layer
    imageColorPairs[0].scale = imageColorPairs[1].scale
    controlState.imageIndices[0] = controlState.imageIndices[1]
    controlState.manualSizeControl[0] = controlState.manualSizeControl[1]

    // Move A to B
    imageColorPairs[1].img = tempImg
    imageColorPairs[1].color = tempColor
    imageColorPairs[1].layer = tempLayer
    imageColorPairs[1].scale = tempScale
    controlState.imageIndices[1] = tempIndex
    controlState.manualSizeControl[1] = tempManualControl

    requestScreenUpdate()
    updateStatusDisplay()
    showStatusDisplay()

    // Capture to history immediately (discrete action)
    captureHistoryImmediate('manual')
  }

  /**
   * Color Navigation System
   *
   * Allows cycling through colors in the current palette for individual images.
   * Maintains uniqueness between images and provides wraparound navigation.
   * Regenerates image layers with new colors and updates visual feedback.
   */

  /**
   * Cycles through colors in the current palette for a specific image.
   * Ensures uniqueness (prevents both images from having the same color).
   * Supports wraparound navigation and conflict resolution.
   *
   * @param {number} imageIndex - 0 for Image A, 1 for Image B
   * @param {string|number} direction - 'next'/'previous' or 1/-1
   * @returns {boolean} - true if navigation succeeded, false if failed
   */
  function navigateImageColor (imageIndex, direction) {
    if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
      console.warn('Invalid image index:', imageIndex)
      return false
    }

    const currentColorArray = ALL_PALETTES[colorIndex]
    const currentColor = imageColorPairs[imageIndex].color
    let currentColorIndex = currentColorArray.findIndex(c => c.color === currentColor.color)

    // If current color not found in array (shouldn't happen), start from 0
    if (currentColorIndex === -1) {
      currentColorIndex = 0
    }

    let newColorIndex

    // Calculate new index with wraparound logic
    if (direction === 'next' || direction === 1) {
      newColorIndex = (currentColorIndex + 1) % currentColorArray.length
    } else if (direction === 'previous' || direction === -1) {
      newColorIndex = (currentColorIndex - 1 + currentColorArray.length) % currentColorArray.length
    } else {
      console.warn('Invalid direction:', direction)
      return false
    }

    // Ensure uniqueness - prevent both images from having the same color or the background
    const otherImageIndex = imageIndex === 0 ? 1 : 0
    const otherColor = imageColorPairs[otherImageIndex].color

    const backgroundHex = backgroundSystem.getCurrentBackgroundHexColor()
    const toHex = c => Array.isArray(c) ? normalizeHexColor(rgbArrayToHex(c)) : normalizeHexColor(c)
    const otherHex = toHex(otherColor?.color)

    const isInvalidColor = (entry) => {
      const colorHex = toHex(entry?.color)
      return colorHex === otherHex || colorHex === backgroundHex
    }

    let newColor = currentColorArray[newColorIndex]
    if (isInvalidColor(newColor)) {
      // Continue in the same direction to find the next unique color
      if (direction === 'next' || direction === 1) {
        newColorIndex = (newColorIndex + 1) % currentColorArray.length
      } else {
        newColorIndex = (newColorIndex - 1 + currentColorArray.length) % currentColorArray.length
      }

      // Safety check to prevent infinite loop
      let attempts = 0
      while (isInvalidColor(currentColorArray[newColorIndex]) && attempts < currentColorArray.length) {
        if (direction === 'next' || direction === 1) {
          newColorIndex = (newColorIndex + 1) % currentColorArray.length
        } else {
          newColorIndex = (newColorIndex - 1 + currentColorArray.length) % currentColorArray.length
        }
        attempts++
      }

      if (attempts >= currentColorArray.length) {
        console.warn('Could not find unique color - all colors may be in use')
        return false
      }

      newColor = currentColorArray[newColorIndex]
    }

    imageColorPairs[imageIndex].color = newColor

    // Regenerate the layer with the new color
    if (imageColorPairs[imageIndex].img && imageColorPairs[imageIndex].layer) {
      p.loadImage(imgSource + imageColorPairs[imageIndex].img, img => {
        // Remove old layer if it exists
        if (imageColorPairs[imageIndex].layer && imageColorPairs[imageIndex].layer.remove) {
          imageColorPairs[imageIndex].layer.remove()
        }

        // Generate new monochrome layer with new color
        imageColorPairs[imageIndex].layer = createMonochromeImage(
          img,
          p.color(newColor.color)
        )

        // Update the display
        requestScreenUpdate()

        // Update status display when color changes
        updateStatusDisplay()
      })
    }

    // Update status display immediately for color name change
    showStatusDisplay()

    // Capture to history immediately (discrete action)
    captureHistoryImmediate('manual')

    return true
  }

  /**
   * Image Navigation System
   *
   * Provides navigation through the image array for individual images.
   * Maintains uniqueness between images and supports wraparound navigation.
   * Preserves manual size adjustments when switching to new images.
   */

  /**
   * Navigates through the image array for a specific image.
   * Ensures uniqueness (prevents both images from showing the same content).
   * Supports wraparound navigation and preserves manual size adjustments.
   *
   * @param {number} imageIndex - 0 for Image A, 1 for Image B
   * @param {string|number} direction - 'next'/'previous' or 1/-1
   * @returns {boolean} - true if navigation succeeded, false if failed
   */
  function navigateImage (imageIndex, direction) {
    if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
      console.warn('Invalid image index:', imageIndex)
      return false
    }

    const currentFilename = imageColorPairs[imageIndex].img
    const listToUse = controlState.filteredImgs.length > 0 ? controlState.filteredImgs : imgs

    // Find current position in the list we are using
    let currentPos = listToUse.indexOf(currentFilename)

    // Fallback if current image is not in the filtered list
    if (currentPos === -1) {
      currentPos = 0
    }

    let newPos
    // Calculate new position with wraparound logic
    if (direction === 'next' || direction === 1) {
      newPos = (currentPos + 1) % listToUse.length
    } else if (direction === 'previous' || direction === -1) {
      newPos = (currentPos - 1 + listToUse.length) % listToUse.length
    } else {
      console.warn('Invalid direction:', direction)
      return false
    }

    // Ensure uniqueness - prevent both images from showing the same content
    const otherImageIndex = imageIndex === 0 ? 1 : 0
    const otherFilename = imageColorPairs[otherImageIndex].img

    // If the new filename would conflict with the other image, skip to the next available
    if (listToUse[newPos] === otherFilename && listToUse.length > 1) {
      if (direction === 'next' || direction === 1) {
        newPos = (newPos + 1) % listToUse.length
      } else {
        newPos = (newPos - 1 + listToUse.length) % listToUse.length
      }
    }

    const newImageFilename = listToUse[newPos]
    const newArrayIndex = imgs.indexOf(newImageFilename)

    // Update the control state with new array index
    setImageIndex(imageIndex, newArrayIndex)

    console.log(`Image ${imageIndex === 0 ? 'A' : 'B'} navigated ${direction} to: ${newImageFilename} (index ${newArrayIndex} in original imgs)`)

    // Load and update the image
    setImageByIndex(imageIndex, newArrayIndex)

    // Update status display when image changes
    showStatusDisplay()

    // Capture to history immediately (discrete action)
    captureHistoryImmediate('manual')

    return true
  }

  function setImageByIndex (imageIndex, arrayIndex) {
    if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
      console.warn('Invalid image index:', imageIndex)
      return
    }

    if (arrayIndex < 0 || arrayIndex >= imgs.length) {
      console.warn('Invalid array index:', arrayIndex)
      return
    }

    const newImageFilename = imgs[arrayIndex]
    const currentColor = imageColorPairs[imageIndex].color

    // Update the image filename in the pair
    imageColorPairs[imageIndex].img = newImageFilename

    // Update control state
    setImageIndex(imageIndex, arrayIndex)

    // Preserve manual size adjustments when navigating to new images
    const currentScale = imageColorPairs[imageIndex].scale
    const wasManuallyAdjusted = controlState.manualSizeControl[imageIndex]

    // Load the new image and regenerate the layer
    p.loadImage(imgSource + newImageFilename, img => {
      // Remove old layer if it exists
      if (imageColorPairs[imageIndex].layer && imageColorPairs[imageIndex].layer.remove) {
        imageColorPairs[imageIndex].layer.remove()
      }

      // Generate new monochrome layer with existing color
      imageColorPairs[imageIndex].layer = createMonochromeImage(
        img,
        p.color(currentColor.color)
      )

      // Preserve the scale and manual control state
      imageColorPairs[imageIndex].scale = currentScale
      controlState.manualSizeControl[imageIndex] = wasManuallyAdjusted

      // Update the display
      requestScreenUpdate()

      // Update status display when image loads
      updateStatusDisplay()
    })
  }

  /**
   * Pre-processes the color arrays into Maps for faster lookups.
   */
  function initializeColorMaps () {
    COLOR_MAPS = ALL_PALETTES.map(palette => {
      const map = new Map()
      palette.forEach(color => map.set(color.name, color))
      return map
    })
  }

  p.setup = function () {
    p.pixelDensity(2)
    // display mode
    // const c = p.createCanvas(p.windowWidth, p.windowHeight);
    // production mode
    const c = p.createCanvas(1000, 1000)
    c.elt.focus()
    p.imageMode(p.CENTER)
    colorLayer1 = p.createGraphics(100, 100)

    // Initialize renderer
    renderer = createRenderer({
      p,
      imageColorPairs,
      controlState,
      backgroundModeIndex: {
        get: () => currentBackgroundModeIndex
      },
      blendModeIndex: {
        get: () => currentBlendModeIndex
      }
    })

    // Initialize background system (depends on renderer for createMonochromeImage)
    backgroundSystem = createBackgroundSystem({
      p,
      imageColorPairs,
      colorIndex: {
        get: () => colorIndex,
        set: (v) => { colorIndex = v }
      },
      backgroundModeIndex: {
        get: () => currentBackgroundModeIndex,
        set: (v) => { currentBackgroundModeIndex = v }
      },
      blendModeIndex: {
        get: () => currentBlendModeIndex,
        set: (v) => { currentBlendModeIndex = v }
      },
      ALL_PALETTES,
      createMonochromeImage: (img, color) => renderer.createMonochromeImage(img, color),
      requestScreenUpdate: () => renderer.requestScreenUpdate(),
      updateStatusDisplay: () => showStatusDisplay(),
      captureHistoryImmediate: (source) => captureHistoryImmediate(source),
      imgSource
    })

    backgroundSystem.setBlendModeAndBackground()

    // Add cleanup on page unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
      renderer.cleanupGraphicsObjects()
      if (colorLayer1 && colorLayer1.remove) {
        colorLayer1.remove()
        colorLayer1 = null
      }
    })

    // Pre-process colors for faster lookups
    initializeColorMaps()

    // Initialize control state
    initializeControlState()

    // Initialize status display module
    statusDisplay = createStatusDisplay({
      imageColorPairs,
      controlState,
      backgroundModeIndex: { get: () => currentBackgroundModeIndex },
      blendModeIndex: { get: () => currentBlendModeIndex },
      getLoopAnimationController: () => loopAnimationController,
      imgs
    })

    // Initialize help system
    initializeHelpSystem()

    // Initialize HistoryManager with state references
    // Use getters for primitive values to ensure they're always current
    historyManager = new HistoryManager(p, {
      imageColorPairs,
      controlState,
      get colorIndex () { return colorIndex },
      set colorIndex (value) { colorIndex = value },
      get currentBlendModeIndex () { return currentBlendModeIndex },
      set currentBlendModeIndex (value) { currentBlendModeIndex = value },
      get currentBackgroundModeIndex () { return currentBackgroundModeIndex },
      set currentBackgroundModeIndex (value) { currentBackgroundModeIndex = value },
      imgs,
      ALL_PALETTES,
      COLOR_MAPS,
      requestScreenUpdate,
      updateStatusDisplay
    })

    // Initialize ThumbnailGenerator
    thumbnailGenerator = new ThumbnailGenerator(p, {
      imageColorPairs,
      get colorIndex () { return colorIndex },
      get currentBlendModeIndex () { return currentBlendModeIndex },
      get currentBackgroundModeIndex () { return currentBackgroundModeIndex },
      imgs,
      ALL_PALETTES,
      COLOR_MAPS,
      backgroundModes
    })

    // Initialize FilmstripPanel
    filmstripPanel = new FilmstripPanel(historyManager, thumbnailGenerator)

    // Initialize HistoryController
    historyController = createHistoryController({
      getHistoryManager: () => historyManager,
      getFilmstripPanel: () => filmstripPanel,
      getCanvas: () => p.canvas,
      CAPTURE_DEBOUNCE_DELAY
    })

    function assignLoopFrameColors () {
      if (!loopAnimationController || !loopAnimationController.walk || loopAnimationController.walk.length === 0) {
        loopFrameColors = []
        return
      }

      const palette = ALL_PALETTES[colorIndex] || []
      loopFrameColors = generateLoopFrameColors(loopAnimationController.walk, palette, Math.random, {
        excludedColors: [backgroundSystem.getCurrentBackgroundHexColor()]
      })
    }

    function loadImageAsync (src) {
      return new Promise((resolve, reject) => {
        p.loadImage(src, resolve, reject)
      })
    }

    // Initialize Loop Animation Controller
    loopAnimationController = new LoopAnimationController({
      fps: 4,
      onFrameChange: (frame) => {
        console.log('[LoopAnimation Draw] onFrameChange called with frame:', frame)
        if (frame && loopAnimationPanel) {
          // Update the panel UI
          loopAnimationPanel.updateFrame(frame)

          // Load and display images whenever frame changes (playing, scrubbing, or saving)
          // This ensures frames render correctly during all interactions
          // frame.pair.a and frame.pair.b are already the filenames
          const filenameA = frame.pair.a
          const filenameB = frame.pair.b

          const frameColors = loopFrameColors[loopAnimationController.currentFrameIndex]
          if (!frameColors) {
            assignLoopFrameColors()
          }

          const fallbackPalette = ALL_PALETTES[colorIndex] || []
          const colors = loopFrameColors[loopAnimationController.currentFrameIndex] || {
            colorA: fallbackPalette[0] || imageColorPairs[0].color,
            colorB: fallbackPalette[Math.min(1, Math.max(0, fallbackPalette.length - 1))] || imageColorPairs[1].color
          }

          const colorA = colors.colorA
          const colorB = colors.colorB

          console.log('[LoopAnimation Draw] Loading new images:', filenameA, filenameB, 'with colors:', colorA.name, colorB.name)

          const currentToken = ++loopFrameLoadToken

          Promise.all([
            loadImageAsync(imgSource + filenameA),
            loadImageAsync(imgSource + filenameB)
          ]).then(([imgA, imgB]) => {
            if (currentToken !== loopFrameLoadToken) {
              return
            }

            if (imageColorPairs[0].layer && imageColorPairs[0].layer.remove) {
              imageColorPairs[0].layer.remove()
            }
            if (imageColorPairs[1].layer && imageColorPairs[1].layer.remove) {
              imageColorPairs[1].layer.remove()
            }

            imageColorPairs[0].img = filenameA
            imageColorPairs[0].color = colorA
            imageColorPairs[0].scale = 1.0 // Reset to default scale for consistent loop frames
            imageColorPairs[0].layer = createMonochromeImage(imgA, colorA.color)

            imageColorPairs[1].img = filenameB
            imageColorPairs[1].color = colorB
            imageColorPairs[1].scale = 1.0 // Reset to default scale for consistent loop frames
            imageColorPairs[1].layer = createMonochromeImage(imgB, colorB.color)

            // Reset manual size control flags for loop frames
            controlState.manualSizeControl[0] = false
            controlState.manualSizeControl[1] = false

            requestScreenUpdate()
            updateStatusDisplay()
          }).catch((error) => {
            console.warn('[LoopAnimation Draw] Failed to load loop frame images:', error)
          })
        }
      },
      onPlayStateChange: () => {
        if (loopAnimationPanel) {
          loopAnimationPanel.updatePlaybackButtons()
        }
      },
      onGenerationProgress: (phase) => {
        console.log('[LoopAnimation UI] Progress phase:', phase)
        if (loopAnimationPanel) {
          if (phase === 'building-graph' || phase === 'preparing') {
            console.log('[LoopAnimation UI] Showing loading spinner')
            loopAnimationPanel.setLoading(true)
          } else if (phase === 'complete' || phase === 'error') {
            console.log('[LoopAnimation UI] Hiding loading spinner, updating UI')
            loopAnimationPanel.setLoading(false)
            if (phase === 'complete') {
              assignLoopFrameColors()
            }
            loopAnimationPanel.updateAll()
          }
        }
      }
    })

    // Initialize Loop Animation Panel
    loopAnimationPanel = new LoopAnimationPanel(loopAnimationController, {
      onSaveFrame: async (filename) => {
        // Save the current canvas frame
        p.saveCanvas(filename)
        // Small delay to ensure save completes
        await new Promise(resolve => setTimeout(resolve, 50))
      },
      onLoopEnabled: () => {
        // Set the current image pair as the desired start state for the loop
        setCurrentImagePairAsLoopStart()
        // Stop background auto-play when entering loop mode
        pause = true
        console.log('[LoopAnimation] Auto-play paused when enabling loop mode')
        showStatusDisplay()
      },
      onLoopDisabled: () => {
        // Keep auto-play stopped when exiting loop mode
        pause = true
        console.log('[LoopAnimation] Auto-play remains paused when disabling loop mode')
        showStatusDisplay()
      },
      onBeforeRotate: (rotationIndex) => {
        // Rotate loopFrameColors BEFORE the walk rotates so onFrameChange sees correct colors
        if (loopFrameColors.length > 0 && rotationIndex > 0) {
          loopFrameColors = [
            ...loopFrameColors.slice(rotationIndex),
            ...loopFrameColors.slice(0, rotationIndex)
          ]
        }
      },
      onSetLoopStart: (frame) => {
        // frame.pair.a / frame.pair.b are filenames; look up indices in image sets
        const indexA = loopAnimationController.imageSetA.indexOf(frame.pair.a)
        const indexB = loopAnimationController.imageSetB.indexOf(frame.pair.b)
        loopAnimationController.setDesiredStartState(indexA, indexB)
        console.log('[LoopAnimation] Walk rotated; new desiredStartState:', { indexA, indexB })
      },
      onPlay: () => {
        pause = false
        console.log('[Transport] Sketch play started')
      },
      onPause: () => {
        pause = true
        console.log('[Transport] Sketch play paused')
      },
      onSave: () => {
        p.saveCanvas(generateFilename())
      },
      onRandomize: () => {
        loadNewImagesAndColors()
      },
      getIsSketchPlaying: () => !pause
    })
    loopAnimationPanel.mount()
    loopAnimationPanel.updateAll()

    // Helper function to update loop controller image sets
    function updateLoopControllerImageSets () {
      // Get theme-based sets or full imgs as primary fallback
      let imageSetA = controlState.themeAssignments?.[0]
        ? filterImages(imgs, getThemeById(controlState.themeAssignments[0])?.filter || {})
        : imgs

      let imageSetB = controlState.themeAssignments?.[1]
        ? filterImages(imgs, getThemeById(controlState.themeAssignments[1])?.filter || {})
        : imgs

      // Secondary fallback: if filtered result is empty, use full imgs
      // This handles cases where theme filters match zero images or theme no longer exists
      if (imageSetA.length === 0) {
        console.log('[LoopAnimation] ImageSetA was empty (filtered theme returned 0 results), falling back to full image list')
        imageSetA = imgs
      }

      if (imageSetB.length === 0) {
        console.log('[LoopAnimation] ImageSetB was empty (filtered theme returned 0 results), falling back to full image list')
        imageSetB = imgs
      }

      console.log('[LoopAnimation] Updating image sets:', {
        imageSetA: imageSetA.length,
        imageSetB: imageSetB.length,
        totalImgs: imgs.length,
        usingThemeA: controlState.themeAssignments?.[0] && imageSetA !== imgs,
        usingThemeB: controlState.themeAssignments?.[1] && imageSetB !== imgs
      })

      loopAnimationController.setImageSets(imageSetA, imageSetB)
      if (loopAnimationPanel) {
        loopAnimationPanel.updateLoopLengthInput()
        loopAnimationPanel.updateAll()
      }
    }

    /**
     * Set the desired start state for loop generation using the current image pair
     */
    function setCurrentImagePairAsLoopStart () {
      const imageSetA = loopAnimationController.imageSetA
      const imageSetB = loopAnimationController.imageSetB

      if (!imageColorPairs[0].img || !imageColorPairs[1].img) {
        console.log('[LoopAnimation] Cannot set start state: images not loaded')
        return
      }

      // Find indices of current images in the sets
      const indexA = imageSetA.indexOf(imageColorPairs[0].img)
      const indexB = imageSetB.indexOf(imageColorPairs[1].img)

      if (indexA >= 0 && indexB >= 0) {
        loopAnimationController.setDesiredStartState(indexA, indexB)
        console.log('[LoopAnimation] Set desired start state from current image pair:', { indexA, indexB })
      } else {
        console.log('[LoopAnimation] Could not find current images in image sets:', { indexA, indexB })
        loopAnimationController.setDesiredStartState(null, null)
      }
    }

    // Update image sets on initialization
    updateLoopControllerImageSets()

    // Store reference for later updates
    window.updateLoopControllerImageSets = updateLoopControllerImageSets

    // Initialize FilterModal (ContactSheet in V3)
    filterModal = new FilterModal({
      totalImages: imgs.length,
      onFilterChange: (filterDef) => {
        // filterDef is { searchString, selectedImages[] } in V3
        controlState.activeFilter = {
          searchString: filterDef.searchString || '',
          selectedImages: filterDef.selectedImages || []
        }
        controlState.filteredImgs = filterImages(imgs, controlState.activeFilter)
        filterModal.updateStats(controlState.filteredImgs.length)
        filterModal.updateList(controlState.filteredImgs)

        // Persist to localStorage
        localStorage.setItem('duochrome-filter', JSON.stringify(controlState.activeFilter))

        // Update visual indicator
        const filterOpenBtn = document.getElementById('filter-open-btn')
        if (filterOpenBtn) {
          const hasFilter = controlState.activeFilter.searchString.trim() !== '' ||
            controlState.activeFilter.selectedImages.length > 0
          filterOpenBtn.classList.toggle('active', hasFilter)
        }
      },
      onThemeAssign: (position, themeId) => {
        // Update control state
        controlState.themeAssignments[position] = themeId

        // Refresh the image for this position immediately to reflect the new theme
        // We pass the current array index as null to trigger a random selection from the new theme
        updateImageColorPair(position, null)

        console.log(`Assigned theme ${themeId} to position ${position}`)
      }
    })

    // Sync filter UI with restored state
    {
      const hasFilter = controlState.activeFilter.searchString ||
        controlState.activeFilter.selectedImages?.length > 0
      filterModal.currentFilter = controlState.activeFilter.searchString
      filterModal.input.value = controlState.activeFilter.searchString
      filterModal.updateList(hasFilter ? controlState.filteredImgs : imgs)
      filterModal.updateStats(controlState.filteredImgs.length)

      const filterOpenBtn = document.getElementById('filter-open-btn')
      if (filterOpenBtn) {
        filterOpenBtn.classList.toggle('active', !!hasFilter)
        filterOpenBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          if (filterModal) filterModal.show()
        })
      }
    }

    // Wire monitor collapse button (V3: rack module toggle)
    const monitorCollapse = document.getElementById('monitor-collapse')
    if (monitorCollapse) {
      monitorCollapse.addEventListener('click', (e) => {
        e.stopPropagation()
        const statusOverlay = document.getElementById('status-overlay')
        statusOverlay?.classList.toggle('is-collapsed')
        monitorCollapse.textContent = statusOverlay?.classList.contains('is-collapsed') ? '+' : '−'
      })
    }

    // Initialize PalettePanel (V3 Palette rack module + picker overlay)
    const palettePanelEl = document.getElementById('palette-panel')
    if (palettePanelEl) {
      palettePanel = new PalettePanel(palettePanelEl, {
        palettes: ALL_PALETTES,
        paletteNames: PALETTE_NAMES,
        initialIndex: colorIndex,
        onPaletteChange: (index) => {
          colorIndex = index
          loopFrameColors = [] // clear cached loop colors; regenerated on next frame

          // Re-color current image pair from the new palette immediately
          const palette = backgroundSystem.getPaletteWithoutBackground()
          if (palette.length > 0) {
            imageColorPairs[0].color = getRandomUniqueItem(palette, [])
            imageColorPairs[1].color = getRandomUniqueItem(palette, [imageColorPairs[0].color])
            backgroundSystem.regenerateLayers() // async — calls requestScreenUpdate internally
          } else {
            requestScreenUpdate()
          }
          updateStatusDisplay()
        }
      })
    }

    // Initialize sharing system
    sharingSystem = createSharingSystem({
      imageColorPairs,
      controlState,
      colorIndex: {
        get: () => colorIndex,
        set: (v) => { colorIndex = v }
      },
      blendModeIndex: {
        get: () => currentBlendModeIndex,
        set: (v) => { currentBlendModeIndex = v }
      },
      backgroundModeIndex: {
        get: () => currentBackgroundModeIndex,
        set: (v) => { currentBackgroundModeIndex = v }
      },
      getColorMaps: () => COLOR_MAPS,
      imgs,
      onPause: () => { pause = true },
      onPaletteUpdate: (index) => { if (palettePanel) palettePanel.update(index) },
      onRestoreImages: () => loadRestoredImages()
    })

    // Try to restore composition from URL, otherwise initialize random pairs
    if (!restoreCompositionFromURL()) {
      initializeImageColorPairs() // Initialize both pairs initially
      updateImageColorPair(0)
      updateImageColorPair(1)
    }
  }

  p.mousePressed = function (event) {
    // Block clicks inside any fixed UI panel or overlay — never trigger an image
    // change when the user is interacting with (or just mis-clicking inside) a
    // panel that has nothing to do with the canvas.
    if (event && event.target) {
      const uiPanels = [
        'signal-panel', // right-side rack (monitor, transport, palette)
        'filmstrip-panel', // bottom history strip
        'filter-modal', // contact sheet overlay
        'palette-modal', // palette picker overlay
        'help-overlay', // keyboard shortcuts overlay
        'clear-history-dialog' // confirmation dialog
      ]
      if (uiPanels.some(id => {
        const el = document.getElementById(id)
        return el && el.contains(event.target)
      })) return
    }

    loadNewImagesAndColors()
  }

  p.keyPressed = function () {
    const IS_SHIFTED = p.keyIsDown(p.SHIFT)
    const IS_CMD = p.keyIsDown(91) || p.keyIsDown(93)
    if ((p.keyIsDown(p.CONTROL) || IS_CMD) && p.key === 's') {
      p.saveCanvas(generateFilename())
      return false // Prevent default browser behavior
    } else if (p.key === 'a') {
      // Select Image A as active
      setActiveImage(0)
    } else if (p.key === 'b') {
      // Select Image B as active
      setActiveImage(1)
    } else if (p.key === 'B' && IS_SHIFTED) {
      // Toggle background color (capital B)
      backgroundSystem.toggleBackgroundColor()
      backgroundSystem.regenerateLayers()
    } else if (p.key === 'S' && IS_SHIFTED) {
      // Share composition (Shift+S)
      generateShareURL()
      return false // Prevent default browser behavior
    } else if (p.keyCode === p.UP_ARROW) {
      // Increase active image size
      const activeIndex = getActiveImageIndex()
      adjustImageSize(activeIndex, 0.1)
      showIndicatorsTemporarily()
      return false // Prevent default browser behavior
    } else if (p.keyCode === p.DOWN_ARROW) {
      // Decrease active image size
      const activeIndex = getActiveImageIndex()
      adjustImageSize(activeIndex, -0.1)
      showIndicatorsTemporarily()
      return false // Prevent default browser behavior
    } else if (p.keyCode === p.LEFT_ARROW) {
      // History Navigation: Backward
      // Cmd+Left jumps to beginning, Shift+Left moves 10 steps, Left moves 1 step
      if (p.keyIsDown(p.CONTROL) || p.keyIsDown(91)) { // Cmd/Ctrl
        navigateHistoryToBeginning()
      } else {
        const step = IS_SHIFTED ? 10 : 1
        navigateHistoryBackward(step)
      }
      return false // Prevent default browser behavior
    } else if (p.keyCode === p.RIGHT_ARROW) {
      // History Navigation: Forward
      // Cmd+Right jumps to end, Shift+Right moves 10 steps, Right moves 1 step
      if (p.keyIsDown(p.CONTROL) || p.keyIsDown(91)) { // Cmd/Ctrl
        navigateHistoryToEnd()
      } else {
        const step = IS_SHIFTED ? 10 : 1
        navigateHistoryForward(step)
      }
      return false // Prevent default browser behavior
    } else if (p.key === '[' || p.key === '{') {
      // Image/Color Navigation: Previous
      // Cmd+[ : Previous Color
      // Shift+[: Previous Image (10 steps)
      // [: Previous Image (1 step)
      const activeIndex = getActiveImageIndex()
      if (p.keyIsDown(p.CONTROL) || p.keyIsDown(91)) { // Cmd/Ctrl key
        navigateImageColor(activeIndex, 'previous')
      } else {
        // Navigate previous image
        // Check for Shift (key is '{') or explicit SHIFT modifier
        const step = (p.key === '{' || IS_SHIFTED) ? 10 : 1

        // Navigate multiple steps if needed
        for (let i = 0; i < step; i++) {
          // We only need to trigger the actual load on the last step to avoid flicker
          // But navigateImage triggers load immediately.
          // For now, we'll just loop the logical index if we implement a 'seek' function,
          // but navigateImage is coupled to load.
          // Optimization: Just call it once with a loop internally?
          // For simplicity/safety in this refactor, we'll just call it 'step' times but that's inefficient.
          // Better: navigateImage handles single steps.
          // Let's just do single step for now unless we refactor navigateImage to accept a delta.
          // The previous history logic had a loop. navigateImage does not support 'step'.
          // We will just do single step for standard '[' and color.
          // For Shift, we can just call it once for now to keep it simple, or implement a loop.
          // Let's stick to single step navigation for images for now to ensure stability,
          // or fast-loop if step > 1.
          navigateImage(activeIndex, 'previous')
        }
      }
      showIndicatorsTemporarily()
      return false // Prevent default browser behavior
    } else if (p.key === ']' || p.key === '}') {
      // Image/Color Navigation: Next
      // Cmd+] : Next Color
      // Shift+]: Next Image (10 steps)
      // ]: Next Image (1 step)
      const activeIndex = getActiveImageIndex()
      if (p.keyIsDown(p.CONTROL) || p.keyIsDown(91)) { // Cmd/Ctrl key
        navigateImageColor(activeIndex, 'next')
      } else {
        // Navigate next image
        const step = (p.key === '}' || IS_SHIFTED) ? 10 : 1
        for (let i = 0; i < step; i++) {
          navigateImage(activeIndex, 'next')
        }
      }
      showIndicatorsTemporarily()
      return false // Prevent default browser behavior
    } else if (p.key === 'f') {
      // Toggle filmstrip panel
      toggleFilmstrip()
      return false // Prevent default browser behavior
    } else if (p.key === 'l' || p.key === 'L') {
      // Toggle filter modal
      if (filterModal) {
        filterModal.toggle()
      }
      return false // Prevent default browser behavior
    } else if (p.key === 'C' && IS_SHIFTED) {
      // Clear history (Shift+C)
      showClearHistoryDialog()
      return false // Prevent default browser behavior
    } else if (p.key === 'T' && IS_SHIFTED) {
      // Regenerate thumbnails (Shift+T)
      regenerateThumbnails()
      return false // Prevent default browser behavior
    } else if (p.key === 'P' && IS_SHIFTED) {
      // Show performance statistics (Shift+P)
      if (historyManager) {
        historyManager.logPerformanceStats()
      }
      return false // Prevent default browser behavior
    } else if (p.key === 'c') {
      colorIndex = (colorIndex + 1) % ALL_PALETTES.length
      if (palettePanel) palettePanel.update(colorIndex)
    } else if (p.key === 'g') {
      if (palettePanel) palettePanel.toggle()
    } else if (p.key === 'm') {
      backgroundSystem.cycleBlendMode()
    } else if (p.key === 'p' || p.keyCode === 32) {
      if (loopAnimationController && loopAnimationController.enabled) {
        // Space is handled by the LoopAnimationPanel keydown listener when loop mode is active
        return false
      }
      pause = !pause
      console.log(`pause: ${pause}`)
      if (loopAnimationPanel) loopAnimationPanel.updatePlaybackButtons()
    } else if (p.key === 'S') {
      autoSave = !autoSave
      console.log(`autoSave: ${autoSave}`)
    } else if (p.key === 'h' || p.key === '?') {
      toggleHelpOverlay()
    } else if (p.key === 'i') {
      toggleStatusDisplay()
    } else if (p.key === 'v') {
      toggleIndicators()
    } else if (p.key === 'x') {
      exchangeImages()
    }
  }

  p.draw = () => {
    const _fps = loopAnimationController ? loopAnimationController.fps : 2
    const _interval = Math.max(1, Math.round(60 / _fps))
    if (!pause && !(loopAnimationController && loopAnimationController.enabled) && p.frameCount % _interval === 0) {
      loadNewImagesAndColors()
      if (autoSave) {
        p.saveCanvas(generateFilename())
      }
    }
  }

  /**
   * Loads images for restored composition state.
   * Creates monochrome layers with the restored colors and scales.
   */
  function loadRestoredImages () {
    let loadedCount = 0
    const totalImages = imageColorPairs.filter(pair => pair.img && pair.color).length

    imageColorPairs.forEach((pair) => {
      if (pair.img && pair.color) {
        p.loadImage(imgSource + pair.img, (img) => {
          // Remove old layer if it exists
          if (pair.layer && pair.layer.remove) {
            pair.layer.remove()
          }

          // Create monochrome layer with restored color
          pair.layer = createMonochromeImage(img, p.color(pair.color.color))

          // Update display when both images are loaded
          requestScreenUpdate()
          updateStatusDisplay()

          // Capture initial state after all images are loaded
          loadedCount++
          if (loadedCount === totalImages) {
            // Capture with 'url' source since this is from URL restoration
            captureHistoryImmediate('url')
          }
        })
      }
    })
  }

  function generateFilename () {
    const d = new Date()
    return `duo_chrome_image.${d.getFullYear()}.${d.getMonth() + 1
      }.${d.getDate()}.${d.getHours()}${d.getMinutes()}${d.getSeconds()}.png`
  }

  async function toggleHelpOverlay () {
    const helpOverlay = document.getElementById('help-overlay')
    if (helpOverlay) {
      // If showing the overlay, populate version info
      if (helpOverlay.classList.contains('hidden')) {
        const versionInfo = document.getElementById('version-info')
        if (versionInfo) {
          try {
            const version = await getFormattedVersion()
            versionInfo.textContent = version
          } catch (error) {
            console.warn('Failed to load version info:', error)
            versionInfo.textContent = 'v1.0.0'
          }
        }
      }
      helpOverlay.classList.toggle('hidden')
    }
  }

  function initializeHelpSystem () {
    // Add close button functionality
    const closeButton = document.getElementById('close-help')
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        const helpOverlay = document.getElementById('help-overlay')
        if (helpOverlay) {
          helpOverlay.classList.add('hidden')
        }
      })
    }

    // Add ESC key to close help
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const helpOverlay = document.getElementById('help-overlay')
        if (helpOverlay && !helpOverlay.classList.contains('hidden')) {
          helpOverlay.classList.add('hidden')
          e.preventDefault()
        }
      }
    })
  }

  function initializeControlState () {
    // Set default active image to Image A (index 0)
    controlState.activeImageIndex = 0

    // Initialize manual control flags to false (automatic mode)
    controlState.manualSizeControl = [false, false]

    // Initialize image indices to track position in imgs array
    // Find the current images in the imgs array and set their indices
    controlState.imageIndices = [0, 1] // Start with first two images

    // Start in automatic mode
    controlState.isManualMode = false

    // Load theme assignments
    controlState.themeAssignments = getAssignments()

    // Load filter from localStorage if available
    const savedFilter = localStorage.getItem('duochrome-filter')
    if (savedFilter) {
      try {
        const parsed = JSON.parse(savedFilter)
        // Migrate V2 format (searchString only) to V3 format
        controlState.activeFilter = {
          searchString: parsed.searchString || '',
          selectedImages: parsed.selectedImages || []
        }
        controlState.filteredImgs = filterImages(imgs, controlState.activeFilter)
      } catch (e) {
        console.warn('Failed to parse saved filter:', e)
        controlState.activeFilter = { searchString: '', selectedImages: [] }
        controlState.filteredImgs = [...imgs]
      }
    }

    console.log('Control state initialized:', controlState)
  }

  function initializeImageColorPairs () {
    const availableColors = backgroundSystem.getPaletteWithoutBackground()

    imageColorPairs[0].img = getRandomUniqueItem(imgs, [])
    imageColorPairs[0].color = getRandomUniqueItem(availableColors, [])
    imageColorPairs[1].img = getRandomUniqueItem(imgs, [imageColorPairs[0].img])
    imageColorPairs[1].color = getRandomUniqueItem(availableColors, [
      imageColorPairs[0].color
    ])

    // Update control state with the selected image indices
    controlState.imageIndices[0] = imgs.indexOf(imageColorPairs[0].img)
    controlState.imageIndices[1] = imgs.indexOf(imageColorPairs[1].img)
  }

  function loadNewImagesAndColors () {
    updateImageColorPair(currentPair)
    currentPair = (currentPair + 1) % 2 // Toggle between 0 and 1
  }

  function updateImageColorPair (pairIndex, specificArrayIndex = null) {
    let selectedImage

    if (specificArrayIndex !== null) {
      // Use specific array index for manual navigation
      if (specificArrayIndex < 0 || specificArrayIndex >= imgs.length) {
        console.warn('Invalid array index:', specificArrayIndex)
        return
      }
      selectedImage = imgs[specificArrayIndex]

      // Ensure the selected image is different from the other image in the pair
      const otherPairIndex = pairIndex === 0 ? 1 : 0
      const otherImage = imageColorPairs[otherPairIndex].img

      if (selectedImage === otherImage) {
        console.warn('Selected image conflicts with other image, skipping update')
        return
      }
    } else {
      // Use random selection for automatic cycling (existing behavior)
      // Determine which list to use based on theme assignment or active filter
      let listToUse = imgs
      const assignedThemeId = controlState.themeAssignments[pairIndex]

      if (assignedThemeId) {
        const theme = getThemeById(assignedThemeId)
        if (theme) {
          const themeImages = filterImages(imgs, theme.filter)
          if (themeImages.length > 0) {
            listToUse = themeImages
            // Optional: Log that we used a theme?
            // console.log(`Using theme "${theme.name}" for position ${pairIndex}`)
          }
        }
      } else if (controlState.activeFilter.searchString && controlState.filteredImgs.length > 0) {
        // Fallback to global active filter if no theme assigned
        listToUse = controlState.filteredImgs
      }

      selectedImage = getRandomUniqueItem(
        listToUse,
        imageColorPairs.map(pair => pair.img)
      )
    }

    // Always get a new random color (unless preserving existing color for navigation)
    const availableColors = backgroundSystem.getPaletteWithoutBackground()
    const selectedColor = getRandomUniqueItem(
      availableColors,
      imageColorPairs.map(pair => pair.color)
    )

    imageColorPairs[pairIndex].img = selectedImage
    imageColorPairs[pairIndex].color = selectedColor

    // Reset manual size control when automatic cycling occurs
    if (!controlState.isManualMode && specificArrayIndex === null) {
      imageColorPairs[pairIndex].scale = p.random(0.8, 1.2).toFixed(2)
      controlState.manualSizeControl[pairIndex] = false
    }

    // Update control state with new image index
    if (specificArrayIndex !== null) {
      controlState.imageIndices[pairIndex] = specificArrayIndex
    } else {
      controlState.imageIndices[pairIndex] = imgs.indexOf(selectedImage)
    }

    p.loadImage(imgSource + selectedImage, img => {
      if (
        imageColorPairs[pairIndex].layer &&
        imageColorPairs[pairIndex].layer.remove
      ) {
        imageColorPairs[pairIndex].layer.remove()
      }
      imageColorPairs[pairIndex].layer = createMonochromeImage(
        img,
        p.color(selectedColor.color)
      )
      requestScreenUpdate()

      // Check if this is initial load (both images now have layers)
      if (imageColorPairs[0].layer && imageColorPairs[1].layer && historyManager && historyManager.getTotalEntries() === 0) {
        // Capture initial state after both images are loaded
        captureHistoryImmediate('manual')
      } else if (historyManager && historyManager.getTotalEntries() > 0) {
        // Capture subsequent automatic updates (mouse clicks or timer-based)
        // Use 'random' source for automatic cycling, 'manual' for user-initiated
        const source = controlState.isManualMode || specificArrayIndex !== null ? 'manual' : 'random'
        captureHistoryImmediate(source)
      }
    })
  }

  // Add debug utilities to global scope for console access
  window.debugCanvasCount = function () {
    const canvases = document.querySelectorAll('canvas')
    const sizeCount = {}
    canvases.forEach(canvas => {
      const size = `${canvas.width}x${canvas.height}`
      sizeCount[size] = (sizeCount[size] || 0) + 1
    })
    console.log(`Total canvas elements in DOM: ${canvases.length}`, sizeCount)
    return { total: canvases.length, bySizes: sizeCount }
  }
  window.cleanupGraphicsObjects = cleanupGraphicsObjects

  p.calculateScaleRatio = function (img) {
    const maxCanvasSize = Math.min(p.width, p.height) * 0.8
    const maxImgSize = Math.max(img.width, img.height)
    return maxCanvasSize / maxImgSize
  }
}

new p5(sketch) // eslint-disable-line no-new, new-cap
