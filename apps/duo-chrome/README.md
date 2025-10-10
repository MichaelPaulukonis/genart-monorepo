# DUO-CHROME

Overlays two monochrome images in different colors to create duotone compositions. Inspired by [Lee Doughty's work](https://leedoughty.com/) and RISO printing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Takes two random black & white images from a curated collection, applies different RISO colors to each, and composites them using various blend modes. Images cycle automatically or manually to create unexpected juxtapositions.

## Table of Contents

- [Installation](#installation)
- [Controls](#controls)
- [Development](#development)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
git clone https://github.com/MichaelPaulukonis/duo-chrome.git
cd duo-chrome
npm install
npm run dev
```

The development server will automatically open in your browser on an available port.

## Controls

| Input        | Action                                |
| ------------ | ------------------------------------- |
| Mouse Click  | Generate new image combination        |
| `b`          | Toggle background color (black/white) |
| `c`          | Cycle through color palettes          |
| `m`          | Cycle through blend modes             |
| `p` or Space | Pause/resume auto-generation          |
| `S`          | Toggle auto-save mode                 |
| `Cmd+S`      | Save current composition              |

## Development

```bash
npm run dev      # Development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run clean    # Fix code style with StandardJS
```

Uses StandardJS code style and ESLint with p5.js rules.

### Adding Images

1. Add image to `public/images/`
2. Update `imgs` array in `src/imagelist.js`
3. Works best with high-contrast black and white graphics

### Adding Colors

Edit `src/risocolors.js`:

```javascript
export const CUSTOM_PALETTE = [
  { name: "CUSTOM_COLOR", color: [255, 100, 50] },
  // ...
];
```

## How It Works

1. Randomly selects two images from the collection
2. Converts each to monochrome layers
3. Applies different RISO colors via `globalCompositeOperation = 'source-in'`
4. Composites using blend modes (ADD, MULTIPLY, EXCLUSION, etc.)
5. Images overlap in sequence (A+B, C+B, C+D) for visual continuity

### Core Algorithm

```javascript
// Simplified version of the core process
function createMonochromeImage(img, monoColor) {
  const layer = p.createGraphics(scaledWidth, scaledHeight);
  layer.image(img, 0, 0, scaledWidth, scaledHeight);
  layer.drawingContext.globalCompositeOperation = "source-in";
  layer.image(colorLayer, 0, 0, scaledWidth, scaledHeight);
  return layer;
}
```

## Project Structure

```
src/
├── duo-chrome.js     # Main p5.js sketch
├── imagelist.js      # Image inventory (~160 files)
└── risocolors.js     # Color palettes
public/images/        # Curated image collection
```

## Contributing

PRs welcome. Follow StandardJS style.

## License

MIT
