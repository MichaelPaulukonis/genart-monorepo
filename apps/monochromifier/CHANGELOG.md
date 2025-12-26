## 0.5.0 (2025-11-10)

### 🚀 Features

- **monochromifier:** Redesign fit methods, zoom, and autocrop interaction ([#64](https://github.com/MichaelPaulukonis/genart-monorepo/issues/64))

## 0.4.0 (2025-11-10)

### 🚀 Features

- Implement whitelist-based image validation and feedback ([1cc1562d](https://github.com/MichaelPaulukonis/genart-monorepo/commit/1cc1562d))
- **monochromifier:** Refactor image manipulation with camera object ([793afdb7](https://github.com/MichaelPaulukonis/genart-monorepo/commit/793afdb7))
- **monochromifier:** Implement crop feature and improve image processing ([6c48a416](https://github.com/MichaelPaulukonis/genart-monorepo/commit/6c48a416))
- Implement URL sharing and improve testing infrastructure ([b3a04718](https://github.com/MichaelPaulukonis/genart-monorepo/commit/b3a04718))

### 🩹 Fixes

- **monochromifier:** Enforce integer math for pixel calculations ([041879a4](https://github.com/MichaelPaulukonis/genart-monorepo/commit/041879a4))
- **monochromifier:** apply fixes for post-crop preview and fit mode ([40009850](https://github.com/MichaelPaulukonis/genart-monorepo/commit/40009850))
- **nx:** resolve release configuration conflicts across all apps ([22f7de53](https://github.com/MichaelPaulukonis/genart-monorepo/commit/22f7de53))

## 0.3.0 (2025-11-04)

### 🚀 Features

- **monochromifier:** implement click-and-drag source image repositioning with OSD (On-Screen Display)
  - Add interactive image dragging outside of paint mode
  - Implement OSD showing original image thumbnail with highlighted viewport rectangle
  - Add boundary constraints ensuring minimum 25% image visibility
  - Include keyboard controls: 'o' to toggle OSD, 'd' to reset drag position
  - Support zoom-aware viewport calculations and drag offset tracking
  - Add visual feedback with red border during drag operations
  - add version display in help screen accessible via '?' key
  - complete monorepo-wide version display implementation across all apps

### 🩹 Fixes

- **monochromifier:** fix transparency export regression where inverted images saved as normal
  - Remove double-inversion logic in createSaveImage function
  - Ensure transparency mode correctly exports inverted images
  - Fix white/black pixel transparency mapping for inverted mode

### 🧹 Code Quality

- **monochromifier:** fix StandardJS linting issues (semicolons, function spacing)
- **monochromifier:** integrate shared version display CSS library for consistency

## 0.2.0 (2025-10-28)

### 🚀 Features

- **monochromifier:** add save-as-transparent option with proper invert mode support ([#37](https://github.com/MichaelPaulukonis/genart-monorepo/issues/37))

### 🩹 Fixes

- resolve nx release configuration conflicts for proper versioning ([0dbd2db0](https://github.com/MichaelPaulukonis/genart-monorepo/commit/0dbd2db0))
- **monochromifier:** add missing version management to release-deploy target ([147b702c](https://github.com/MichaelPaulukonis/genart-monorepo/commit/147b702c))
- **monochromifier:** resolve Nx Vite executor build issues and update documentation ([b430e3be](https://github.com/MichaelPaulukonis/genart-monorepo/commit/b430e3be))
