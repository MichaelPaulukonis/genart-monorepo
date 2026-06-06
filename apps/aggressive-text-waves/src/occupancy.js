export function cellsFree (cells, grid, word) {
  for (const { x, y } of cells) {
    const occ = grid[y][x].occupiedBy
    if (occ !== null && occ !== word) return false
  }
  return true
}

export function stampWord (word, grid, cols, rows) {
  for (const { x, y, char } of word.stripCells(cols, rows)) {
    grid[y][x].setWordLetter(char)
    grid[y][x].occupiedBy = word
  }
}

const GRIDLOCK_FRAMES = 60

export function resolveOccupancy ({ wordObjects, grid, cols, rows, overlapMode }) {
  let relaxed = 0

  if (overlapMode !== 'nonOverlap') {
    for (const w of wordObjects) stampWord(w, grid, cols, rows)
    return { relaxed }
  }

  const tryClaim = (word) => {
    const cells = word.stripCells(cols, rows)
    if (!cellsFree(cells, grid, word)) return false
    stampWord(word, grid, cols, rows)
    return true
  }

  for (const word of wordObjects) {
    if (tryClaim(word)) {
      word.prevPosX = word.posX
      word.prevPosY = word.posY
      word.stuckFrames = 0
      continue
    }
    // blocked
    word.stuckFrames++
    if (word.stuckFrames > GRIDLOCK_FRAMES) {
      stampWord(word, grid, cols, rows) // relax: force placement for one frame
      // commit the relaxed position so a block next frame reverts here, not to a stale spot
      word.prevPosX = word.posX
      word.prevPosY = word.posY
      word.stuckFrames = 0
      relaxed++
      continue
    }
    const blockers = blockingWords(word, grid, cols, rows)
    word.handleOverlap({ blockers, grid, cols, rows, tryClaim })
  }

  return { relaxed }
}

function blockingWords (word, grid, cols, rows) {
  const set = new Set()
  for (const { x, y } of word.stripCells(cols, rows)) {
    const occ = grid[y][x].occupiedBy
    if (occ !== null && occ !== word) set.add(occ)
  }
  return [...set]
}
