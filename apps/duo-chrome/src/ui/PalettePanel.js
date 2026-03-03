/**
 * PalettePanel — Palette rack module + full-screen picker overlay.
 *
 * The rack module body mounts into an existing `.rack-module` container
 * (header already present in HTML).  The full-screen overlay uses the
 * `#palette-modal` element.
 *
 * Public API:
 *   update(index)   — sync palette index from external source (no callback)
 *   show()          — open overlay
 *   hide()          — close overlay
 *   toggle()        — toggle overlay
 *   isVisible       — getter, boolean
 *
 * Options:
 *   palettes[]       — Array of palette arrays (ALL_PALETTES)
 *   paletteNames[]   — Display names (index-matched to palettes)
 *   onPaletteChange  — Called with (index) when user picks a palette
 *   initialIndex     — Starting index (default 0)
 */
export class PalettePanel {
  constructor (containerEl, options = {}) {
    this.containerEl = containerEl
    this.palettes = options.palettes || []
    this.paletteNames = options.paletteNames || []
    this.onPaletteChange = options.onPaletteChange || null
    this._activeIndex = options.initialIndex || 0
    this._isVisible = false

    this._modal = document.getElementById('palette-modal')

    this._buildModuleHTML()
    this._buildOverlayHTML()
    this._bindEvents()
    this._sync()
  }

  /* ── Rack module body ────────────────────────────────────────── */

  _buildModuleHTML () {
    const body = document.createElement('div')
    body.className = 'rack-module__body palette-module'
    body.innerHTML = `
      <div class="palette-module__header-row">
        <span class="palette-module__name led-display" data-palette-name></span>
        <span class="palette-module__count" data-palette-count></span>
      </div>
      <div class="palette-module__strip" data-palette-strip></div>
      <div class="palette-module__controls">
        <button class="palette-nav-btn palette-module__prev" title="Previous palette (C key)">◂</button>
        <button class="palette-nav-btn palette-module__next" title="Next palette (C key)">▸</button>
        <button class="dc-btn dc-btn--secondary palette-module__pick" title="Browse all palettes (G key)">PICK</button>
      </div>
    `
    // Clicking any non-button area of the module body opens the picker
    body.addEventListener('click', e => {
      if (!e.target.closest('button')) this.show()
    })

    this.containerEl.appendChild(body)

    this._nameEl = body.querySelector('[data-palette-name]')
    this._countEl = body.querySelector('[data-palette-count]')
    this._stripEl = body.querySelector('[data-palette-strip]')
    this._prevBtn = body.querySelector('.palette-module__prev')
    this._nextBtn = body.querySelector('.palette-module__next')
    this._pickBtn = body.querySelector('.palette-module__pick')

    // Wire collapse button already in the rack header
    const collapseBtn = this.containerEl.querySelector('.rack-module__collapse')
    collapseBtn?.addEventListener('click', () => {
      this.containerEl.classList.toggle('is-collapsed')
      collapseBtn.textContent = this.containerEl.classList.contains('is-collapsed') ? '+' : '−'
    })
  }

  /* ── Overlay ─────────────────────────────────────────────────── */

  _buildOverlayHTML () {
    if (!this._modal) return
    this._modal.innerHTML = `
      <div class="palette-picker">
        <div class="palette-picker__header">
          <span class="palette-picker__title">◈ Palette Bank</span>
          <span class="palette-picker__hint">Click to apply · G or Esc to close</span>
          <button class="palette-picker__close" data-action="close" aria-label="Close">×</button>
        </div>
        <div class="palette-picker__grid" data-picker-grid></div>
      </div>
    `
    this._grid = this._modal.querySelector('[data-picker-grid]')
    this._closeBtn = this._modal.querySelector('[data-action="close"]')
  }

  /* ── Rendering ───────────────────────────────────────────────── */

  _sync () {
    this._renderStrip()
  }

  _renderStrip () {
    if (!this._stripEl) return
    const palette = this.palettes[this._activeIndex] || []
    const name = this.paletteNames[this._activeIndex] || `Palette ${this._activeIndex + 1}`
    const count = palette.length

    if (this._nameEl) this._nameEl.textContent = name
    if (this._countEl) this._countEl.textContent = `${count} color${count !== 1 ? 's' : ''}`

    // Sample up to 14 swatches evenly from the palette
    const MAX = 14
    const step = count > MAX ? count / MAX : 1
    const entries = count > MAX
      ? Array.from({ length: MAX }, (_, i) => palette[Math.floor(i * step)])
      : palette

    this._stripEl.innerHTML = entries.map(entry => {
      const color = this._toHex(entry)
      const label = entry.name || ''
      return `<span class="palette-mini-swatch" style="background:${color}" title="${label}"></span>`
    }).join('')
  }

  _renderGrid () {
    if (!this._grid) return
    this._grid.innerHTML = ''

    this.palettes.forEach((palette, idx) => {
      const name = this.paletteNames[idx] || `Palette ${idx + 1}`
      const isActive = idx === this._activeIndex
      const count = palette.length

      // Sample up to 30 swatches for the card display
      const MAX = 30
      const step = count > MAX ? count / MAX : 1
      const entries = count > MAX
        ? Array.from({ length: MAX }, (_, i) => palette[Math.floor(i * step)])
        : palette

      const swatchHTML = entries.map(entry => {
        const color = this._toHex(entry)
        const label = entry.name || ''
        return `<span class="palette-card__swatch" style="background:${color}" title="${label}"></span>`
      }).join('')

      const card = document.createElement('div')
      card.className = `palette-card${isActive ? ' is-active' : ''}`
      card.innerHTML = `
        <div class="palette-card__meta">
          <span class="palette-card__name">${name}</span>
          <span class="palette-card__count">${count}</span>
          ${isActive ? '<span class="palette-card__check">✓</span>' : ''}
        </div>
        <div class="palette-card__swatches">${swatchHTML}</div>
      `
      card.addEventListener('click', () => {
        this._applyPalette(idx)
        this.hide()
      })
      this._grid.appendChild(card)
    })
  }

  /* ── Palette application ─────────────────────────────────────── */

  _applyPalette (index) {
    this._activeIndex = index
    this._sync()
    if (this.onPaletteChange) this.onPaletteChange(index)
  }

  /* ── Events ──────────────────────────────────────────────────── */

  _bindEvents () {
    this._prevBtn?.addEventListener('click', () => {
      const next = ((this._activeIndex - 1) + this.palettes.length) % this.palettes.length
      this._applyPalette(next)
    })

    this._nextBtn?.addEventListener('click', () => {
      const next = (this._activeIndex + 1) % this.palettes.length
      this._applyPalette(next)
    })

    this._pickBtn?.addEventListener('click', () => this.show())

    this._closeBtn?.addEventListener('click', () => this.hide())

    // Click the backdrop (not the inner panel) to close
    this._modal?.addEventListener('click', e => {
      if (e.target === this._modal) this.hide()
    })

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._isVisible) this.hide()
    })
  }

  /* ── Utilities ───────────────────────────────────────────────── */

  _toHex (entry) {
    if (!entry) return '#333'
    const c = entry.color
    if (typeof c === 'string') return c
    if (Array.isArray(c) && c.length >= 3) {
      const h = n => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, '0')
      return `#${h(c[0])}${h(c[1])}${h(c[2])}`
    }
    return '#333'
  }

  /* ── Public API ──────────────────────────────────────────────── */

  /** Sync from external palette change (C key etc.) — does NOT fire callback */
  update (index) {
    this._activeIndex = index
    this._sync()
  }

  show () {
    this._isVisible = true
    this._modal?.classList.remove('hidden')
    this._renderGrid()
  }

  hide () {
    this._isVisible = false
    this._modal?.classList.add('hidden')
  }

  toggle () {
    this._isVisible ? this.hide() : this.show()
  }

  get isVisible () { return this._isVisible }
}
