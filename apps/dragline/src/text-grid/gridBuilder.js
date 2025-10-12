export function buildGrid(tokens, spaceRatio = 0.5) {
  const gridSize = 40;
  const grids = [];
  let currentGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(' '));
  let row = 0;
  let col = 0;

  const addTokenToGrid = (token) => {
    for (let i = 0; i < token.length; i++) {
      if (col >= gridSize) {
        // Move to the next row if the token exceeds the current row
        col = 0;
        row++;
      }

      if (row >= gridSize) {
        // If the current grid is full, start a new grid
        grids.push(currentGrid);
        currentGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(' '));
        row = 0;
        col = 0;
      }

      currentGrid[row][col] = token[i];
      col++;
    }
  };

  const addSpacesToGrid = (spaceCount) => {
    for (let i = 0; i < spaceCount; i++) {
      if (col >= gridSize) {
        col = 0;
        row++;
      }

      if (row >= gridSize) {
        grids.push(currentGrid);
        currentGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(' '));
        row = 0;
        col = 0;
      }

      currentGrid[row][col] = ' ';
      col++;
    }
  };

  tokens.forEach((token) => {
    // Add random spaces before the token
    const spaceCount = Math.floor(Math.random() * (spaceRatio * gridSize));
    addSpacesToGrid(spaceCount);

    // Add the token itself
    addTokenToGrid(token);
  });

  // Push the last grid if it has content
  grids.push(currentGrid);

  // Convert each grid's rows into single 40-character strings
  const formattedGrids = grids.map((grid) => grid.map((row) => row.join('')));

  return formattedGrids;
}
