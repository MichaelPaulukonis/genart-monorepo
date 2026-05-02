## 0.8.0 (2026-03-21)

### 🚀 Features

- **monochromifier:** add About screen and createModal() factory ([8d73927](https://github.com/MichaelPaulukonis/genart-monorepo/commit/8d73927))

### ❤️ Thank You

- Michael Paul Ukonis

## [Unreleased]

### Added
- **monochromifier:** Ctrl+S saves directly to `~/projects/images/genart-output/` when local save server is running; falls back silently to browser download when server is absent or unreachable
- **monochromifier:** About screen with app description, usage summary, and links to GitHub and author homepage
- **monochromifier:** first-visit auto-show for About screen (localStorage, no consent required)
- **monochromifier:** `a` key toggles About screen; Help and About close each other via conflict resolution
- **monochromifier:** `createModal()` factory in `infobox.js` — shared pattern for draggable overlays with mutual conflict resolution; documented in `docs/guides/modal-factory-pattern.md`
- **monochromifier:** migrate canvas OSD status text to HTML control panels (View, Image Controls, Edit Controls) with two-way sync to all existing keyboard shortcuts
- **monochromifier:** View panel shows live mode/zoom/pan status and minimap toggle
- **monochromifier:** Image Controls panel exposes threshold slider, invert, transparency, and auto-crop toggles
- **monochromifier:** Edit Controls panel exposes tool selection, erase mode, and brush size slider

### Fixed
- **monochromifier:** arrow keys no longer scroll the browser page when used for threshold/zoom adjustment
- **monochromifier:** toggling invert no longer turns the canvas background black
- **monochromifier:** drag handle label and collapse button text contrast raised to meet WCAG AA (4.5:1)
- **monochromifier:** control panels wrapped in `<aside>` landmark for screen reader navigation
- **monochromifier:** modal `<footer>` elements marked `role="none"` to prevent duplicate contentinfo landmarks
- **monochromifier:** inactive custom-weight value outputs hidden to avoid low-contrast dimmed text

## 0.7.0 (2026-03-20)

### 🚀 Features

- **monochromifier:** add collapsible panels with inline enable toggles ([65886c0](https://github.com/MichaelPaulukonis/genart-monorepo/commit/65886c0))
- **monochromifier:** add grayscale channel-mode system and sidebar layout ([d338e13](https://github.com/MichaelPaulukonis/genart-monorepo/commit/d338e13))
- **monochromifier:** finalize halftone effects and implement UI event protection ([72cb3cf](https://github.com/MichaelPaulukonis/genart-monorepo/commit/72cb3cf))
- **monochromifier:** implement halftone effects with WebGL shaders ([5d05540](https://github.com/MichaelPaulukonis/genart-monorepo/commit/5d05540))
- **monochromifier:** implement p5.js WEBGL mode for GPU-accelerated image processing ([dba5563](https://github.com/MichaelPaulukonis/genart-monorepo/commit/dba5563))
- **duo-chrome:** implement theme management and A/B assignment ([#8](https://github.com/MichaelPaulukonis/genart-monorepo/issues/8), [#5](https://github.com/MichaelPaulukonis/genart-monorepo/issues/5))
- **duo-chrome:** fix broken tests and implement enhanced image filtering ([#10](https://github.com/MichaelPaulukonis/genart-monorepo/issues/10), [#4](https://github.com/MichaelPaulukonis/genart-monorepo/issues/4))
- fix deployment issues ([2d9189b](https://github.com/MichaelPaulukonis/genart-monorepo/commit/2d9189b))

### 🩹 Fixes

- **monochromifier:** correct paint order and halftone dot clipping ([2e380a4](https://github.com/MichaelPaulukonis/genart-monorepo/commit/2e380a4))
- **monochromifier:** fix paint layer compositing in WebGL shaders ([26d0e9d](https://github.com/MichaelPaulukonis/genart-monorepo/commit/26d0e9d))
- **monochromifier:** prevent UI interaction from bleeding through to canvas ([7f08592](https://github.com/MichaelPaulukonis/genart-monorepo/commit/7f08592))
- **duo-chrome:** resolve loop panel event propagation and playback issues ([2e1d798](https://github.com/MichaelPaulukonis/genart-monorepo/commit/2e1d798))

### ❤️ Thank You

- Michael Paul Ukonis
- MichaelPaulukonis

## [Unreleased]

### Added
- **monochromifier:** collapsible control panels (Grid, Halftone, Color Mode) with collapsed state persisted to localStorage
- **monochromifier:** draggable control panels — reposition anywhere on screen
- **monochromifier:** halftone effect panel with pattern, size/frequency, and angle controls
- **monochromifier:** grayscale channel-mode panel with custom RGB weight sliders
- **monochromifier:** panel heading rows — section title and enable checkbox share one line, reducing visual redundancy while preserving screen-reader accessibility via `aria-labelledby`

## 0.6.0 (2025-12-30)

### 🚀 Features

- **monochromifier:** post-crop code cleanup + links added to help also updated a screenshot ([b619a15](https://github.com/MichaelPaulukonis/genart-monorepo/commit/b619a15))
- **monochromifier:** exiting/resetting crop mode stays in edit mode Added some tasks. ([30c46d4](https://github.com/MichaelPaulukonis/genart-monorepo/commit/30c46d4))
- **monochromifier:** add 'r' shortcut to reset crop selection ([67e006f](https://github.com/MichaelPaulukonis/genart-monorepo/commit/67e006f))
- fix color and size, version update ([e9f5793](https://github.com/MichaelPaulukonis/genart-monorepo/commit/e9f5793))
- **monochromifier:** enhance crop tool and grid overlay ([cd52bce](https://github.com/MichaelPaulukonis/genart-monorepo/commit/cd52bce))
- **monochromifier:** implement configurable grid overlay with draggable controls ([5db4a8e](https://github.com/MichaelPaulukonis/genart-monorepo/commit/5db4a8e))
- **monochromifier:** convert help screen to HTML ([22c08f0](https://github.com/MichaelPaulukonis/genart-monorepo/commit/22c08f0))
- **duo-chrome:** add comprehensive history system with filmstrip navigation ([#35](https://github.com/MichaelPaulukonis/genart-monorepo/issues/35))
- **testing:** Standardize Playwright E2E testing across apps ([#54](https://github.com/MichaelPaulukonis/genart-monorepo/issues/54), [#39](https://github.com/MichaelPaulukonis/genart-monorepo/issues/39))

### ❤️ Thank You

- MichaelPaulukonis

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
