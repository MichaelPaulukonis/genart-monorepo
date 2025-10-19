import '../css/style.css'
import '../css/infobox.css'
import '../../../libs/version-display/version-display.css'
import { p5 } from 'p5js-wrapper' // Import p5 from wrapper
import { formatVersion } from './utils/version.js'
import gridify from './text-grid'
import {
  createCharGrid,
  populateCharGrid,
  renderCharGrid,
  gridBoundsToPixels
} from './grid'
import { createBlock, setupTextAreas } from './blocks'
import fallbackBlocks from './grids.20250403T123247766Z.json'
import tumblrRandomPost from './tumblr-random'
import {
  createSelectionState,
  enterSelectionMode,
  exitSelectionMode,
  getActiveBounds,
  handlePointerDragged as handleSelectionPointerDragged,
  handlePointerPressed as handleSelectionPointerPressed,
  handlePointerReleased as handleSelectionPointerReleased,
  handleRatioPresetClick,
  nudgeSelection,
  renderSelectionOverlay
} from './selection'

let blocks = fallbackBlocks // Remove .default since it's now a static import

let corpus

// Initialize blocks by fetching data from Tumblr or falling back to a local JSON file
const initializeBlocks = async () => {
  try {
    corpus = await tumblrRandomPost()
    blocks = gridify(corpus.join('\n'))
  } catch (error) {
    console.error(
      'Failed to fetch or process data from tumblrRandomPost. Falling back to JSON import.',
      error
    )
    blocks = fallbackBlocks
  }
}

await initializeBlocks()

// Main p5.js instance
/* eslint-disable-next-line no-new, new-cap */
new p5(p => {
  let textAreas = [] // Array to store text blocks
  let previousTextAreas = [] // Track previous positions of text areas
  let dragging = false // Flag to track dragging state
  let selectedIndex = -1 // Index of the currently selected block
  let blockCount = 10 // Initial number of blocks
  const clusteringDistance = 30 // Controls clustering tightness
  let fieldIsDirty = false // Flag to redraw entire field
  let offsetX
  let offsetY // Offset for dragging
  let gradient // Gradient for the background
  const grid = {
    cols: 0,
    rows: 0,
    cellSize: 15 // Size of each grid cell
  }
  const TEXT_SIZE_ADJUSTMENT = 4
  const fillChars = ' .-|:*+' // Characters used for filling text blocks
  let fillChar = fillChars[0] // Default fill character
  let monospaceFont = null // Font for rendering text
  let selectionState = createSelectionState(grid)

  // DOM elements for the info box
  const infoBox = document.getElementById('info-box')
  const closeButton = document.getElementById('close-info-box')
  const versionDisplay = document.getElementById('version-display')

  // Initialize version display
  if (versionDisplay) {
    versionDisplay.textContent = formatVersion()
  }

  // Toggle the visibility of the info box
  const toggleInfoBox = () => {
    infoBox.classList.toggle('hidden') // Simplify logic with toggle
  }

  closeButton.addEventListener('click', () => {
    toggleInfoBox()
  })

  // Preload assets (e.g., fonts)
  p.preload = () => {
    monospaceFont = p.loadFont('saxmono.ttf')
  }

  // Setup the canvas and initialize the grid and text areas
  p.setup = () => {
    p.pixelDensity(2)
    p.createCanvas(p.windowWidth, p.windowHeight)
    grid.cols = Math.floor(p.width / grid.cellSize)
    grid.rows = Math.floor(p.height / grid.cellSize)
    // clusteringDistance = Math.floor(grid.cols / 2) // Cache this value
    p.textFont(monospaceFont)
    p.noStroke()
    setGradient()

    const textSize = grid.cellSize + TEXT_SIZE_ADJUSTMENT // Cache this value
    p.textSize(textSize)
    p.textAlign(p.LEFT, p.TOP)

    textAreas = setupTextAreas(
      textAreas,
      blocks,
      blockCount,
      grid,
      fillChar,
      clusteringDistance
    )

    display()

    toggleInfoBox()
  }

  // Create a gradient for the background
  const setGradient = () => {
    // Calculate angle in radians (45 degrees)
    const angle = Math.PI / 4;

    // Calculate start and end points based on angle
    const startX = p.width / 2 - Math.cos(angle) * p.width / 2;
    const startY = p.height / 2 - Math.sin(angle) * p.height / 2;
    const endX = p.width / 2 + Math.cos(angle) * p.width / 2;
    const endY = p.height / 2 + Math.sin(angle) * p.height / 2;

    gradient = p.drawingContext.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, '#fe5196');
    gradient.addColorStop(1, '#f77062');
  }

  // Draw the gradient background
  const drawGradient = () => {
    if (!gradient) {
      p.background(255)
      return
    }

    p.drawingContext.fillStyle = gradient
    p.drawingContext.fillRect(0, 0, p.width, p.height)
  }

  // Main display function to render the canvas
  const display = () => {
    drawGradient()
    drawDraggingHighlight() // Ensure highlight is drawn even when not dragging
    drawTextAreas()
    renderSelectionOverlay(p, selectionState, grid)
  }

  // Highlight the selected block while dragging or selected
  const drawDraggingHighlight = () => {
    if (selectedIndex !== -1) {
      // Highlight if a block is selected
      const hue = calculateHue()
      const saturation = 50
      const brightness = 100
      const alpha = dragging ? 100 : 50 // Full opacity while dragging, reduced opacity otherwise

      p.colorMode(p.HSB)
      p.fill(hue, saturation, brightness, alpha)

      drawHighlightRectangle()

      p.colorMode(p.RGB)
    }
    p.fill(0) // Ensure text rendering always has a valid fill color
  }

  // Calculate the hue for the dragging highlight
  const calculateHue = () => {
    const MIN_HUE = 240 // Blue
    const MAX_HUE = 60 // Yellow
    const HUE_RANGE = MAX_HUE - MIN_HUE

    // Get the full range of z-indices
    const zIndices = textAreas.map(area => area.zIndex)
    const minZ = Math.min(...zIndices)
    const maxZ = Math.max(...zIndices)
    const zRange = maxZ - minZ || 1 // Avoid division by zero

    // Normalize current z-index to [0,1] range and map to hue
    const normalizedZ = (textAreas[selectedIndex].zIndex - minZ) / zRange
    return MAX_HUE - normalizedZ * HUE_RANGE
  }

  // Draw a rectangle around the selected block
  const drawHighlightRectangle = () => {
    const area = textAreas[selectedIndex]
    p.rect(
      area.x * grid.cellSize,
      area.y * grid.cellSize,
      area.w * grid.cellSize,
      area.h * grid.cellSize
    )
  }

  let cachedCharGrid = null // Cache for the character grid

  // Draw all text areas on the canvas
  const refreshCharGrid = () => {
    if (!cachedCharGrid || fieldIsDirty) {
      cachedCharGrid = createCharGrid(grid.rows, grid.cols, fillChar)
      previousTextAreas = []
    }

    const sortedAreas = [...textAreas].sort((a, b) => a.zIndex - b.zIndex)

    populateCharGrid(
      cachedCharGrid,
      previousTextAreas,
      sortedAreas,
      fillChar,
      withinGrid
    )

    previousTextAreas = JSON.parse(JSON.stringify(sortedAreas))
    fieldIsDirty = false

    return cachedCharGrid
  }

  const drawTextAreas = () => {
    refreshCharGrid()
    renderCharGrid(cachedCharGrid, p, grid, fillChar)
  }

  // Check if a position is within the grid boundaries
  const withinGrid = (area, i, j) => {
    return (
      area.y + i >= 0 &&
      area.y + i < grid.rows &&
      area.x + j >= 0 &&
      area.x + j < grid.cols
    )
  }

  // Check if the mouse click is on the info box
  const isClickOnInfoBox = (element) => {
    const rect = element.getBoundingClientRect()
    return (
      p.mouseX >= rect.left &&
      p.mouseX <= rect.right &&
      p.mouseY >= rect.top &&
      p.mouseY <= rect.bottom
    )
  }

  // Handle mouse press events
  p.mousePressed = () => {
    if (isClickOnInfoBox(infoBox)) {
      return false // Prevents p5js from handling this event
    }

    if (selectionState.isActive) {
      // Check for ratio preset clicks first
      if (handleRatioPresetClick(selectionState, p.mouseX, p.mouseY)) {
        display()
        return false
      }

      handleSelectionPointerPressed(selectionState, { x: p.mouseX, y: p.mouseY }, grid)
      display()
      return false
    }

    let blockClicked = false
    for (let i = 0; i < textAreas.length; i++) {
      const area = textAreas[i]
      const pixelX = area.x * grid.cellSize
      const pixelY = area.y * grid.cellSize
      const pixelW = area.w * grid.cellSize
      const pixelH = area.h * grid.cellSize

      if (
        p.mouseX >= pixelX &&
        p.mouseX < pixelX + pixelW &&
        p.mouseY >= pixelY &&
        p.mouseY < pixelY + pixelH
      ) {
        dragging = true
        selectedIndex = i
        offsetX = p.mouseX - pixelX
        offsetY = p.mouseY - pixelY
        blockClicked = true
        break
      }
    }

    if (!blockClicked) {
      selectedIndex = -1 // Deselect if no block is clicked
      p.fill(0) // Reset fill color to ensure text remains visible
    }

    display() // Update the display
  }

  // Handle mouse drag events
  p.mouseDragged = () => {
    if (isClickOnInfoBox(infoBox)) {
      return false // Prevents p5js from handling this event
    }
    if (selectionState.isActive) {
      handleSelectionPointerDragged(selectionState, { x: p.mouseX, y: p.mouseY }, grid)
      display()
      return false
    }
    if (dragging) {
      const area = textAreas[selectedIndex]
      const prevX = area.x
      const prevY = area.y

      // Ensure integer values with Math.round instead of Math.floor
      area.x = Math.round((p.mouseX - offsetX) / grid.cellSize)
      area.y = Math.round((p.mouseY - offsetY) / grid.cellSize)

      if (area.x !== prevX || area.y !== prevY) {
        display()
      }
    }
  }

  // Handle mouse release events
  p.mouseReleased = () => {
    if (selectionState.isActive) {
      handleSelectionPointerReleased(selectionState)
      display()
      return false
    }
    dragging = false
    display() // Remove the highlight
  }

  // Handle key press events
  p.keyPressed = async event => {
    const keyChar = typeof p.key === 'string' ? p.key.toUpperCase() : ''
    const code = event?.code ?? ''
    const isSKey = code === 'KeyS' || keyChar === 'S'

    const isShiftDown = event?.shiftKey ?? p.keyIsDown(p.SHIFT)
    const isAltDown = event?.altKey ?? p.keyIsDown(p.ALT)

    const isShiftSave = isSKey && isShiftDown
    const isSelectionToggle = isShiftSave && isAltDown

    if (selectionState.isActive) {
      if (p.keyCode === p.ESCAPE) {
        exitSelectionMode(selectionState)
        display()
        return
      }

      if (isShiftSave || p.keyCode === p.ENTER) {
        saveComposition(getActiveBounds(selectionState))
        exitSelectionMode(selectionState)
        display()
        return
      }

      const modifier = isShiftDown ? 2 : 1

      if (p.keyCode === p.LEFT_ARROW) {
        nudgeSelection(selectionState, -1 * modifier, 0, grid)
        display()
      } else if (p.keyCode === p.RIGHT_ARROW) {
        nudgeSelection(selectionState, 1 * modifier, 0, grid)
        display()
      } else if (p.keyCode === p.UP_ARROW) {
        nudgeSelection(selectionState, 0, -1 * modifier, grid)
        display()
      } else if (p.keyCode === p.DOWN_ARROW) {
        nudgeSelection(selectionState, 0, 1 * modifier, grid)
        display()
      }
      return
    }

    if (isSelectionToggle) {
      dragging = false
      selectedIndex = -1
      enterSelectionMode(selectionState, grid)
      display()
      return
    }

    if (isShiftSave) {
      saveComposition()
      return
    }

    if (selectedIndex !== -1 && (p.keyCode === p.DELETE || p.keyCode === p.BACKSPACE) && textAreas.length > 1) {
      textAreas.splice(selectedIndex, 1)
      blockCount--
      selectedIndex = -1 // Deselect after deletion
      fieldIsDirty = true
      display()
    } else if (selectedIndex !== -1 && (p.keyCode === p.ESCAPE || p.keyCode === p.ENTER)) {
      selectedIndex = -1 // Deselect
      display()
    } else if (p.key === 'i' || p.keyCode === p.ESCAPE) {
      toggleInfoBox()
    } else if (p.key === ' ') {
      cycleFillChar()
      fieldIsDirty = true
      display()
    } else if (p.key === 'r') {
      resetTextAreas()
      fieldIsDirty = true
      display()
    } else if (p.keyCode === p.RIGHT_ARROW && selectedIndex === -1) {
      addBlock()
    } else if (p.keyCode === p.LEFT_ARROW && selectedIndex === -1) {
      removeBlock()
    } else if (selectedIndex !== -1) {
      handleArrowKeys()
    } else if (p.key === 'n') {
      await fetchNewBlocks()
    }
  }

  const saveComposition = bounds => {
    refreshCharGrid()

    const originalGradient = gradient
    const originalSelectedIndex = selectedIndex
    gradient = null
    selectedIndex = -1

    p.push()
    p.background(255)
    renderCharGrid(cachedCharGrid, p, grid, fillChar)
    p.pop()

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .split('.')[0]
      .replace('Z', '')

    const suffix = bounds ? '.selection' : ''
    const filename = `dragline${suffix}.${timestamp}.png`

    if (bounds) {
      const { x, y, width, height } = gridBoundsToPixels(bounds, grid.cellSize)
      // oooh, get is both slow and poorer quality IIRC.....
      // not an issue for now
      const cropped = p.get(x, y, width, height)
      cropped.save(filename, 'png')
    } else {
      p.saveCanvas(filename, 'png')
    }

    gradient = originalGradient
    selectedIndex = originalSelectedIndex
    display()
  }

  // Cycle through fill characters
  const cycleFillChar = () => {
    fillChar = fillChars[(fillChars.indexOf(fillChar) + 1) % fillChars.length]
  }

  // Reset text areas
  const resetTextAreas = () => {
    textAreas.length = 0
    textAreas = setupTextAreas(
      textAreas,
      blocks,
      blockCount,
      grid,
      fillChar,
      clusteringDistance
    )
  }

  // Add a new block
  const addBlock = () => {
    if (textAreas.length < blocks.length) {
      const usedIndices = new Set(textAreas.map(area => area.index))
      textAreas.push(
        createBlock(
          usedIndices,
          Math.floor(grid.cols / 2),
          Math.floor(grid.rows / 2),
          blocks,
          fillChar,
          clusteringDistance,
          grid
        )
      )
      blockCount++
      display()
    }
  }

  // Remove the last block
  const removeBlock = () => {
    if (textAreas.length > 1) {
      textAreas.pop()
      blockCount--
      display()
    }
  }

  const handleMovementKeys = area => {
    const isShiftPressed = p.keyIsDown(p.SHIFT)
    if (isShiftPressed) return

    if (p.keyIsDown(p.UP_ARROW)) {
      area.y = Math.max(0, area.y - 1) // up
    } else if (p.keyIsDown(p.DOWN_ARROW)) {
      area.y = Math.min(grid.rows - area.h, area.y + 1) // down
    } else if (p.keyIsDown(p.LEFT_ARROW)) {
      area.x = Math.max(0, area.x - 1) // left
    } else if (p.keyIsDown(p.RIGHT_ARROW)) {
      area.x = Math.min(grid.cols - area.w, area.x + 1) // right
    }
  }

  // Handle arrow key (non-movement) events
  const handleArrowKeys = () => {
    const area = textAreas[selectedIndex]
    const isShiftPressed = p.keyIsDown(p.SHIFT)

    if (isShiftPressed) {
      if (p.keyCode === p.LEFT_ARROW) {
        selectedIndex =
          (selectedIndex - 1 + textAreas.length) % textAreas.length
      } else if (p.keyCode === p.RIGHT_ARROW) {
        selectedIndex = (selectedIndex + 1) % textAreas.length
      } else if (p.keyCode === p.UP_ARROW || p.keyCode === p.DOWN_ARROW) {
        // Sort areas by z-index to find adjacent blocks
        const sortedAreas = [...textAreas].sort((a, b) => a.zIndex - b.zIndex)
        const currentZIndex = area.zIndex
        const currentPosition = sortedAreas.findIndex(
          a => a.zIndex === currentZIndex
        )

        if (
          p.keyCode === p.UP_ARROW &&
          currentPosition < sortedAreas.length - 1
        ) {
          // Swap z-index with the block above (higher z-index)
          const temp = area.zIndex
          area.zIndex = sortedAreas[currentPosition + 1].zIndex
          sortedAreas[currentPosition + 1].zIndex = temp
        } else if (p.keyCode === p.DOWN_ARROW && currentPosition > 0) {
          // Swap z-index with the block below (lower z-index)
          const temp = area.zIndex
          area.zIndex = sortedAreas[currentPosition - 1].zIndex
          sortedAreas[currentPosition - 1].zIndex = temp
        }
      }
    }
    display()
  }

  // Fetch new blocks from Tumblr
  const fetchNewBlocks = async () => {
    try {
      await initializeBlocks()
      textAreas.length = 0
      textAreas = setupTextAreas(
        textAreas,
        blocks,
        blockCount,
        grid,
        fillChar,
        clusteringDistance
      )
      display()
    } catch (error) {
      console.error(
        'Failed to fetch or process new data from tumblrRandomPost.',
        error
      )
    }
  }

  // Handle continuous key presses for movement
  p.draw = () => {
    if (selectionState.isActive) {
      return
    }

    if (selectedIndex !== -1 && !dragging) {
      const area = textAreas[selectedIndex]
      handleMovementKeys(area)
      display() // Update the display after movement
    }
  }
})
