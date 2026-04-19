// Info box functionality for monochromifier

import { formatVersion } from './utils/version.js'

const gridControls = document.getElementById('grid-controls')
const halftoneControls = document.getElementById('halftone-controls')
const colorModeControls = document.getElementById('color-mode-controls')
const imageControls = document.getElementById('image-controls')
const viewStatus = document.getElementById('view-status')
const editControls = document.getElementById('edit-controls')

// --- Draggable ---

function makeDraggable(element, options = {}) {
  if (!element) return

  let isDragging = false
  let currentX
  let currentY
  let initialX
  let initialY
  let xOffset = 0
  let yOffset = 0

  const config = {
    centered: false, // If true, maintains translate(-50%, -50%)
    handleSelector: null, // If provided, only this child triggers drag
    ...options
  }

  element.addEventListener('mousedown', startDragging)
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', stopDragging)

  function startDragging(e) {
    if (config.handleSelector) {
      if (!e.target.closest(config.handleSelector)) return
    } else {
      if (['INPUT', 'SELECT', 'BUTTON', 'LABEL', 'A'].includes(e.target.tagName)) return
    }

    e.stopPropagation()
    initialX = e.clientX - xOffset
    initialY = e.clientY - yOffset

    if (e.target === element || element.contains(e.target)) {
      isDragging = true
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault()
      currentX = e.clientX - initialX
      currentY = e.clientY - initialY
      xOffset = currentX
      yOffset = currentY
      setTranslate(currentX, currentY, element, config.centered)
    }
  }

  function stopDragging() {
    initialX = currentX
    initialY = currentY
    isDragging = false
  }
}

function setTranslate(xPos, yPos, el, centered) {
  if (centered) {
    el.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`
  } else {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`
  }
}

// --- Modal factory ---
//
// Creates a modal instance with show/hide/toggle/isVisible.
// conflictsWith is a mutable array — assign after all modals are created so
// opening one automatically closes the other(s).
//
// Portability: copy this factory + makeDraggable/setTranslate to any vanilla-JS
// app. See docs/guides/modal-factory-pattern.md for the adoption checklist.

function createModal({ id, centered = false, ariaLabel }) {
  const el = document.getElementById(id)
  if (!el) {
    console.error(`createModal: element #${id} not found`)
    return null
  }

  makeDraggable(el, { centered })

  // Block all pointer events from reaching the p5.js canvas
  el.addEventListener('mousedown', e => e.stopPropagation())
  el.addEventListener('touchstart', e => e.stopPropagation(), { passive: false })
  el.addEventListener('pointerdown', e => e.stopPropagation())

  if (ariaLabel) {
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', ariaLabel)
    el.setAttribute('aria-modal', 'false')
  }

  const instance = {
    conflictsWith: [],

    show() {
      this.conflictsWith.forEach(m => m && m.hide())
      el.classList.remove('hidden')
    },
    hide() {
      el.classList.add('hidden')
    },
    toggle() {
      this.isVisible() ? this.hide() : this.show()
    },
    isVisible() {
      return !el.classList.contains('hidden')
    }
  }

  const closeBtn = el.querySelector('.close-button')
  if (closeBtn) closeBtn.addEventListener('click', () => instance.hide())

  return instance
}

// --- Collapsible control panels ---

function makeCollapsible(panel, storageKey, defaultCollapsed = false) {
  if (!panel) return
  const btn = panel.querySelector('.panel-collapse-btn')
  if (!btn) return

  try {
    const stored = localStorage.getItem(storageKey)
    const shouldCollapse = stored !== null ? stored === 'true' : defaultCollapsed
    if (shouldCollapse) {
      panel.classList.add('is-collapsed')
      btn.textContent = '+'
    }
  } catch (err) {
    // localStorage unavailable — proceed without persistence
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    const collapsed = panel.classList.toggle('is-collapsed')
    btn.textContent = collapsed ? '+' : '−'
    try {
      localStorage.setItem(storageKey, collapsed)
    } catch (err) {
      // ignore storage errors
    }
  })
}

// --- Instantiate modals ---

const helpModal = createModal({
  id: 'info-box',
  centered: true,
  ariaLabel: 'Keyboard shortcuts help'
})

const aboutModal = createModal({
  id: 'about-box',
  centered: true,
  ariaLabel: 'About Monochromifier'
})

// Mutual conflict resolution: opening one closes the other
if (helpModal && aboutModal) {
  helpModal.conflictsWith = [aboutModal]
  aboutModal.conflictsWith = [helpModal]
}

// Cross-navigation buttons between dialogs
const openAboutBtn = document.getElementById('open-about-btn')
if (openAboutBtn && aboutModal) {
  openAboutBtn.addEventListener('click', () => aboutModal.show())
}

const openHelpBtn = document.getElementById('open-help-btn')
if (openHelpBtn && helpModal) {
  openHelpBtn.addEventListener('click', () => helpModal.show())
}

// --- Draggable + collapsible control panels ---

makeDraggable(gridControls, { centered: false })
makeDraggable(halftoneControls, { centered: false })
makeDraggable(colorModeControls, { centered: false })
makeDraggable(imageControls, { centered: false })
makeDraggable(viewStatus, { centered: false })
makeDraggable(editControls, { centered: false })

makeCollapsible(gridControls, 'monochromifier_panel_grid_collapsed', true)
makeCollapsible(halftoneControls, 'monochromifier_panel_halftone_collapsed', true)
makeCollapsible(colorModeControls, 'monochromifier_panel_color-mode_collapsed', true)
makeCollapsible(imageControls, 'monochromifier_panel_image_collapsed')
makeCollapsible(viewStatus, 'monochromifier_panel_view_collapsed')
makeCollapsible(editControls, 'monochromifier_panel_edit_collapsed')

// Block bleed-through on control panels
const blockBleedThrough = (e) => e.stopPropagation()
;[gridControls, halftoneControls, colorModeControls, imageControls, viewStatus, editControls].forEach(panel => {
  if (panel) {
    panel.addEventListener('mousedown', blockBleedThrough)
    panel.addEventListener('touchstart', blockBleedThrough, { passive: false })
    panel.addEventListener('pointerdown', blockBleedThrough)
  }
})

// --- First-visit: auto-show About ---

const ABOUT_SEEN_KEY = 'monochromifier_about_seen'
if (aboutModal) {
  try {
    if (!localStorage.getItem(ABOUT_SEEN_KEY)) {
      aboutModal.show()
      localStorage.setItem(ABOUT_SEEN_KEY, '1')
    }
  } catch (e) {
    // localStorage unavailable — skip first-visit logic
  }
}

// --- ESC key: close any visible modal ---

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ;[helpModal, aboutModal].forEach(m => {
      if (m && m.isVisible()) m.hide()
    })
  }
})

// --- Exports for input.js ---

window.infoBoxControls = {
  toggle: () => helpModal && helpModal.toggle(),
  show: () => helpModal && helpModal.show(),
  hide: () => helpModal && helpModal.hide()
}

window.aboutControls = {
  toggle: () => aboutModal && aboutModal.toggle(),
  show: () => aboutModal && aboutModal.show(),
  hide: () => aboutModal && aboutModal.hide()
}

// --- Version display ---

async function initializeVersionDisplay() {
  const setVersion = (text) => {
    document.querySelectorAll('.version-text').forEach(el => { el.textContent = text })
  }
  try {
    setVersion(await formatVersion())
  } catch (error) {
    console.warn('Could not initialize version display:', error)
    setVersion('v1.0.0')
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVersionDisplay)
} else {
  initializeVersionDisplay()
}
