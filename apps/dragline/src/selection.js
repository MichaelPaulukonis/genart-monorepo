import { clampBoundsToGrid, gridBoundsToPixels, pixelsToGridCoordinates } from './grid.js'

const HANDLE_TOLERANCE = 0.65
const MIN_SIZE = 3

export const createSelectionState = grid => ({
  isActive: false,
  bounds: null,
  lastBounds: null,
  aspectRatio: 1,
  interaction: null,
  hoverHandle: null,
  grid,
  activeRatio: null,
  ratioPresets: [
    { label: 'Free', width: null, height: null },
    { label: '1:1', width: 1, height: 1 },
    { label: '4:5', width: 4, height: 5 },
    { label: '3:4', width: 3, height: 4 },
    { label: '2:3', width: 2, height: 3 },
    { label: '16:9', width: 16, height: 9 },
    { label: '21:9', width: 21, height: 9 },
    { label: '9:16', width: 9, height: 16 },
    { label: '5:4', width: 5, height: 4 }
  ]
})

export const enterSelectionMode = (state, grid) => {
  state.grid = grid
  state.bounds = state.lastBounds
    ? { ...state.lastBounds }
    : createDefaultBounds(grid)
  state.bounds = ensureMinSize(state.bounds)
  state.bounds = clampBoundsToGrid(state.bounds, grid)
  
  // Apply active ratio if set
  if (state.activeRatio) {
    state.bounds = fitBoundsToRatio(state.bounds, state.activeRatio, grid)
  }
  
  state.isActive = true
  state.interaction = null
}

export const exitSelectionMode = state => {
  if (state.bounds) {
    state.lastBounds = { ...state.bounds }
  }
  state.isActive = false
  state.interaction = null
}

export const handlePointerPressed = (state, pointer, grid) => {
  if (!state.isActive || !state.bounds) return false

  const { col, row } = pixelsToGridCoordinates(pointer.x, pointer.y, grid.cellSize)
  const handle = detectHandle(state.bounds, col, row)

  if (!handle) {
    return false
  }

  state.interaction = {
    type: handle,
    startCol: col,
    startRow: row,
    originalBounds: { ...state.bounds },
    originalCenter: getBoundsCenter(state.bounds)
  }

  return true
}

export const handlePointerDragged = (state, pointer, grid) => {
  if (!state.isActive || !state.interaction) return false

  const { col, row } = pixelsToGridCoordinates(pointer.x, pointer.y, grid.cellSize)
  let nextBounds = { ...state.interaction.originalBounds }

  if (state.interaction.type === 'move') {
    const deltaCol = col - state.interaction.startCol
    const deltaRow = row - state.interaction.startRow

    nextBounds.x = state.interaction.originalBounds.x + Math.round(deltaCol)
    nextBounds.y = state.interaction.originalBounds.y + Math.round(deltaRow)
  } else {
    nextBounds = resizeBounds(
      state.interaction.originalBounds,
      state.interaction,
      { col, row },
      state.aspectRatio
    )
  }

  nextBounds = ensureMinSize(nextBounds)
  nextBounds = clampBoundsToGrid(nextBounds, grid)
  
  // Apply active ratio constraints
  if (state.activeRatio) {
    nextBounds = fitBoundsToRatio(nextBounds, state.activeRatio, grid)
  }
  
  state.bounds = nextBounds
  return true
}

export const handlePointerReleased = state => {
  if (!state.isActive || !state.interaction) return

  state.lastBounds = { ...state.bounds }
  state.interaction = null
}

export const renderSelectionOverlay = (p, state, grid) => {
  if (!state.isActive || !state.bounds) return

  const { x, y, width, height } = gridBoundsToPixels(state.bounds, grid.cellSize)

  p.push()
  p.noStroke()
  p.fill(0, 0, 0, 90)

  // Top mask
  if (y > 0) {
    p.rect(0, 0, p.width, y)
  }
  // Bottom mask
  if (y + height < p.height) {
    p.rect(0, y + height, p.width, p.height - (y + height))
  }
  // Left mask
  if (x > 0) {
    p.rect(0, y, x, height)
  }
  // Right mask
  if (x + width < p.width) {
    p.rect(x + width, y, p.width - (x + width), height)
  }

  // Selection rectangle
  p.stroke('#ffffff')
  p.strokeWeight(2)
  p.noFill()
  p.rect(x, y, width, height)

  drawHandles(p, x, y, width, height)
  drawDimensions(p, x, y, width, height, state.bounds)
  drawRatioPresets(p, state)

  p.pop()
}

export const getActiveBounds = state => {
  if (!state.isActive) return null
  return state.bounds ? { ...state.bounds } : null
}

export const nudgeSelection = (state, dx, dy, grid) => {
  if (!state.isActive || !state.bounds) return

  const next = {
    ...state.bounds,
    x: state.bounds.x + dx,
    y: state.bounds.y + dy
  }

  state.bounds = clampBoundsToGrid(next, grid)
  state.lastBounds = { ...state.bounds }
}

const createDefaultBounds = grid => {
  const size = Math.max(
    MIN_SIZE,
    Math.min(Math.floor(Math.min(grid.cols, grid.rows) / 2), 16)
  )

  const x = Math.max(0, Math.floor(grid.cols / 2 - size / 2))
  const y = Math.max(0, Math.floor(grid.rows / 2 - size / 2))

  return {
    x,
    y,
    w: size,
    h: size
  }
}

const ensureMinSize = bounds => {
  const w = Math.max(MIN_SIZE, bounds.w)
  const h = Math.max(MIN_SIZE, bounds.h)
  return { ...bounds, w, h }
}

const detectHandle = (bounds, col, row) => {
  const x2 = bounds.x + bounds.w
  const y2 = bounds.y + bounds.h

  const nearLeft = Math.abs(col - bounds.x) <= HANDLE_TOLERANCE
  const nearRight = Math.abs(col - x2) <= HANDLE_TOLERANCE
  const nearTop = Math.abs(row - bounds.y) <= HANDLE_TOLERANCE
  const nearBottom = Math.abs(row - y2) <= HANDLE_TOLERANCE

  const insideX = col > bounds.x && col < x2
  const insideY = row > bounds.y && row < y2

  if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
    if (nearLeft && nearTop) return 'corner-nw'
    if (nearRight && nearTop) return 'corner-ne'
    if (nearLeft && nearBottom) return 'corner-sw'
    if (nearRight && nearBottom) return 'corner-se'
  }

  if (nearLeft && insideY) return 'edge-w'
  if (nearRight && insideY) return 'edge-e'
  if (nearTop && insideX) return 'edge-n'
  if (nearBottom && insideX) return 'edge-s'

  if (insideX && insideY) return 'move'

  return null
}

const resizeBounds = (originalBounds, interaction, pointer, aspectRatio) => {
  switch (interaction.type) {
    case 'corner-nw':
      return resizeCornerNorthWest(originalBounds, pointer, aspectRatio)
    case 'corner-ne':
      return resizeCornerNorthEast(originalBounds, pointer, aspectRatio)
    case 'corner-sw':
      return resizeCornerSouthWest(originalBounds, pointer, aspectRatio)
    case 'corner-se':
      return resizeCornerSouthEast(originalBounds, pointer, aspectRatio)
    case 'edge-w':
      return resizeFromEdge(originalBounds, pointer, aspectRatio, 'w')
    case 'edge-e':
      return resizeFromEdge(originalBounds, pointer, aspectRatio, 'e')
    case 'edge-n':
      return resizeFromEdge(originalBounds, pointer, aspectRatio, 'n')
    case 'edge-s':
      return resizeFromEdge(originalBounds, pointer, aspectRatio, 's')
    default:
      return { ...originalBounds }
  }
}

const resizeCornerNorthWest = (bounds, pointer, aspectRatio) => {
  const anchorCol = bounds.x + bounds.w
  const anchorRow = bounds.y + bounds.h

  const widthCandidate = Math.max(MIN_SIZE, anchorCol - pointer.col)
  const heightCandidate = Math.max(MIN_SIZE, anchorRow - pointer.row)

  const { width, height } = pickDimension(widthCandidate, heightCandidate, aspectRatio, bounds)

  return {
    x: anchorCol - width,
    y: anchorRow - height,
    w: width,
    h: height
  }
}

const resizeCornerNorthEast = (bounds, pointer, aspectRatio) => {
  const anchorCol = bounds.x
  const anchorRow = bounds.y + bounds.h

  const widthCandidate = Math.max(MIN_SIZE, pointer.col - anchorCol)
  const heightCandidate = Math.max(MIN_SIZE, anchorRow - pointer.row)

  const { width, height } = pickDimension(widthCandidate, heightCandidate, aspectRatio, bounds)

  return {
    x: anchorCol,
    y: anchorRow - height,
    w: width,
    h: height
  }
}

const resizeCornerSouthWest = (bounds, pointer, aspectRatio) => {
  const anchorCol = bounds.x + bounds.w
  const anchorRow = bounds.y

  const widthCandidate = Math.max(MIN_SIZE, anchorCol - pointer.col)
  const heightCandidate = Math.max(MIN_SIZE, pointer.row - anchorRow)

  const { width, height } = pickDimension(widthCandidate, heightCandidate, aspectRatio, bounds)

  return {
    x: anchorCol - width,
    y: anchorRow,
    w: width,
    h: height
  }
}

const resizeCornerSouthEast = (bounds, pointer, aspectRatio) => {
  const anchorCol = bounds.x
  const anchorRow = bounds.y

  const widthCandidate = Math.max(MIN_SIZE, pointer.col - anchorCol)
  const heightCandidate = Math.max(MIN_SIZE, pointer.row - anchorRow)

  const { width, height } = pickDimension(widthCandidate, heightCandidate, aspectRatio, bounds)

  return {
    x: anchorCol,
    y: anchorRow,
    w: width,
    h: height
  }
}

const pickDimension = (widthCandidate, heightCandidate, aspectRatio, bounds) => {
  const widthDelta = Math.abs(widthCandidate - bounds.w)
  const heightDelta = Math.abs(heightCandidate - bounds.h)
  const useWidth = widthDelta >= heightDelta

  let width
  let height

  if (useWidth) {
    width = widthCandidate
    height = width / aspectRatio
  } else {
    height = heightCandidate
    width = height * aspectRatio
  }

  width = Math.max(MIN_SIZE, Math.round(width))
  height = Math.max(MIN_SIZE, Math.round(height))

  return { width, height }
}

const resizeFromEdge = (bounds, pointer, aspectRatio, edge) => {
  const center = getBoundsCenter(bounds)
  let width = bounds.w
  let height = bounds.h
  let x = bounds.x
  let y = bounds.y

  switch (edge) {
    case 'w': {
      const anchor = bounds.x + bounds.w
      width = Math.max(MIN_SIZE, Math.round(anchor - pointer.col))
      height = Math.max(MIN_SIZE, Math.round(width / aspectRatio))
      x = anchor - width
      y = Math.round(center.y - height / 2)
      break
    }
    case 'e': {
      const anchor = bounds.x
      width = Math.max(MIN_SIZE, Math.round(pointer.col - anchor))
      height = Math.max(MIN_SIZE, Math.round(width / aspectRatio))
      x = anchor
      y = Math.round(center.y - height / 2)
      break
    }
    case 'n': {
      const anchor = bounds.y + bounds.h
      height = Math.max(MIN_SIZE, Math.round(anchor - pointer.row))
      width = Math.max(MIN_SIZE, Math.round(height * aspectRatio))
      y = anchor - height
      x = Math.round(center.x - width / 2)
      break
    }
    case 's': {
      const anchor = bounds.y
      height = Math.max(MIN_SIZE, Math.round(pointer.row - anchor))
      width = Math.max(MIN_SIZE, Math.round(height * aspectRatio))
      y = anchor
      x = Math.round(center.x - width / 2)
      break
    }
    default:
      break
  }

  return {
    x,
    y,
    w: width,
    h: height
  }
}

const drawHandles = (p, x, y, width, height) => {
  const handleSize = 8
  const half = handleSize / 2
  const positions = [
    { x: x, y: y },
    { x: x + width / 2, y: y },
    { x: x + width, y: y },
    { x: x, y: y + height / 2 },
    { x: x + width, y: y + height / 2 },
    { x: x, y: y + height },
    { x: x + width / 2, y: y + height },
    { x: x + width, y: y + height }
  ]

  p.fill('#ffffff')
  p.stroke('#000000')
  p.strokeWeight(1)

  positions.forEach(pos => {
    p.rect(pos.x - half, pos.y - half, handleSize, handleSize)
  })
}

const drawDimensions = (p, x, y, width, height, bounds) => {
  const label = `${bounds.w}×${bounds.h}`
  const padding = 6
  const textSize = 12

  const previousTextSize = p.textSize()
  p.textSize(textSize)
  const textWidth = p.textWidth(label)
  const boxWidth = textWidth + padding * 2
  const boxHeight = textSize + padding
  const boxX = x + width - boxWidth
  const boxY = Math.min(p.height - boxHeight - padding, y + height + padding)

  p.fill(0, 0, 0, 160)
  p.noStroke()
  p.rect(boxX, boxY, boxWidth, boxHeight, 4)

  p.fill('#ffffff')
  p.textAlign(p.RIGHT, p.CENTER)
  p.text(label, boxX + boxWidth - padding, boxY + boxHeight / 2)
  p.textSize(previousTextSize)
}

const getBoundsCenter = bounds => ({
  x: bounds.x + bounds.w / 2,
  y: bounds.y + bounds.h / 2
})

const fitBoundsToRatio = (bounds, ratio, grid) => {
  if (!ratio || (!ratio.width || !ratio.height)) {
    return bounds // Freeform - no constraints
  }

  const targetRatio = ratio.width / ratio.height
  const currentRatio = bounds.w / bounds.h

  let newW, newH

  if (currentRatio > targetRatio) {
    // Too wide - expand height
    newH = Math.round(bounds.w / targetRatio)
    newW = bounds.w
  } else {
    // Too tall - expand width  
    newW = Math.round(bounds.h * targetRatio)
    newH = bounds.h
  }

  // Ensure we don't exceed grid boundaries
  const maxX = grid.cols - newW
  const maxY = grid.rows - newH
  
  let newX = Math.min(bounds.x, Math.max(0, maxX))
  let newY = Math.min(bounds.y, Math.max(0, maxY))

  // If still too large, shrink proportionally
  if (newX < 0 || newY < 0 || newX + newW > grid.cols || newY + newH > grid.rows) {
    const availableWidth = grid.cols - bounds.x
    const availableHeight = grid.rows - bounds.y
    const constrainedByWidth = availableWidth / ratio.width
    const constrainedByHeight = availableHeight / ratio.height
    const scale = Math.min(constrainedByWidth, constrainedByHeight)
    
    newW = Math.max(MIN_SIZE, Math.floor(ratio.width * scale))
    newH = Math.max(MIN_SIZE, Math.floor(ratio.height * scale))
  }

  return { x: newX, y: newY, w: newW, h: newH }
}

const drawRatioPresets = (p, state) => {
  const buttonWidth = 45
  const buttonHeight = 24
  const margin = 8
  const startX = 20
  const startY = 20
  
  p.push()
  p.textAlign(p.CENTER, p.CENTER)
  p.textSize(11)
  
  state.ratioPresets.forEach((ratio, index) => {
    const x = startX + (index % 3) * (buttonWidth + margin)
    const y = startY + Math.floor(index / 3) * (buttonHeight + margin)
    
    const isActive = state.activeRatio === ratio
    
    // Button background
    p.fill(isActive ? 100 : 40, 150)
    p.stroke(isActive ? 255 : 180)
    p.strokeWeight(1)
    p.rect(x, y, buttonWidth, buttonHeight, 4)
    
    // Button text
    p.fill(255)
    p.noStroke()
    p.text(ratio.label, x + buttonWidth / 2, y + buttonHeight / 2)
  })
  
  p.pop()
}

export const setActiveRatio = (state, ratioIndex) => {
  const ratio = state.ratioPresets[ratioIndex] || null
  state.activeRatio = ratio
  
  if (ratio && state.isActive && state.bounds) {
    // Apply ratio to current bounds
    state.bounds = fitBoundsToRatio(state.bounds, ratio, state.grid)
    state.lastBounds = { ...state.bounds }
  }
}

export const handleRatioPresetClick = (state, mouseX, mouseY) => {
  if (!state.isActive) return false
  
  const buttonWidth = 45
  const buttonHeight = 24
  const margin = 8
  const startX = 20
  const startY = 20
  
  for (let i = 0; i < state.ratioPresets.length; i++) {
    const x = startX + (i % 3) * (buttonWidth + margin)
    const y = startY + Math.floor(i / 3) * (buttonHeight + margin)
    
    if (mouseX >= x && mouseX <= x + buttonWidth && 
        mouseY >= y && mouseY <= y + buttonHeight) {
      setActiveRatio(state, i)
      return true // Click was handled
    }
  }
  
  return false // Click was not on any preset button
}
