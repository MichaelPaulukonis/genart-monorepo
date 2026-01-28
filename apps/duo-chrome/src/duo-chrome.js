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
import { ALL_PALETTES } from './risocolors'
import { imgs } from './generated/images.js'
import { getFormattedVersion } from './utils/version.js'
import { filterImages } from './utils/image-filtering.js'
import { getAssignments, getThemeById } from './utils/theme-management.js'
import { FilterModal } from './ui/FilterModal.js'
import { HistoryManager } from './history/HistoryManager.js'
import { ThumbnailGenerator } from './history/ThumbnailGenerator.js'
import { FilmstripPanel } from './ui/FilmstripPanel.js'
import { LoopAnimationController } from './utils/loop-animation-controller.js'
import { LoopAnimationPanel } from './ui/LoopAnimationPanel.js'
import '../css/style.css'
import '../../../libs/version-display/version-display.css'

function getRandomUniqueItem (arr, excludeItems) {
  const filteredArr = arr.filter(item => !excludeItems.includes(item))
  if (filteredArr.length === 0) {
    throw new RangeError('getRandomUniqueItem: no available items to select')
  }
  const randomIndex = Math.floor(Math.random() * filteredArr.length)
  return filteredArr[randomIndex]
}

let currentBlendModeIndex = 0 // Start with the first blend mode

const backgroundModes = [
  {
    color: [0, 0, 0],
    blendModes: ['ADD', 'EXCLUSION', 'SCREEN', 'BLEND', 'DIFFERENCE', 'LIGHTEST']
  },
  {
    color: [255, 255, 255],
    blendModes: ['MULTIPLY', 'EXCLUSION', 'BLEND', 'DIFFERENCE', 'DARKEST', 'HARD_LIGHT']
  }
]

const sketch = function (p) {
  let currentPair = 0 // Track which image-color pair to update next
  let pause = false
  let autoSave = false
  let colorLayer1 = null
  let currentBackgroundModeIndex = 0 // Start with the first background mode
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
  let captureDebounceTimer = null
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
    activeFilter: { searchString: '' }, // Current image filter definition
    filteredImgs: [...imgs], // List of images matching current filter
    indicatorTimeout: null, // Timeout for auto-hiding visual indicators
    statusTimeout: null, // Timeout for auto-hiding status display
    statusPosition: { x: 20, y: 20 }, // Position of draggable status display (session persistent)
    statusIsPermanent: false, // was status display manually toggled (permanent vs temporary)
    isDraggingStatus: false, // is status display currently being dragged (prevents canvas clicks)
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

  function resetManualControls () {
    controlState.manualSizeControl = [false, false]
    controlState.isManualMode = false
    console.log('Manual controls reset to automatic mode')
  }

  function getActiveImageIndex () {
    return controlState.activeImageIndex
  }

  function isManualControlActive (imageIndex) {
    return controlState.manualSizeControl[imageIndex]
  }

  /**
   * History Capture System
   *
   * Functions for capturing composition state to history with debouncing.
   * Debouncing prevents excessive history entries during rapid parameter changes.
   */

  /**
   * Captures current state to history with debouncing.
   * Delays capture to allow rapid changes to settle before creating entry.
   *
   * @param {string} source - How the entry was created: 'manual', 'random', 'url', 'modified'
   */
  function debouncedCaptureHistory (source = 'manual') {
    if (!historyManager) {
      return
    }

    // Clear existing timer
    if (captureDebounceTimer) {
      clearTimeout(captureDebounceTimer)
    }

    // Set new timer to capture after delay
    captureDebounceTimer = setTimeout(() => {
      historyManager.captureCurrentState(source)
      captureDebounceTimer = null

      // Update filmstrip if visible
      if (filmstripPanel && filmstripPanel.isVisible) {
        filmstripPanel.update()
      }
    }, CAPTURE_DEBOUNCE_DELAY)
  }

  /**
   * Captures current state to history immediately without debouncing.
   * Use for discrete actions like image exchange or blend mode changes.
   *
   * @param {string} source - How the entry was created: 'manual', 'random', 'url', 'modified'
   */
  function captureHistoryImmediate (source = 'manual') {
    if (!historyManager) {
      return
    }

    // Clear any pending debounced capture
    if (captureDebounceTimer) {
      clearTimeout(captureDebounceTimer)
      captureDebounceTimer = null
    }

    historyManager.captureCurrentState(source)

    // Update filmstrip if visible
    if (filmstripPanel && filmstripPanel.isVisible) {
      filmstripPanel.update()
    }
  }

  /**
   * History Navigation System
   *
   * Functions for navigating through the history stack using keyboard shortcuts.
   * Provides visual and status feedback when navigating or reaching boundaries.
   */

  /**
   * Navigates to the previous composition in history.
   * Shows temporary status message with feedback.
   * Provides boundary feedback when at the beginning of history.
   *
   * @param {number} step - Number of positions to move backward (default: 1)
   */
  function navigateHistoryBackward (step = 1) {
    if (!historyManager) {
      console.warn('History manager not initialized')
      return
    }

    // Navigate multiple steps
    let actualSteps = 0
    for (let i = 0; i < step; i++) {
      const success = historyManager.navigateBackward()
      if (success) {
        actualSteps++
      } else {
        break // Stop if we hit the beginning
      }
    }

    if (actualSteps > 0) {
      const currentPos = historyManager.getCurrentPosition() + 1 // +1 for 1-based display
      const totalEntries = historyManager.getTotalEntries()
      const stepText = actualSteps > 1 ? ` (-${actualSteps})` : ''
      showHistoryNavigationFeedback(`History: ${currentPos} / ${totalEntries}${stepText}`)

      // Update filmstrip highlight and counter if visible
      if (filmstripPanel && filmstripPanel.isVisible) {
        filmstripPanel.updateHighlight()
        filmstripPanel.updateCounter()
        filmstripPanel.scrollToCurrentPosition()
      }
    } else {
      // At the beginning of history
      showHistoryNavigationFeedback('At beginning of history', 'boundary')
      provideHistoryBoundsFeedback('beginning')
    }
  }

  /**
   * Navigates to the next composition in history.
   * Shows temporary status message with feedback.
   * Provides boundary feedback when at the end of history.
   *
   * @param {number} step - Number of positions to move forward (default: 1)
   */
  function navigateHistoryForward (step = 1) {
    if (!historyManager) {
      console.warn('History manager not initialized')
      return
    }

    // Navigate multiple steps
    let actualSteps = 0
    for (let i = 0; i < step; i++) {
      const success = historyManager.navigateForward()
      if (success) {
        actualSteps++
      } else {
        break // Stop if we hit the end
      }
    }

    if (actualSteps > 0) {
      const currentPos = historyManager.getCurrentPosition() + 1 // +1 for 1-based display
      const totalEntries = historyManager.getTotalEntries()
      const stepText = actualSteps > 1 ? ` (+${actualSteps})` : ''
      showHistoryNavigationFeedback(`History: ${currentPos} / ${totalEntries}${stepText}`)

      // Update filmstrip highlight and counter if visible
      if (filmstripPanel && filmstripPanel.isVisible) {
        filmstripPanel.updateHighlight()
        filmstripPanel.updateCounter()
        filmstripPanel.scrollToCurrentPosition()
      }
    } else {
      // At the end of history
      showHistoryNavigationFeedback('At end of history', 'boundary')
      provideHistoryBoundsFeedback('end')
    }
  }

  /**
   * Jumps to the beginning of history (first entry).
   * Shows feedback with current position.
   */
  function navigateHistoryToBeginning () {
    if (!historyManager) {
      console.warn('History manager not initialized')
      return
    }

    const totalEntries = historyManager.getTotalEntries()
    if (totalEntries === 0) {
      showHistoryNavigationFeedback('History is empty', 'boundary')
      return
    }

    // Navigate to position 0
    const success = historyManager.navigateTo(0)

    if (success) {
      showHistoryNavigationFeedback(`History: 1 / ${totalEntries} (beginning)`)

      // Update filmstrip highlight and counter if visible
      if (filmstripPanel && filmstripPanel.isVisible) {
        filmstripPanel.updateHighlight()
        filmstripPanel.updateCounter()
        filmstripPanel.scrollToCurrentPosition()
      }
    }
  }

  /**
   * Jumps to the end of history (last entry).
   * Shows feedback with current position.
   */
  function navigateHistoryToEnd () {
    if (!historyManager) {
      console.warn('History manager not initialized')
      return
    }

    const totalEntries = historyManager.getTotalEntries()
    if (totalEntries === 0) {
      showHistoryNavigationFeedback('History is empty', 'boundary')
      return
    }

    // Navigate to last position
    const lastPosition = totalEntries - 1
    const success = historyManager.navigateTo(lastPosition)

    if (success) {
      showHistoryNavigationFeedback(`History: ${totalEntries} / ${totalEntries} (end)`)

      // Update filmstrip highlight and counter if visible
      if (filmstripPanel && filmstripPanel.isVisible) {
        filmstripPanel.updateHighlight()
        filmstripPanel.updateCounter()
        filmstripPanel.scrollToCurrentPosition()
      }
    }
  }

  /**
   * Toggles the filmstrip panel visibility.
   * Updates the filmstrip when shown to reflect current history state.
   */
  function toggleFilmstrip () {
    if (!filmstripPanel) {
      console.warn('Filmstrip panel not initialized')
      return
    }

    filmstripPanel.toggle()

    // Update filmstrip when shown
    if (filmstripPanel.isVisible) {
      filmstripPanel.update()
    }
  }

  /**
   * Clear History System
   *
   * Functions for clearing the history stack with user confirmation.
   * Provides a confirmation dialog to prevent accidental deletion.
   */

  /**
   * Regenerates all thumbnails by clearing the cache.
   * Forces thumbnails to be recreated when filmstrip is next displayed.
   */
  function regenerateThumbnails () {
    if (!historyManager) {
      console.warn('History manager not initialized')
      return
    }

    // Clear the thumbnail cache
    historyManager.thumbnailGenerator.clearCache()
    console.log('Thumbnail cache cleared - thumbnails will regenerate')

    // Update filmstrip if visible to trigger regeneration
    if (filmstripPanel && filmstripPanel.isVisible) {
      // Clear the DOM completely
      filmstripPanel.scrollContainer.innerHTML = ''
      // Reset tracking variables
      filmstripPanel.renderedCount = 0
      filmstripPanel.renderedThumbnails.clear()
      // Re-render with fresh thumbnails
      filmstripPanel.update()
    }

    // Show feedback to user
    showClearHistoryFeedback('Thumbnails regenerated', 'success')
  }

  /**
   * Shows the clear history confirmation dialog.
   * Prompts user to confirm before clearing history.
   */
  function showClearHistoryDialog () {
    if (!historyManager) {
      console.warn('History manager not initialized')
      return
    }

    const dialog = document.getElementById('clear-history-dialog')
    if (!dialog) {
      console.error('Clear history dialog not found')
      return
    }

    const cancelBtn = document.getElementById('clear-history-cancel')
    const confirmBtn = document.getElementById('clear-history-confirm')

    if (!cancelBtn || !confirmBtn) {
      console.error('Clear history dialog buttons not found')
      return
    }

    // Cleanup function to remove all event listeners
    const cleanup = () => {
      cancelBtn.removeEventListener('click', handleCancel)
      confirmBtn.removeEventListener('click', handleConfirm)
      document.removeEventListener('keydown', handleEscape)
      dialog.removeEventListener('click', handleBackdropClick)
    }

    // Cancel handler
    const handleCancel = (event) => {
      if (event) {
        event.stopPropagation()
        event.preventDefault()
      }
      dialog.classList.add('hidden')
      cleanup()
    }

    // Confirm handler
    const handleConfirm = (event) => {
      if (event) {
        event.stopPropagation()
        event.preventDefault()
      }
      dialog.classList.add('hidden')
      cleanup()

      // Clear the history
      clearHistory()
    }

    // Escape key handler
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel(e)
      }
    }

    // Dialog backdrop click handler (close on backdrop click)
    const handleBackdropClick = (event) => {
      // Only close if clicking the backdrop itself, not the content
      if (event.target === dialog) {
        handleCancel(event)
      }
    }

    // Attach event listeners
    cancelBtn.addEventListener('click', handleCancel)
    confirmBtn.addEventListener('click', handleConfirm)
    document.addEventListener('keydown', handleEscape)
    dialog.addEventListener('click', handleBackdropClick)

    // Show the dialog
    dialog.classList.remove('hidden')
  }

  /**
   * Clears the history stack after user confirmation.
   * Keeps the current composition as the first entry in new history.
   * Provides visual feedback for the clear operation.
   */
  function clearHistory () {
    if (!historyManager) {
      console.warn('History manager not initialized')
      return
    }

    const totalEntries = historyManager.getTotalEntries()

    // Clear history from both memory and localStorage
    const success = historyManager.clearHistory()

    if (success) {
      console.log(`Cleared ${totalEntries} history entries`)

      // Update filmstrip if visible
      if (filmstripPanel) {
        // Clear the DOM and reset rendered count
        filmstripPanel.scrollContainer.innerHTML = ''
        filmstripPanel.renderedCount = 0

        // Update if visible
        if (filmstripPanel.isVisible) {
          filmstripPanel.update()
        }
      }

      // Show feedback to user
      showClearHistoryFeedback(`History cleared (${totalEntries} entries removed)`)
    } else {
      console.error('Failed to clear history')
      showClearHistoryFeedback('Failed to clear history', 'error')
    }
  }

  /**
   * Shows visual feedback for clear history operation.
   *
   * @param {string} message - Message to display
   * @param {string} type - 'success' or 'error'
   */
  function showClearHistoryFeedback (message, type = 'success') {
    // Create or update feedback element
    let feedback = document.getElementById('clear-history-feedback')

    if (!feedback) {
      feedback = document.createElement('div')
      feedback.id = 'clear-history-feedback'
      feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 16px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 16px;
        font-weight: 500;
        color: white;
        z-index: 10000;
        transition: opacity 0.3s ease;
        pointer-events: none;
        text-align: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      `
      document.body.appendChild(feedback)
    }

    // Set colors based on type
    if (type === 'error') {
      feedback.style.backgroundColor = '#d32f2f'
    } else {
      feedback.style.backgroundColor = '#4CAF50'
    }

    feedback.textContent = message
    feedback.style.opacity = '1'

    // Auto-hide after 2.5 seconds
    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback)
        }
      }, 300)
    }, 2500)
  }

  /**
   * Shows temporary status message for history navigation.
   *
   * @param {string} message - Message to display
   * @param {string} type - 'normal' or 'boundary' for styling
   */
  function showHistoryNavigationFeedback (message, type = 'normal') {
    // Create or update feedback element
    let feedback = document.getElementById('history-navigation-feedback')

    if (!feedback) {
      feedback = document.createElement('div')
      feedback.id = 'history-navigation-feedback'
      // TODO: move back to css
      feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: white;
        z-index: 10000;
        transition: opacity 0.3s ease;
        pointer-events: none;
        white-space: nowrap;
      `
      document.body.appendChild(feedback)
    }

    // Set colors based on type
    if (type === 'boundary') {
      feedback.style.backgroundColor = '#ff9800' // Orange for boundary
    } else {
      feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.8)' // Dark for normal
    }

    feedback.textContent = message
    feedback.style.opacity = '1'

    // Auto-hide after 2 seconds
    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback)
        }
      }, 300)
    }, 2000)
  }

  /**
   * Provides visual and audio feedback when reaching history boundaries.
   *
   * @param {string} boundType - 'beginning' or 'end'
   */
  function provideHistoryBoundsFeedback (boundType) {
    // Visual feedback - briefly flash the canvas border
    const canvas = p.canvas
    const originalStyle = canvas.style.border

    // Use orange color for history boundaries
    canvas.style.border = '3px solid #ff9800'

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

      // Use different frequencies for beginning vs end
      oscillator.frequency.setValueAtTime(boundType === 'beginning' ? 300 : 500, audioContext.currentTime)
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

  function resetImageSize (imageIndex) {
    if (imageIndex < 0 || imageIndex >= imageColorPairs.length) {
      console.warn('Invalid image index:', imageIndex)
      return
    }

    imageColorPairs[imageIndex].scale = 1.0
    setManualSizeControl(imageIndex, false)
    requestScreenUpdate()
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

    // Ensure uniqueness - prevent both images from having the same color
    const otherImageIndex = imageIndex === 0 ? 1 : 0
    const otherColor = imageColorPairs[otherImageIndex].color

    // If the new color would conflict with the other image, skip to the next available
    // TODO: also check if new color is same as background and skip (white on white, black on black, etc)
    let newColor = currentColorArray[newColorIndex]
    if (newColor.color === otherColor.color) {
      // Continue in the same direction to find the next unique color
      if (direction === 'next' || direction === 1) {
        newColorIndex = (newColorIndex + 1) % currentColorArray.length
      } else {
        newColorIndex = (newColorIndex - 1 + currentColorArray.length) % currentColorArray.length
      }

      // Safety check to prevent infinite loop
      let attempts = 0
      while (currentColorArray[newColorIndex].color === otherColor.color && attempts < currentColorArray.length) {
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
    setBlendModeAndBackground()

    // Add cleanup on page unload to prevent memory leaks
    window.addEventListener('beforeunload', cleanupGraphicsObjects)

    // Pre-process colors for faster lookups
    initializeColorMaps()

    // Initialize control state
    initializeControlState()

    // Initialize status display dragging
    initializeStatusDragging()

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

    // Initialize Loop Animation Controller
    loopAnimationController = new LoopAnimationController({
      fps: 12,
      onFrameChange: (frame) => {
        console.log('[LoopAnimation Draw] onFrameChange called with frame:', frame)
        if (frame && loopAnimationPanel) {
          // frame.pair.a and frame.pair.b are filenames
          const filenameA = frame.pair.a
          const filenameB = frame.pair.b
          
          console.log('[LoopAnimation Draw] Loading new images:', filenameA, filenameB)

          // Load image A and update layer
          p.loadImage(imgSource + filenameA, (imgA) => {
            console.log('[LoopAnimation Draw] Image A loaded:', filenameA)
            imageColorPairs[0].img = filenameA
            const colorA = Array.isArray(imageColorPairs[0].color) 
              ? imageColorPairs[0].color 
              : imageColorPairs[0].color.color || imageColorPairs[0].color
            imageColorPairs[0].layer = createMonochromeImage(imgA, colorA)
            requestScreenUpdate()
          })

          // Load image B and update layer
          p.loadImage(imgSource + filenameB, (imgB) => {
            console.log('[LoopAnimation Draw] Image B loaded:', filenameB)
            imageColorPairs[1].img = filenameB
            const colorB = Array.isArray(imageColorPairs[1].color) 
              ? imageColorPairs[1].color 
              : imageColorPairs[1].color.color || imageColorPairs[1].color
            imageColorPairs[1].layer = createMonochromeImage(imgB, colorB)
            requestScreenUpdate()
          })

          loopAnimationPanel.updateFrame(frame)
        }
      },
      onPlayStateChange: (state) => {
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
            loopAnimationPanel.updateAll()
          }
        }
      }
    })

    // Initialize Loop Animation Panel
    loopAnimationPanel = new LoopAnimationPanel(loopAnimationController)
    loopAnimationPanel.mount()
    loopAnimationPanel.updateAll()

    // Helper function to update loop controller image sets
    function updateLoopControllerImageSets () {
      const imageSetA = controlState.themeAssignments?.[0] ? filterImages(imgs, getThemeById(controlState.themeAssignments[0])?.filter || {}) : imgs
      const imageSetB = controlState.themeAssignments?.[1] ? filterImages(imgs, getThemeById(controlState.themeAssignments[1])?.filter || {}) : imgs

      console.log('[LoopAnimation] Updating image sets:', {
        imageSetA: imageSetA.length,
        imageSetB: imageSetB.length,
        totalImgs: imgs.length
      })

      loopAnimationController.setImageSets(imageSetA, imageSetB)
      if (loopAnimationPanel) {
        loopAnimationPanel.updateLoopLengthInput()
        loopAnimationPanel.updateAll()
      }
    }

    // Update image sets on initialization
    updateLoopControllerImageSets()

    // Store reference for later updates
    window.updateLoopControllerImageSets = updateLoopControllerImageSets

    // Initialize FilterModal
    filterModal = new FilterModal({
      totalImages: imgs.length,
      onFilterChange: (searchString) => {
        controlState.activeFilter.searchString = searchString
        controlState.filteredImgs = filterImages(imgs, controlState.activeFilter)
        filterModal.updateStats(controlState.filteredImgs.length)
        filterModal.updateList(controlState.filteredImgs)

        // Persist to localStorage
        localStorage.setItem('duochrome-filter', JSON.stringify(controlState.activeFilter))

        // Update visual indicator
        const filterOpenBtn = document.getElementById('filter-open-btn')
        if (filterOpenBtn) {
          if (searchString.trim() !== '') {
            filterOpenBtn.classList.add('active')
          } else {
            filterOpenBtn.classList.remove('active')
          }
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

    // If we restored a filter from localStorage, we need to sync the UI
    if (controlState.activeFilter.searchString) {
      filterModal.currentFilter = controlState.activeFilter.searchString
      filterModal.input.value = controlState.activeFilter.searchString
      filterModal.updateStats(controlState.filteredImgs.length)
      filterModal.updateList(controlState.filteredImgs)

      const filterOpenBtn = document.getElementById('filter-open-btn')
      if (filterOpenBtn) {
        filterOpenBtn.classList.add('active')
      }
    } else {
      // Initial populate with all images
      filterModal.updateList(imgs)
    }
    const filterOpenBtn = document.getElementById('filter-open-btn')
    if (filterOpenBtn) {
      filterOpenBtn.addEventListener('click', (e) => {
        e.stopPropagation() // Prevent triggering p.mousePressed
        if (filterModal) {
          filterModal.show()
        }
      })
    }

    // Try to restore composition from URL, otherwise initialize random pairs
    if (!restoreCompositionFromURL()) {
      initializeImageColorPairs() // Initialize both pairs initially
      updateImageColorPair(0)
      updateImageColorPair(1)
    }
  }

  p.mousePressed = function (event) {
    // Don't update images if currently dragging status display
    if (controlState.isDraggingStatus) {
      return
    }

    // Don't update images if clear history dialog is visible
    const clearHistoryDialog = document.getElementById('clear-history-dialog')
    if (clearHistoryDialog && !clearHistoryDialog.classList.contains('hidden')) {
      return
    }

    // Don't update images if clicking on filmstrip panel
    if (filmstripPanel && filmstripPanel.isVisible) {
      const filmstripElement = document.getElementById('filmstrip-panel')
      if (filmstripElement && event && event.target) {
        // Check if click target is within filmstrip
        if (filmstripElement.contains(event.target)) {
          return
        }
      }
    }

    // Don't update images if clicking on filter button or modal
    if (event && event.target) {
      const filterBtn = document.getElementById('filter-open-btn')
      const filterModal = document.getElementById('filter-modal')
      
      // Check filter button
      if (filterBtn && (filterBtn === event.target || filterBtn.contains(event.target))) {
        return
      }

      // Check filter modal (if visible)
      if (filterModal && !filterModal.classList.contains('hidden') && filterModal.contains(event.target)) {
        return
      }
    }

    // Don't update images if clicking on loop animation panel
    if (event && event.target) {
      const loopPanel = document.getElementById('loop-animation-panel')
      if (loopPanel && loopPanel.contains(event.target)) {
        return
      }
    }

    loadNewImagesAndColors() // Update one pair at a time
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
      toggleBackgroundColor()
      regenerateLayers()
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
    } else if (p.key === 'm') {
      cycleBlendMode()
    } else if (p.key === 'p' || p.keyCode === 32) {
      pause = !pause
      console.log(`pause: ${pause}`)
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
    if (!pause && p.frameCount % 30 === 0) {
      loadNewImagesAndColors()
      if (autoSave) {
        p.saveCanvas(generateFilename())
      }
    }
  }

  /**
   * URL-based Composition Sharing System
   *
   * Functions for encoding current composition state into URL parameters
   * and restoring compositions from shared URLs.
   */

  /**
   * Generates a shareable URL and uses the Web Share API if available.
   * Falls back to copying the URL to the clipboard.
   */
  async function generateShareURL () {
    try {
      const params = serializeCompositionState()
      const baseURL = `${window.location.origin}${window.location.pathname}`
      const shareURL = `${baseURL}?${params.toString()}`

      // Update browser URL without adding to history
      window.history.replaceState(null, null, shareURL)

      const shareData = {
        title: 'Duo-Chrome Composition',
        text: 'Check out this duotone composition I made!',
        url: shareURL
      }

      // Use Web Share API if available
      if (navigator.share && navigator.canShare(shareData)) {
        console.log('Using Web Share API')
        await navigator.share(shareData)
        showShareFeedback('Composition shared!')
      } else {
        // Fallback to copying to clipboard
        console.log('Web Share API not available, falling back to clipboard')
        await copyToClipboard(shareURL)
        showShareFeedback('URL copied to clipboard!')
      }

      console.log('Share URL generated:', shareURL)
    } catch (error) {
      // Don't show an error if the user cancels the share sheet
      if (error.name !== 'AbortError') {
        console.error('Failed to share:', error)
        showShareFeedback('Failed to share composition', 'error')
      } else {
        console.log('Share action cancelled by user.')
      }
    }
  }

  /**
   * Serializes the current composition state into URL parameters.
   * @returns {URLSearchParams} - Encoded composition parameters
   */
  function serializeCompositionState () {
    const params = new URLSearchParams()

    // Image indices
    params.set('imageA', controlState.imageIndices[0])
    params.set('imageB', controlState.imageIndices[1])

    // Colors (use color names for readability)
    if (imageColorPairs[0].color) {
      params.set('colorA', imageColorPairs[0].color.name)
    }
    if (imageColorPairs[1].color) {
      params.set('colorB', imageColorPairs[1].color.name)
    }

    // Scales
    params.set('scaleA', parseFloat(imageColorPairs[0].scale).toFixed(2))
    params.set('scaleB', parseFloat(imageColorPairs[1].scale).toFixed(2))

    // Visual settings
    params.set('blendMode', currentBlendModeIndex)
    params.set('bgMode', currentBackgroundModeIndex)
    params.set('palette', colorIndex)

    // Active image
    params.set('active', controlState.activeImageIndex)

    // Version parameter for future compatibility
    params.set('v', '1')

    return params
  }

  /**
   * Restores composition state from URL parameters.
   * Called on page load to recreate shared compositions.
   */
  function restoreCompositionFromURL () {
    const params = new URLSearchParams(window.location.search)

    const imageA = params.get('imageA')
    const imageB = params.get('imageB')

    // Check if this is a shared composition
    if (!imageA && !imageB) {
      return false // No composition to restore
    }

    console.log('Restoring composition from URL:', window.location.search)

    try {
      // Restore palette first
      const paletteParam = params.get('palette')
      if (paletteParam) {
        const paletteIndex = parseInt(paletteParam)
        if (paletteIndex >= 0 && paletteIndex < COLOR_MAPS.length) {
          colorIndex = paletteIndex
        }
      }

      // Restore image indices
      if (imageA) {
        const imageAIndex = parseInt(imageA)
        if (imageAIndex >= 0 && imageAIndex < imgs.length) {
          controlState.imageIndices[0] = imageAIndex
          imageColorPairs[0].img = imgs[imageAIndex]
        }
      }

      if (imageB) {
        const imageBIndex = parseInt(imageB)
        if (imageBIndex >= 0 && imageBIndex < imgs.length) {
          controlState.imageIndices[1] = imageBIndex
          imageColorPairs[1].img = imgs[imageBIndex]
        }
      }

      // Restore colors using the optimized color map
      const colorAName = params.get('colorA')
      if (colorAName) {
        const colorA = COLOR_MAPS[colorIndex].get(colorAName)
        if (colorA) {
          imageColorPairs[0].color = colorA
        }
      }

      const colorBName = params.get('colorB')
      if (colorBName) {
        const colorB = COLOR_MAPS[colorIndex].get(colorBName)
        if (colorB) {
          imageColorPairs[1].color = colorB
        }
      }

      // Restore scales
      const scaleAParam = params.get('scaleA')
      if (scaleAParam) {
        const scaleA = parseFloat(scaleAParam)
        if (scaleA >= 0.05 && scaleA <= 5.0) {
          imageColorPairs[0].scale = scaleA.toFixed(2)
          controlState.manualSizeControl[0] = true
        }
      }

      const scaleBParam = params.get('scaleB')
      if (scaleBParam) {
        const scaleB = parseFloat(scaleBParam)
        if (scaleB >= 0.05 && scaleB <= 5.0) {
          imageColorPairs[1].scale = scaleB.toFixed(2)
          controlState.manualSizeControl[1] = true
        }
      }

      // Restore visual settings
      const blendModeParam = params.get('blendMode')
      if (blendModeParam) {
        const blendIndex = parseInt(blendModeParam)
        const currentBgMode = backgroundModes[currentBackgroundModeIndex]
        if (blendIndex >= 0 && blendIndex < currentBgMode.blendModes.length) {
          currentBlendModeIndex = blendIndex
        }
      }

      const bgModeParam = params.get('bgMode')
      if (bgModeParam) {
        const bgIndex = parseInt(bgModeParam)
        if (bgIndex >= 0 && bgIndex < backgroundModes.length) {
          currentBackgroundModeIndex = bgIndex
          // Reset blend mode for new background
          currentBlendModeIndex = 0
          if (blendModeParam) {
            const blendIndex = parseInt(blendModeParam)
            const newBgMode = backgroundModes[currentBackgroundModeIndex]
            if (blendIndex >= 0 && blendIndex < newBgMode.blendModes.length) {
              currentBlendModeIndex = blendIndex
            }
          }
        }
      }

      // Restore active image
      const activeParam = params.get('active')
      if (activeParam) {
        const activeIndex = parseInt(activeParam)
        if (activeIndex === 0 || activeIndex === 1) {
          controlState.activeImageIndex = activeIndex
        }
      }

      // Mark as manual mode since this is a curated composition
      controlState.isManualMode = true

      // Pause the app to preserve the shared composition
      pause = true
      console.log('App paused to preserve shared composition')

      // Load the images with restored state
      loadRestoredImages()

      // Show feedback that composition was loaded
      showShareFeedback('Composition loaded from URL')

      console.log('Composition restored successfully')
      return true
    } catch (error) {
      console.error('Failed to restore composition from URL:', error)
      showShareFeedback('Failed to load composition from URL', 'error')
      return false
    }
  }

  /**
   * Loads images for restored composition state.
   * Creates monochrome layers with the restored colors and scales.
   */
  function loadRestoredImages () {
    let loadedCount = 0
    const totalImages = imageColorPairs.filter(pair => pair.img && pair.color).length

    imageColorPairs.forEach((pair, index) => {
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

  /**
   * Copies text to clipboard with fallback for older browsers.
   * @param {string} text - Text to copy to clipboard
   */
  async function copyToClipboard (text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error)
    }
  }

  /**
   * Shows user feedback for share actions.
   * @param {string} message - Message to display
   * @param {string} type - 'success' or 'error'
   */
  function showShareFeedback (message, type = 'success') {
    // Create or update feedback element
    let feedback = document.getElementById('share-feedback')

    if (!feedback) {
      feedback = document.createElement('div')
      feedback.id = 'share-feedback'
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: white;
        z-index: 10000;
        transition: opacity 0.3s ease;
        pointer-events: none;
        max-width: 300px;
        word-wrap: break-word;
      `
      document.body.appendChild(feedback)
    }

    // Set colors based on type
    feedback.style.backgroundColor = type === 'error' ? '#ff4444' : '#4CAF50'
    feedback.textContent = message
    feedback.style.opacity = '1'

    // Auto-hide after 3 seconds
    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback)
        }
      }, 300)
    }, 3000)
  }

  function setBlendModeAndBackground () {
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex]
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]])
    p.background(p.color(...currentBackgroundMode.color))
  }

  function toggleBackgroundColor () {
    currentBackgroundModeIndex =
      (currentBackgroundModeIndex + 1) % backgroundModes.length
    currentBlendModeIndex = 0 // Reset to the first blend mode for the new background
    setBlendModeAndBackground()
    requestScreenUpdate()
    showStatusDisplay()

    // Capture to history immediately (discrete action)
    captureHistoryImmediate('manual')
  }

  function regenerateLayers () {
    imageColorPairs.forEach((pair, index) => {
      if (pair.img && pair.color) {
        p.loadImage(imgSource + pair.img, function (img) {
          if (
            imageColorPairs[index].layer &&
            imageColorPairs[index].layer.remove
          ) {
            imageColorPairs[index].layer.remove()
          }
          imageColorPairs[index].layer = createMonochromeImage(
            img,
            p.color(pair.color.color)
          )
          requestScreenUpdate()
        })
      }
    })
  }

  function cycleBlendMode () {
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex]
    currentBlendModeIndex =
      (currentBlendModeIndex + 1) % currentBackgroundMode.blendModes.length
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]])
    requestScreenUpdate()
    showStatusDisplay()

    // Capture to history immediately (discrete action)
    captureHistoryImmediate('manual')
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
        controlState.activeFilter = JSON.parse(savedFilter)
        controlState.filteredImgs = filterImages(imgs, controlState.activeFilter)
      } catch (e) {
        console.warn('Failed to parse saved filter:', e)
        controlState.activeFilter = { searchString: '' }
        controlState.filteredImgs = [...imgs]
      }
    }

    console.log('Control state initialized:', controlState)
  }

  function initializeImageColorPairs () {
    imageColorPairs[0].img = getRandomUniqueItem(imgs, [])
    imageColorPairs[0].color = getRandomUniqueItem(ALL_PALETTES[colorIndex], [])
    imageColorPairs[1].img = getRandomUniqueItem(imgs, [imageColorPairs[0].img])
    imageColorPairs[1].color = getRandomUniqueItem(ALL_PALETTES[colorIndex], [
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
    const selectedColor = getRandomUniqueItem(
      ALL_PALETTES[colorIndex],
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

  // Visual Feedback System
  function drawActiveImageIndicator () {
    const activeIndex = controlState.activeImageIndex
    const activePair = imageColorPairs[activeIndex]

    if (!activePair.layer) return

    // Calculate the position and size of the active image
    const imageWidth = activePair.layer.width * activePair.scale
    const imageHeight = activePair.layer.height * activePair.scale
    const imageX = p.width / 2
    const imageY = p.height / 2

    // Save current drawing state
    p.push()

    // Use normal blend mode for better control
    p.blendMode(p.BLEND)

    // Use contrasting color based on background
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex]
    const isLightBackground = currentBackgroundMode.color[0] > 127

    // Use high-contrast colors that work on both backgrounds
    const borderColor = isLightBackground ? p.color(0, 0, 0, 255) : p.color(255, 255, 255, 255)
    const shadowColor = isLightBackground ? p.color(255, 255, 255, 200) : p.color(0, 0, 0, 200)

    // Draw border around active image with shadow for visibility
    p.rectMode(p.CENTER)
    p.noFill()

    // Draw shadow/outline first
    p.stroke(shadowColor)
    p.strokeWeight(6)
    p.rect(imageX, imageY, imageWidth + 8, imageHeight + 8)

    // Draw main border
    p.stroke(borderColor)
    p.strokeWeight(3)
    p.rect(imageX, imageY, imageWidth + 8, imageHeight + 8)

    // Draw corner indicators for extra visibility
    const cornerSize = 20
    const halfWidth = (imageWidth + 8) / 2
    const halfHeight = (imageHeight + 8) / 2

    // Draw corner shadows first
    p.stroke(shadowColor)
    p.strokeWeight(4)

    // Top-left corner
    p.line(imageX - halfWidth, imageY - halfHeight, imageX - halfWidth + cornerSize, imageY - halfHeight)
    p.line(imageX - halfWidth, imageY - halfHeight, imageX - halfWidth, imageY - halfHeight + cornerSize)

    // Top-right corner
    p.line(imageX + halfWidth, imageY - halfHeight, imageX + halfWidth - cornerSize, imageY - halfHeight)
    p.line(imageX + halfWidth, imageY - halfHeight, imageX + halfWidth, imageY - halfHeight + cornerSize)

    // Bottom-left corner
    p.line(imageX - halfWidth, imageY + halfHeight, imageX - halfWidth + cornerSize, imageY + halfHeight)
    p.line(imageX - halfWidth, imageY + halfHeight, imageX - halfWidth, imageY + halfHeight - cornerSize)

    // Bottom-right corner
    p.line(imageX + halfWidth, imageY + halfHeight, imageX + halfWidth - cornerSize, imageY + halfHeight)
    p.line(imageX + halfWidth, imageY + halfHeight, imageX + halfWidth, imageY + halfHeight - cornerSize)

    // Draw main corner indicators
    p.stroke(borderColor)
    p.strokeWeight(2)

    // Top-left corner
    p.line(imageX - halfWidth, imageY - halfHeight, imageX - halfWidth + cornerSize, imageY - halfHeight)
    p.line(imageX - halfWidth, imageY - halfHeight, imageX - halfWidth, imageY - halfHeight + cornerSize)

    // Top-right corner
    p.line(imageX + halfWidth, imageY - halfHeight, imageX + halfWidth - cornerSize, imageY - halfHeight)
    p.line(imageX + halfWidth, imageY - halfHeight, imageX + halfWidth, imageY - halfHeight + cornerSize)

    // Bottom-left corner
    p.line(imageX - halfWidth, imageY + halfHeight, imageX - halfWidth + cornerSize, imageY + halfHeight)
    p.line(imageX - halfWidth, imageY + halfHeight, imageX - halfWidth, imageY + halfHeight - cornerSize)

    // Bottom-right corner
    p.line(imageX + halfWidth, imageY + halfHeight, imageX + halfWidth - cornerSize, imageY + halfHeight)
    p.line(imageX + halfWidth, imageY + halfHeight, imageX + halfWidth, imageY + halfHeight - cornerSize)

    // Draw label indicating which image is active
    p.noStroke()
    p.textAlign(p.CENTER, p.CENTER)
    p.textSize(16)
    p.textStyle(p.BOLD)

    // Position label at top of the indicator
    const labelY = imageY - halfHeight - 25
    const labelText = activeIndex === 0 ? 'IMAGE A' : 'IMAGE B'
    const textWidth = p.textWidth(labelText)

    // Draw background shadow for label
    p.fill(shadowColor)
    p.rect(imageX + 1, labelY + 1, textWidth + 12, 22, 5)

    // Draw background for label
    p.fill(isLightBackground ? p.color(255, 255, 255, 220) : p.color(0, 0, 0, 220))
    p.rect(imageX, labelY, textWidth + 10, 20, 5)

    // Draw label text shadow
    p.fill(shadowColor)
    p.text(labelText, imageX + 1, labelY + 1)

    // Draw label text
    p.fill(borderColor)
    p.text(labelText, imageX, labelY)

    // Restore drawing state
    p.pop()
  }

  /**
   * Status Display System
   *
   * Manages the draggable status overlay that shows current image information.
   * Displays image filenames, colors, scale factors, and active image highlighting.
   * Supports temporary and permanent display modes with session-persistent positioning.
   */

  /**
   * Updates the status display with current image information.
   * Shows filenames, color names, scale factors, and active image highlighting.
   * Called automatically when image properties change.
   */
  function updateStatusDisplay () {
    const statusOverlay = document.getElementById('status-overlay')
    if (!statusOverlay) return

    // helper to format filenames
    const formatName = (filename) => {
      if (!filename) return '-'
      // Remove extension
      const name = filename.replace(/\.[^/.]+$/, '')
      // Replace delimiters with spaces for natural wrapping
      return name.replace(/[_-]/g, ' ')
    }

    // Update filenames
    const filenameA = document.getElementById('status-filename-a')
    const filenameB = document.getElementById('status-filename-b')

    if (filenameA && imageColorPairs[0].img) {
      filenameA.textContent = formatName(imageColorPairs[0].img)
      filenameA.title = imageColorPairs[0].img // Tooltip
    }

    if (filenameB && imageColorPairs[1].img) {
      filenameB.textContent = formatName(imageColorPairs[1].img)
      filenameB.title = imageColorPairs[1].img // Tooltip
    }

    // Update color names
    const colorA = document.getElementById('status-color-a')
    const colorB = document.getElementById('status-color-b')

    if (colorA && imageColorPairs[0].color) {
      colorA.textContent = imageColorPairs[0].color.name
    }

    if (colorB && imageColorPairs[1].color) {
      colorB.textContent = imageColorPairs[1].color.name
    }

    // Update Theme Assignments
    const themeA = document.getElementById('status-theme-a')
    const themeB = document.getElementById('status-theme-b')
    const assignments = controlState.themeAssignments || [null, null]

    if (themeA) {
      if (assignments[0]) {
        const theme = getThemeById(assignments[0])
        if (theme) {
          const count = filterImages(imgs, theme.filter).length
          themeA.textContent = `Theme: ${theme.name}${count === 0 ? ' (Empty)' : ''}`
          themeA.style.color = count === 0 ? '#ff9800' : '#4CAF50'
        } else {
          themeA.textContent = 'Theme: Unknown'
          themeA.style.color = '#aaa'
        }
      } else {
        themeA.textContent = 'Theme: None'
        themeA.style.color = '#aaa'
      }
    }

    if (themeB) {
      if (assignments[1]) {
        const theme = getThemeById(assignments[1])
        if (theme) {
          const count = filterImages(imgs, theme.filter).length
          themeB.textContent = `Theme: ${theme.name}${count === 0 ? ' (Empty)' : ''}`
          themeB.style.color = count === 0 ? '#ff9800' : '#4CAF50'
        } else {
          themeB.textContent = 'Theme: Unknown'
          themeB.style.color = '#aaa'
        }
      } else {
        themeB.textContent = 'Theme: None'
        themeB.style.color = '#aaa'
      }
    }

    // Update scale factors
    const scaleA = document.getElementById('status-scale-a')
    const scaleB = document.getElementById('status-scale-b')

    if (scaleA) {
      scaleA.textContent = parseFloat(imageColorPairs[0].scale).toFixed(2)
    }

    if (scaleB) {
      scaleB.textContent = parseFloat(imageColorPairs[1].scale).toFixed(2)
    }

    // Update active image highlighting
    const statusImageA = document.getElementById('status-image-a')
    const statusImageB = document.getElementById('status-image-b')

    if (statusImageA && statusImageB) {
      statusImageA.classList.toggle('active', controlState.activeImageIndex === 0)
      statusImageB.classList.toggle('active', controlState.activeImageIndex === 1)
    }

    // Update Blend Mode
    const blendModeVal = document.getElementById('status-blend-mode-value')
    if (blendModeVal) {
      const currentBgMode = backgroundModes[currentBackgroundModeIndex]
      const modeName = currentBgMode.blendModes[currentBlendModeIndex]
      blendModeVal.textContent = modeName
    }
  }

  function showStatusDisplay (duration = 3000) {
    const statusOverlay = document.getElementById('status-overlay')
    if (!statusOverlay) return

    // Update the display with current information
    updateStatusDisplay()

    // Show the overlay
    statusOverlay.classList.remove('hidden', 'fade-out')

    // Clear any existing timeout
    if (controlState.statusTimeout) {
      clearTimeout(controlState.statusTimeout)
      controlState.statusTimeout = null
    }

    // Set timeout to hide the overlay (only if duration > 0)
    if (duration > 0) {
      controlState.statusIsPermanent = false
      controlState.statusTimeout = setTimeout(() => {
        hideStatusDisplay()
      }, duration)
    } else {
      controlState.statusIsPermanent = true
    }
  }

  function hideStatusDisplay () {
    const statusOverlay = document.getElementById('status-overlay')
    if (!statusOverlay) return

    // Reset permanent flag and clear timeout
    controlState.statusIsPermanent = false
    if (controlState.statusTimeout) {
      clearTimeout(controlState.statusTimeout)
      controlState.statusTimeout = null
    }

    // Add fade-out class for smooth transition
    statusOverlay.classList.add('fade-out')

    // Hide after transition completes
    setTimeout(() => {
      statusOverlay.classList.add('hidden')
      statusOverlay.classList.remove('fade-out')
    }, 300)
  }

  function toggleStatusDisplay () {
    const statusOverlay = document.getElementById('status-overlay')
    if (!statusOverlay) return

    if (statusOverlay.classList.contains('hidden')) {
      showStatusDisplay(0) // Show permanently when manually toggled
    } else {
      hideStatusDisplay()
    }
  }

  // Status Display Dragging System
  function initializeStatusDragging () {
    const statusOverlay = document.getElementById('status-overlay')
    if (!statusOverlay) return

    let isDragging = false
    const dragOffset = { x: 0, y: 0 }

    // Load saved position from session storage
    const savedPosition = sessionStorage.getItem('duo-chrome-status-position')
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition)
        controlState.statusPosition = position
        updateStatusPosition()
      } catch (error) {
        console.warn('Failed to load status position:', error)
      }
    } else {
      // Set initial position
      updateStatusPosition()
    }

    // Prevent clicks on status overlay from reaching canvas
    statusOverlay.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
    })

    statusOverlay.addEventListener('mousedown', (e) => {
      e.stopPropagation()
    })

    // Make the status header draggable
    const statusHeader = statusOverlay.querySelector('.status-header')
    if (!statusHeader) return

    statusHeader.style.cursor = 'grab'

    statusHeader.addEventListener('mousedown', (e) => {
      isDragging = true
      controlState.isDraggingStatus = true
      statusHeader.style.cursor = 'grabbing'

      const rect = statusOverlay.getBoundingClientRect()
      dragOffset.x = e.clientX - rect.left
      dragOffset.y = e.clientY - rect.top

      // Pause timeout during drag
      if (controlState.statusTimeout) {
        clearTimeout(controlState.statusTimeout)
        controlState.statusTimeout = null
      }

      e.preventDefault()
      e.stopPropagation() // Prevent event bubbling
    })

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Constrain to viewport bounds
      const maxX = window.innerWidth - statusOverlay.offsetWidth
      const maxY = window.innerHeight - statusOverlay.offsetHeight

      controlState.statusPosition.x = Math.max(0, Math.min(newX, maxX))
      controlState.statusPosition.y = Math.max(0, Math.min(newY, maxY))

      updateStatusPosition()

      e.preventDefault()
    })

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false
        controlState.isDraggingStatus = false
        statusHeader.style.cursor = 'grab'

        // Save position to session storage
        sessionStorage.setItem('duo-chrome-status-position', JSON.stringify(controlState.statusPosition))

        // Resume timeout only if status display was temporary (not manually toggled)
        if (!statusOverlay.classList.contains('hidden') && !controlState.statusIsPermanent) {
          showStatusDisplay(3000) // Resume with 3 second timeout
        }
      }
    })

    // Touch support for mobile devices
    statusHeader.addEventListener('touchstart', (e) => {
      isDragging = true
      controlState.isDraggingStatus = true

      const touch = e.touches[0]
      const rect = statusOverlay.getBoundingClientRect()
      dragOffset.x = touch.clientX - rect.left
      dragOffset.y = touch.clientY - rect.top

      // Pause timeout during drag
      if (controlState.statusTimeout) {
        clearTimeout(controlState.statusTimeout)
        controlState.statusTimeout = null
      }

      e.preventDefault()
      e.stopPropagation() // Prevent event bubbling
    })

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return

      const touch = e.touches[0]
      const newX = touch.clientX - dragOffset.x
      const newY = touch.clientY - dragOffset.y

      // Constrain to viewport bounds
      const maxX = window.innerWidth - statusOverlay.offsetWidth
      const maxY = window.innerHeight - statusOverlay.offsetHeight

      controlState.statusPosition.x = Math.max(0, Math.min(newX, maxX))
      controlState.statusPosition.y = Math.max(0, Math.min(newY, maxY))

      updateStatusPosition()

      e.preventDefault()
    })

    document.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false
        controlState.isDraggingStatus = false

        // Save position to session storage
        sessionStorage.setItem('duo-chrome-status-position', JSON.stringify(controlState.statusPosition))

        // Resume timeout only if status display was temporary (not manually toggled)
        const statusOverlay = document.getElementById('status-overlay')
        if (statusOverlay && !statusOverlay.classList.contains('hidden') && !controlState.statusIsPermanent) {
          showStatusDisplay(3000) // Resume with 3 second timeout
        }
      }
    })
  }

  function updateStatusPosition () {
    const statusOverlay = document.getElementById('status-overlay')
    if (!statusOverlay) return

    statusOverlay.style.left = `${controlState.statusPosition.x}px`
    statusOverlay.style.top = `${controlState.statusPosition.y}px`
  }

  /**
   * Performance-optimized screen update function.
   * Only redraws when necessary and uses cached scaled images when possible.
   */
  function updateScreen () {
    // Skip unnecessary redraws for performance
    if (!controlState.needsRedraw) {
      return
    }

    // Performance monitoring
    const startTime = performance.now()

    p.clear()
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex]
    p.background(currentBackgroundMode.color)
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]])

    // Render images with optimized scaling
    imageColorPairs.forEach((pair, index) => {
      if (pair.layer) {
        const scaledWidth = pair.layer.width * pair.scale
        const scaledHeight = pair.layer.height * pair.scale

        p.image(
          pair.layer,
          p.width / 2,
          p.height / 2,
          scaledWidth,
          scaledHeight
        )
      }
    })

    // Draw active image indicator only if enabled
    if (controlState.showIndicators) {
      drawActiveImageIndicator()
    }

    // Mark redraw as complete
    controlState.needsRedraw = false

    // Performance monitoring
    const endTime = performance.now()
    const frameTime = endTime - startTime

    // Log performance warnings for slow frames (> 16.67ms = 60fps)
    if (frameTime > 16.67) {
      console.warn(`Slow frame detected: ${frameTime.toFixed(2)}ms (target: 16.67ms for 60fps)`)
    }

    // Update performance tracking
    controlState.lastFrameTime = frameTime
    controlState.frameCount++
  }

  /**
   * Marks the screen as needing a redraw.
   * Call this instead of updateScreen() directly to enable performance optimizations.
   */
  function requestScreenUpdate () {
    controlState.needsRedraw = true

    // Use requestAnimationFrame for smooth 60fps updates
    if (!controlState.animationFrameRequested) {
      controlState.animationFrameRequested = true
      requestAnimationFrame(() => {
        updateScreen()
        controlState.animationFrameRequested = false
      })
    }
  }

  /**
   * Performance monitoring and optimization utilities
   */
  function getPerformanceStats () {
    return {
      lastFrameTime: controlState.lastFrameTime,
      frameCount: controlState.frameCount,
      averageFrameTime: controlState.frameCount > 0
        ? (controlState.totalFrameTime || controlState.lastFrameTime) / controlState.frameCount
        : 0
    }
  }

  /**
   * Cleanup function to remove all graphics objects and prevent memory leaks
   */
  function cleanupGraphicsObjects () {
    console.log('Cleaning up graphics objects...')

    // Clean up image layers
    imageColorPairs.forEach((pair, index) => {
      if (pair.layer && pair.layer.remove) {
        console.log(`Removing layer for image ${index}`)
        pair.layer.remove()
        pair.layer = null
      }
    })

    // Clean up the shared color layer
    if (colorLayer1 && colorLayer1.remove) {
      console.log('Removing shared color layer')
      colorLayer1.remove()
      colorLayer1 = null
    }

    console.log('Graphics cleanup complete')
  }

  /**
   * Debug function to count canvas elements in the DOM
   * Useful for monitoring memory leaks
   */
  function debugCanvasCount () {
    const canvases = document.querySelectorAll('canvas')
    console.log(`Total canvas elements in DOM: ${canvases.length}`)

    // Count by size to identify the problematic 100x100 elements
    const sizeCount = {}
    canvases.forEach(canvas => {
      const size = `${canvas.width}x${canvas.height}`
      sizeCount[size] = (sizeCount[size] || 0) + 1
    })

    console.log('Canvas elements by size:', sizeCount)
    return { total: canvases.length, bySizes: sizeCount }
  }

  // Add debug function to global scope for console access
  window.debugCanvasCount = debugCanvasCount
  window.cleanupGraphicsObjects = cleanupGraphicsObjects

  /**
   * Optimized layer creation with caching considerations
   */
  function createOptimizedMonochromeImage (img, monoColor, cacheKey = null) {
    // Use existing createMonochromeImage but with performance monitoring
    const startTime = performance.now()
    const layer = createMonochromeImage(img, monoColor)
    const endTime = performance.now()

    const creationTime = endTime - startTime
    if (creationTime > 50) { // Log slow layer creation (> 50ms)
      console.warn(`Slow layer creation: ${creationTime.toFixed(2)}ms for image`)
    }

    return layer
  }

  const createMonochromeImage = (img, monoColor) => {
    const scaleRatio = p.calculateScaleRatio(img)
    const scaledWidth = Math.round(img.width * scaleRatio)
    const scaledHeight = Math.round(img.height * scaleRatio)

    // Create a temporary color layer instead of reusing colorLayer1
    const tempColorLayer = p.createGraphics(scaledWidth, scaledHeight)
    tempColorLayer.background(monoColor)

    const layer = p.createGraphics(scaledWidth, scaledHeight)
    layer.image(img, 0, 0, scaledWidth, scaledHeight)
    layer.drawingContext.globalCompositeOperation = 'source-in'
    layer.image(tempColorLayer, 0, 0, scaledWidth, scaledHeight)

    // Clean up the temporary color layer immediately
    tempColorLayer.remove()

    return layer
  }

  p.calculateScaleRatio = function (img) {
    const maxCanvasSize = Math.min(p.width, p.height) * 0.8
    const maxImgSize = Math.max(img.width, img.height)
    return maxCanvasSize / maxImgSize
  }
}

new p5(sketch) // eslint-disable-line no-new, new-cap
