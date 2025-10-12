const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomSpacing = (gridSize, tokenCount) => {
    const spacing = [];
    for (let i = 0; i < tokenCount; i++) {
        spacing.push(getRandomInt(1, gridSize / 10)); // Random spacing between 1 and gridSize/10
    }
    return spacing;
};

const validateTokens = (tokens) => {
    if (!Array.isArray(tokens) || tokens.length === 0) {
        throw new Error("Invalid tokens: must be a non-empty array.");
    }
};

export { getRandomInt, generateRandomSpacing, validateTokens };
