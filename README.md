# DUO-CHROME 🎨

> Generative duotone art through random image fusion and vintage color palettes
# DUO-CHROME 🎨

> Generative duotone art through random image fusion and vintage color palettes

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Made with p5.js](https://img.shields.io/badge/Made%20with-p5.js-ED225D.svg)](https://p5js.org/)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF.svg)](https://vitejs.dev/)

**Duo-Chrome** is a creative coding web application that creates dynamic visual compositions by overlaying two randomly selected monochrome images in different colors. Inspired by [Lee Doughty's work](https://leedoughty.com/) and duotone printing techniques, it explores unexpected juxtapositions through algorithmic image selection and RISO printing color palettes.

---

## Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🎮 Controls](#-controls)
- [🛠️ Development](#️-development)
- [🎨 How It Works](#-how-it-works)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [🔧 Troubleshooting](#-troubleshooting)
- [📝 License](#-license)

---

## ✨ Features

- **🎲 Random Image Fusion**: Algorithmically combines 160+ curated vintage and pop-art images
- **🌈 RISO Color Palettes**: Authentic risograph printing colors plus custom palettes
- **🔄 Dynamic Blend Modes**: Multiple blend modes (ADD, MULTIPLY, EXCLUSION, DIFFERENCE, etc.)
- **⚡ Real-time Generation**: Auto-generates new compositions every second
- **🖱️ Interactive Controls**: Manual control via mouse clicks and keyboard shortcuts
- **💾 Export Functionality**: Save your favorite compositions as PNG files
- **🎨 Seamless Transitions**: Overlapping image pairs create visual continuity

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MichaelPaulukonis/duo-chrome.git
   cd duo-chrome
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
[![Made with p5.js](https://img.shields.io/badge/Made%20with-p5.js-ED225D.svg)](https://p5js.org/)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF.svg)](https://vitejs.dev/)

**Duo-Chrome** is a creative coding web application that creates dynamic visual compositions by overlaying two randomly selected monochrome images in different colors. Inspired by [Lee Doughty's work](https://leedoughty.com/) and duotone printing techniques, it explores unexpected juxtapositions through algorithmic image selection and RISO printing color palettes.

---

## Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🎮 Controls](#-controls)
- [🛠️ Development](#️-development)
- [🎨 How It Works](#-how-it-works)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [🔧 Troubleshooting](#-troubleshooting)
- [📝 License](#-license)

---

## ✨ Features

- **🎲 Random Image Fusion**: Algorithmically combines 160+ curated vintage and pop-art images
- **🌈 RISO Color Palettes**: Authentic risograph printing colors plus custom palettes
- **🔄 Dynamic Blend Modes**: Multiple blend modes (ADD, MULTIPLY, EXCLUSION, DIFFERENCE, etc.)
- **⚡ Real-time Generation**: Auto-generates new compositions every second
- **🖱️ Interactive Controls**: Manual control via mouse clicks and keyboard shortcuts
- **💾 Export Functionality**: Save your favorite compositions as PNG files
- **🎨 Seamless Transitions**: Overlapping image pairs create visual continuity

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MichaelPaulukonis/duo-chrome.git
   cd duo-chrome
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` and watch the magic happen! ✨

---

## 🎮 Controls

| Input | Action |
|-------|--------|
| **Mouse Click** | Generate new image combination |
| **`b`** | Toggle background color (black/white) |
| **`c`** | Cycle through color palettes |
| **`m`** | Cycle through blend modes |
| **`p`** or **`Space`** | Pause/resume auto-generation |
| **`S`** (capital) | Toggle auto-save mode |
| **`Cmd+S`** | Manually save current composition |

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
npm run clean    # Fix code style with StandardJS
```

### Development Workflow

1. **Code Style**: This project follows [StandardJS](https://standardjs.com/) conventions
2. **Linting**: ESLint with p5.js-specific rules
3. **Hot Reload**: Vite provides instant feedback during development
4. **Build System**: Vite handles bundling and optimization

### Adding New Images

1. Add your image to `public/images/`
2. Update the `imgs` array in `src/imagelist.js`
3. Images work best as high-contrast black and white graphics

### Customizing Color Palettes

Edit `src/risocolors.js` to add new color palettes:

```javascript
export const CUSTOM_PALETTE = [
  { name: 'CUSTOM_COLOR', color: [255, 100, 50] },
  // Add more colors...
]
```

---

## 🎨 How It Works

Duo-Chrome uses a multi-step image processing pipeline:

1. **Image Selection**: Two images are randomly selected from a curated collection
2. **Monochrome Conversion**: Each image is processed into a monochrome layer
3. **Color Application**: Different colors from RISO palettes are applied to each layer
4. **Blend Mode Overlay**: Images are composited using various blend modes
5. **Dynamic Scaling**: Images are scaled and positioned for optimal composition

### Core Algorithm

```javascript
// Simplified version of the core process
function createMonochromeImage(img, monoColor) {
  const layer = p.createGraphics(scaledWidth, scaledHeight)
  layer.image(img, 0, 0, scaledWidth, scaledHeight)
  layer.drawingContext.globalCompositeOperation = 'source-in'
  layer.image(colorLayer, 0, 0, scaledWidth, scaledHeight)
  return layer
}
```

---

## 📁 Project Structure

```
duo-chrome/
├── public/
│   └── images/           # 160+ curated images
├── src/
│   ├── duo-chrome.js     # Main application logic
│   ├── imagelist.js      # Image inventory
│   └── risocolors.js     # Color palette definitions
├── css/
│   └── style.css         # Minimal styling
├── docs/
│   └── reference/        # Project documentation
├── package.json          # Dependencies & scripts
├── vite.config.js        # Build configuration
└── index.html           # Entry point
```

### Key Files

- **`src/duo-chrome.js`**: Core p5.js sketch with rendering logic
- **`src/imagelist.js`**: Maintains inventory of all available images
- **`src/risocolors.js`**: RISO and custom color palette definitions
- **`public/images/`**: Curated collection of vintage/pop-art imagery

---

## 🤝 Contributing

Contributions are welcome! This project is shared with the creative coding community in the spirit of learning and collaboration.

### Ways to Contribute

- 🖼️ **Add Images**: Contribute interesting black & white graphics
- 🎨 **New Palettes**: Add color schemes from different printing traditions
- 🐛 **Bug Reports**: Report issues or unexpected behavior
- 💡 **Feature Ideas**: Suggest new functionality
- 📚 **Documentation**: Improve guides and examples

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code style (StandardJS)
4. Test your changes thoroughly
5. Commit with clear messages
6. Push and create a Pull Request

---

## 🔧 Troubleshooting

### Common Issues

**Images not loading?**
- Check that image files exist in `public/images/`
- Verify image filenames match entries in `src/imagelist.js`
- Ensure images are web-compatible formats (PNG, JPG)

**Build failing?**
- Run `npm run lint` to check for code style issues
- Update dependencies: `npm update`
- Clear node_modules: `rm -rf node_modules && npm install`

**Performance issues?**
- Try reducing the auto-generation frequency
- Check browser developer tools for memory usage
- Some blend modes are more computationally intensive

### Getting Help

- 📋 **Issues**: [GitHub Issues](https://github.com/MichaelPaulukonis/duo-chrome/issues)
- 📖 **Documentation**: Check `docs/reference/overview.md`
- 💬 **Community**: Connect with other creative coders

---

## 🎯 Roadmap

### Coming Soon
- **UI Improvements**: Color picker, image browser
- **Export Options**: Different formats and sizes
- **Mobile Support**: Touch-friendly interface
- **Performance**: Image preloading and caching

### Future Ideas
- **Custom Image Upload**: Add your own images
- **Palette Editor**: Create custom color schemes
- **Animation Export**: Save as GIF or video
- **Collaborative Collections**: Share image sets

---

## 🙏 Acknowledgments

- **Inspiration**: [Lee Doughty](https://leedoughty.com/) for the original concept
- **Community**: The creative coding community for sharing knowledge
- **Tools**: Built with [p5.js](https://p5js.org/) and [Vite](https://vitejs.dev/)
- **Colors**: RISO printing color specifications

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

**Made with ❤️ for the creative coding community**

*I learned from the community, I give my code back to the community.*

**Made with ❤️ for the creative coding community**

*I learned from the community, I give my code back to the community.*
