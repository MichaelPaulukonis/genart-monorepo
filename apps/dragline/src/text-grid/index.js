import { tokenize } from './tokenizer.js';
import { buildGrid } from './gridBuilder.js';
import { splitGrid } from './splitter.js';

const gridify = (data) => {
    const tokens = tokenize(data);

    // Build a 40x40 grid with the tokens, 50% density
    const grids = buildGrid(tokens, 0.5);

    // amazonq-ignore-next-line
    console.log('Generated 40x40 grids: ', grids.length);

    // Split the grid into four 20x20 grids
    const smallerGrids = grids.map(splitGrid).flat(); // Flatten in case multiple grids were generated
    if (smallerGrids.length === 0) {
        console.error('No smaller grids generated.');
        return;
    }
    return smallerGrids
}

export default gridify;
