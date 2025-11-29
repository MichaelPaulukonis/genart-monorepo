/**
 * ThumbnailGenerator Module
 *
 * Handles thumbnail generation for history entries with LRU caching.
 * Generates small preview images (120x120px) of compositions on-demand.
 *
 * Features:
 * - Lazy generation (only when needed)
 * - LRU cache with size management
 * - Error handling for generation failures
 * - Base64 encoding for storage
 * - Optimized rendering for performance
 */

/* global requestIdleCallback */

/**
 * LRU Cache for thumbnail storage
 * Implements Least Recently Used eviction policy
 */
class ThumbnailCache {
  constructor (maxSize = 50) {
    this.maxSize = maxSize
    this.cache = new Map() // Map maintains insertion order
    this.sizeBytes = 0
    this.maxSizeBytes = 5 * 1024 * 1024 // 5MB max cache size

    // Performance tracking
    this.hits = 0
    this.misses = 0
    this.evictions = 0

    // Automatic cleanup
    this.lastCleanup = Date.now()
    this.cleanupInterval = 60000 // Cleanup every 60 seconds
  }

  /**
   * Gets a thumbnail from cache and marks it as recently used
   * @param {string} entryId - History entry ID
   * @returns {string|null} - Base64 thumbnail or null if not cached
   */
  get (entryId) {
    // Check if automatic cleanup is needed
    this._maybeCleanup()
    if (!this.cache.has(entryId)) {
      this.misses++
      return null
    }

    this.hits++

    // Move to end (most recently used)
    const value = this.cache.get(entryId)
    this.cache.delete(entryId)
    this.cache.set(entryId, value)

    return value.thumbnail
  }

  /**
   * Stores a thumbnail in cache with LRU eviction
   * @param {string} entryId - History entry ID
   * @param {string} thumbnail - Base64 encoded thumbnail
   */
  set (entryId, thumbnail) {
    // Calculate size (rough estimate: 1 char ≈ 1 byte for base64)
    const size = thumbnail.length

    // Remove old entry if it exists
    if (this.cache.has(entryId)) {
      const oldEntry = this.cache.get(entryId)
      this.sizeBytes -= oldEntry.size
      this.cache.delete(entryId)
    }

    // Evict least recently used entries if needed
    while (this.cache.size >= this.maxSize || this.sizeBytes + size > this.maxSizeBytes) {
      if (this.cache.size === 0) break // Safety check

      // Get first (least recently used) entry
      const firstKey = this.cache.keys().next().value
      const firstEntry = this.cache.get(firstKey)

      this.sizeBytes -= firstEntry.size
      this.cache.delete(firstKey)
      this.evictions++

      console.log(`Evicted thumbnail from cache: ${firstKey} (${(firstEntry.size / 1024).toFixed(2)}KB)`)
    }

    // Add new entry
    this.cache.set(entryId, {
      thumbnail,
      size,
      generated: Date.now(),
      lastAccessed: Date.now()
    })
    this.sizeBytes += size

    console.log(`Cached thumbnail: ${entryId} (${(size / 1024).toFixed(2)}KB, total: ${(this.sizeBytes / 1024).toFixed(2)}KB)`)
  }

  /**
   * Checks if a thumbnail is cached
   * @param {string} entryId - History entry ID
   * @returns {boolean} - True if cached
   */
  has (entryId) {
    return this.cache.has(entryId)
  }

  /**
   * Clears all cached thumbnails
   */
  clear () {
    this.cache.clear()
    this.sizeBytes = 0
    console.log('Thumbnail cache cleared')
  }

  /**
   * Gets cache statistics
   * @returns {Object} - Cache stats
   */
  getStats () {
    const hitRate = this.hits + this.misses > 0
      ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1)
      : 0

    return {
      entries: this.cache.size,
      sizeBytes: this.sizeBytes,
      sizeMB: (this.sizeBytes / 1024 / 1024).toFixed(2),
      maxEntries: this.maxSize,
      maxSizeMB: (this.maxSizeBytes / 1024 / 1024).toFixed(2),
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      evictions: this.evictions
    }
  }

  /**
   * Performs automatic cleanup of old cache entries
   * Removes entries that haven't been accessed in a while
   * @private
   */
  _maybeCleanup () {
    const now = Date.now()

    // Only cleanup if interval has passed
    if (now - this.lastCleanup < this.cleanupInterval) {
      return
    }

    this.lastCleanup = now
    const maxAge = 5 * 60 * 1000 // 5 minutes

    let removedCount = 0
    let removedSize = 0

    // Remove entries older than maxAge
    for (const [entryId, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.sizeBytes -= entry.size
        removedSize += entry.size
        this.cache.delete(entryId)
        removedCount++
      }
    }

    if (removedCount > 0) {
      console.log(`Automatic cache cleanup: removed ${removedCount} entries (${(removedSize / 1024).toFixed(2)}KB)`)
    }
  }

  /**
   * Manually triggers cache cleanup
   * Removes entries older than specified age
   * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
   * @returns {Object} - Cleanup statistics
   */
  cleanup (maxAge = 5 * 60 * 1000) {
    const now = Date.now()
    let removedCount = 0
    let removedSize = 0

    for (const [entryId, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.sizeBytes -= entry.size
        removedSize += entry.size
        this.cache.delete(entryId)
        removedCount++
      }
    }

    this.lastCleanup = now

    return {
      removedCount,
      removedSize,
      removedSizeMB: (removedSize / 1024 / 1024).toFixed(2)
    }
  }
}

/**
 * ThumbnailGenerator Class
 *
 * Generates thumbnail previews of compositions using p5.js rendering
 */
export class ThumbnailGenerator {
  constructor (p5Instance, stateRefs = null, thumbnailSize = 120) {
    this.p = p5Instance
    this.stateRefs = stateRefs // Store state references for rendering context
    this.thumbnailSize = thumbnailSize
    this.cache = new ThumbnailCache()

    // Track generation errors for debugging
    this.errorCount = 0
    this.lastError = null

    console.log(`ThumbnailGenerator initialized (size: ${thumbnailSize}px)`)
  }

  /**
   * Generates a thumbnail for a history entry
   * Uses cache if available, otherwise generates new thumbnail
   *
   * @param {HistoryEntry} entry - History entry to generate thumbnail for
   * @param {Object} renderContext - Context needed for rendering
   * @param {Array} renderContext.imgs - Array of available images
   * @param {Array} renderContext.ALL_PALETTES - Color palettes
   * @param {Map[]} renderContext.COLOR_MAPS - Color lookup maps
   * @param {Array} renderContext.backgroundModes - Background mode configurations
   * @returns {Promise<string>} - Base64 encoded thumbnail
   */
  async generateThumbnail (entry, renderContext) {
    // Validate inputs
    if (!entry || !entry.id) {
      console.error('Invalid entry: missing id')
      this.errorCount++
      return this._generatePlaceholderThumbnail('Invalid Entry')
    }

    if (!renderContext) {
      console.error('Invalid render context')
      this.errorCount++
      return this._generatePlaceholderThumbnail('No Context')
    }

    // Check cache first
    if (this.cache.has(entry.id)) {
      console.log(`Using cached thumbnail for ${entry.id}`)
      return this.cache.get(entry.id)
    }

    try {
      console.log(`Generating thumbnail for ${entry.id}`)

      // Validate render context components
      if (!Array.isArray(renderContext.imgs) || renderContext.imgs.length === 0) {
        throw new Error('Invalid or empty images array in render context')
      }

      if (!Array.isArray(renderContext.backgroundModes) || renderContext.backgroundModes.length === 0) {
        throw new Error('Invalid or empty background modes in render context')
      }

      if (!Array.isArray(renderContext.COLOR_MAPS) || renderContext.COLOR_MAPS.length === 0) {
        throw new Error('Invalid or empty color maps in render context')
      }

      // Validate entry indices
      if (entry.backgroundModeIndex < 0 || entry.backgroundModeIndex >= renderContext.backgroundModes.length) {
        throw new Error(`Invalid background mode index: ${entry.backgroundModeIndex}`)
      }

      if (entry.paletteIndex < 0 || entry.paletteIndex >= renderContext.COLOR_MAPS.length) {
        throw new Error(`Invalid palette index: ${entry.paletteIndex}`)
      }

      // Create off-screen graphics for thumbnail rendering
      const thumbnail = this.p.createGraphics(this.thumbnailSize, this.thumbnailSize)

      // Set background
      const bgMode = renderContext.backgroundModes[entry.backgroundModeIndex]
      if (!bgMode || !bgMode.color) {
        throw new Error('Invalid background mode configuration')
      }
      thumbnail.background(bgMode.color)

      // Set blend mode
      if (!bgMode.blendModes || entry.blendModeIndex < 0 || entry.blendModeIndex >= bgMode.blendModes.length) {
        throw new Error(`Invalid blend mode index: ${entry.blendModeIndex}`)
      }
      const blendModeName = bgMode.blendModes[entry.blendModeIndex]
      if (!this.p[blendModeName]) {
        throw new Error(`Blend mode not available: ${blendModeName}`)
      }
      thumbnail.blendMode(this.p[blendModeName])

      // Load and render both images
      const imageA = await this._loadImage(entry.imageA.filename, renderContext.imgs)
      const imageB = await this._loadImage(entry.imageB.filename, renderContext.imgs)

      // Get colors with validation
      const colorA = renderContext.COLOR_MAPS[entry.paletteIndex].get(entry.imageA.colorName)
      const colorB = renderContext.COLOR_MAPS[entry.paletteIndex].get(entry.imageB.colorName)

      if (!colorA) {
        throw new Error(`Color A not found in palette: ${entry.imageA.colorName}`)
      }
      if (!colorB) {
        throw new Error(`Color B not found in palette: ${entry.imageB.colorName}`)
      }

      // Validate scale values
      const scaleA = parseFloat(entry.imageA.scale)
      const scaleB = parseFloat(entry.imageB.scale)
      if (!Number.isFinite(scaleA) || scaleA <= 0) {
        throw new Error(`Invalid scale for image A: ${entry.imageA.scale}`)
      }
      if (!Number.isFinite(scaleB) || scaleB <= 0) {
        throw new Error(`Invalid scale for image B: ${entry.imageB.scale}`)
      }

      // Create monochrome layers for thumbnail
      const layerA = this._createThumbnailLayer(imageA, this.p.color(colorA.color), scaleA, thumbnail)
      const layerB = this._createThumbnailLayer(imageB, this.p.color(colorB.color), scaleB, thumbnail)

      // Render layers to thumbnail
      thumbnail.imageMode(this.p.CENTER)
      thumbnail.image(layerA, this.thumbnailSize / 2, this.thumbnailSize / 2)
      thumbnail.image(layerB, this.thumbnailSize / 2, this.thumbnailSize / 2)

      // Convert to base64
      const base64 = thumbnail.canvas.toDataURL('image/png')

      // Validate base64 output
      if (!base64 || !base64.startsWith('data:image')) {
        throw new Error('Failed to generate valid base64 image data')
      }

      // Clean up graphics objects
      layerA.remove()
      layerB.remove()
      thumbnail.remove()

      // Cache the result
      this.cache.set(entry.id, base64)

      console.log(`Thumbnail generated successfully for ${entry.id}`)
      return base64
    } catch (error) {
      this.errorCount++
      this.lastError = {
        message: error.message,
        stack: error.stack,
        entryId: entry.id,
        timestamp: Date.now()
      }
      console.error(`Failed to generate thumbnail for ${entry.id}:`, error)

      // Return placeholder thumbnail on error
      return this._generatePlaceholderThumbnail(error.message)
    }
  }

  /**
   * Loads an image from the image source
   * @private
   * @param {string} filename - Image filename
   * @param {Array} imgs - Array of available images
   * @returns {Promise<p5.Image>} - Loaded image
   */
  _loadImage (filename, imgs) {
    return new Promise((resolve, reject) => {
      // Validate inputs
      if (!filename || typeof filename !== 'string') {
        reject(new Error('Invalid filename'))
        return
      }

      if (!Array.isArray(imgs)) {
        reject(new Error('Invalid images array'))
        return
      }

      // Verify image exists in array
      if (!imgs.includes(filename)) {
        reject(new Error(`Image not found in available images: ${filename}`))
        return
      }

      const imgSource = './images/'
      const fullPath = imgSource + filename

      // Add timeout for image loading
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${filename}`))
      }, 10000) // 10 second timeout

      this.p.loadImage(
        fullPath,
        (img) => {
          clearTimeout(timeout)
          resolve(img)
        },
        (error) => {
          clearTimeout(timeout)
          reject(new Error(`Failed to load image ${filename}: ${error}`))
        }
      )
    })
  }

  /**
   * Creates a monochrome layer for thumbnail rendering
   * Optimized version of createMonochromeImage for thumbnails
   *
   * @private
   * @param {p5.Image} img - Source image
   * @param {p5.Color} monoColor - Color to apply
   * @param {number} scale - Scale factor
   * @param {p5.Graphics} targetGraphics - Target graphics context
   * @returns {p5.Graphics} - Monochrome layer
   */
  _createThumbnailLayer (img, monoColor, scale, targetGraphics) {
    // Calculate scaled dimensions for thumbnail
    const scaleRatio = this._calculateThumbnailScaleRatio(img)
    const scaledWidth = Math.round(img.width * scaleRatio * scale)
    const scaledHeight = Math.round(img.height * scaleRatio * scale)

    // Create temporary color layer
    const colorLayer = this.p.createGraphics(scaledWidth, scaledHeight)
    colorLayer.background(monoColor)

    // Create monochrome layer
    const layer = this.p.createGraphics(scaledWidth, scaledHeight)
    layer.image(img, 0, 0, scaledWidth, scaledHeight)
    layer.drawingContext.globalCompositeOperation = 'source-in'
    layer.image(colorLayer, 0, 0, scaledWidth, scaledHeight)

    // Clean up temporary layer
    colorLayer.remove()

    return layer
  }

  /**
   * Calculates scale ratio for thumbnail rendering
   * @private
   * @param {p5.Image} img - Image to scale
   * @returns {number} - Scale ratio
   */
  _calculateThumbnailScaleRatio (img) {
    const maxSize = this.thumbnailSize * 0.8 // Leave some padding
    const maxImgSize = Math.max(img.width, img.height)
    return maxSize / maxImgSize
  }

  /**
   * Generates a placeholder thumbnail for error cases
   * @private
   * @param {string} errorMessage - Optional error message to display
   * @returns {string} - Base64 encoded placeholder
   */
  _generatePlaceholderThumbnail (errorMessage = 'Error') {
    try {
      const placeholder = this.p.createGraphics(this.thumbnailSize, this.thumbnailSize)

      // Gray background
      placeholder.background(200)

      // Draw error indicator
      placeholder.fill(150)
      placeholder.noStroke()
      placeholder.textAlign(this.p.CENTER, this.p.CENTER)
      placeholder.textSize(10)

      // Truncate error message if too long
      const displayMessage = errorMessage.length > 20
        ? errorMessage.substring(0, 17) + '...'
        : errorMessage

      placeholder.text(displayMessage, this.thumbnailSize / 2, this.thumbnailSize / 2)

      const base64 = placeholder.canvas.toDataURL('image/png')
      placeholder.remove()

      return base64
    } catch (error) {
      console.error('Failed to generate placeholder thumbnail:', error)
      // Return minimal base64 image as last resort (1x1 gray pixel)
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
  }

  /**
   * Batch generates thumbnails for multiple entries
   * Uses requestIdleCallback for background generation
   *
   * @param {HistoryEntry[]} entries - Entries to generate thumbnails for
   * @param {Object} renderContext - Rendering context
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<void>}
   */
  async batchGenerate (entries, renderContext, onProgress = null) {
    console.log(`Starting batch thumbnail generation for ${entries.length} entries`)

    let completed = 0

    for (const entry of entries) {
      // Skip if already cached
      if (this.cache.has(entry.id)) {
        completed++
        if (onProgress) onProgress(completed, entries.length)
        continue
      }

      // Use requestIdleCallback if available for background generation
      if (typeof requestIdleCallback !== 'undefined') {
        await new Promise(resolve => {
          requestIdleCallback(async () => {
            await this.generateThumbnail(entry, renderContext)
            completed++
            if (onProgress) onProgress(completed, entries.length)
            resolve()
          })
        })
      } else {
        // Fallback to immediate generation
        await this.generateThumbnail(entry, renderContext)
        completed++
        if (onProgress) onProgress(completed, entries.length)
      }
    }

    console.log(`Batch thumbnail generation complete: ${completed}/${entries.length}`)
  }

  /**
   * Gets thumbnail for an entry (from cache or generates)
   * @param {HistoryEntry} entry - History entry
   * @param {Object} renderContext - Rendering context
   * @returns {Promise<string>} - Base64 thumbnail
   */
  async getThumbnail (entry, renderContext) {
    return this.generateThumbnail(entry, renderContext)
  }

  /**
   * Clears the thumbnail cache
   */
  clearCache () {
    this.cache.clear()
  }

  /**
   * Gets cache statistics
   * @returns {Object} - Cache stats
   */
  getCacheStats () {
    return {
      ...this.cache.getStats(),
      errorCount: this.errorCount,
      lastError: this.lastError ? this.lastError.message : null
    }
  }

  /**
   * Manually triggers cache cleanup
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Object} - Cleanup statistics
   */
  cleanupCache (maxAge = 5 * 60 * 1000) {
    return this.cache.cleanup(maxAge)
  }

  /**
   * Optimizes cache by removing least recently used entries
   * Useful when memory usage is high
   * @param {number} targetSize - Target number of entries (default: 50% of max)
   * @returns {Object} - Optimization statistics
   */
  optimizeCache (targetSize = null) {
    if (!targetSize) {
      targetSize = Math.floor(this.cache.maxSize * 0.5)
    }

    if (this.cache.cache.size <= targetSize) {
      return { removedCount: 0, removedSize: 0 }
    }

    let removedCount = 0
    let removedSize = 0
    const removeCount = this.cache.cache.size - targetSize

    // Remove oldest entries (from beginning of Map)
    const entries = Array.from(this.cache.cache.entries())
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      const [entryId, entry] = entries[i]
      this.cache.sizeBytes -= entry.size
      removedSize += entry.size
      this.cache.cache.delete(entryId)
      removedCount++
    }

    console.log(`Cache optimization: removed ${removedCount} entries (${(removedSize / 1024).toFixed(2)}KB)`)

    return {
      removedCount,
      removedSize,
      removedSizeMB: (removedSize / 1024 / 1024).toFixed(2)
    }
  }
}
