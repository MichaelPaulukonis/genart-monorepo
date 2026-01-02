/**
 * FilmstripPanel - UI component for displaying and interacting with history thumbnails
 */
export class FilmstripPanel {
  constructor (historyManager, thumbnailGenerator) {
    this.historyManager = historyManager
    this.thumbnailGenerator = thumbnailGenerator
    this.isVisible = false

    // DOM elements
    this.panel = document.getElementById('filmstrip-panel')
    this.scrollContainer = document.getElementById('filmstrip-scroll')
    this.counter = document.getElementById('filmstrip-counter')
    this.closeBtn = document.getElementById('filmstrip-close')

    // Virtual scrolling configuration
    this.virtualScrollEnabled = true
    this.virtualScrollThreshold = 100 // Enable virtual scrolling when > 100 entries
    this.thumbnailWidth = 130 // 120px + 10px gap
    this.visibleRange = { start: 0, end: 0 }
    this.renderBuffer = 5 // Render extra items on each side

    // Bind event handlers
    this.closeBtn.addEventListener('click', (event) => {
      event.stopPropagation() // Prevent click from bubbling to canvas
      event.preventDefault() // Prevent default behavior
      this.hide()
    })

    // Add scroll listener for virtual scrolling
    this.scrollContainer.addEventListener('scroll', () => {
      if (this.virtualScrollEnabled && this.shouldUseVirtualScrolling()) {
        this.updateVisibleRange()
        this.renderVisibleThumbnails()
      }
    })

    // Track rendered thumbnails to avoid re-rendering
    this.renderedCount = 0
    this.renderedThumbnails = new Map() // Track which thumbnails are currently rendered
  }

  /**
   * Show the filmstrip panel
   */
  show () {
    this.isVisible = true
    this.panel.classList.remove('hidden')
    this.render()
    this.scrollToCurrentPosition()
  }

  /**
   * Hide the filmstrip panel
   */
  hide () {
    this.isVisible = false
    this.panel.classList.add('hidden')
  }

  /**
   * Toggle filmstrip visibility
   */
  toggle () {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Check if virtual scrolling should be used based on entry count
   */
  shouldUseVirtualScrolling () {
    return this.historyManager.history.length > this.virtualScrollThreshold
  }

  /**
   * Update the visible range based on scroll position
   */
  updateVisibleRange () {
    const scrollLeft = this.scrollContainer.scrollLeft
    const containerWidth = this.scrollContainer.clientWidth
    const totalEntries = this.historyManager.history.length

    // Calculate visible range with buffer
    const startIndex = Math.max(0, Math.floor(scrollLeft / this.thumbnailWidth) - this.renderBuffer)
    const endIndex = Math.min(
      totalEntries,
      Math.ceil((scrollLeft + containerWidth) / this.thumbnailWidth) + this.renderBuffer
    )

    this.visibleRange = { start: startIndex, end: endIndex }
  }

  /**
   * Render only visible thumbnails (virtual scrolling)
   */
  renderVisibleThumbnails () {
    const entries = this.historyManager.history
    const { start, end } = this.visibleRange

    // Remove thumbnails outside visible range
    for (const [position, element] of this.renderedThumbnails.entries()) {
      if (position < start || position >= end) {
        element.remove()
        this.renderedThumbnails.delete(position)
      }
    }

    // Add thumbnails in visible range
    for (let i = start; i < end; i++) {
      if (!this.renderedThumbnails.has(i)) {
        const entry = entries[i]
        const thumbnailElement = this.createThumbnailElement(entry, i)

        // Position absolutely for virtual scrolling
        thumbnailElement.style.position = 'absolute'
        thumbnailElement.style.left = `${i * this.thumbnailWidth}px`

        this.scrollContainer.appendChild(thumbnailElement)
        this.renderedThumbnails.set(i, thumbnailElement)
      }
    }

    this.updateHighlight()
  }

  /**
   * Render all thumbnails in the filmstrip
   */
  render () {
    const entries = this.historyManager.history
    const currentPosition = this.historyManager.currentPosition

    // Update counter
    const total = entries.length
    const current = currentPosition >= 0 ? currentPosition + 1 : 0
    this.counter.textContent = `${current} / ${total}`

    // Use virtual scrolling for large history
    if (this.shouldUseVirtualScrolling()) {
      // Set container width for virtual scrolling
      const totalWidth = entries.length * this.thumbnailWidth
      this.scrollContainer.style.position = 'relative'
      this.scrollContainer.style.width = '100%'

      // Create a spacer to enable scrolling
      let spacer = this.scrollContainer.querySelector('.filmstrip-spacer')
      if (!spacer) {
        spacer = document.createElement('div')
        spacer.className = 'filmstrip-spacer'
        spacer.style.position = 'absolute'
        spacer.style.height = '1px'
        spacer.style.pointerEvents = 'none'
        this.scrollContainer.appendChild(spacer)
      }
      spacer.style.width = `${totalWidth}px`

      // Update visible range and render
      this.updateVisibleRange()
      this.renderVisibleThumbnails()

      console.log(`Virtual scrolling enabled: ${entries.length} entries, rendering ${this.visibleRange.end - this.visibleRange.start} visible`)
      return
    }

    // Standard rendering for smaller history
    // Only render new thumbnails if history has grown
    if (this.renderedCount === entries.length) {
      // Just update highlighting
      this.updateHighlight()
      return
    }

    // Clear existing thumbnails if we need to re-render from scratch
    if (this.renderedCount > entries.length) {
      this.scrollContainer.innerHTML = ''
      this.renderedCount = 0
      this.renderedThumbnails.clear()
    }

    // Render new thumbnails
    for (let i = this.renderedCount; i < entries.length; i++) {
      const entry = entries[i]
      const thumbnailElement = this.createThumbnailElement(entry, i)
      this.scrollContainer.appendChild(thumbnailElement)
      this.renderedThumbnails.set(i, thumbnailElement)
    }

    this.renderedCount = entries.length
    this.updateHighlight()
  }

  /**
   * Create a thumbnail DOM element for a history entry
   */
  createThumbnailElement (entry, position) {
    const thumbnail = document.createElement('div')
    thumbnail.className = 'filmstrip-thumbnail'
    thumbnail.dataset.position = position

    // Add click handler
    thumbnail.addEventListener('click', (event) => {
      event.stopPropagation() // Prevent click from bubbling to canvas
      event.preventDefault() // Prevent default behavior
      this.handleThumbnailClick(position)
    })

    // Create placeholder initially
    const placeholder = document.createElement('div')
    placeholder.className = 'filmstrip-thumbnail-placeholder'
    placeholder.textContent = 'Loading...'
    thumbnail.appendChild(placeholder)

    // Generate thumbnail asynchronously
    this.generateThumbnailAsync(entry, thumbnail, placeholder)

    // Add info overlay
    const info = document.createElement('div')
    info.className = 'filmstrip-thumbnail-info'
    const positionText = `#${position + 1}`
    
    // Format names to preserve suffixes (essential for distinguishing similar files)
    const nameA = this.formatThumbnailName(entry.imageA.filename)
    const nameB = this.formatThumbnailName(entry.imageB.filename)
    
    info.textContent = `${positionText}: ${nameA} + ${nameB}`
    // Add full title as tooltip
    info.title = `${entry.imageA.filename} + ${entry.imageB.filename}`
    
    thumbnail.appendChild(info)

    return thumbnail
  }

  /**
   * Format filename for thumbnail display
   * Strips extension and truncates start if too long to preserve suffix
   */
  formatThumbnailName (filename) {
    if (!filename) return '?'
    // Get basename and strip extension
    const name = filename.split('/').pop().replace(/\.[^/.]+$/, '')
    
    // If too long, truncate start (preserve suffix like ..._001)
    if (name.length > 15) {
      return '...' + name.slice(-12)
    }
    return name
  }

  /**
   * Generate thumbnail asynchronously and update the DOM
   */
  async generateThumbnailAsync (entry, thumbnailElement, placeholder) {
    try {
      // Validate thumbnail generator has state refs
      if (!this.thumbnailGenerator.stateRefs) {
        throw new Error('Thumbnail generator state refs not available')
      }

      // Get render context from thumbnail generator's state refs
      const renderContext = {
        imgs: this.thumbnailGenerator.stateRefs.imgs,
        ALL_PALETTES: this.thumbnailGenerator.stateRefs.ALL_PALETTES,
        COLOR_MAPS: this.thumbnailGenerator.stateRefs.COLOR_MAPS,
        backgroundModes: this.thumbnailGenerator.stateRefs.backgroundModes
      }

      // Validate render context
      if (!renderContext.imgs || !renderContext.ALL_PALETTES || !renderContext.COLOR_MAPS || !renderContext.backgroundModes) {
        throw new Error('Incomplete render context')
      }

      const thumbnailDataUrl = await this.thumbnailGenerator.generateThumbnail(entry, renderContext)

      // Validate thumbnail data
      if (!thumbnailDataUrl || !thumbnailDataUrl.startsWith('data:image')) {
        throw new Error('Invalid thumbnail data URL')
      }

      // Create image element
      const img = document.createElement('img')
      img.src = thumbnailDataUrl
      img.alt = 'History thumbnail'

      // Replace placeholder with image
      placeholder.remove()
      thumbnailElement.insertBefore(img, thumbnailElement.firstChild)
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      placeholder.textContent = 'Error'
      placeholder.style.color = '#f44'
    }
  }

  /**
   * Handle thumbnail click
   */
  handleThumbnailClick (position) {
    this.historyManager.navigateTo(position)
    this.updateHighlight()
    this.updateCounter()
    this.scrollToPosition(position)
  }

  /**
   * Update the highlight on the current thumbnail
   */
  updateHighlight () {
    const currentPosition = this.historyManager.currentPosition

    // Remove all current highlights from rendered thumbnails
    for (const element of this.renderedThumbnails.values()) {
      element.classList.remove('current')
    }

    // Add highlight to current position if it's rendered
    if (this.renderedThumbnails.has(currentPosition)) {
      this.renderedThumbnails.get(currentPosition).classList.add('current')
    }
  }

  /**
   * Update the position counter display
   */
  updateCounter () {
    const total = this.historyManager.history.length
    const current = this.historyManager.currentPosition >= 0 ? this.historyManager.currentPosition + 1 : 0
    this.counter.textContent = `${current} / ${total}`
  }

  /**
   * Scroll to a specific position in the filmstrip
   */
  scrollToPosition (position) {
    if (position < 0 || position >= this.historyManager.history.length) {
      return
    }

    // For virtual scrolling, calculate scroll position
    if (this.shouldUseVirtualScrolling()) {
      const targetScrollLeft = position * this.thumbnailWidth - (this.scrollContainer.clientWidth / 2) + (this.thumbnailWidth / 2)
      this.scrollContainer.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      })

      // Update visible range after scroll completes
      setTimeout(() => {
        this.updateVisibleRange()
        this.renderVisibleThumbnails()
      }, 300)
    } else {
      // Standard scrolling for smaller history
      const thumbnail = this.renderedThumbnails.get(position)
      if (thumbnail) {
        thumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }

  /**
   * Scroll to the current position
   */
  scrollToCurrentPosition () {
    const currentPosition = this.historyManager.currentPosition
    if (currentPosition >= 0) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        this.scrollToPosition(currentPosition)
      }, 100)
    }
  }

  /**
   * Update the filmstrip (called when history changes)
   */
  update () {
    if (this.isVisible) {
      this.render()
    }
  }
}
