/**
 * FilterModal - UI component for filtering the image list
 */
export class FilterModal {
  /**
   * @param {Object} options
   * @param {Function} options.onFilterChange - Callback when filter changes
   * @param {number} options.totalImages - Total number of images available
   */
  constructor (options) {
    this.onFilterChange = options.onFilterChange
    this.totalImages = options.totalImages
    this.isVisible = false
    this.currentFilter = ''

    // DOM elements
    this.modal = document.getElementById('filter-modal')
    this.input = document.getElementById('filter-input')
    this.clearBtn = document.getElementById('filter-clear-btn')
    this.closeBtn = document.getElementById('filter-close')
    this.stats = document.getElementById('filter-stats')

    // Create file list container
    this.fileListContainer = document.createElement('div')
    this.fileListContainer.className = 'filter-file-list'
    this.fileListContainer.id = 'filter-file-list'
    
    // Insert after stats, before actions
    const content = this.modal.querySelector('.filter-content')
    const actions = this.modal.querySelector('.filter-actions')
    content.insertBefore(this.fileListContainer, actions)

    this._bindEvents()
  }

  _bindEvents () {
    // Input changes
    this.input.addEventListener('input', (e) => {
      this.currentFilter = e.target.value
      this._handleFilterUpdate()
    })

    // Prevent global key shortcuts from triggering while typing
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Escape') {
        this.hide()
        this.closeBtn.focus() // Return focus to a safe element
      }
    })
    this.input.addEventListener('keyup', (e) => e.stopPropagation())
    this.input.addEventListener('keypress', (e) => e.stopPropagation())

    // Clear button
    this.clearBtn.addEventListener('click', () => {
      this.clear()
    })

    // Close button
    this.closeBtn.addEventListener('click', () => {
      this.hide()
    })

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide()
      }
    })

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide()
      }
    })
  }

  _handleFilterUpdate () {
    if (this.onFilterChange) {
      this.onFilterChange(this.currentFilter)
    }
  }

  /**
   * Update the displayed statistics
   * @param {number} filteredCount - Number of images after filtering
   */
  updateStats (filteredCount) {
    if (this.currentFilter.trim() === '') {
      this.stats.textContent = `Showing all ${this.totalImages} images`
    } else {
      this.stats.textContent = `Showing ${filteredCount} of ${this.totalImages} images`
    }
  }

  /**
   * Update the displayed file list
   * @param {string[]} fileList - Array of filenames
   */
  updateList (fileList) {
    this.fileListContainer.innerHTML = ''
    
    if (fileList.length === 0) {
      const emptyMsg = document.createElement('div')
      emptyMsg.className = 'filter-list-empty'
      emptyMsg.textContent = 'No matching images found'
      this.fileListContainer.appendChild(emptyMsg)
      return
    }

    fileList.forEach(filename => {
      const item = document.createElement('div')
      item.className = 'filter-file-item'
      // Remove extension for display
      item.textContent = filename.replace(/\.[^/.]+$/, '')
      item.title = filename
      
      item.addEventListener('click', () => {
        // Future: select this image explicitly? 
        // For now, maybe just fill input with this name?
        this.input.value = item.textContent
        this.currentFilter = item.textContent
        this._handleFilterUpdate()
        // Optional: close modal on selection?
        // this.hide()
      })
      
      this.fileListContainer.appendChild(item)
    })
  }

  show () {
    this.isVisible = true
    this.modal.classList.remove('hidden')
    this.input.focus()
    // Ensure list is rendered (if not already)
    // We rely on external updateList calls usually, but if static...
  }

  hide () {
    this.isVisible = false
    this.modal.classList.add('hidden')
  }

  toggle () {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  clear () {
    this.currentFilter = ''
    this.input.value = ''
    this._handleFilterUpdate()
    this.input.focus()
  }
}
