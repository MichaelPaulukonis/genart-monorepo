/**
 * HistoryManager Class
 *
 * Manages the history stack for duo-chrome compositions.
 * Uses a Non-Destructive Graph Architecture (Map-based Tree).
 *
 * Architecture:
 * - Maintains a graph of HistoryNode objects (Map<id, HistoryNode>)
 * - Supports infinite branching (no data loss on middle-edit)
 * - Exposes a linear "Active Path" to the UI for backward compatibility
 * - Tracks rootId and currentId for navigation
 */

/* global localStorage */

import { createHistoryEntry, validateHistoryEntry } from './HistoryEntry.js'
import { ThumbnailGenerator } from './ThumbnailGenerator.js'

/**
 * Internal Node structure for the History Graph
 */
class HistoryNode {
  constructor (entry) {
    this.id = entry.id
    this.parentId = null
    this.children = [] // IDs of all children (branches)
    this.activeChildId = null // The currently selected "forward" path
    this.entry = entry // The actual composition data
    this.timestamp = entry.timestamp || Date.now()
  }
}

export class HistoryManager {
  /**
   * Creates a new HistoryManager instance.
   *
   * @param {Object} p5Instance - p5.js instance for rendering
   * @param {Object} stateRefs - References to duo-chrome state objects
   */
  constructor (p5Instance, stateRefs) {
    this.p = p5Instance
    this.stateRefs = stateRefs

    // Graph Data Structure
    this.nodes = new Map()
    this.rootId = null
    this.currentId = null

    // Cache for linear history representation (Active Path)
    this._cachedActivePath = null
    this._cachedCurrentPosition = -1

    // Navigation state
    this.isNavigating = false // Prevent capture during navigation

    // Configuration
    this.maxEntries = 1000 // Increased limit due to graph structure

    // Storage configuration
    this.storageKey = 'duo-chrome-history'
    this.storageVersion = 2 // v2 = Graph Architecture

    // Error tracking
    this.errorLog = []
    this.maxErrorLogSize = 100
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

    console.log('HistoryManager (Non-Destructive) initialized')

    // Load history from storage on initialization
    this.loadFromStorage()
  }

  // --- Public API Compatibility Getters ---

  /**
   * Gets the linear "Active Path" as an array of entries.
   * Maintains compatibility with UI that expects a linear array.
   */
  get history () {
    if (this._cachedActivePath === null) {
      this._rebuildActivePath()
    }
    return this._cachedActivePath
  }

  set history (value) {
    // Read-only derived property, but some internal methods might try to set it during migration/testing
    // We ignore it or log a warning
    console.warn('Attempted to set read-only history property')
  }

  /**
   * Gets the current position index in the active path.
   */
  get currentPosition () {
    if (this._cachedCurrentPosition === -1 && this.currentId) {
      this._rebuildActivePath()
    }
    return this._cachedCurrentPosition
  }

  set currentPosition (value) {
    // Read-only derived property
    console.warn('Attempted to set read-only currentPosition property')
  }

  /**
   * Rebuilds the active path cache from the graph.
   * Walks from rootId -> activeChildId -> ...
   * @private
   */
  _rebuildActivePath () {
    const path = []
    let currentNodeId = this.rootId
    let index = 0
    this._cachedCurrentPosition = -1

    while (currentNodeId && this.nodes.has(currentNodeId)) {
      const node = this.nodes.get(currentNodeId)

      // Attach metadata for UI (non-persistent)
      // This allows the filmstrip to show branch indicators
      node.entry._branchCount = node.children.length

      path.push(node.entry)

      if (node.id === this.currentId) {
        this._cachedCurrentPosition = index
      }

      currentNodeId = node.activeChildId
      index++
    }

    this._cachedActivePath = path
  }

  /**
   * Invalidates the active path cache.
   * Call this whenever the graph structure or currentId changes.
   * @private
   */
  _invalidateCache () {
    this._cachedActivePath = null
    this._cachedCurrentPosition = -1
  }

  // --- Core Functionality ---

  /**
   * Captures the current composition state and adds it to history.
   * Creates a NEW BRANCH if not at the latest tip.
   *
   * @param {string} source - How the entry was created
   * @returns {HistoryEntry|null} - The created entry
   */
  captureCurrentState (source = 'manual') {
    if (this.isNavigating) {
      console.log('Skipping capture during navigation')
      return null
    }

    const entry = this._createEntryFromState(source)
    if (!entry) return null

    const newNode = new HistoryNode(entry)

    if (!this.rootId) {
      // First entry
      this.rootId = newNode.id
      this.nodes.set(newNode.id, newNode)
    } else {
      // Add as child of current node
      const currentNode = this.nodes.get(this.currentId)
      if (currentNode) {
        newNode.parentId = currentNode.id
        currentNode.children.push(newNode.id)

        // **Branching Logic:**
        // Always set the new node as the active child, effectively
        // "switching" the active path to this new branch.
        // The old activeChildId (if any) is preserved in the children array
        // but no longer part of the default forward path.
        currentNode.activeChildId = newNode.id
      } else {
        console.error('Current node ID not found in graph:', this.currentId)
        // Fallback: reset to root or start over?
        // Ideally shouldn't happen.
      }
      this.nodes.set(newNode.id, newNode)
    }

    // Move pointer to new node
    this.currentId = newNode.id
    this._invalidateCache()

    // Enforce limits (pruning)
    this._enforceSizeLimits()

    console.log(`Captured history entry: ${entry.id} (source: ${source})`)
    this.saveToStorage()

    return entry
  }

  /**
   * Creates a HistoryEntry object from current app state.
   * @private
   */
  _createEntryFromState (source) {
    const { imageColorPairs, controlState, colorIndex, currentBlendModeIndex, currentBackgroundModeIndex } = this.stateRefs

    if (!imageColorPairs || imageColorPairs.length < 2 || !imageColorPairs[0].img) {
      console.warn('Cannot capture state: data not ready')
      return null
    }

    return createHistoryEntry({
      imageA: {
        index: controlState.imageIndices[0],
        filename: imageColorPairs[0].img,
        colorName: imageColorPairs[0].color.name,
        scale: parseFloat(imageColorPairs[0].scale)
      },
      imageB: {
        index: controlState.imageIndices[1],
        filename: imageColorPairs[1].img,
        colorName: imageColorPairs[1].color.name,
        scale: parseFloat(imageColorPairs[1].scale)
      },
      paletteIndex: colorIndex,
      blendModeIndex: currentBlendModeIndex,
      backgroundModeIndex: currentBackgroundModeIndex,
      activeImageIndex: controlState.activeImageIndex,
      source
    })
  }

  /**
   * Toggles the active branch for a specific node.
   * Cycles through available children, changing the active path.
   *
   * @param {string} nodeId - ID of the node to toggle
   * @returns {boolean} - True if branch was switched
   */
  toggleBranch (nodeId) {
    const node = this.nodes.get(nodeId)
    if (!node || node.children.length <= 1) {
      return false
    }

    const currentChildIndex = node.children.indexOf(node.activeChildId)
    if (currentChildIndex === -1) {
      // Should not happen, but fallback to first child
      node.activeChildId = node.children[0]
    } else {
      // Cycle to next child
      const nextIndex = (currentChildIndex + 1) % node.children.length
      node.activeChildId = node.children[nextIndex]
    }

    console.log(`Switched branch for node ${nodeId}. Active child: ${node.activeChildId}`)

    this._invalidateCache()
    this.saveToStorage()

    // If we are currently "downstream" from this node, we might need to
    // update currentId?
    // Actually, if we switch the branch at a past node, our currentId
    // (if we are at the tip) effectively becomes "disconnected" from the active path.
    // The "Filmstrip" shows the active path.
    // If currentId is NOT in the new active path, we should probably
    // jump to the new tip? Or stay where we are (off-road)?

    // Standard behavior: If I switch a signpost 5 miles back, I am still where I am.
    // But the "Map" (Filmstrip) will show the new route.
    // If I want to "see" the other branch, I should probably navigate to it.

    // Let's check if currentId is still reachable from root.
    // _rebuildActivePath will determine the new path.
    // If currentId is not in it, it's confusing.

    // Better UX: When toggling a branch, typically one is AT the fork point.
    // If the user clicks the fork icon on a thumbnail, they are modifying
    // the path *leaving* that thumbnail.

    return true
  }

  /**
   * Navigates to a specific position in the *active* history stack.
   *
   * @param {number} position - Target position (0-based index in active path)
   * @returns {boolean} - True if navigation succeeded
   */
  navigateTo (position) {
    const path = this.history // Gets cached active path
    if (position < 0 || position >= path.length) {
      console.warn(`Invalid history position: ${position}`)
      return false
    }

    const entry = path[position]
    const targetNodeId = entry.id

    this.isNavigating = true

    try {
      this.currentId = targetNodeId
      this._invalidateCache() // Update current position index

      this._restoreCompositionFromEntry(entry)
      console.log(`Navigated to position ${position + 1}/${path.length} (${entry.id})`)

      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to navigate:', error)
      this.isNavigating = false
      return false
    }
  }

  /**
   * Navigates backward (to parent).
   */
  navigateBackward () {
    const currentNode = this.nodes.get(this.currentId)
    if (!currentNode || !currentNode.parentId) {
      console.log('Already at beginning of history')
      return false
    }

    // Find the position of the parent in the active path
    // We can't just subtract 1 from currentPosition because we might be
    // navigating *up* a tree that isn't the active path?
    // Actually, parent is always "back".

    // We can just set currentId to parentId.
    // However, we need to call navigateTo to trigger the restore logic.
    // But navigateTo takes an *index* in the active path.
    // Since parent is always in the active path of the child,
    // we can just decrement currentPosition IF we are on the active path.
    // If we are disjointed, this logic holds: Parent is always index-1.

    return this.navigateTo(this.currentPosition - 1)
  }

  /**
   * Navigates forward (to active child).
   */
  navigateForward () {
    const currentNode = this.nodes.get(this.currentId)
    if (!currentNode || !currentNode.activeChildId) {
      console.log('Already at end of history')
      return false
    }

    return this.navigateTo(this.currentPosition + 1)
  }

  /**
   * Gets the current history entry.
   */
  getCurrentEntry () {
    if (!this.currentId) return null
    const node = this.nodes.get(this.currentId)
    return node ? node.entry : null
  }

  /**
   * Checks if backward navigation is possible.
   */
  canNavigateBackward () {
    if (!this.currentId) return false
    const node = this.nodes.get(this.currentId)
    return !!(node && node.parentId)
  }

  /**
   * Checks if forward navigation is possible.
   */
  canNavigateForward () {
    if (!this.currentId) return false
    const node = this.nodes.get(this.currentId)
    return !!(node && node.activeChildId)
  }

  /**
   * Gets the total number of entries in the ACTIVE path.
   */
  getTotalEntries () {
    return this.history.length
  }

  /**
   * Gets the current position in the ACTIVE path (1-based).
   */
  getCurrentPosition () {
    return this.currentPosition + 1
  }

  _logError (context, error, data = {}) {
    console.error(`Error in ${context}:`, error)

    // Update counts
    // We might want to categorize errors, but 'other' is safe default if we don't infer category
    const category = this._categorizeError(context, error)
    if (this.errorCounts[category] !== undefined) {
      this.errorCounts[category]++
    } else {
      this.errorCounts.other++
    }

    // Add to log
    const entry = {
      timestamp: Date.now(),
      context, // Maps to 'operation' in tests
      message: error.message || String(error),
      stack: error.stack,
      data // Maps to 'context' in tests
    }
    this.errorLog.unshift(entry)
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog.pop()
    }
  }

  _categorizeError (context, error) {
    if (context.includes('Storage') || error.name?.includes('Quota') || error.name?.includes('Security')) return 'storage'
    if (context.includes('Image') || context.includes('load')) return 'imageLoad'
    if (context.includes('navigat')) return 'navigation'
    if (context.includes('Thumbnail')) return 'thumbnail'
    if (context.includes('validat')) return 'validation'
    return 'other'
  }

  getErrorLog () {
    return this.errorLog
  }

  getErrorStats () {
    return {
      errorCounts: { ...this.errorCounts },
      totalErrors: Object.values(this.errorCounts).reduce((a, b) => a + b, 0)
    }
  }

  exportErrorLog () {
    return JSON.stringify({
      timestamp: Date.now(),
      errors: this.errorLog,
      errorStats: this.getErrorStats(),
      historySize: this.nodes.size,
      storageUsage: this._estimateStorageUsage()
    }, null, 2)
  }

  _estimateStorageUsage () {
    if (typeof localStorage === 'undefined') return 0
    const stored = localStorage.getItem(this.storageKey)
    return stored ? stored.length : 0
  }

  healthCheck () {
    const issues = []
    const warnings = []

    // Check storage
    if (typeof localStorage === 'undefined') {
      issues.push('localStorage is not available')
    }

    // Check consistency
    if (this.nodes.size > 0) {
      if (!this.rootId || !this.nodes.has(this.rootId)) {
        issues.push('Graph root is missing')
      }
      if (!this.currentId || !this.nodes.has(this.currentId)) {
        issues.push('Current pointer is invalid')
      }
    }

    // Check error rates
    const stats = this.getErrorStats()
    if (stats.totalErrors > 50) {
      warnings.push(`High error count: ${stats.totalErrors}`)
    }

    return {
      healthy: issues.length === 0,
      issues,
      warnings
    }
  }

  // --- Restoration Logic (Same as before) ---

  _restoreCompositionFromEntry (entry) {
    const { imageColorPairs, controlState, ALL_PALETTES, COLOR_MAPS } = this.stateRefs

    try {
      const paletteIndex = this._validatePaletteIndex(entry.paletteIndex, ALL_PALETTES)
      this.stateRefs.colorIndex = paletteIndex

      const blendModeIndex = this._validateBlendModeIndex(entry.blendModeIndex, entry.backgroundModeIndex)
      this.stateRefs.currentBlendModeIndex = blendModeIndex

      const backgroundModeIndex = this._validateBackgroundModeIndex(entry.backgroundModeIndex)
      this.stateRefs.currentBackgroundModeIndex = backgroundModeIndex

      controlState.activeImageIndex = this._validateActiveImageIndex(entry.activeImageIndex)
      controlState.imageIndices[0] = this._validateImageIndex(entry.imageA.index)
      controlState.imageIndices[1] = this._validateImageIndex(entry.imageB.index)

      imageColorPairs[0].img = entry.imageA.filename
      imageColorPairs[0].scale = this._validateScale(entry.imageA.scale)
      controlState.manualSizeControl[0] = true

      imageColorPairs[0].color = this._findColorWithFallback(
        entry.imageA.colorName, paletteIndex, COLOR_MAPS, ALL_PALETTES, 0
      )

      imageColorPairs[1].img = entry.imageB.filename
      imageColorPairs[1].scale = this._validateScale(entry.imageB.scale)
      controlState.manualSizeControl[1] = true

      imageColorPairs[1].color = this._findColorWithFallback(
        entry.imageB.colorName, paletteIndex, COLOR_MAPS, ALL_PALETTES, 1
      )

      this._loadImagesForEntry(entry)
    } catch (error) {
      console.error('Failed to restore composition:', error)
      this._logError('_restoreCompositionFromEntry', error, entry)
      throw error
    }
  }

  // --- Validation Helpers (Preserved from original) ---

  _validatePaletteIndex (index, palettes) {
    if (typeof index !== 'number' || index < 0 || index >= palettes.length) return 0
    return index
  }

  _validateBlendModeIndex (blendIndex, bgIndex) {
    if (typeof blendIndex !== 'number' || blendIndex < 0 || blendIndex > 5) return 0
    return blendIndex
  }

  _validateBackgroundModeIndex (index) {
    if (typeof index !== 'number' || (index !== 0 && index !== 1)) return 0
    return index
  }

  _validateActiveImageIndex (index) {
    if (typeof index !== 'number' || (index !== 0 && index !== 1)) return 0
    return index
  }

  _validateImageIndex (index) {
    const { imgs } = this.stateRefs
    if (typeof index !== 'number' || index < 0 || index >= imgs.length) return 0
    return index
  }

  _validateScale (scale) {
    const parsed = parseFloat(scale)
    if (!Number.isFinite(parsed) || parsed < 0.05 || parsed > 5.0) return 1.0
    return parsed
  }

  _findColorWithFallback (colorName, paletteIndex, colorMaps, palettes, fallbackIndex) {
    try {
      const color = colorMaps[paletteIndex].get(colorName)
      if (color) return color

      for (let i = 0; i < colorMaps.length; i++) {
        if (i === paletteIndex) continue
        const altColor = colorMaps[i].get(colorName)
        if (altColor) return altColor
      }
      return palettes[paletteIndex][fallbackIndex]
    } catch (error) {
      return palettes[0][0]
    }
  }

  // --- Image Loading (Preserved) ---

  _loadImagesForEntry (entry) {
    const { imageColorPairs, imgs } = this.stateRefs
    const imgSource = './images/'
    let loadedCount = 0
    const totalImages = 2
    const loadErrors = []

    const loadCallback = () => {
      loadedCount++
      if (loadedCount === totalImages) {
        this._onImagesLoaded(loadErrors)
      }
    }

    const loadErrorCallback = (idx, error) => {
      loadErrors.push({ image: idx === 0 ? 'A' : 'B', error })
      this._loadFallbackImage(idx, imageColorPairs)
      loadCallback()
    }

    // Load A
    this.p.loadImage(imgSource + entry.imageA.filename, (img) => {
      try {
        if (imageColorPairs[0].layer?.remove) imageColorPairs[0].layer.remove()
        imageColorPairs[0].layer = this._createMonochromeImage(img, this.p.color(imageColorPairs[0].color.color))
        loadCallback()
      } catch (e) { loadErrorCallback(0, e) }
    }, (e) => loadErrorCallback(0, e))

    // Load B
    this.p.loadImage(imgSource + entry.imageB.filename, (img) => {
      try {
        if (imageColorPairs[1].layer?.remove) imageColorPairs[1].layer.remove()
        imageColorPairs[1].layer = this._createMonochromeImage(img, this.p.color(imageColorPairs[1].color.color))
        loadCallback()
      } catch (e) { loadErrorCallback(1, e) }
    }, (e) => loadErrorCallback(1, e))
  }

  _loadFallbackImage (imageIndex, imageColorPairs) {
    const { imgs } = this.stateRefs
    if (imgs.length > 0) {
      this.p.loadImage('./images/' + imgs[0], (img) => {
        if (imageColorPairs[imageIndex].layer?.remove) imageColorPairs[imageIndex].layer.remove()
        imageColorPairs[imageIndex].layer = this._createMonochromeImage(img, this.p.color(imageColorPairs[imageIndex].color.color))
        imageColorPairs[imageIndex].img = imgs[0]
      }, () => this._createPlaceholderLayer(imageIndex, imageColorPairs))
    } else {
      this._createPlaceholderLayer(imageIndex, imageColorPairs)
    }
  }

  _createPlaceholderLayer (imageIndex, imageColorPairs) {
    const size = 400
    const layer = this.p.createGraphics(size, size)
    layer.background(imageColorPairs[imageIndex].color.color)
    layer.text('Unavailable', size / 2, size / 2)
    if (imageColorPairs[imageIndex].layer?.remove) imageColorPairs[imageIndex].layer.remove()
    imageColorPairs[imageIndex].layer = layer
  }

  _onImagesLoaded (loadErrors = []) {
    if (this.stateRefs.requestScreenUpdate) this.stateRefs.requestScreenUpdate()
    if (this.stateRefs.updateStatusDisplay) this.stateRefs.updateStatusDisplay()
    this.isNavigating = false
  }

  _createMonochromeImage (img, monoColor) {
    const scaleRatio = this._calculateScaleRatio(img)
    const layer = this.p.createGraphics(Math.round(img.width * scaleRatio), Math.round(img.height * scaleRatio))
    const colorLayer = this.p.createGraphics(100, 100)
    colorLayer.background(monoColor)
    layer.image(img, 0, 0, layer.width, layer.height)
    layer.drawingContext.globalCompositeOperation = 'source-in'
    layer.image(colorLayer, 0, 0, layer.width, layer.height)
    return layer
  }

  _calculateScaleRatio (img) {
    return (Math.min(this.p.width, this.p.height) * 0.8) / Math.max(img.width, img.height)
  }

  // --- Persistence & Migration ---

  saveToStorage () {
    try {
      if (typeof localStorage === 'undefined') return false

      // Serialize Graph: Convert Map to array of nodes
      const nodesArray = Array.from(this.nodes.values())

      const storageData = {
        version: this.storageVersion,
        rootId: this.rootId,
        currentId: this.currentId,
        nodes: nodesArray,
        lastModified: Date.now()
      }

      const serialized = JSON.stringify(storageData)
      localStorage.setItem(this.storageKey, serialized)

      // Auto-optimize if too large
      if (serialized.length > 4 * 1024 * 1024) { // 4MB
        this.optimizeHistory()
      }

      return true
    } catch (error) {
      console.error('Failed to save history:', error)
      return false
    }
  }

  loadFromStorage () {
    try {
      if (typeof localStorage === 'undefined') return false
      const serialized = localStorage.getItem(this.storageKey)
      if (!serialized) return false

      const data = JSON.parse(serialized)

      if (!data || !data.nodes || !Array.isArray(data.nodes)) return false

      // Rehydrate Graph
      this.nodes = new Map()
      data.nodes.forEach(node => {
        this.nodes.set(node.id, node)
      })
      this.rootId = data.rootId
      this.currentId = data.currentId

      // Validate pointers
      if (!this.nodes.has(this.rootId) || !this.nodes.has(this.currentId)) {
        console.error('Corrupted history graph (missing root or current node). Resetting.')
        this.clearHistory()
        return false
      }

      this._invalidateCache()
      console.log(`Loaded history graph: ${this.nodes.size} nodes`)
      return true
    } catch (error) {
      console.error('Failed to load history:', error)
      this.clearHistory()
      return false
    }
  }

  _enforceSizeLimits () {
    if (this.nodes.size > this.maxEntries) {
      this.optimizeHistory(this.maxEntries)
    }
  }

  clearHistory () {
    this.nodes.clear()
    this.rootId = null
    this.currentId = null
    this._invalidateCache()
    localStorage.removeItem(this.storageKey)
    if (this.thumbnailGenerator) this.thumbnailGenerator.clearCache()

    // Preserve current state as new root
    const entry = this._createEntryFromState('manual')
    if (entry) {
      const node = new HistoryNode(entry)
      this.rootId = node.id
      this.currentId = node.id
      this.nodes.set(node.id, node)
      this.saveToStorage()
    }

    return true
  }

  // --- Thumbnail Pass-throughs ---
  async generateThumbnailForPosition (position) {
    const entry = this.history[position] // Use active path
    if (!entry) return null
    // ... context generation logic ...
    // Simplifying for refactor: reuse generic generator
    // Note: The original method had complex context setup.
    // We rely on ThumbnailGenerator generic methods.
    return null // Placeholder, actual implementation requires refactoring context logic from original
  }

  // --- Performance Monitoring ---

  getPerformanceStats () {
    return {
      historySize: this.nodes.size,
      activePathLength: this.history.length,
      currentPosition: this.currentPosition,
      maxEntries: this.maxEntries,
      memoryUsage: {
        estimatedKB: (this._estimateStorageUsage() / 1024).toFixed(2)
      },
      errorStats: this.getErrorStats(),
      thumbnailCache: this.thumbnailGenerator ? this.thumbnailGenerator.getCacheStats() : null
    }
  }

  async profileOperation (name, operation) {
    const start = performance.now()
    try {
      const result = await operation()
      const duration = performance.now() - start
      // We could log this if we had a performance log
      return result
    } catch (error) {
      const duration = performance.now() - start
      throw error
    }
  }

  optimizeHistory (targetSize = 50) {
    // Basic graph pruning: Keep root, current path, and up to targetSize recent nodes
    if (this.nodes.size <= targetSize) return 0

    const keepIds = new Set()
    
    // 1. Prune Active Path
    const path = this.history
    let startIndex = 0
    if (path.length > targetSize) {
      startIndex = path.length - targetSize
      // Update root to the new start
      this.rootId = path[startIndex].id
      const newRoot = this.nodes.get(this.rootId)
      if (newRoot) newRoot.parentId = null
    }
    
    // Keep nodes in the (possibly truncated) active path
    for (let i = startIndex; i < path.length; i++) {
      keepIds.add(path[i].id)
    }

    // 2. Keep currentId (should be in path usually, but safety check)
    if (this.currentId) keepIds.add(this.currentId)

    // If we still have room, keep some recent nodes (by timestamp)
    if (keepIds.size < targetSize) {
      const sortedNodes = Array.from(this.nodes.values())
        .sort((a, b) => b.timestamp - a.timestamp)
      
      for (const node of sortedNodes) {
        if (keepIds.size >= targetSize) break
        keepIds.add(node.id)
      }
    }

    // Remove nodes not in keepIds
    let removedCount = 0
    for (const [id, node] of this.nodes) {
      if (!keepIds.has(id)) {
        this.nodes.delete(id)
        // Also verify parent references? 
        // In a graph, removing a node might break parent's children array.
        // We should cleanup parent references.
        if (node.parentId && this.nodes.has(node.parentId)) {
          const parent = this.nodes.get(node.parentId)
          parent.children = parent.children.filter(childId => childId !== id)
          if (parent.activeChildId === id) {
            parent.activeChildId = parent.children.length > 0 ? parent.children[0] : null
          }
        }
        removedCount++
      }
    }

    this._invalidateCache()
    
    // Clear thumbnail cache for removed entries if possible
    // (ThumbnailGenerator doesn't expose delete yet, but we can clear all if drastic)
    if (removedCount > 0 && this.thumbnailGenerator) {
       // Ideally we'd remove specific IDs. 
       // For now, assume ThumbnailGenerator manages its own LRU or we let it be.
    }

    this.saveToStorage()
    console.log(`Optimized history: removed ${removedCount} nodes`)
    return removedCount
  }

  logPerformanceStats () {
    console.log(`History Graph: ${this.nodes.size} nodes`)
    console.log(`Storage Usage: ${this._estimateStorageUsage()} bytes`)
  }
}
