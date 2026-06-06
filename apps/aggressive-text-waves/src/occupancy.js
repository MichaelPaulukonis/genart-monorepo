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
