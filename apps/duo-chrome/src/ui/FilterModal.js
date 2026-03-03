import {
  getThemes,
  saveTheme,
  deleteTheme,
  getAssignments,
  assignTheme
} from '../utils/theme-management.js'

/**
 * ContactSheet — V3 full-screen image filter overlay.
 *
 * Replaces the V2 FilterModal text-list with a thumbnail grid (contact sheet).
 * Supports dual filter model:
 *   - searchString: text substring match against filenames
 *   - selectedImages: explicit list of manually selected filenames
 *
 * When selectedImages is non-empty it IS the final result set.
 * When selectedImages is empty, searchString is used as the filter.
 * The UI allows toggling individual tiles regardless of search state.
 *
 * Public properties accessed externally by duo-chrome.js:
 *   this.input           — the search <input> element
 *   this.currentFilter   — current filter string (searchString)
 *   this.isVisible       — boolean
 *
 * Public methods:
 *   show / hide / toggle / clear
 *   updateStats(filteredCount)
 *   updateList(fileList)
 */
export class FilterModal {
  /**
   * @param {Object} options
   * @param {Function} options.onFilterChange  - Called with full filter def {searchString, selectedImages}
   * @param {Function} options.onThemeAssign   - Called with (position, themeId)
   * @param {number}   options.totalImages     - Total number of images available
   */
  constructor (options) {
    this.onFilterChange = options.onFilterChange
    this.onThemeAssign = options.onThemeAssign
    this.totalImages = options.totalImages
    this.isVisible = false
    this.currentFilter = '' // alias for searchString (external contract)
    this.currentTab = 'filter'

    /** Full filter definition */
    this._filterDef = { searchString: '', selectedImages: [] }

    /** All images known (set via updateList) */
    this._allImages = []

    this.modal = document.getElementById('filter-modal')
    this._buildHTML()

    // Public — accessed externally by duo-chrome.js
    this.input = this.modal.querySelector('.contact-sheet__input')

    // Internal element refs
    this._searchInput = this.input
    this._clearBtn = this.modal.querySelector('[data-action="clear"]')
    this._closeBtn = this.modal.querySelector('[data-action="close"]')
    this._saveThemeBtn = this.modal.querySelector('[data-action="save-theme"]')
    this._statsEl = this.modal.querySelector('.contact-sheet__stats')
    this._tabBtns = this.modal.querySelectorAll('.contact-sheet__tab')
    this._filterContent = this.modal.querySelector('[data-content="filter"]')
    this._themesContent = this.modal.querySelector('[data-content="themes"]')
    this._grid = this.modal.querySelector('.contact-grid')
    this._themesGrid = this.modal.querySelector('.themes-list')

    this._bindEvents()
  }

  _buildHTML () {
    this.modal.innerHTML = `
      <div class="contact-sheet">
        <div class="contact-sheet__header">
          <span class="contact-sheet__title">Contact Sheet</span>
          <div class="contact-sheet__search">
            <input
              type="text"
              class="contact-sheet__input"
              placeholder="Search filenames…"
              aria-label="Search by filename"
              autocomplete="off"
            >
            <button class="contact-sheet__clear" data-action="clear" title="Clear filter">×</button>
          </div>
          <button class="contact-sheet__close" data-action="close" aria-label="Close">×</button>
        </div>

        <div class="contact-sheet__toolbar">
          <span class="contact-sheet__stats">Showing all images</span>
          <div class="contact-sheet__tabs">
            <button class="contact-sheet__tab is-active" data-tab="filter">Images</button>
            <button class="contact-sheet__tab" data-tab="themes">Themes</button>
          </div>
          <button class="dc-btn dc-btn--secondary" data-action="save-theme">Save as Theme</button>
        </div>

        <div class="contact-sheet__content" data-content="filter">
          <div class="contact-grid"></div>
        </div>

        <div class="contact-sheet__content hidden" data-content="themes">
          <div class="themes-list"></div>
        </div>
      </div>
    `
  }

  /* ── Tab switching ─────────────────────────────────────────── */

  _switchTab (tabName) {
    this.currentTab = tabName
    this._tabBtns.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.tab === tabName)
    })
    this._filterContent.classList.toggle('hidden', tabName !== 'filter')
    this._themesContent.classList.toggle('hidden', tabName !== 'themes')
    if (tabName === 'themes') this._renderThemes()
  }

  /* ── Themes tab ────────────────────────────────────────────── */

  _renderThemes () {
    this._themesGrid.innerHTML = ''
    const themes = getThemes()
    const assignments = getAssignments()

    if (themes.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'themes-empty'
      empty.textContent = 'No saved themes. Filter images and click "Save as Theme".'
      this._themesGrid.appendChild(empty)
      return
    }

    themes.forEach(theme => {
      const card = document.createElement('div')
      card.className = 'theme-card'

      const isA = assignments[0] === theme.id
      const isB = assignments[1] === theme.id

      const filterDesc = [
        theme.filter?.searchString ? `"${theme.filter.searchString}"` : '',
        theme.filter?.selectedImages?.length ? `+${theme.filter.selectedImages.length} selected` : ''
      ].filter(Boolean).join(' ')

      card.innerHTML = `
        <div class="theme-card__info">
          <div class="theme-card__name">${theme.name}</div>
          <div class="theme-card__filter">${filterDesc || '(all images)'}</div>
        </div>
        <div class="theme-card__actions">
          <button class="theme-assign-btn ${isA ? 'is-active-a' : ''}" data-pos="0" title="Assign to A">
            ${isA ? 'A ✓' : 'A'}
          </button>
          <button class="theme-assign-btn ${isB ? 'is-active-b' : ''}" data-pos="1" title="Assign to B">
            ${isB ? 'B ✓' : 'B'}
          </button>
          <button class="dc-btn dc-btn--secondary theme-edit-btn" data-id="${theme.id}" title="Load filter">Edit</button>
          <button class="dc-btn dc-btn--danger theme-delete-btn" data-id="${theme.id}" data-name="${theme.name}" title="Delete">×</button>
        </div>
      `

      card.querySelector('[data-pos="0"]').addEventListener('click', () => {
        const newId = isA ? null : theme.id
        assignTheme(0, newId)
        if (this.onThemeAssign) this.onThemeAssign(0, newId)
        this._renderThemes()
      })

      card.querySelector('[data-pos="1"]').addEventListener('click', () => {
        const newId = isB ? null : theme.id
        assignTheme(1, newId)
        if (this.onThemeAssign) this.onThemeAssign(1, newId)
        this._renderThemes()
      })

      card.querySelector('.theme-edit-btn').addEventListener('click', () => {
        const f = theme.filter || {}
        this._filterDef = {
          searchString: f.searchString || '',
          selectedImages: [...(f.selectedImages || [])]
        }
        this.currentFilter = this._filterDef.searchString
        this._searchInput.value = this.currentFilter
        this._handleFilterUpdate()
        this._switchTab('filter')
      })

      card.querySelector('.theme-delete-btn').addEventListener('click', () => {
        if (confirm(`Delete theme "${theme.name}"?`)) {
          deleteTheme(theme.id)
          if (assignments[0] === theme.id && this.onThemeAssign) this.onThemeAssign(0, null)
          if (assignments[1] === theme.id && this.onThemeAssign) this.onThemeAssign(1, null)
          this._renderThemes()
        }
      })

      this._themesGrid.appendChild(card)
    })
  }

  /* ── Image grid ────────────────────────────────────────────── */

  /**
   * Render the contact grid from a list of filenames.
   * Tiles matching selectedImages get a checked state.
   * Pinned tiles (in selectedImages but not matching search) appear first.
   */
  _renderGrid (fileList) {
    this._grid.innerHTML = ''
    const selected = new Set(this._filterDef.selectedImages || [])
    const inSearch = new Set(fileList)

    // Pinned = selected but NOT in current search results
    const pinned = [...selected].filter(f => !inSearch.has(f) && this._allImages.includes(f))

    // Render pinned row if any
    if (pinned.length > 0) {
      const label = document.createElement('div')
      label.className = 'contact-grid__pinned-label'
      label.textContent = `${pinned.length} pinned (outside search)`
      this._grid.appendChild(label)
      pinned.forEach(filename => this._grid.appendChild(this._makeTile(filename, true, true)))
    }

    if (fileList.length === 0 && pinned.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'contact-empty'
      empty.textContent = 'No matching images'
      this._grid.appendChild(empty)
      return
    }

    fileList.forEach(filename => {
      const isChecked = selected.has(filename)
      this._grid.appendChild(this._makeTile(filename, isChecked, false))
    })
  }

  /**
   * Create a single contact sheet tile.
   * @param {string}  filename  - image filename
   * @param {boolean} checked   - whether tile is selected
   * @param {boolean} pinned    - whether tile is pinned (outside search)
   */
  _makeTile (filename, checked, pinned) {
    const tile = document.createElement('div')
    tile.className = [
      'contact-tile',
      checked ? 'is-selected' : '',
      pinned ? 'is-pinned' : ''
    ].filter(Boolean).join(' ')
    tile.title = filename

    // Strip leading path and extension for display
    const base = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
    const displayName = base.length > 18 ? '\u2026' + base.slice(-16) : base

    tile.innerHTML = `
      <img class="contact-tile__img" src="/images/${filename}" alt="${displayName}" loading="lazy">
      <div class="contact-tile__check">✓</div>
      <div class="contact-tile__name">${displayName}</div>
    `

    tile.addEventListener('click', () => this._toggleTile(filename, tile))
    return tile
  }

  /**
   * Toggle a tile's selection state and update the filter def.
   */
  _toggleTile (filename, tile) {
    const selected = new Set(this._filterDef.selectedImages || [])
    if (selected.has(filename)) {
      selected.delete(filename)
      tile.classList.remove('is-selected')
    } else {
      selected.add(filename)
      tile.classList.add('is-selected')
    }
    this._filterDef.selectedImages = [...selected]
    this._handleFilterUpdate()
    this._updateStats()
  }

  /* ── Events ────────────────────────────────────────────────── */

  _bindEvents () {
    // Tab switching
    this._tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab))
    })

    // Search input
    this._searchInput.addEventListener('input', e => {
      this.currentFilter = e.target.value
      this._filterDef.searchString = this.currentFilter
      this._handleFilterUpdate()
    })

    // Block global shortcuts while typing
    this._searchInput.addEventListener('keydown', e => {
      e.stopPropagation()
      if (e.key === 'Escape') this.hide()
    })
    this._searchInput.addEventListener('keyup', e => e.stopPropagation())
    this._searchInput.addEventListener('keypress', e => e.stopPropagation())

    // Clear
    this._clearBtn?.addEventListener('click', () => this.clear())

    // Close
    this._closeBtn?.addEventListener('click', () => this.hide())

    // ESC to close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isVisible) this.hide()
    })

    // Click backdrop to close
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) this.hide()
    })

    // Save as Theme
    this._saveThemeBtn?.addEventListener('click', () => {
      const hasSearch = this._filterDef.searchString.trim() !== ''
      const hasSelected = this._filterDef.selectedImages.length > 0
      if (!hasSearch && !hasSelected) {
        alert('Please search or select at least one image first.')
        return
      }
      const defaultName = this._filterDef.searchString.trim() || 'Custom Selection'
      const name = prompt('Enter a name for this theme:', defaultName)
      if (name) {
        saveTheme(name, { ...this._filterDef })
        this._switchTab('themes')
      }
    })
  }

  _handleFilterUpdate () {
    if (this.onFilterChange) {
      this.onFilterChange({ ...this._filterDef })
    }
  }

  _updateStats () {
    if (!this._statsEl) return
    const hasSearch = this._filterDef.searchString.trim() !== ''
    const hasSelected = this._filterDef.selectedImages.length > 0

    if (!hasSearch && !hasSelected) {
      this._statsEl.textContent = `Showing all ${this.totalImages} images`
    } else if (hasSelected) {
      this._statsEl.textContent = `${this._filterDef.selectedImages.length} selected`
      if (hasSearch) {
        const inSearch = this._allImages.filter(f =>
          f.toLowerCase().includes(this._filterDef.searchString.toLowerCase().trim())
        ).length
        this._statsEl.textContent += ` · ${inSearch} match search`
      }
    } else {
      const count = this._allImages.filter(f =>
        f.toLowerCase().includes(this._filterDef.searchString.toLowerCase().trim())
      ).length
      this._statsEl.textContent = `${count} of ${this.totalImages} images`
    }
  }

  /* ── Public API ────────────────────────────────────────────── */

  /**
   * Update the stats display.
   * Called externally by duo-chrome.js with the filtered count.
   */
  updateStats (filteredCount) {
    if (!this._statsEl) return
    if (this._filterDef.selectedImages.length > 0) {
      this._updateStats()
      return
    }
    if (!this._filterDef.searchString.trim()) {
      this._statsEl.textContent = `Showing all ${this.totalImages} images`
    } else {
      this._statsEl.textContent = `${filteredCount} of ${this.totalImages} images`
    }
  }

  /**
   * Update the image grid.
   * Called externally by duo-chrome.js with the current filtered list.
   */
  updateList (fileList) {
    this._allImages = [...fileList] // store for pinned logic
    this._renderGrid(fileList)
    this._updateStats()
  }

  show () {
    this.isVisible = true
    this.modal.classList.remove('hidden')
    this._switchTab(this.currentTab)
    if (this.currentTab === 'filter') {
      this._searchInput.focus()
    }
  }

  hide () {
    this.isVisible = false
    this.modal.classList.add('hidden')
  }

  toggle () {
    if (this.isVisible) { this.hide() } else { this.show() }
  }

  clear () {
    this._filterDef = { searchString: '', selectedImages: [] }
    this.currentFilter = ''
    this._searchInput.value = ''
    this._handleFilterUpdate()
    this._searchInput.focus()
  }
}
