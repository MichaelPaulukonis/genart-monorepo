import { PILEUP_POST } from './pileup-strategies.js'

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

export function resolveOccupancy ({ wordObjects, grid, cols, rows, overlapMode, pileupStrategy }) {
  let relaxed = 0

  if (overlapMode !== 'nonOverlap') {
    for (const w of wordObjects) {
      stampWord(w, grid, cols, rows)
      // keep prevPos fresh so switching to nonOverlap doesn't snap words to spawn
      w.commitPosition()
    }
    return { relaxed }
  }

  const tryClaim = (word) => {
    const cells = word.stripCells(cols, rows)
    if (!cellsFree(cells, grid, word)) return false
    stampWord(word, grid, cols, rows)
    return true
  }

  // locked (crystallized) words claim first so they hold their cells against
  // mobile claimants. No word is locked outside crystallize mode, so this is a
  // no-op (stable order preserved) for the other strategies.
  const ordered = wordObjects.filter(w => w.isLocked).concat(wordObjects.filter(w => !w.isLocked))

  for (const word of ordered) {
    if (tryClaim(word)) {
      word.commitPosition()
      continue
    }
    // blocked
    word.stuckFrames++
    if (word.stuckFrames > GRIDLOCK_FRAMES) {
      stampWord(word, grid, cols, rows) // relax: force placement for one frame
      // commit the relaxed position so a block next frame reverts here, not to a stale spot
      word.commitPosition()
      relaxed++
      continue
    }
    const blockers = blockingWords(word, grid, cols, rows)
    // handleOverlap returns true if it placed the word (claimed cells via tryClaim).
    // On success, commit its position and clear the stuck counter so a word that
    // legitimately re-places every frame never trips the gridlock fallback.
    const claimed = word.handleOverlap({ blockers, grid, cols, rows, tryClaim, strategy: pileupStrategy })
    if (claimed) word.commitPosition()
  }

  // optional global post-pass for strategies that need one (e.g. crystallize)
  const post = PILEUP_POST[pileupStrategy]
  if (post) post(wordObjects, grid, cols, rows)

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
