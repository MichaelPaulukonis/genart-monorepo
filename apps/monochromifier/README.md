# monochromifier

make square b&w images for use with `duo-chrome`

![MONOCHROMIFIER Screenshot](./docs/screenshots/monochromifier-main-00.png) Screenshot showing UI

![MONOCHROMIFIER Screenshot](./docs/screenshots/monochromifier-main-01.png) Screenshot showing help screen

## Usage

Drag and drop an image onto the canvas to begin.

### Help & Controls

Press **`?`** to toggle the on-screen help, which lists all available keyboard shortcuts.

### Modes

The application has two primary modes, toggled with the **`e`** key:

1. **Adjust Mode** (Default):
    - Position and scale the source image (Pan/Zoom).
    - Apply fit methods (Fit to Width/Height/Both).
    - Control global settings like Threshold and Inversion.
    - Save/Export the result (`Cmd+S`).

2. **Edit Mode**:
    - **Paint Tool (`p`)**: Draw directly on the monochrome image (supports erase mode).
    - **Crop Tool (`c`)**: Define a crop region to trim the image.

## 🔗 Links

- **Live Demo:** [https://michaelpaulukonis.github.io/monochromifier/](https://michaelpaulukonis.github.io/monochromifier/)
- **Monorepo:** [https://github.com/michaelpaulukonis/genart-monorepo](https://github.com/michaelpaulukonis/genart-monorepo)
- **Source Code:** [apps/monochromifier/](https://github.com/michaelpaulukonis/genart-monorepo/tree/main/apps/monochromifier)
- **Documentation:** [View in monorepo](https://github.com/michaelpaulukonis/genart-monorepo/tree/main/apps/monochromifier/README.md)

## Development

All development happens in the monorepo. To work on this project:

```bash
git clone https://github.com/michaelpaulukonis/genart-monorepo.git
cd genart-monorepo
pnpm install
nx dev monochromifier
```

## License

This project is open source and available under the [MIT License](LICENSE).
