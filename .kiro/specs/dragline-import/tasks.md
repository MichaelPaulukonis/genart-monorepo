# Implementation Plan

- [x] 1. Create directory structure and copy source files
  - Create `apps/dragline/` directory with standard subdirectories (src/, css/, public/, docs/)
  - Copy all JavaScript files from external project's `src/` to `apps/dragline/src/` preserving structure
  - Copy CSS files to `apps/dragline/css/`
  - Copy public assets (favicon.ico, saxmono.ttf) to `apps/dragline/public/`
  - Copy documentation from `docs/` to `apps/dragline/docs/`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Create configuration files
  - [x] 2.1 Create package.json with app metadata and dependencies
    - Set name to `@genart/dragline`
    - Include p5, p5js-wrapper, axios as dependencies
    - Include gh-pages as devDependency
    - _Requirements: 4.1, 4.3_
  
  - [x] 2.2 Create project.json with Nx targets
    - Configure dev target with port 5177
    - Configure build target with output to `dist/apps/dragline`
    - Configure preview target
    - Configure lint target
    - Add deploy target using gh-pages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.4, 8.6_
  
  - [x] 2.3 Create vite.config.js with monorepo-specific settings
    - Set base path conditionally (`/dragline/` for production, `/` for dev)
    - Configure server port to 5177
    - Set build output directory to `../../dist/apps/dragline`
    - Maintain esnext target
    - Configure proper path resolution
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.5_

- [x] 3. Adapt HTML entry point
  - Copy index.html to `apps/dragline/`
  - Update script paths to reference `/src/dragline.js` and `/src/infobox.js`
  - Verify favicon reference points to `/favicon.ico`
  - Ensure all paths work with Vite's module resolution
  - _Requirements: 7.1_

- [x] 4. Update documentation
  - Copy README.md to `apps/dragline/`
  - Replace standalone commands with monorepo equivalents (nx dev dragline, nx build dragline, etc.)
  - Update installation instructions to reference monorepo setup
  - Add note about deployment to original repository
  - Preserve feature descriptions and usage instructions
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 5. Install and verify dependencies
  - Run `pnpm install` at workspace root
  - Verify p5 and p5js-wrapper are available
  - Verify axios is installed
  - Check that gh-pages is available for deployment
  - _Requirements: 4.2, 4.4_

- [x] 6. Test development server
  - Start dev server with `nx dev dragline`
  - Verify app loads at localhost:5177
  - Test that canvas renders correctly
  - Verify custom font (saxmono.ttf) loads
  - Check that info box displays and toggles
  - _Requirements: 2.4, 7.2, 7.3_

- [x] 7. Verify core functionality
  - [x] 7.1 Test block interaction
    - Verify blocks can be dragged with mouse
    - Test arrow key movement of selected blocks
    - Verify block selection with Shift + Left/Right
    - Test z-index changes with Shift + Up/Down
    - _Requirements: 6.1_
  
  - [x] 7.2 Test keyboard shortcuts
    - Verify Space cycles fill characters
    - Test Delete/Backspace removes selected block
    - Verify Right arrow adds new block
    - Test Left arrow removes most recent block
    - Verify 'r' resets layout
    - Test 'n' fetches new blocks
    - Verify 'i' and Escape toggle info box
    - _Requirements: 6.2_
  
  - [x] 7.3 Test Tumblr integration
    - Verify Tumblr API calls work (or fail gracefully)
    - Test fallback to local JSON files
    - Verify blocks populate from fetched data
    - _Requirements: 6.3, 7.4_
  
  - [x] 7.4 Test selection and save functionality
    - Enter selection mode with Option/Alt + Shift + S
    - Test selection movement with arrow keys
    - Verify Shift + arrow moves selection by 2 cells
    - Test saving selection with Shift + S or Enter
    - Verify full canvas save with Shift + S (when not in selection mode)
    - Check that PNG files are generated with correct timestamps
    - _Requirements: 6.4, 6.5_

- [x] 8. Test production build
  - Run `nx build dragline`
  - Verify build completes without errors
  - Check that dist/apps/dragline contains all necessary files
  - Verify assets are properly bundled
  - Test preview with `nx preview dragline`
  - Confirm app works correctly from built files
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 9. Configure and test deployment
  - Verify gh-pages package is available
  - Test deploy command: `nx deploy dragline`
  - Confirm files are pushed to original dragline repository
  - Verify deployment to gh-pages branch
  - Check live site at michaelpaulukonis.github.io/dragline
  - _Requirements: 8.4, 8.6_

- [x] 10. Verify Nx integration
  - Run `nx graph` and confirm dragline appears
  - Test `nx lint dragline` (configure if needed)
  - Verify `nx affected:build` includes dragline when appropriate
  - Confirm project appears in Nx project list
  - _Requirements: 2.5_

- [x] 11. Final verification and cleanup
  - Run through complete user workflow (load, drag, save, etc.)
  - Verify no console errors in browser
  - Check that all requirements are met
  - Update root README if needed to include dragline
  - Verify all documentation is accurate
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
