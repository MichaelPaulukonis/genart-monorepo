# Requirements Document

## Introduction

This feature involves importing the existing dragline project (an interactive poem-machine that creates draggable text landscapes) into the genart-monorepo. Dragline is a p5.js-based application that scatters monospaced text blocks across a canvas, allowing users to rearrange them into new compositions. The project currently exists as a standalone repository and needs to be integrated into the monorepo structure while preserving all functionality, maintaining consistency with existing apps, and adapting to the Nx build system.

## Requirements

### Requirement 1: Project Structure Migration

**User Story:** As a developer, I want dragline to follow the monorepo's standard application structure, so that it's consistent with other apps and easy to maintain.

#### Acceptance Criteria

1. WHEN the dragline project is imported THEN it SHALL be placed in the `apps/dragline/` directory
2. WHEN the project structure is created THEN it SHALL follow the standard app structure with `src/`, `css/`, `public/`, `index.html`, `package.json`, `project.json`, `vite.config.js`, and `README.md`
3. WHEN source files are migrated THEN all JavaScript files from `src/` SHALL be preserved with their original functionality
4. WHEN CSS files are migrated THEN both `style.css` and `infobox.css` SHALL be placed in the `css/` directory
5. WHEN public assets are migrated THEN `favicon.ico` and `saxmono.ttf` SHALL be placed in the `public/` directory
6. WHEN the migration is complete THEN the `text-grid/` subdirectory structure SHALL be preserved within `src/`

### Requirement 2: Nx Integration

**User Story:** As a developer, I want dragline to integrate with the Nx build system, so that it can be built, developed, and deployed using monorepo commands.

#### Acceptance Criteria

1. WHEN Nx configuration is added THEN a `project.json` file SHALL be created with `dev`, `build`, `lint`, and `preview` targets
2. WHEN the dev target is configured THEN it SHALL use port 5177 to avoid conflicts with existing apps
3. WHEN the build target is configured THEN it SHALL output to `dist/apps/dragline`
4. WHEN Nx commands are executed THEN `nx dev dragline`, `nx build dragline`, and `nx lint dragline` SHALL work correctly
5. WHEN the project is integrated THEN it SHALL appear in the Nx dependency graph

### Requirement 3: Vite Configuration Adaptation

**User Story:** As a developer, I want the Vite configuration to work within the monorepo context, so that the app builds and runs correctly.

#### Acceptance Criteria

1. WHEN the Vite config is adapted THEN the `base` path SHALL be updated from `/dragline/` to `/` for local development
2. WHEN the Vite config is created THEN it SHALL specify the correct port (5177) in the server configuration
3. WHEN the build configuration is set THEN it SHALL maintain the `esnext` target for modern JavaScript features
4. WHEN the Vite config is complete THEN it SHALL include proper path resolution for the monorepo structure

### Requirement 4: Dependency Management

**User Story:** As a developer, I want dragline's dependencies to be properly managed within the monorepo, so that there are no conflicts and shared dependencies are reused.

#### Acceptance Criteria

1. WHEN dependencies are configured THEN `p5`, `p5js-wrapper`, and `axios` SHALL be listed in the app's `package.json`
2. WHEN dev dependencies are reviewed THEN build tools SHALL be inherited from the root workspace where possible
3. WHEN the package.json is created THEN it SHALL include the app name as `@genart/dragline`
4. WHEN dependencies are installed THEN pnpm SHALL resolve them correctly within the workspace

### Requirement 5: Documentation Migration

**User Story:** As a user, I want to understand what dragline does and how to use it, so that I can interact with the application effectively.

#### Acceptance Criteria

1. WHEN the README is migrated THEN it SHALL be adapted to reflect the monorepo context
2. WHEN documentation is updated THEN monorepo-specific commands SHALL replace standalone commands (e.g., `nx dev dragline` instead of `npm run dev`)
3. WHEN the README is complete THEN it SHALL include the project description, features, and usage instructions
4. WHEN additional documentation exists THEN the `docs/` directory SHALL be preserved within the app folder

### Requirement 6: Functionality Preservation

**User Story:** As a user, I want all dragline features to work exactly as they did in the standalone version, so that no functionality is lost during migration.

#### Acceptance Criteria

1. WHEN the app runs THEN users SHALL be able to drag and rearrange text blocks
2. WHEN keyboard shortcuts are used THEN all documented interactions (arrow keys, shift combinations, space, etc.) SHALL work correctly
3. WHEN the Tumblr API is called THEN it SHALL fetch text successfully or fall back to local JSON files
4. WHEN selection mode is activated THEN users SHALL be able to crop and save regions of the canvas
5. WHEN save functionality is used THEN PNG exports SHALL be generated with correct timestamps
6. WHEN the info box is toggled THEN it SHALL display and hide correctly

### Requirement 7: Asset and Resource Handling

**User Story:** As a developer, I want all assets and resources to be properly referenced, so that the app loads and displays correctly.

#### Acceptance Criteria

1. WHEN the HTML file is updated THEN all script and style references SHALL use correct paths for the monorepo structure
2. WHEN the custom font is loaded THEN `saxmono.ttf` SHALL be accessible from the public directory
3. WHEN the favicon is loaded THEN it SHALL display correctly in the browser tab
4. WHEN fallback JSON files are referenced THEN they SHALL be accessible from the correct paths

### Requirement 8: Build and Deployment Configuration

**User Story:** As a developer, I want dragline to build correctly for production and maintain its existing GitHub Pages deployment, so that it continues to be accessible at its current URL.

#### Acceptance Criteria

1. WHEN the production build runs THEN it SHALL generate optimized output in the dist directory
2. WHEN the build is complete THEN all assets SHALL be properly bundled and referenced
3. WHEN the preview command runs THEN the built app SHALL be viewable locally
4. WHEN deployment is configured THEN it SHALL maintain the ability to deploy to the original dragline repository's GitHub Pages at `michaelpaulukonis.github.io/dragline`
5. WHEN the Vite base path is set for production THEN it SHALL use `/dragline/` to match the GitHub Pages subdirectory structure
6. WHEN deployment scripts are added THEN they SHALL use `gh-pages` to push the built app to the appropriate repository
