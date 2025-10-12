// Info box drag functionality for crude-collage-painter

const infoBox = document.getElementById('info-box')
const closeButton = document.getElementById('close-info-box')

// Check for required DOM elements
if (!infoBox) {
  console.error('Info box element not found')
}

if (!closeButton) {
  console.error('Close button not found')
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
          xOffset = parseFloat(values[4]) || 0
          yOffset = parseFloat(values[5]) || 0
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
  el.style.transform = `translate(${xPos}px, ${yPos}px)`
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

// ESC key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && infoBox && !infoBox.classList.contains('hidden')) {
    hideInfoBox()
  }
})
