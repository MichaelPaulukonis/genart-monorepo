/**
 * HistoryManager Class
 *
 * Manages the history stack for duo-chrome compositions.
 * Provides capture, navigation, and state management functionality.
 *
 * Architecture:
 * - Maintains an array of HistoryEntry objects
 * - Tracks current position in history for navigation
 * - Enforces maximum entries limit with oldest entry removal
 * - Prevents capture during navigation to avoid polluting history
 * - Integrates with existing duo-chrome state via references
 */

/* global localStorage */

import { createHistoryEntry, validateHistoryEntry } from './HistoryEntry.js'
import { ThumbnailGenerator } from './ThumbnailGenerator.js'

export class HistoryManager {
  /**
   * Creates a new HistoryManager instance.
   *
   * @param {Object} p5Instance - p5.js instance for rendering
   * @param {Object} stateRefs - References to duo-chrome state objects
   * @param {Array} stateRefs.imageColorPairs - Array of image/color pair objects
   * @param {Object} stateRefs.controlState - Control state object
   * @param {number} stateRefs.colorIndex - Current palette index
   * @param {number} stateRefs.currentBlendModeIndex - Current blend mode index
   * @param {number} stateRefs.currentBackgroundModeIndex - Current background mode index
   * @param {Array} stateRefs.imgs - Array of available image filenames
   */
  constructor (p5Instance, stateRefs) {
    this.p = p5Instance
    this.stateRefs = stateRefs

    // History stack
    this.history = []
    this.currentPosition = -1 // -1 means no history yet

    // Navigation state
    this.isNavigating = false // Prevent capture during navigation

    // Configuration
    this.maxEntries = 500 // Generous limit for lightweight entries

    // Storage configuration
    this.storageKey = 'duo-chrome-history'
    this.storageVersion = 1 // Schema version for future compatibility

    // Error tracking
    this.errorLog = []
    this.maxErrorLogSize = 100 // Keep last 100 errors
    this.errorCounts = {
      storage: 0,
      imageLoad: 0,
      navigation: 0,
      thumbnail: 0,
      validation: 0,
      other: 0
    }

    // Thumbnail generation
    this.thumbnailGenerator = new ThumbnailGenerator(p5Instance, 120)

    console.log('HistoryManager initialized')

    // Load history from storage on initialization
    this.loadFromStorage()
  }

  /**
   * Captures the current composition state and adds it to history.
   *
   * @param {string} source - How the entry was created: 'manual', 'random', 'url', 'modified'
   * @returns {HistoryEntry|null} - The created entry, or null if capture was prevented
   */
  captureCurrentState (source = 'manual') {
    // Don't capture during navigation to avoid polluting history
    if (this.isNavigating) {
      console.log('Skipping capture during navigation')
      return null
    }

    const { imageColorPairs, controlState, colorIndex, currentBlendModeIndex, currentBackgroundModeIndex } = this.stateRefs

    // Validate that we have the necessary state
    if (!imageColorPairs || imageColorPairs.length < 2) {
      console.warn('Cannot capture state: imageColorPairs not ready')
      return null
    }

    if (!imageColorPairs[0].img || !imageColorPairs[1].img) {
      console.warn('Cannot capture state: images not loaded')
      return null
    }

    if (!imageColorPairs[0].color || !imageColorPairs[1].color) {
      console.warn('Cannot capture state: colors not set')
      return null
    }

    // Validate scale values are valid numbers (can be strings or numbers)
    const scaleA = parseFloat(imageColorPairs[0].scale)
    const scaleB = parseFloat(imageColorPairs[1].scale)
    if (!Number.isFinite(scaleA) || !Number.isFinite(scaleB)) {
      console.warn('Cannot capture state: invalid scale values', { scaleA, scaleB })
      return null
    }

    // Create history entry from current state
    const entry = createHistoryEntry({
      imageA: {
        index: controlState.imageIndices[0],
        filename: imageColorPairs[0].img,
        colorName: imageColorPairs[0].color.name,
        scale: scaleA // Use parsed value
      },
      imageB: {
        index: controlState.imageIndices[1],
        filename: imageColorPairs[1].img,
        colorName: imageColorPairs[1].color.name,
        scale: scaleB // Use parsed value
      },
      paletteIndex: colorIndex,
      blendModeIndex: currentBlendModeIndex,
      backgroundModeIndex: currentBackgroundModeIndex,
      activeImageIndex: controlState.activeImageIndex,
      source
    })

    // If we're not at the end of history, truncate forward entries
    // This implements linear history (modifications truncate forward)
    if (this.currentPosition < this.history.length - 1) {
      const removedCount = this.history.length - this.currentPosition - 1
      this.history = this.history.slice(0, this.currentPosition + 1)
      console.log(`Truncated ${removedCount} forward history entries`)
    }

    // Add entry to history
    this.history.push(entry)
    this.currentPosition = this.history.length - 1

    // Enforce maximum entries limit
    if (this.history.length > this.maxEntries) {
      this.history.shift() // Remove oldest entry
      this.currentPosition-- // Adjust position since we removed from beginning
      console.log(`Removed oldest history entry to maintain limit of ${this.maxEntries}`)
    }

    console.log(`Captured history entry: ${entry.id} (source: ${source}, position: ${this.currentPosition + 1}/${this.history.length})`)

    // Automatically save to storage after capturing
    this.saveToStorage()

    return entry
  }

  /**
   * Navigates to a specific position in the history stack.
   *
   * @param {number} position - Target position (0-based index)
   * @returns {boolean} - True if navigation succeeded, false otherwise
   */
  navigateTo (position) {
    // Validate position
    if (position < 0 || position >= this.history.length) {
      console.warn(`Invalid history position: ${position} (valid range: 0-${this.history.length - 1})`)
      return false
    }

    // Get the target entry
    const entry = this.history[position]
    if (!validateHistoryEntry(entry)) {
      console.error('Invalid history entry at position:', position)
      return false
    }

    // Set navigation flag to prevent capture during restoration
    this.isNavigating = true

    try {
      // Update current position
      this.currentPosition = position

      // Restore composition state from entry
      this._restoreCompositionFromEntry(entry)

      console.log(`Navigated to history position ${position + 1}/${this.history.length} (${entry.id})`)

      // Save position change to storage after navigation completes
      // We save here (not after image loading) because we're only persisting
      // the position and metadata, not the actual image data
      this.saveToStorage()

      return true
    } catch (error) {
      console.error('Failed to navigate to history position:', error)
      // Clear navigation flag on error
      this.isNavigating = false
      return false
    }
    // Note: isNavigating flag is cleared in _onImagesLoaded() after async image loading completes
  }

  /**
   * Navigates backward in history (to previous composition).
   *
   * @returns {boolean} - True if navigation succeeded, false if at beginning
   */
  navigateBackward () {
    if (!this.canNavigateBackward()) {
      console.log('Already at beginning of history')
      return false
    }

    return this.navigateTo(this.currentPosition - 1)
  }

  /**
   * Navigates forward in history (to next composition).
   *
   * @returns {boolean} - True if navigation succeeded, false if at end
   */
  navigateForward () {
    if (!this.canNavigateForward()) {
      console.log('Already at end of history')
      return false
    }

    return this.navigateTo(this.currentPosition + 1)
  }

  /**
   * Gets the current history entry.
   *
   * @returns {HistoryEntry|null} - Current entry, or null if no history
   */
  getCurrentEntry () {
    if (this.currentPosition < 0 || this.currentPosition >= this.history.length) {
      return null
    }

    return this.history[this.currentPosition]
  }

  /**
   * Checks if backward navigation is possible.
   *
   * @returns {boolean} - True if can navigate backward
   */
  canNavigateBackward () {
    return this.currentPosition > 0
  }

  /**
   * Checks if forward navigation is possible.
   *
   * @returns {boolean} - True if can navigate forward
   */
  canNavigateForward () {
    return this.currentPosition < this.history.length - 1
  }

  /**
   * Gets the total number of entries in history.
   *
   * @returns {number} - Total entries
   */
  getTotalEntries () {
    return this.history.length
  }

  /**
   * Gets the current position in history (1-based for display).
   *
   * @returns {number} - Current position (1-based), or 0 if no history
   */
  getCurrentPosition () {
    return this.currentPosition + 1
  }

  /**
   * Restores composition state from a history entry.
   * This is an internal method called during navigation.
   *
   * @private
   * @param {HistoryEntry} entry - Entry to restore from
   */
  _restoreCompositionFromEntry (entry) {
    const { imageColorPairs, controlState, ALL_PALETTES, COLOR_MAPS } = this.stateRefs

    try {
      // Validate palette index
      const paletteIndex = this._validatePaletteIndex(entry.paletteIndex, ALL_PALETTES)
      this.stateRefs.colorIndex = paletteIndex

      // Validate and restore blend mode
      const blendModeIndex = this._validateBlendModeIndex(entry.blendModeIndex, entry.backgroundModeIndex)
      this.stateRefs.currentBlendModeIndex = blendModeIndex

      // Validate and restore background mode
      const backgroundModeIndex = this._validateBackgroundModeIndex(entry.backgroundModeIndex)
      this.stateRefs.currentBackgroundModeIndex = backgroundModeIndex

      // Validate and restore active image
      const activeImageIndex = this._validateActiveImageIndex(entry.activeImageIndex)
      controlState.activeImageIndex = activeImageIndex

      // Validate and restore image indices
      const imageIndexA = this._validateImageIndex(entry.imageA.index)
      const imageIndexB = this._validateImageIndex(entry.imageB.index)
      controlState.imageIndices[0] = imageIndexA
      controlState.imageIndices[1] = imageIndexB

      // Restore Image A
      imageColorPairs[0].img = entry.imageA.filename
      imageColorPairs[0].scale = this._validateScale(entry.imageA.scale)
      controlState.manualSizeControl[0] = true // Mark as manually controlled

      // Find color in palette with fallback
      const colorA = this._findColorWithFallback(
        entry.imageA.colorName,
        paletteIndex,
        COLOR_MAPS,
        ALL_PALETTES,
        0
      )
      imageColorPairs[0].color = colorA

      // Restore Image B
      imageColorPairs[1].img = entry.imageB.filename
      imageColorPairs[1].scale = this._validateScale(entry.imageB.scale)
      controlState.manualSizeControl[1] = true // Mark as manually controlled

      // Find color in palette with fallback
      const colorB = this._findColorWithFallback(
        entry.imageB.colorName,
        paletteIndex,
        COLOR_MAPS,
        ALL_PALETTES,
        1
      )
      imageColorPairs[1].color = colorB

      // Load images and regenerate layers with restored state
      this._loadImagesForEntry(entry)
    } catch (error) {
      console.error('Failed to restore composition from entry:', error)
      this._logError('_restoreCompositionFromEntry', error, entry)
      throw error // Re-throw to be handled by navigateTo
    }
  }

  /**
   * Validates and corrects palette index
   * @private
   * @param {number} index - Palette index to validate
   * @param {Array} palettes - Available palettes
   * @returns {number} - Valid palette index
   */
  _validatePaletteIndex (index, palettes) {
    if (typeof index !== 'number' || index < 0 || index >= palettes.length) {
      console.warn(`Invalid palette index ${index}, using default 0`)
      return 0
    }
    return index
  }

  /**
   * Validates and corrects blend mode index
   * @private
   * @param {number} blendIndex - Blend mode index to validate
   * @param {number} bgIndex - Background mode index (for context)
   * @returns {number} - Valid blend mode index
   */
  _validateBlendModeIndex (blendIndex, bgIndex) {
    // Blend modes are 0-5 for each background mode
    if (typeof blendIndex !== 'number' || blendIndex < 0 || blendIndex > 5) {
      console.warn(`Invalid blend mode index ${blendIndex}, using default 0`)
      return 0
    }
    return blendIndex
  }

  /**
   * Validates and corrects background mode index
   * @private
   * @param {number} index - Background mode index to validate
   * @returns {number} - Valid background mode index
   */
  _validateBackgroundModeIndex (index) {
    // Background modes are 0 (black) or 1 (white)
    if (typeof index !== 'number' || (index !== 0 && index !== 1)) {
      console.warn(`Invalid background mode index ${index}, using default 0`)
      return 0
    }
    return index
  }

  /**
   * Validates and corrects active image index
   * @private
   * @param {number} index - Active image index to validate
   * @returns {number} - Valid active image index
   */
  _validateActiveImageIndex (index) {
    // Active image is 0 or 1
    if (typeof index !== 'number' || (index !== 0 && index !== 1)) {
      console.warn(`Invalid active image index ${index}, using default 0`)
      return 0
    }
    return index
  }

  /**
   * Validates and corrects image index
   * @private
   * @param {number} index - Image index to validate
   * @returns {number} - Valid image index
   */
  _validateImageIndex (index) {
    const { imgs } = this.stateRefs
    if (typeof index !== 'number' || index < 0 || index >= imgs.length) {
      console.warn(`Invalid image index ${index}, using default 0`)
      return 0
    }
    return index
  }

  /**
   * Validates and corrects scale value
   * @private
   * @param {number} scale - Scale value to validate
   * @returns {number} - Valid scale value
   */
  _validateScale (scale) {
    const parsed = parseFloat(scale)
    if (!Number.isFinite(parsed) || parsed < 0.05 || parsed > 5.0) {
      console.warn(`Invalid scale value ${scale}, using default 1.0`)
      return 1.0
    }
    return parsed
  }

  /**
   * Finds a color in the palette with fallback handling
   * @private
   * @param {string} colorName - Color name to find
   * @param {number} paletteIndex - Palette index
   * @param {Map[]} colorMaps - Color lookup maps
   * @param {Array} palettes - All palettes
   * @param {number} fallbackIndex - Fallback color index (0 or 1)
   * @returns {Object} - Color object
   */
  _findColorWithFallback (colorName, paletteIndex, colorMaps, palettes, fallbackIndex) {
    try {
      // Try to find color in specified palette
      const color = colorMaps[paletteIndex].get(colorName)
      if (color) {
        return color
      }

      console.warn(`Color "${colorName}" not found in palette ${paletteIndex}`)

      // Try to find color in other palettes
      for (let i = 0; i < colorMaps.length; i++) {
        if (i === paletteIndex) continue
        const altColor = colorMaps[i].get(colorName)
        if (altColor) {
          console.log(`Found color "${colorName}" in alternate palette ${i}`)
          return altColor
        }
      }

      // Fallback to default color in current palette
      console.warn(`Using fallback color at index ${fallbackIndex} in palette ${paletteIndex}`)
      return palettes[paletteIndex][fallbackIndex]
    } catch (error) {
      console.error('Error finding color, using emergency fallback:', error)
      // Emergency fallback: return first color in first palette
      return palettes[0][0]
    }
  }

  /**
   * Loads images for a history entry and regenerates layers.
   * Integrates with the existing image loading system.
   *
   * @private
   * @param {HistoryEntry} entry - Entry to load images for
   */
  _loadImagesForEntry (entry) {
    const { imageColorPairs, imgs } = this.stateRefs
    const imgSource = './images/'
    let loadedCount = 0
    const totalImages = 2
    const loadErrors = []

    // Validate image filenames exist in available images
    const imageAValid = imgs.includes(entry.imageA.filename)
    const imageBValid = imgs.includes(entry.imageB.filename)

    if (!imageAValid) {
      console.error(`Image A not found in available images: ${entry.imageA.filename}`)
      loadErrors.push({ image: 'A', filename: entry.imageA.filename, reason: 'not in image list' })
    }

    if (!imageBValid) {
      console.error(`Image B not found in available images: ${entry.imageB.filename}`)
      loadErrors.push({ image: 'B', filename: entry.imageB.filename, reason: 'not in image list' })
    }

    // Load Image A
    this.p.loadImage(imgSource + entry.imageA.filename, (img) => {
      try {
        // Remove old layer if it exists
        if (imageColorPairs[0].layer && imageColorPairs[0].layer.remove) {
          imageColorPairs[0].layer.remove()
        }

        // Create monochrome layer with restored color
        imageColorPairs[0].layer = this._createMonochromeImage(
          img,
          this.p.color(imageColorPairs[0].color.color)
        )

        loadedCount++
        if (loadedCount === totalImages) {
          this._onImagesLoaded(loadErrors)
        }
      } catch (error) {
        console.error('Error processing loaded image A:', error)
        this._logError('_loadImagesForEntry:imageA:process', error, entry)
        loadedCount++
        loadErrors.push({ image: 'A', filename: entry.imageA.filename, reason: 'processing error', error })
        if (loadedCount === totalImages) {
          this._onImagesLoaded(loadErrors)
        }
      }
    }, (error) => {
      console.error(`Failed to load image A: ${entry.imageA.filename}`, error)
      this._logError('_loadImagesForEntry:imageA:load', error, entry)
      loadedCount++
      loadErrors.push({ image: 'A', filename: entry.imageA.filename, reason: 'load failed', error })

      // Try to load a fallback image
      this._loadFallbackImage(0, imageColorPairs)

      if (loadedCount === totalImages) {
        this._onImagesLoaded(loadErrors)
      }
    })

    // Load Image B
    this.p.loadImage(imgSource + entry.imageB.filename, (img) => {
      try {
        // Remove old layer if it exists
        if (imageColorPairs[1].layer && imageColorPairs[1].layer.remove) {
          imageColorPairs[1].layer.remove()
        }

        // Create monochrome layer with restored color
        imageColorPairs[1].layer = this._createMonochromeImage(
          img,
          this.p.color(imageColorPairs[1].color.color)
        )

        loadedCount++
        if (loadedCount === totalImages) {
          this._onImagesLoaded(loadErrors)
        }
      } catch (error) {
        console.error('Error processing loaded image B:', error)
        this._logError('_loadImagesForEntry:imageB:process', error, entry)
        loadedCount++
        loadErrors.push({ image: 'B', filename: entry.imageB.filename, reason: 'processing error', error })
        if (loadedCount === totalImages) {
          this._onImagesLoaded(loadErrors)
        }
      }
    }, (error) => {
      console.error(`Failed to load image B: ${entry.imageB.filename}`, error)
      this._logError('_loadImagesForEntry:imageB:load', error, entry)
      loadedCount++
      loadErrors.push({ image: 'B', filename: entry.imageB.filename, reason: 'load failed', error })

      // Try to load a fallback image
      this._loadFallbackImage(1, imageColorPairs)

      if (loadedCount === totalImages) {
        this._onImagesLoaded(loadErrors)
      }
    })
  }

  /**
   * Loads a fallback image when the original fails
   * @private
   * @param {number} imageIndex - Index of image (0 or 1)
   * @param {Array} imageColorPairs - Image color pairs array
   */
  _loadFallbackImage (imageIndex, imageColorPairs) {
    const { imgs } = this.stateRefs
    const imgSource = './images/'

    // Try to load the first available image as fallback
    if (imgs.length > 0) {
      const fallbackFilename = imgs[0]
      console.log(`Loading fallback image for position ${imageIndex}: ${fallbackFilename}`)

      this.p.loadImage(imgSource + fallbackFilename, (img) => {
        try {
          // Remove old layer if it exists
          if (imageColorPairs[imageIndex].layer && imageColorPairs[imageIndex].layer.remove) {
            imageColorPairs[imageIndex].layer.remove()
          }

          // Create monochrome layer with current color
          imageColorPairs[imageIndex].layer = this._createMonochromeImage(
            img,
            this.p.color(imageColorPairs[imageIndex].color.color)
          )

          // Update the filename reference
          imageColorPairs[imageIndex].img = fallbackFilename

          console.log(`Fallback image loaded successfully for position ${imageIndex}`)
        } catch (error) {
          console.error(`Failed to process fallback image for position ${imageIndex}:`, error)
          this._logError('_loadFallbackImage:process', error)
        }
      }, (error) => {
        console.error(`Failed to load fallback image for position ${imageIndex}:`, error)
        this._logError('_loadFallbackImage:load', error)
        // Create a placeholder layer as last resort
        this._createPlaceholderLayer(imageIndex, imageColorPairs)
      })
    } else {
      console.error('No fallback images available')
      this._createPlaceholderLayer(imageIndex, imageColorPairs)
    }
  }

  /**
   * Creates a placeholder layer when all image loading fails
   * @private
   * @param {number} imageIndex - Index of image (0 or 1)
   * @param {Array} imageColorPairs - Image color pairs array
   */
  _createPlaceholderLayer (imageIndex, imageColorPairs) {
    try {
      // Create a simple colored rectangle as placeholder
      const size = 400
      const layer = this.p.createGraphics(size, size)
      layer.background(imageColorPairs[imageIndex].color.color)
      layer.fill(255, 255, 255, 100)
      layer.noStroke()
      layer.textAlign(this.p.CENTER, this.p.CENTER)
      layer.textSize(24)
      layer.text('Image\nUnavailable', size / 2, size / 2)

      // Remove old layer if it exists
      if (imageColorPairs[imageIndex].layer && imageColorPairs[imageIndex].layer.remove) {
        imageColorPairs[imageIndex].layer.remove()
      }

      imageColorPairs[imageIndex].layer = layer
      console.log(`Created placeholder layer for position ${imageIndex}`)
    } catch (error) {
      console.error(`Failed to create placeholder layer for position ${imageIndex}:`, error)
      this._logError('_createPlaceholderLayer', error)
    }
  }

  /**
   * Called when all images for a history entry have been loaded.
   * Triggers screen update and status display update.
   *
   * @private
   * @param {Array} loadErrors - Array of load errors (if any)
   */
  _onImagesLoaded (loadErrors = []) {
    // Log any load errors
    if (loadErrors.length > 0) {
      console.warn(`History restoration completed with ${loadErrors.length} error(s):`, loadErrors)
      this._logError('_onImagesLoaded', new Error('Image load errors'), { errors: loadErrors })
    }

    // Request screen update to display the restored composition
    if (this.stateRefs.requestScreenUpdate) {
      this.stateRefs.requestScreenUpdate()
    }

    // Update status display to show restored composition info
    if (this.stateRefs.updateStatusDisplay) {
      this.stateRefs.updateStatusDisplay()
    }

    if (loadErrors.length === 0) {
      console.log('History images loaded and composition restored successfully')
    } else {
      console.log('History composition restored with fallbacks due to load errors')
    }

    // Clear navigation flag now that async image loading is complete
    // This prevents captures from being triggered during the restoration process
    this.isNavigating = false
  }

  /**
   * Creates a monochrome image layer from a source image and color.
   * This is a helper method that replicates the createMonochromeImage logic.
   *
   * @private
   * @param {p5.Image} img - Source image
   * @param {p5.Color} monoColor - Color to apply
   * @returns {p5.Graphics} - Monochrome layer
   */
  _createMonochromeImage (img, monoColor) {
    const scaleRatio = this._calculateScaleRatio(img)
    const scaledWidth = Math.round(img.width * scaleRatio)
    const scaledHeight = Math.round(img.height * scaleRatio)

    // Create temporary color layer
    const colorLayer = this.p.createGraphics(100, 100)
    colorLayer.background(monoColor)

    // Create the monochrome layer
    const layer = this.p.createGraphics(scaledWidth, scaledHeight)
    layer.image(img, 0, 0, scaledWidth, scaledHeight)
    layer.drawingContext.globalCompositeOperation = 'source-in'
    layer.image(colorLayer, 0, 0, scaledWidth, scaledHeight)

    return layer
  }

  /**
   * Calculates the scale ratio for an image to fit within the canvas.
   *
   * @private
   * @param {p5.Image} img - Image to calculate scale for
   * @returns {number} - Scale ratio
   */
  _calculateScaleRatio (img) {
    const maxCanvasSize = Math.min(this.p.width, this.p.height) * 0.8
    const maxImgSize = Math.max(img.width, img.height)
    return maxCanvasSize / maxImgSize
  }

  /**
   * Saves the current history stack to localStorage.
   * Includes schema versioning for future compatibility.
   *
   * @returns {boolean} - True if save succeeded, false otherwise
   */
  saveToStorage () {
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined' || !localStorage) {
        console.warn('localStorage not available, history will not be persisted')
        return false
      }

      const storageData = {
        version: this.storageVersion,
        currentPosition: this.currentPosition,
        entries: this.history,
        lastModified: Date.now(),
        maxEntries: this.maxEntries
      }

      const serialized = JSON.stringify(storageData)

      // Check if we're approaching storage quota (5MB typical limit)
      // Rough estimate: 1 char ≈ 2 bytes in UTF-16
      const estimatedSize = serialized.length * 2
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (estimatedSize > maxSize * 0.9) {
        console.warn(`History storage approaching quota limit: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`)
        // Automatically optimize if approaching limit
        this._autoOptimizeForStorage()
      }

      localStorage.setItem(this.storageKey, serialized)
      console.log(`Saved history to storage: ${this.history.length} entries, position ${this.currentPosition + 1}`)

      return true
    } catch (error) {
      // Handle storage quota exceeded
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('localStorage quota exceeded. Attempting to save minimal history.')
        return this._saveMinimalHistory()
      }

      // Handle SecurityError (private browsing, etc.)
      if (error.name === 'SecurityError') {
        console.error('localStorage access denied (private browsing mode?). History will not be persisted.')
        return false
      }

      // Handle other storage errors
      console.error('Failed to save history to storage:', error)
      this._logError('saveToStorage', error)
      return false
    }
  }

  /**
   * Automatically optimizes history when approaching storage limits
   * @private
   */
  _autoOptimizeForStorage () {
    const targetSize = Math.floor(this.maxEntries * 0.6) // Reduce to 60% of max
    const removed = this.optimizeHistory(targetSize)
    if (removed > 0) {
      console.log(`Auto-optimized history: removed ${removed} entries to reduce storage usage`)
    }
  }

  /**
   * Attempts to save a minimal version of history when quota is exceeded
   * @private
   * @returns {boolean} - True if save succeeded
   */
  _saveMinimalHistory () {
    try {
      // Keep only last 50 entries
      const recentEntries = this.history.slice(-50)
      const adjustedPosition = Math.max(0, Math.min(this.currentPosition - (this.history.length - 50), recentEntries.length - 1))

      const minimalData = {
        version: this.storageVersion,
        currentPosition: adjustedPosition,
        entries: recentEntries,
        lastModified: Date.now(),
        maxEntries: this.maxEntries,
        truncated: true // Flag to indicate this is a truncated history
      }

      localStorage.setItem(this.storageKey, JSON.stringify(minimalData))
      console.log('Saved minimal history (last 50 entries) to storage')

      // Update in-memory history to match what was saved
      this.history = recentEntries
      this.currentPosition = adjustedPosition

      return true
    } catch (retryError) {
      console.error('Failed to save even minimal history:', retryError)
      this._logError('_saveMinimalHistory', retryError)

      // Last resort: try to save just the current entry
      return this._saveCurrentEntryOnly()
    }
  }

  /**
   * Last resort: saves only the current entry when all else fails
   * @private
   * @returns {boolean} - True if save succeeded
   */
  _saveCurrentEntryOnly () {
    try {
      const currentEntry = this.getCurrentEntry()
      if (!currentEntry) {
        console.warn('No current entry to save')
        return false
      }

      const minimalData = {
        version: this.storageVersion,
        currentPosition: 0,
        entries: [currentEntry],
        lastModified: Date.now(),
        maxEntries: this.maxEntries,
        truncated: true,
        emergency: true // Flag to indicate this is an emergency save
      }

      localStorage.setItem(this.storageKey, JSON.stringify(minimalData))
      console.log('Emergency save: saved only current entry to storage')

      return true
    } catch (error) {
      console.error('Emergency save failed:', error)
      this._logError('_saveCurrentEntryOnly', error)
      return false
    }
  }

  /**
   * Loads history stack from localStorage with validation.
   * Handles corrupted data and schema version mismatches.
   *
   * @returns {boolean} - True if load succeeded, false otherwise
   */
  loadFromStorage () {
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined' || !localStorage) {
        console.warn('localStorage not available, cannot load history')
        return false
      }

      const serialized = localStorage.getItem(this.storageKey)

      // No stored history
      if (!serialized) {
        console.log('No stored history found')
        return false
      }

      // Validate JSON before parsing
      if (typeof serialized !== 'string' || serialized.length === 0) {
        console.error('Invalid storage data: not a string or empty')
        this._clearCorruptedStorage()
        return false
      }

      // Parse stored data
      let storageData
      try {
        storageData = JSON.parse(serialized)
      } catch (parseError) {
        console.error('Failed to parse history JSON:', parseError)
        this._clearCorruptedStorage()
        return false
      }

      // Validate data structure
      if (!storageData || typeof storageData !== 'object') {
        console.error('Invalid history data: not an object')
        this._clearCorruptedStorage()
        return false
      }

      // Validate schema version
      if (!storageData.version || storageData.version !== this.storageVersion) {
        console.warn(`History schema version mismatch: stored=${storageData.version}, current=${this.storageVersion}`)
        // Attempt migration if needed
        storageData = this._migrateStorageData(storageData)
        if (!storageData) {
          console.error('Failed to migrate storage data')
          this._clearCorruptedStorage()
          return false
        }
      }

      // Validate required fields
      if (!Array.isArray(storageData.entries)) {
        console.error('Invalid history data: entries is not an array')
        this._clearCorruptedStorage()
        return false
      }

      if (typeof storageData.currentPosition !== 'number') {
        console.error('Invalid history data: currentPosition is not a number')
        this._clearCorruptedStorage()
        return false
      }

      // Validate and recover entries
      const { validEntries, recoveredCount } = this._validateAndRecoverEntries(storageData.entries)

      // Check if we lost too many entries
      if (validEntries.length === 0 && storageData.entries.length > 0) {
        console.error('All stored history entries are invalid, starting fresh')
        this._clearCorruptedStorage()
        return false
      }

      if (recoveredCount > 0) {
        console.warn(`Recovered ${validEntries.length}/${storageData.entries.length} history entries (${recoveredCount} repaired)`)
      } else if (validEntries.length < storageData.entries.length) {
        console.warn(`Loaded ${validEntries.length}/${storageData.entries.length} valid history entries`)
      }

      // Validate and adjust position
      let position = storageData.currentPosition
      if (position < -1 || position >= validEntries.length) {
        console.warn(`Invalid position ${position}, resetting to end of history`)
        position = validEntries.length - 1
      }

      // Restore history
      this.history = validEntries
      this.currentPosition = position

      // Update maxEntries if stored value is different
      if (storageData.maxEntries && storageData.maxEntries !== this.maxEntries) {
        console.log(`Updating maxEntries from storage: ${storageData.maxEntries}`)
        this.maxEntries = storageData.maxEntries
      }

      // Notify if this was a truncated/emergency save
      if (storageData.truncated) {
        console.warn('Loaded truncated history (storage quota was exceeded)')
      }
      if (storageData.emergency) {
        console.warn('Loaded emergency save (only current entry was saved)')
      }

      console.log(`Loaded history from storage: ${this.history.length} entries, position ${this.currentPosition + 1}`)

      return true
    } catch (error) {
      // Handle SecurityError (private browsing, etc.)
      if (error.name === 'SecurityError') {
        console.error('localStorage access denied (private browsing mode?). Cannot load history.')
        return false
      }

      // Handle other errors
      console.error('Failed to load history from storage:', error)
      this._logError('loadFromStorage', error)
      this._clearCorruptedStorage()
      return false
    }
  }

  /**
   * Validates and attempts to recover history entries
   * @private
   * @param {Array} entries - Entries to validate
   * @returns {Object} - { validEntries, recoveredCount }
   */
  _validateAndRecoverEntries (entries) {
    const validEntries = []
    let recoveredCount = 0

    for (const entry of entries) {
      if (validateHistoryEntry(entry)) {
        validEntries.push(entry)
      } else {
        // Attempt to recover entry
        const recovered = this._attemptEntryRecovery(entry)
        if (recovered) {
          validEntries.push(recovered)
          recoveredCount++
          console.log(`Recovered invalid entry: ${entry.id || 'unknown'}`)
        } else {
          console.warn('Skipping unrecoverable history entry:', entry)
        }
      }
    }

    return { validEntries, recoveredCount }
  }

  /**
   * Attempts to recover a corrupted history entry
   * @private
   * @param {Object} entry - Potentially corrupted entry
   * @returns {HistoryEntry|null} - Recovered entry or null
   */
  _attemptEntryRecovery (entry) {
    try {
      // Check if entry has minimum required fields
      if (!entry || typeof entry !== 'object') {
        return null
      }

      // Attempt to reconstruct missing fields with defaults
      const recovered = {
        id: entry.id || `recovered-${Date.now()}`,
        timestamp: entry.timestamp || Date.now(),
        imageA: entry.imageA || null,
        imageB: entry.imageB || null,
        paletteIndex: typeof entry.paletteIndex === 'number' ? entry.paletteIndex : 0,
        blendModeIndex: typeof entry.blendModeIndex === 'number' ? entry.blendModeIndex : 0,
        backgroundModeIndex: typeof entry.backgroundModeIndex === 'number' ? entry.backgroundModeIndex : 0,
        activeImageIndex: typeof entry.activeImageIndex === 'number' ? entry.activeImageIndex : 0,
        source: entry.source || 'recovered'
      }

      // Validate recovered entry
      if (validateHistoryEntry(recovered)) {
        return recovered
      }

      return null
    } catch (error) {
      console.error('Failed to recover entry:', error)
      return null
    }
  }

  /**
   * Migrates storage data from older versions
   * @private
   * @param {Object} data - Storage data to migrate
   * @returns {Object|null} - Migrated data or null if migration failed
   */
  _migrateStorageData (data) {
    try {
      // Currently only version 1 exists, but this provides structure for future migrations
      const currentVersion = data.version || 0

      if (currentVersion === 0) {
        // Migrate from version 0 (no version) to version 1
        console.log('Migrating storage data from version 0 to version 1')
        data.version = 1
      }

      // Future migrations would go here
      // if (currentVersion === 1) { ... }

      return data
    } catch (error) {
      console.error('Failed to migrate storage data:', error)
      return null
    }
  }

  /**
   * Clears corrupted storage data
   * @private
   */
  _clearCorruptedStorage () {
    try {
      localStorage.removeItem(this.storageKey)
      console.log('Cleared corrupted storage data')
    } catch (error) {
      console.error('Failed to clear corrupted storage:', error)
      this._logError('_clearCorruptedStorage', error)
    }
  }

  /**
   * Clears history from both memory and localStorage.
   * Keeps the current composition as the first entry in new history.
   *
   * @returns {boolean} - True if clear succeeded
   */
  clearHistory () {
    try {
      // Clear from localStorage
      localStorage.removeItem(this.storageKey)

      // Clear thumbnail cache
      if (this.thumbnailGenerator) {
        this.thumbnailGenerator.clearCache()
      }

      // Keep current composition if it exists
      const currentEntry = this.getCurrentEntry()

      // Reset history
      this.history = []
      this.currentPosition = -1

      // If we had a current composition, make it the first entry
      if (currentEntry) {
        this.history.push(currentEntry)
        this.currentPosition = 0
        console.log('History cleared, kept current composition')
      } else {
        console.log('History cleared completely')
      }

      // Save the new state
      this.saveToStorage()

      return true
    } catch (error) {
      console.error('Failed to clear history:', error)
      return false
    }
  }

  /**
   * Generates a thumbnail for a specific history entry.
   * Uses lazy generation - only creates thumbnail when requested.
   *
   * @param {number} position - Position in history stack
   * @returns {Promise<string|null>} - Base64 thumbnail or null if failed
   */
  async generateThumbnailForPosition (position) {
    if (position < 0 || position >= this.history.length) {
      console.warn(`Invalid position for thumbnail generation: ${position}`)
      return null
    }

    const entry = this.history[position]

    try {
      // Prepare render context
      const renderContext = {
        imgs: this.stateRefs.imgs,
        ALL_PALETTES: this.stateRefs.ALL_PALETTES,
        COLOR_MAPS: this.stateRefs.COLOR_MAPS,
        backgroundModes: [
          {
            color: [0, 0, 0],
            blendModes: ['ADD', 'EXCLUSION', 'SCREEN', 'BLEND', 'DIFFERENCE', 'LIGHTEST']
          },
          {
            color: [255, 255, 255],
            blendModes: ['MULTIPLY', 'EXCLUSION', 'BLEND', 'DIFFERENCE', 'DARKEST', 'HARD_LIGHT']
          }
        ]
      }

      const thumbnail = await this.thumbnailGenerator.generateThumbnail(entry, renderContext)

      // Optionally store thumbnail in entry for persistence
      // Note: We don't do this by default to keep history entries lightweight
      // Thumbnails are cached in memory and regenerated on demand

      return thumbnail
    } catch (error) {
      console.error(`Failed to generate thumbnail for position ${position}:`, error)
      return null
    }
  }

  /**
   * Gets a thumbnail for a specific history entry.
   * Returns cached thumbnail if available, generates if not.
   *
   * @param {number} position - Position in history stack
   * @returns {Promise<string|null>} - Base64 thumbnail or null if failed
   */
  async getThumbnailForPosition (position) {
    return this.generateThumbnailForPosition(position)
  }

  /**
   * Batch generates thumbnails for all history entries.
   * Useful for pre-generating thumbnails when filmstrip opens.
   *
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<void>}
   */
  async generateAllThumbnails (onProgress = null) {
    if (this.history.length === 0) {
      console.log('No history entries to generate thumbnails for')
      return
    }

    console.log(`Generating thumbnails for ${this.history.length} entries`)

    const renderContext = {
      imgs: this.stateRefs.imgs,
      ALL_PALETTES: this.stateRefs.ALL_PALETTES,
      COLOR_MAPS: this.stateRefs.COLOR_MAPS,
      backgroundModes: [
        {
          color: [0, 0, 0],
          blendModes: ['ADD', 'EXCLUSION', 'SCREEN', 'BLEND', 'DIFFERENCE', 'LIGHTEST']
        },
        {
          color: [255, 255, 255],
          blendModes: ['MULTIPLY', 'EXCLUSION', 'BLEND', 'DIFFERENCE', 'DARKEST', 'HARD_LIGHT']
        }
      ]
    }

    await this.thumbnailGenerator.batchGenerate(this.history, renderContext, onProgress)
  }

  /**
   * Gets thumbnail cache statistics.
   * Useful for monitoring memory usage and cache performance.
   *
   * @returns {Object} - Cache statistics
   */
  getThumbnailCacheStats () {
    if (!this.thumbnailGenerator) {
      return null
    }

    return this.thumbnailGenerator.getCacheStats()
  }

  /**
   * Clears the thumbnail cache.
   * Useful for freeing memory or forcing regeneration.
   */
  clearThumbnailCache () {
    if (this.thumbnailGenerator) {
      this.thumbnailGenerator.clearCache()
      console.log('Thumbnail cache cleared')
    }
  }

  /**
   * Performance Monitoring and Optimization
   */

  /**
   * Gets performance statistics for history operations.
   * Useful for profiling and optimization.
   *
   * @returns {Object} - Performance statistics
   */
  getPerformanceStats () {
    const stats = {
      historySize: this.history.length,
      currentPosition: this.currentPosition,
      maxEntries: this.maxEntries,
      memoryUsage: this._estimateMemoryUsage(),
      thumbnailCache: this.getThumbnailCacheStats()
    }

    return stats
  }

  /**
   * Estimates memory usage of history stack.
   * Rough calculation based on entry structure.
   *
   * @private
   * @returns {Object} - Memory usage estimate
   */
  _estimateMemoryUsage () {
    // Rough estimate: each entry is ~500 bytes (without thumbnails)
    const entrySize = 500
    const totalBytes = this.history.length * entrySize

    return {
      entries: this.history.length,
      estimatedBytes: totalBytes,
      estimatedKB: (totalBytes / 1024).toFixed(2),
      estimatedMB: (totalBytes / 1024 / 1024).toFixed(2)
    }
  }

  /**
   * Optimizes history by removing old entries if approaching limits.
   * Can be called periodically or when performance degrades.
   *
   * @param {number} targetSize - Target number of entries (default: 80% of max)
   * @returns {number} - Number of entries removed
   */
  optimizeHistory (targetSize = null) {
    if (!targetSize) {
      targetSize = Math.floor(this.maxEntries * 0.8)
    }

    if (this.history.length <= targetSize) {
      console.log('History already optimized')
      return 0
    }

    const removeCount = this.history.length - targetSize
    this.history.splice(0, removeCount)

    // Adjust current position
    this.currentPosition = Math.max(0, this.currentPosition - removeCount)

    console.log(`Optimized history: removed ${removeCount} oldest entries`)

    // Save optimized state
    this.saveToStorage()

    return removeCount
  }

  /**
   * Profiles a history operation and logs timing.
   * Useful for identifying performance bottlenecks.
   *
   * @param {string} operationName - Name of operation to profile
   * @param {Function} operation - Operation to profile
   * @returns {*} - Result of operation
   */
  async profileOperation (operationName, operation) {
    const startTime = performance.now()

    try {
      const result = await operation()
      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`[Profile] ${operationName}: ${duration.toFixed(2)}ms`)

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      console.error(`[Profile] ${operationName} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  /**
   * Logs current performance statistics to console.
   * Useful for debugging and monitoring.
   */
  logPerformanceStats () {
    const stats = this.getPerformanceStats()

    console.group('History Performance Statistics')
    console.log('History Size:', stats.historySize, '/', stats.maxEntries)
    console.log('Current Position:', stats.currentPosition + 1)
    console.log('Memory Usage (estimated):', stats.memoryUsage.estimatedKB, 'KB')

    if (stats.thumbnailCache) {
      console.log('Thumbnail Cache:', stats.thumbnailCache.entries, 'entries')
      console.log('Cache Size:', stats.thumbnailCache.sizeMB, 'MB')
    }

    console.groupEnd()
  }

  /**
   * Error Logging and Debugging
   */

  /**
   * Logs an error with context for debugging
   * @private
   * @param {string} operation - Operation that failed
   * @param {Error} error - Error object
   * @param {Object} context - Additional context (optional)
   */
  _logError (operation, error, context = null) {
    const errorEntry = {
      timestamp: Date.now(),
      operation,
      message: error.message,
      stack: error.stack,
      context
    }

    // Add to error log
    this.errorLog.push(errorEntry)

    // Trim error log if it exceeds max size
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog.shift()
    }

    // Update error counts
    const category = this._categorizeError(operation)
    this.errorCounts[category]++

    // Log to console with details
    console.error(`[HistoryManager Error] ${operation}:`, error)
    if (context) {
      console.error('Context:', context)
    }
  }

  /**
   * Categorizes an error by operation type
   * @private
   * @param {string} operation - Operation name
   * @returns {string} - Error category
   */
  _categorizeError (operation) {
    if (operation.includes('storage') || operation.includes('Storage')) {
      return 'storage'
    }
    if (operation.includes('image') || operation.includes('Image') || operation.includes('load')) {
      return 'imageLoad'
    }
    if (operation.includes('navigate') || operation.includes('Navigate')) {
      return 'navigation'
    }
    if (operation.includes('thumbnail') || operation.includes('Thumbnail')) {
      return 'thumbnail'
    }
    if (operation.includes('validate') || operation.includes('Validate')) {
      return 'validation'
    }
    return 'other'
  }

  /**
   * Gets error statistics
   * @returns {Object} - Error statistics
   */
  getErrorStats () {
    const totalErrors = Object.values(this.errorCounts).reduce((sum, count) => sum + count, 0)

    return {
      totalErrors,
      errorCounts: { ...this.errorCounts },
      recentErrors: this.errorLog.slice(-10), // Last 10 errors
      errorLogSize: this.errorLog.length
    }
  }

  /**
   * Logs error statistics to console
   */
  logErrorStats () {
    const stats = this.getErrorStats()

    console.group('History Error Statistics')
    console.log('Total Errors:', stats.totalErrors)
    console.log('Error Counts by Category:', stats.errorCounts)
    console.log('Error Log Size:', stats.errorLogSize)

    if (stats.recentErrors.length > 0) {
      console.log('Recent Errors:')
      stats.recentErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${new Date(error.timestamp).toLocaleTimeString()}] ${error.operation}: ${error.message}`)
      })
    }

    console.groupEnd()
  }

  /**
   * Clears the error log
   */
  clearErrorLog () {
    this.errorLog = []
    this.errorCounts = {
      storage: 0,
      imageLoad: 0,
      navigation: 0,
      thumbnail: 0,
      validation: 0,
      other: 0
    }
    console.log('Error log cleared')
  }

  /**
   * Gets the full error log
   * @returns {Array} - Array of error entries
   */
  getErrorLog () {
    return [...this.errorLog]
  }

  /**
   * Exports error log as JSON string
   * Useful for debugging and bug reports
   * @returns {string} - JSON string of error log
   */
  exportErrorLog () {
    const exportData = {
      timestamp: Date.now(),
      historySize: this.history.length,
      currentPosition: this.currentPosition,
      errorStats: this.getErrorStats(),
      errors: this.errorLog
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Health check for history system
   * Returns status and any issues detected
   * @returns {Object} - Health check results
   */
  healthCheck () {
    const issues = []
    const warnings = []

    // Check localStorage availability
    try {
      if (typeof localStorage === 'undefined' || !localStorage) {
        issues.push('localStorage not available')
      } else {
        // Test localStorage access
        const testKey = 'duo-chrome-history-test'
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
      }
    } catch (error) {
      issues.push(`localStorage access error: ${error.message}`)
    }

    // Check history integrity
    if (this.currentPosition < -1 || this.currentPosition >= this.history.length) {
      issues.push(`Invalid current position: ${this.currentPosition}`)
    }

    // Check for high error rates
    const errorStats = this.getErrorStats()
    if (errorStats.totalErrors > 50) {
      warnings.push(`High error count: ${errorStats.totalErrors}`)
    }

    // Check memory usage
    const memoryUsage = this._estimateMemoryUsage()
    if (memoryUsage.estimatedMB > 10) {
      warnings.push(`High memory usage: ${memoryUsage.estimatedMB}MB`)
    }

    // Check thumbnail cache
    const cacheStats = this.getThumbnailCacheStats()
    if (cacheStats && cacheStats.sizeMB > 5) {
      warnings.push(`Large thumbnail cache: ${cacheStats.sizeMB}MB`)
    }

    return {
      healthy: issues.length === 0,
      issues,
      warnings,
      stats: {
        historySize: this.history.length,
        currentPosition: this.currentPosition,
        errorCount: errorStats.totalErrors,
        memoryUsageMB: memoryUsage.estimatedMB
      }
    }
  }

  /**
   * Logs health check results to console
   */
  logHealthCheck () {
    const health = this.healthCheck()

    console.group('History System Health Check')
    console.log('Status:', health.healthy ? '✓ Healthy' : '✗ Issues Detected')

    if (health.issues.length > 0) {
      console.error('Issues:')
      health.issues.forEach(issue => console.error(`  - ${issue}`))
    }

    if (health.warnings.length > 0) {
      console.warn('Warnings:')
      health.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }

    console.log('Statistics:', health.stats)
    console.groupEnd()

    return health
  }
}
