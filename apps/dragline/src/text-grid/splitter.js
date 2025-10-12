export function splitGrid(grid) {
  const grids = [];
  
  for (let i = 0; i < 4; i++) {
    const startRow = (i % 2) * 20;
    const startCol = Math.floor(i / 2) * 20;
    const subGrid = [];

    for (let row = startRow; row < startRow + 20; row++) {
      subGrid.push(grid[row].slice(startCol, startCol + 20));
    }

    grids.push(subGrid);
  }

  return grids;
}
