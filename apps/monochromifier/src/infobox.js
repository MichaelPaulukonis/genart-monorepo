// Info box functionality for monochromifier

import { formatVersion } from './utils/version.js'

const infoBox = document.getElementById('info-box')
const closeButton = document.getElementById('close-info-box')

// Check for required DOM elements
if (!infoBox) {
  console.error('Info box element not found')
}

// Drag state
let isDragging = false
let currentX
let currentY
let initialX
let initialY
let xOffset = 0
let yOffset = 0
let hasBeenDragged = false

// Set up accessibility attributes
if (infoBox) {
  infoBox.setAttribute('role', 'dialog')
  infoBox.setAttribute('aria-label', 'Keyboard shortcuts help')
  infoBox.setAttribute('aria-modal', 'false')

  // Drag event listeners
  infoBox.addEventListener('mousedown', startDragging)
}

document.addEventListener('mousemove', drag)
document.addEventListener('mouseup', stopDragging)

// Close button listener
if (closeButton) {
  closeButton.addEventListener('click', hideInfoBox)
}

function startDragging (e) {
  // Only drag if clicking on the box itself or headings
  if (e.target === infoBox || e.target.tagName === 'H2' || e.target.tagName === 'H3') {
    e.stopPropagation()

    // On first drag, get the current position from computed style
    if (!hasBeenDragged) {
      const computedStyle = window.getComputedStyle(infoBox)
      const transform = computedStyle.transform
      if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\((.+)\)/)
        if (matrix) {
          const values = matrix[1].split(', ')
          // The matrix logic might need adjustment if using translate(-50%, -50%)
          // But usually browsers report the computed matrix.
          // Simpler: just start from 0 offsets relative to the initial click.
          // However, to avoid jumping, we need to handle the initial transform.
          // Let's stick to the crude-collage-painter logic which seemed to work or simplify.
          // Since we center with CSS translate(-50%, -50%), dragging implementation needs care.
          // A safer way is to switch to absolute positioning on first drag or use offsets.
          // For now, let's just initialize xOffset/yOffset to 0 and rely on delta.
          // But if we use translate(x,y) it overrides translate(-50%, -50%).
          // So we might need to set initial position to computed pixels.
          
          // Let's rely on standard logic:
          // We will use transform translate(x,y) but we need to account for the initial centering.
          // Ideally, we remove the centering class/style on first drag and set absolute pixels.
        }
      }
      hasBeenDragged = true
    }

    initialX = e.clientX - xOffset
    initialY = e.clientY - yOffset
    isDragging = true
  }
}

function drag (e) {
  if (isDragging) {
    e.preventDefault()
    e.stopPropagation()

    currentX = e.clientX - initialX
    currentY = e.clientY - initialY

    xOffset = currentX
    yOffset = currentY

    setTranslate(currentX, currentY, infoBox)
  }
}

function stopDragging (e) {
  isDragging = false
}

function setTranslate (xPos, yPos, el) {
  // We keep the -50% -50% to maintain relative centering logic + offset
  // Or if we want to move freely, we might just append the translation.
  // BUT: standard transform replacement overwrites.
  // The crude-collage-painter css uses `transform: translate(-50%, -20%);`
  // Here we used `transform: translate(-50%, -50%);`
  // So we should maintain that.
  el.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`
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
