export function createBlock(usedIndices, clusterCenterX, clusterCenterY, blocks, fillChar, clusteringDistance, grid, zIndex = 0) {
  const allIndices = Array.from(Array(blocks.length).keys()) // Cache all indices
  const availableIndices = allIndices.filter(i => !usedIndices.has(i))

  if (availableIndices.length === 0) {
    console.warn('All indices have been used. Resetting usedIndices.')
    usedIndices.clear()
    availableIndices.push(...allIndices)
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
  usedIndices.add(randomIndex)

  // Retain the original lines without replacing spaces
  const lines = blocks[randomIndex]

  const width = Math.max(...lines.map(line => line.length))
  const height = lines.length

  // Calculate spread based purely on clustering distance without safe margins
  const spreadRadius = clusteringDistance * (0.3 + Math.random() * 0.5)

  // Apply spread with variable distance
  const angle = Math.random() * Math.PI * 2
  const distance = spreadRadius * (0.3 + Math.random() * 1.2)
  const spreadX = Math.cos(angle) * distance
  const spreadY = Math.sin(angle) * distance

  // Add occasional "outliers" that break from the tight clustering
  const breakPattern = Math.random() < 0.2
  const spreadMultiplier = breakPattern ? 2 : 1

  // Calculate position without edge protection
  const adjustedX = clusterCenterX + (spreadX * spreadMultiplier)
  const adjustedY = clusterCenterY + (spreadY * spreadMultiplier)

  // Only prevent blocks from going completely outside canvas
  const x = Math.round(Math.max(0, Math.min(grid.cols - width, adjustedX)))
  const y = Math.round(Math.max(0, Math.min(grid.rows - height, adjustedY)))

  return {
    index: randomIndex,
    lines: lines, // Keep the original lines
    x: x,
    y: y,
    w: width,
    h: height,
    zIndex: zIndex // Now accepts zIndex parameter
  }
}

export function setupTextAreas(textAreas, blocks, blockCount, grid, fillChar, clusteringDistance) {
  const usedIndices = new Set(textAreas.map(area => area.index))
  const baseZIndex = textAreas.length > 0 
    ? Math.max(...textAreas.map(area => area.zIndex)) + 1 
    : 0

  // Use clusteringDistance as direct scaling factor (higher = more spread out)
  const optimalDistance = clusteringDistance

  // Choose cluster center - can be anywhere on grid
  // No margin restriction, allow cluster center near edges
  const clusterCenterX = Math.floor(Math.random() * grid.cols)
  const clusterCenterY = Math.floor(Math.random() * grid.rows)

  const newTextAreas = [...textAreas]
  const blocksToAdd = blockCount - newTextAreas.length
  if (blocksToAdd > 0) {
    const newBlocks = Array(blocksToAdd)
      .fill()
      .map((_, idx) => createBlock(
        usedIndices,
        clusterCenterX,
        clusterCenterY,
        blocks,
        fillChar,
        optimalDistance, // Use the calculated optimal distance
        grid,
        baseZIndex + idx // Assign sequential z-indices
      ))
    newTextAreas.push(...newBlocks)
  }

  return newTextAreas
}
