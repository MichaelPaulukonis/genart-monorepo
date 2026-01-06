# GenArt Monorepo Tech Stack

## Core Language & Runtime
- **Language:** JavaScript (ES6+)
- **Runtime Environment:** Web Browser
- **Package Manager:** pnpm

## Workspace & Build Tooling
- **Monorepo Management:** Nx (Independent Versioning)
- **Build Tool:** Vite
- **Development Server:** Vite Dev Server (via Nx targets)

## Generative Art Stack
- **Primary Library:** p5.js
- **UI Controls:** Tweakpane (Standardized for parameter adjustment)
- **Shared Utilities:** Custom internal libraries (@genart/p5-utils, @genart/color-palettes)

## Testing & Quality Assurance
- **End-to-End Testing:** Playwright
- **Unit/Integration Testing:** Vitest
- **Code Linting:** StandardJS / ESLint

## Deployment & Infrastructure
- **Hosting:** GitHub Pages
- **Deployment Scripting:** gh-pages
