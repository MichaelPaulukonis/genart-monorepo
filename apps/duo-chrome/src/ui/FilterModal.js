import { 
  getThemes, 
  saveTheme, 
  deleteTheme, 
  getAssignments, 
  assignTheme 
} from '../utils/theme-management.js'

/**
 * FilterModal - UI component for filtering the image list
 */
export class FilterModal {
  /**
   * @param {Object} options
   * @param {Function} options.onFilterChange - Callback when filter changes
   * @param {Function} options.onThemeAssign - Callback when theme assignment changes (position, themeId)
   * @param {number} options.totalImages - Total number of images available
   */
  constructor (options) {
    this.onFilterChange = options.onFilterChange
    this.onThemeAssign = options.onThemeAssign
    this.totalImages = options.totalImages
    this.isVisible = false
    this.currentFilter = ''
    this.currentTab = 'filter' // 'filter' or 'themes'

    // DOM elements
    this.modal = document.getElementById('filter-modal')
    this.input = document.getElementById('filter-input')
    this.clearBtn = document.getElementById('filter-clear-btn')
    this.closeBtn = document.getElementById('filter-close')
    this.stats = document.getElementById('filter-stats')
    this.content = this.modal.querySelector('.filter-content')
    this.actions = this.modal.querySelector('.filter-actions')

    // Create tabs container
    this.tabsContainer = document.createElement('div')
    this.tabsContainer.className = 'filter-tabs'
    this.tabsContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 10px;'
    
    this.filterTabBtn = this._createTabBtn('Active Filter', 'filter')
    this.themesTabBtn = this._createTabBtn('Saved Themes', 'themes')
    
    this.tabsContainer.appendChild(this.filterTabBtn)
    this.tabsContainer.appendChild(this.themesTabBtn)
    
    // Insert tabs at the top of content
    this.content.insertBefore(this.tabsContainer, this.content.firstChild)

    // Create file list container (for filter view)
    this.fileListContainer = document.createElement('div')
    this.fileListContainer.className = 'filter-file-list'
    this.fileListContainer.id = 'filter-file-list'
    
    // Create themes container (for themes view)
    this.themesContainer = document.createElement('div')
    this.themesContainer.className = 'filter-themes-list'
    this.themesContainer.style.cssText = 'display: none; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto;'

    // Save Theme Button (for filter view)
    this.saveThemeBtn = document.createElement('button')
    this.saveThemeBtn.textContent = 'Save as Theme'
    this.saveThemeBtn.className = 'filter-btn'
    this.saveThemeBtn.style.marginLeft = '10px'
    
    // Insert containers
    this.content.insertBefore(this.fileListContainer, this.actions)
    this.content.insertBefore(this.themesContainer, this.actions)
    
    // Append save button to input area (we might need to find the input container)
    // The input is likely inside a wrapper. Let's append it next to clearBtn for now if possible,
    // or just in the actions area for the filter view.
    // Let's put it in the header/input area.
    this.input.parentNode.appendChild(this.saveThemeBtn)

    this._bindEvents()
    this._updateTabVisibility()
  }

  _createTabBtn(text, tabName) {
    const btn = document.createElement('button')
    btn.textContent = text
    btn.style.cssText = 'background: none; border: none; color: #888; cursor: pointer; padding: 5px 10px; font-weight: bold;'
    btn.addEventListener('click', () => {
      this.currentTab = tabName
      this._updateTabVisibility()
    })
    return btn
  }

  _updateTabVisibility() {
    // Update Tab Buttons
    const activeStyle = 'color: #fff; border-bottom: 2px solid #00bcd4;'
    const inactiveStyle = 'color: #888; border-bottom: none;'
    
    this.filterTabBtn.style.cssText += (this.currentTab === 'filter' ? activeStyle : inactiveStyle)
    this.themesTabBtn.style.cssText += (this.currentTab === 'themes' ? activeStyle : inactiveStyle)

    // Show/Hide Content
    if (this.currentTab === 'filter') {
      this.fileListContainer.style.display = 'block'
      this.themesContainer.style.display = 'none'
      this.input.parentElement.style.display = 'block' // Show input area
      this.stats.style.display = 'block'
      this.saveThemeBtn.style.display = 'inline-block'
    } else {
      this.fileListContainer.style.display = 'none'
      this.themesContainer.style.display = 'flex'
      this.input.parentElement.style.display = 'none' // Hide input area
      this.stats.style.display = 'none'
      this.saveThemeBtn.style.display = 'none'
      this._renderThemes()
    }
  }

  _renderThemes() {
    this.themesContainer.innerHTML = ''
    const themes = getThemes()
    const assignments = getAssignments()

    if (themes.length === 0) {
      const empty = document.createElement('div')
      empty.textContent = 'No saved themes.'
      empty.style.padding = '20px'
      empty.style.textAlign = 'center'
      empty.style.color = '#888'
      this.themesContainer.appendChild(empty)
      return
    }

    themes.forEach(theme => {
      const item = document.createElement('div')
      item.style.cssText = 'background: #333; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;'
      
      const info = document.createElement('div')
      info.style.flex = '1'
      
      const name = document.createElement('div')
      name.textContent = theme.name
      name.style.fontWeight = 'bold'
      name.style.color = '#fff'
      
      const details = document.createElement('div')
      details.textContent = `Filter: "${theme.filter.searchString}"`
      details.style.fontSize = '0.8em'
      details.style.color = '#aaa'
      
      info.appendChild(name)
      info.appendChild(details)
      
      // Controls
      const controls = document.createElement('div')
      controls.style.display = 'flex'
      controls.style.gap = '8px'
      
      // Assign A
      const btnA = document.createElement('button')
      const isA = assignments[0] === theme.id
      btnA.textContent = isA ? 'A (Active)' : 'Assign A'
      btnA.style.cssText = `padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; background: ${isA ? '#00bcd4' : '#444'}; color: ${isA ? '#000' : '#fff'};`
      btnA.addEventListener('click', () => {
        const newId = isA ? null : theme.id
        assignTheme(0, newId)
        if (this.onThemeAssign) this.onThemeAssign(0, newId)
        this._renderThemes() // Re-render to update state
      })
      
      // Assign B
      const btnB = document.createElement('button')
      const isB = assignments[1] === theme.id
      btnB.textContent = isB ? 'B (Active)' : 'Assign B'
      btnB.style.cssText = `padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; background: ${isB ? '#ff4081' : '#444'}; color: ${isB ? '#fff' : '#fff'};`
      btnB.addEventListener('click', () => {
        const newId = isB ? null : theme.id
        assignTheme(1, newId)
        if (this.onThemeAssign) this.onThemeAssign(1, newId)
        this._renderThemes() // Re-render
      })

      // Edit
      const btnEdit = document.createElement('button')
      btnEdit.textContent = 'Edit'
      btnEdit.title = 'Edit Theme Filter'
      btnEdit.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; background: #2196F3; color: #fff;'
      btnEdit.addEventListener('click', () => {
        // Load filter
        this.currentFilter = theme.filter.searchString
        this.input.value = this.currentFilter
        this._handleFilterUpdate()
        
        // Switch to filter tab
        this.currentTab = 'filter'
        this._updateTabVisibility()
      })
      
      // Delete
      const btnDel = document.createElement('button')
      btnDel.textContent = '×'
      btnDel.title = 'Delete Theme'
      btnDel.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; background: #d32f2f; color: #fff; font-weight: bold;'
      btnDel.addEventListener('click', () => {
        if (confirm(`Delete theme "${theme.name}"?`)) {
          deleteTheme(theme.id)
          // Also need to notify if an assignment was removed? 
          // deleteTheme handles removing assignment from storage, but we need to notify app
          if (assignments[0] === theme.id && this.onThemeAssign) this.onThemeAssign(0, null)
          if (assignments[1] === theme.id && this.onThemeAssign) this.onThemeAssign(1, null)
          this._renderThemes()
        }
      })

      controls.appendChild(btnA)
      controls.appendChild(btnB)
      controls.appendChild(btnEdit)
      controls.appendChild(btnDel)
      
      item.appendChild(info)
      item.appendChild(controls)
      this.themesContainer.appendChild(item)
    })
  }

  _bindEvents () {
    // Input changes
    this.input.addEventListener('input', (e) => {
      this.currentFilter = e.target.value
      this._handleFilterUpdate()
    })

    // Save Theme
    this.saveThemeBtn.addEventListener('click', () => {
      if (!this.currentFilter.trim()) {
        alert('Please enter a filter first.')
        return
      }
      const name = prompt('Enter a name for this theme:', this.currentFilter)
      if (name) {
        saveTheme(name, { searchString: this.currentFilter })
        this.currentTab = 'themes'
        this._updateTabVisibility()
      }
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
    this._updateTabVisibility()
    if (this.currentTab === 'filter') {
      this.input.focus()
    }
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
