import {
  getThemes,
  saveTheme,
  deleteTheme,
  getAssignments,
  assignTheme
} from '../utils/theme-management.js'

/**
 * FilterModal — tabbed panel for filtering images and managing themes.
 * Builds its entire DOM inside #filter-modal on construction.
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
    this.currentTab = 'filter'

    this.modal = document.getElementById('filter-modal')
    this._buildHTML()

    // Public properties — accessed externally by duo-chrome.js
    this.input = this.modal.querySelector('.filter-search__input')

    // Internal element references
    this.clearBtn = this.modal.querySelector('.filter-search__clear')
    this.closeBtn = this.modal.querySelector('.filter-panel__close')
    this.stats = this.modal.querySelector('.filter-stats')
    this.tabBtns = this.modal.querySelectorAll('.filter-tab')
    this.filterContent = this.modal.querySelector('[data-content="filter"]')
    this.themesContent = this.modal.querySelector('[data-content="themes"]')
    this.fileListContainer = this.modal.querySelector('.filter-file-list')
    this.themesContainer = this.modal.querySelector('.filter-themes-list')
    this.saveThemeBtn = this.modal.querySelector('[data-action="save-theme"]')

    this._bindEvents()
  }

  _buildHTML () {
    this.modal.innerHTML = `
      <div class="filter-panel">
        <div class="filter-panel__header">
          <span class="filter-panel__title">Filter Images</span>
          <button class="filter-panel__close" aria-label="Close">×</button>
        </div>
        <div class="filter-tabs">
          <button class="filter-tab is-active" data-tab="filter">Active Filter</button>
          <button class="filter-tab" data-tab="themes">Saved Themes</button>
        </div>
        <div class="filter-tab-content" data-content="filter">
          <div class="filter-search">
            <input
              type="text"
              class="filter-search__input"
              placeholder="Search by filename…"
              aria-label="Search by filename"
            >
            <button class="filter-search__clear" title="Clear filter">×</button>
          </div>
          <div class="filter-action-bar">
            <span class="filter-stats">Showing all images</span>
            <button class="dc-btn dc-btn--secondary" data-action="save-theme">Save as Theme</button>
          </div>
          <div class="filter-file-list"></div>
        </div>
        <div class="filter-tab-content hidden" data-content="themes">
          <div class="filter-themes-list"></div>
        </div>
      </div>
    `
  }

  _switchTab (tabName) {
    this.currentTab = tabName
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.tab === tabName)
    })
    this.filterContent.classList.toggle('hidden', tabName !== 'filter')
    this.themesContent.classList.toggle('hidden', tabName !== 'themes')
    if (tabName === 'themes') {
      this._renderThemes()
    }
  }

  _renderThemes () {
    this.themesContainer.innerHTML = ''
    const themes = getThemes()
    const assignments = getAssignments()

    if (themes.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'themes-empty'
      empty.textContent = 'No saved themes. Filter images and click "Save as Theme".'
      this.themesContainer.appendChild(empty)
      return
    }

    themes.forEach(theme => {
      const card = document.createElement('div')
      card.className = 'theme-card'

      const isA = assignments[0] === theme.id
      const isB = assignments[1] === theme.id

      card.innerHTML = `
        <div class="theme-card__info">
          <div class="theme-card__name">${theme.name}</div>
          <div class="theme-card__filter">${theme.filter.searchString}</div>
        </div>
        <div class="theme-card__actions">
          <button class="theme-assign-btn ${isA ? 'is-active-a' : ''}" data-pos="0" title="Assign to Image A">
            ${isA ? 'A ✓' : 'A'}
          </button>
          <button class="theme-assign-btn ${isB ? 'is-active-b' : ''}" data-pos="1" title="Assign to Image B">
            ${isB ? 'B ✓' : 'B'}
          </button>
          <button class="dc-btn dc-btn--secondary theme-edit-btn" data-id="${theme.id}" title="Edit filter">Edit</button>
          <button class="dc-btn dc-btn--danger theme-delete-btn" data-id="${theme.id}" data-name="${theme.name}" title="Delete theme">×</button>
        </div>
      `

      // Assign A
      card.querySelector('[data-pos="0"]').addEventListener('click', () => {
        const newId = isA ? null : theme.id
        assignTheme(0, newId)
        if (this.onThemeAssign) this.onThemeAssign(0, newId)
        this._renderThemes()
      })

      // Assign B
      card.querySelector('[data-pos="1"]').addEventListener('click', () => {
        const newId = isB ? null : theme.id
        assignTheme(1, newId)
        if (this.onThemeAssign) this.onThemeAssign(1, newId)
        this._renderThemes()
      })

      // Edit — load filter and switch to filter tab
      card.querySelector('.theme-edit-btn').addEventListener('click', () => {
        this.currentFilter = theme.filter.searchString
        this.input.value = this.currentFilter
        this._handleFilterUpdate()
        this._switchTab('filter')
      })

      // Delete
      card.querySelector('.theme-delete-btn').addEventListener('click', () => {
        if (confirm(`Delete theme "${theme.name}"?`)) {
          deleteTheme(theme.id)
          if (assignments[0] === theme.id && this.onThemeAssign) this.onThemeAssign(0, null)
          if (assignments[1] === theme.id && this.onThemeAssign) this.onThemeAssign(1, null)
          this._renderThemes()
        }
      })

      this.themesContainer.appendChild(card)
    })
  }

  _bindEvents () {
    // Tab switching
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab))
    })

    // Search input
    this.input.addEventListener('input', (e) => {
      this.currentFilter = e.target.value
      this._handleFilterUpdate()
    })

    // Prevent global key shortcuts from triggering while typing
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Escape') this.hide()
    })
    this.input.addEventListener('keyup', (e) => e.stopPropagation())
    this.input.addEventListener('keypress', (e) => e.stopPropagation())

    // Save as Theme
    this.saveThemeBtn.addEventListener('click', () => {
      if (!this.currentFilter.trim()) {
        alert('Please enter a filter first.')
        return
      }
      const name = prompt('Enter a name for this theme:', this.currentFilter)
      if (name) {
        saveTheme(name, { searchString: this.currentFilter })
        this._switchTab('themes')
      }
    })

    // Clear button
    this.clearBtn.addEventListener('click', () => this.clear())

    // Close button
    this.closeBtn.addEventListener('click', () => this.hide())

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) this.hide()
    })

    // Click backdrop to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide()
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
      this.stats.textContent = `${filteredCount} of ${this.totalImages} images`
    }
  }

  /**
   * Update the displayed file list
   * @param {string[]} fileList - Array of filenames
   */
  updateList (fileList) {
    this.fileListContainer.innerHTML = ''

    if (fileList.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'filter-list-empty'
      empty.textContent = 'No matching images found'
      this.fileListContainer.appendChild(empty)
      return
    }

    fileList.forEach(filename => {
      const item = document.createElement('div')
      item.className = 'filter-file-item'

      // Strip extension; tail-truncate since names share a common prefix
      const base = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      item.textContent = base.length > 32 ? '\u2026' + base.slice(-30) : base
      item.title = filename

      item.addEventListener('click', () => {
        this.input.value = item.textContent
        this.currentFilter = item.textContent
        this._handleFilterUpdate()
      })

      this.fileListContainer.appendChild(item)
    })
  }

  show () {
    this.isVisible = true
    this.modal.classList.remove('hidden')
    this._switchTab(this.currentTab)
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
