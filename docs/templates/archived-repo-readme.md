# [Project Name]

> **⚠️ This repository has moved to a monorepo**
> 
> Active development now happens in the [GenArt Monorepo](https://github.com/MichaelPaulukonis/genart-monorepo).
> 
> This repository remains active **only** for GitHub Pages deployment. The source code here is no longer maintained.

---

![Screenshot](screenshot.png)

## 🔗 Links

- **Live Demo:** [https://michaelpaulukonis.github.io/[project-name]/](https://michaelpaulukonis.github.io/[project-name]/)
- **Monorepo:** [https://github.com/MichaelPaulukonis/genart-monorepo](https://github.com/MichaelPaulukonis/genart-monorepo)
- **Source Code:** [apps/[project-name]/](https://github.com/MichaelPaulukonis/genart-monorepo/tree/main/apps/[project-name])
- **Documentation:** [View in monorepo](https://github.com/MichaelPaulukonis/genart-monorepo/tree/main/apps/[project-name]/README.md)

## About

[Brief 1-2 sentence description of what the project does]

Built with p5.js as part of the GenArt creative coding collection.

## Development

All development happens in the monorepo. To work on this project:

```bash
git clone https://github.com/MichaelPaulukonis/genart-monorepo.git
cd genart-monorepo
pnpm install
nx dev [project-name]
```

See the [monorepo documentation](https://github.com/MichaelPaulukonis/genart-monorepo) for more details.

## License

MIT

---

## Template Instructions

Replace the following placeholders:
- `[Project Name]` - The display name of the project
- `[project-name]` - The kebab-case project name (duo-chrome, crude-collage-painter, etc.)
- `[Brief 1-2 sentence description]` - Short description from the monorepo README
- `screenshot.png` - Copy the screenshot from `docs/screenshots/[project-name]-main.png` in the monorepo

### Project-Specific Descriptions

**duo-chrome:**
Overlays two monochrome images in different colors to create duotone compositions using RISO printing colors and blend modes.

**crude-collage-painter:**
Interactive collage painting tool for creating digital art compositions inspired by Tim Rodenbroeker's Lowtech Painting Machine.

**those-shape-things:**
Geometric tile-based compositions with customizable color palettes and shape patterns on an 8x8 grid.

**computational-collage:**
Advanced collage creation tool with 10 composition modes, image manipulation, and high-resolution export capabilities.

**dragline:**
Interactive poem-machine that scatters monospaced text blocks across a canvas for rearrangement into new constellations.
