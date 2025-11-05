## 0.4.0 (2025-11-04)

### 🚀 Features

- **monochromifier:** implement click-and-drag source image repositioning with OSD (On-Screen Display)
  - Add interactive image dragging outside of paint mode
  - Implement OSD showing original image thumbnail with highlighted viewport rectangle
  - Add boundary constraints ensuring minimum 25% image visibility
  - Include keyboard controls: 'o' to toggle OSD, 'd' to reset drag position
  - Support zoom-aware viewport calculations and drag offset tracking
  - Add visual feedback with red border during drag operations

## 0.3.0 (2025-11-04)

### 🚀 Features

- **monochromifier:** add version display in help screen accessible via '?' key
- **monochromifier:** complete monorepo-wide version display implementation across all apps

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

### ❤️ Thank You

- MichaelPaulukonis