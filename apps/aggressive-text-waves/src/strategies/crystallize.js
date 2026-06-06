// Pileup strategy: crystallization lock.
// Words hemmed in by neighbors lock in place (immovable obstacles) and melt
// (reanimate) when the crowding around them dissolves. Lock/melt is decided by
// a density post-pass (crystallizePostResolve), registered via PILEUP_POST —
// not by per-word handleOverlap. handleOverlap here just holds position for a
// still-mobile blocked word.
//
// ATW's grid is square, so "hemmed in" = occupied fraction of the word's
// 8-neighborhood border ring (wrap-around), with hysteresis to avoid flicker.
const LOCK_DENSITY = 0.6
const MELT_DENSITY = 0.4

// Fraction of the cells bordering a word's strip footprint (8-neighborhood,
// wrap-around, excluding the strip's own cells) that are currently occupied.
export function borderDensity (word, grid, cols, rows) {
  const stripKeys = new Set(word.stripCells(cols, rows).map(c => `${c.x},${c.y}`))
  const border = new Set()
  for (const { x, y } of word.stripCells(cols, rows)) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = (x + dx + cols) % cols
        const ny = (y + dy + rows) % rows
        const key = `${nx},${ny}`
        if (!stripKeys.has(key)) border.add(key)
      }
    }
  }
  if (border.size === 0) return 0
  let occupied = 0
  for (const key of border) {
    const [bx, by] = key.split(',').map(Number)
    if (grid[by][bx].occupiedBy !== null) occupied++
  }
  return occupied / border.size
}

// Post-resolve pass: lock crowded words, melt freed ones (hysteresis band).
export function crystallizePostResolve (wordObjects, grid, cols, rows) {
  for (const word of wordObjects) {
    const density = borderDensity(word, grid, cols, rows)
    if (!word.isLocked && density >= LOCK_DENSITY) word.isLocked = true
    else if (word.isLocked && density < MELT_DENSITY) word.isLocked = false
  }
}

// A still-mobile blocked word holds position; locking is decided post-resolve.
// (No ctx needed — dispatcher passes it but this strategy ignores it.)
export function crystallize (word) {
  return word.revert()
}
