// Info box functionality for monochromifier

import { formatVersion } from './utils/version.js'

const infoBox = document.getElementById('info-box')
const gridControls = document.getElementById('grid-controls')
const halftoneControls = document.getElementById('halftone-controls')
const closeButton = document.getElementById('close-info-box')

// Check for required DOM elements
if (!infoBox) {
  console.error('Info box element not found')
}

// Draggable setup
function makeDraggable(element, options = {}) {
  if (!element) return

  let isDragging = false
  let currentX
  let currentY
  let initialX
  let initialY
  let xOffset = 0
  let yOffset = 0
  
  // Default options
  const config = {
    centered: false, // If true, maintains translate(-50%, -50%)
    handleSelector: null, // If provided, only this child triggers drag
    ...options
  }

  element.addEventListener('mousedown', startDragging)
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', stopDragging)

  function startDragging(e) {
    // Should we drag?
    // If handleSelector is defined, check if target matches or is inside handle
    if (config.handleSelector) {
      if (!e.target.closest(config.handleSelector)) return
    } else {
      // Default behavior: specific check for inputs/buttons to avoid dragging when interacting
      if (['INPUT', 'SELECT', 'BUTTON', 'LABEL', 'A'].includes(e.target.tagName)) return
    }

    // Prevent event from reaching p5.js canvas
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

  function stopDragging(e) {
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

// Initialize draggables
makeDraggable(infoBox, { centered: true })
makeDraggable(gridControls, { centered: false })
makeDraggable(halftoneControls, { centered: false })


// Set up accessibility attributes for infoBox
if (infoBox) {
  infoBox.setAttribute('role', 'dialog')
  infoBox.setAttribute('aria-label', 'Keyboard shortcuts help')
  infoBox.setAttribute('aria-modal', 'false')
}

// Close button listener
if (closeButton) {
  closeButton.addEventListener('click', hideInfoBox)
}

function hideInfoBox () {
  if (infoBox) {
    infoBox.classList.add('hidden')
  }
}

function showInfoBox () {
  if (infoBox) {
    infoBox.classList.remove('hidden')
  }
}

function toggleInfoBox () {
  if (infoBox) {
    infoBox.classList.toggle('hidden')
  }
}

// Export functions for use in sketch.js
window.infoBoxControls = {
  toggle: toggleInfoBox,
  show: showInfoBox,
  hide: hideInfoBox
}

// ESC key handler is also handled in global input, but good to have here too as fallback
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && infoBox && !infoBox.classList.contains('hidden')) {
    hideInfoBox()
  }
})

// Initialize version display
async function initializeVersionDisplay () {
  try {
    const version = await formatVersion()
    const versionElement = document.getElementById('version-info')
    if (versionElement) {
      versionElement.textContent = version
    }
  } catch (error) {
    console.warn('Could not initialize version display:', error)
    const versionElement = document.getElementById('version-info')
    if (versionElement) {
      versionElement.textContent = 'v1.0.0'
    }
  }
}

// Initialize version display when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVersionDisplay)
} else {
  initializeVersionDisplay()
}