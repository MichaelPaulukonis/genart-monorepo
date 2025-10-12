export const createCharGrid = (rows, cols, fillChar) => {
  return Array(rows)
    .fill()
    .map(() => Array(cols).fill(fillChar))
}

export const populateCharGrid = (charGrid, previousTextAreas, currentTextAreas, fillChar, withinGrid) => {
  // Clear the grid cells occupied by the previous positions of text areas
  for (let area of previousTextAreas) {
    for (let i = 0; i < area.lines.length; i++) {
      for (let j = 0; j < area.lines[i].length; j++) {
        if (withinGrid(area, i, j)) {
          charGrid[area.y + i][area.x + j] = fillChar // Reset previous cells
        }
      }
    }
  }

  // Populate the grid with the current positions of text areas
  for (let area of currentTextAreas) {
    for (let i = 0; i < area.lines.length; i++) {
      const line = area.lines[i]
      for (let j = 0; j < line.length; j++) {
        if (line[j] === fillChar) continue

        if (
          withinGrid(area, i, j) &&
          line[j] !== ' '
        ) {
          charGrid[area.y + i][area.x + j] = line[j]
        }
      }
    }
  }
}

export const renderCharGrid = (charGrid, p, grid, fillChar) => {
  for (let y = 0; y < charGrid.length; y++) {
    for (let x = 0; x < charGrid[y].length; x++) {
      const canvasX = x * grid.cellSize
      const canvasY = y * grid.cellSize
      const charToRender = charGrid[y][x] === ' ' ? fillChar : charGrid[y][x] // Replace spaces with fillChar
      p.text(charToRender, canvasX, canvasY)
    }
  }
}

export const gridBoundsToPixels = (bounds, cellSize) => {
  const { x, y, w, h } = bounds

  return {
    x: Math.round(x * cellSize),
    y: Math.round(y * cellSize),
    width: Math.round(w * cellSize),
    height: Math.round(h * cellSize)
  }
}

export const pixelsToGridCoordinates = (pixelX, pixelY, cellSize) => {
  return {
    col: pixelX / cellSize,
    row: pixelY / cellSize
  }
}

export const clampBoundsToGrid = (bounds, grid) => {
  const clamped = { ...bounds }

  const maxX = grid.cols - clamped.w
  const maxY = grid.rows - clamped.h

  clamped.x = Math.max(0, Math.min(maxX, clamped.x))
  clamped.y = Math.max(0, Math.min(maxY, clamped.y))

  return clamped
}

export const renderCharGridRegion = (charGrid, p, grid, bounds, fillChar) => {
  const { x, y, w, h } = bounds

  for (let row = 0; row < h; row++) {
    const sourceRow = charGrid[y + row]
    if (!sourceRow) continue

    for (let col = 0; col < w; col++) {
      const sourceChar = sourceRow[x + col]
      const canvasX = col * grid.cellSize
      const canvasY = row * grid.cellSize
      const charToRender = sourceChar === ' ' ? fillChar : sourceChar
      p.text(charToRender, canvasX, canvasY)
    }
  }
}
