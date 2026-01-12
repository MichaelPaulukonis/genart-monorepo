# GitHub Copilot Instructions for GenArt Monorepo

## Project Context

This is a **Generative Art and Creative Coding Monorepo** managed with **Nx**. The monorepo contains multiple independent creative coding applications that share common libraries, utilities, and build tooling. Each application focuses on different aspects of generative art, computational design, and interactive visual experiences.

## Technology Stack

When suggesting code, please adhere to the following technologies:

### Monorepo Management
- **Build System**: **Nx** for monorepo orchestration, task running, and caching
- **Package Manager**: **pnpm** with workspaces for efficient dependency management
- **Development Server**: **Vite** for fast development and optimized builds

### Creative Coding
- **Core Library**: **p5.js** for creative coding and generative art
- **p5.js Integration**: **p5js-wrapper** for module-friendly p5.js usage
- **Language**: **JavaScript** and **TypeScript** (varies by project)

### Code Quality & Testing
- **Linting**: **ESLint** with **StandardJS** and **eslint-plugin-p5js** *(Note: Consider modernizing linting setup in future)*
- **Testing**: **Playwright** for end-to-end testing of visual applications
- **Formatting**: Follow StandardJS conventions

### Shared Libraries
- **@genart/p5-utils**: Common p5.js utilities and helper functions
- **@genart/color-palettes**: Color management and palette generation
- **@genart/version-display**: Automated version display components

## 1. Project Structure

Follow the established Nx monorepo structure:

- **`apps/`**: Individual creative coding applications
  - `apps/duo-chrome/`: Duotone image compositions
  - `apps/crude-collage-painter/`: Interactive collage creation tool
  - `apps/computational-collage/`: Algorithmic collage generation
  - `apps/dragline/`: Line-drawing interactions
  - `apps/monochromifier/`: Monochrome image processing
  - `apps/those-shape-things/`: Shape-based generative art
- **`libs/`**: Shared libraries and utilities
  - `libs/p5-utils/`: Common p5.js functions and utilities
  - `libs/color-palettes/`: Color management and RISO printing colors
  - `libs/version-display/`: Automated version display components
- **`tools/`**: Build tools and plugins
  - `tools/vite-plugin-version-constants.js`: Version injection plugin
- **`docs/`**: Monorepo-wide documentation
  - `docs/architecture/`: System architecture documentation
  - `docs/guides/`: Development guides and workflows
  - `docs/plans/`: Project planning documents
- **`scripts/`**: Utility scripts for validation and deployment
- **Individual App Structure**: Each app in `apps/` follows this pattern:
  - `apps/[app-name]/src/`: Application source code
  - `apps/[app-name]/docs/`: App-specific documentation
  - `apps/[app-name]/public/`: Static assets
  - `apps/[app-name]/project.json`: Nx project configuration
  - `apps/[app-name]/package.json`: App-specific dependencies

## 2. Coding Standards

1. Use **ESLint** with **StandardJS** and **eslint-plugin-p5js** for code quality and consistent formatting.
   - *Note: Current linting setup may be outdated. Consider modernizing to newer tools that support p5.js when issues arise or during maintenance.*
2. **Language Flexibility**: While TypeScript is preferred for new projects, individual apps may use JavaScript. Respect existing conventions within each app.
3. Follow consistent naming conventions:
   - Files and folders: `kebab-case` (`sketch.js`, `color-utils.js`, `my-app/`)
   - Variables and functions: `camelCase` (`drawCircle`, `getRandomColor`)
   - Constants: `UPPER_SNAKE_CASE` (`MAX_PARTICLES`, `DEFAULT_SIZE`)
4. **p5.js Sketch Structure**: Follow this pattern for p5.js sketches:
   ```javascript
   import { createNamer } from '@genart/p5-utils'
   import { getPalette } from '@genart/color-palettes'
   
   // Configuration and constants
   const CONFIG = {
     width: 800,
     height: 600,
     backgroundColor: '#ffffff'
   }
   
   // Global variables
   let namer
   let palette
   
   // p5.js setup function
   function setup() {
     createCanvas(CONFIG.width, CONFIG.height)
     namer = createNamer('my-sketch')
     palette = getPalette('riso-red-blue')
     
     // Additional setup
   }
   
   // p5.js draw function
   function draw() {
     background(CONFIG.backgroundColor)
     // Drawing logic
   }
   
   // Event handlers and utility functions
   function keyPressed() {
     if (key === 's') {
       namer.save()
     }
   }
   ```
5. **Shared Library Usage**: Prefer using shared libraries from `libs/` over duplicating code across apps.
6. **Creative Coding Best Practices**:
   - Use deterministic randomness with `randomSeed()` for reproducible results
   - Implement save functionality for generated artworks
   - Include interactive controls where appropriate
   - Document algorithm parameters and artistic intent

### StandardJS Configuration

1. **Semicolons**: No semicolons (StandardJS convention)
2. **Indentation**: 2 spaces
3. **Quotes**: Single quotes for strings
4. **Line Length**: Generally keep under 100 characters
5. **Trailing Commas**: Not required but allowed in modern environments

## 3. Mandatory Planning Process

**CRITICAL**: All development work must follow this planning process before any code implementation.

### Plan-File Requirement

1. **Before Any Code Changes**: ALL feature requests, architectural changes, or significant modifications must begin with creating—or reusing—an appropriate plan-file in `docs/plans/`.
2. **User Confirmation Protocol**: When a user requests changes, first inspect `docs/plans/` for a relevant file. If one exists, ask the user to update it, create a new one, or proceed without one. If none exists, ask the user to create one or proceed without one. Honor the user's choice.
3. **Plan-File Naming Convention**: `NN.semantic-name.md` (e.g., `01.user-comments.md`).
4. **Required Plan Contents**: Problem Statement, Requirements, Technical Approach, Implementation Steps, Testing Strategy, Risks & Mitigation, Dependencies.
4.1 **Use Taskmaster MCP**: Unless directed otherwise, use taskmaster MCP server to parse the plan file (as prd) to create discrete tasks
4.2 **Taskmaster append**: Taskmaster should append new tasks, and not delete existing tasks.
5. **Completed Plans**: When all tasks in a plan have been completed the file will be internally annotated and moved to `docs/plans/completed/`.
5. **Exceptions**: This process is not required for Product Requirement Document creation, documentation updates or minor, single-line bug fixes.

## 4. Nx Monorepo Management

1. **Centralized Commands**: Use Nx commands for consistent development workflow:
   - `nx dev app-name`: Start development server for specific app
   - `nx build app-name`: Build specific app for production
   - `nx run-many --target=dev --all`: Start all apps in development
   - `nx run-many --target=build --all`: Build all apps
   - `nx lint app-name`: Lint specific app
   - `nx test app-name`: Test specific app

2. **Project Configuration**: Each app must have a `project.json` file with proper Nx targets:
   - `dev`: Development server (typically uses Vite)
   - `build`: Production build
   - `lint`: ESLint execution
   - `test`: Playwright tests (if applicable)
   - `deploy`: Deployment target (if applicable)

3. **Port Management**: Each app must use a unique development port:
   - duo-chrome: 5173
   - crude-collage-painter: 5174
   - computational-collage: 5175
   - dragline: 5176
   - monochromifier: 5177
   - those-shape-things: 5178
   - (new projects increment from 5179+)

4. **Dependency Management**: 
   - Use `pnpm` for all package operations
   - Shared dependencies go in root `package.json`
   - App-specific dependencies go in app's `package.json`
   - Shared libraries are consumed via `libs/` workspace references

## 5. Shared Libraries

### @genart/p5-utils
Common utilities for p5.js projects:
- Array manipulation (`getRandomUniqueItem`, `getRandomItem`)
- File naming (`datestring`, `createFilenamer`)
- Math utilities (`mapRange`, `constrain`)
- Canvas utilities and common p5.js patterns

### @genart/color-palettes
Color management for creative projects:
- RISO printing colors (authentic ink colors)
- Custom palette creation and management
- Color conversion utilities (hex ↔ RGB)
- Palette sampling and generation

### @genart/version-display
Automated version display components:
- Consistent version display across all apps
- Automatic version detection and display
- Customizable styling and positioning

1. **Library Development**: When creating shared functionality:
   - Identify common patterns across multiple apps
   - Extract to appropriate library in `libs/`
   - Update consuming apps to use shared code
   - Document the library's API and usage

2. **Library Usage**: Always prefer shared libraries over app-specific implementations for common functionality.

## 6. Individual App Architecture

**Important**: Each app in `apps/` may follow different internal architectures and frameworks. While the end goal is increased code sharing and consistency, projects are allowed to be different to preserve their unique creative approaches.

### Common Patterns Across Apps

1. **Entry Point**: Most apps use `index.html` as the entry point
2. **Build Tool**: Vite is the standard build tool across all apps
3. **Source Structure**: Generally follows `src/` for main code, `css/` for styles, `public/` for assets
4. **Documentation**: Each app maintains its own documentation in `apps/[app-name]/docs/`

### App-Specific Variations

- **Language**: Some apps use JavaScript, others TypeScript
- **Framework**: Most use vanilla p5.js, but may incorporate other libraries
- **Structure**: Internal organization varies based on the app's complexity and purpose
- **Dependencies**: Each app manages its own specific dependencies

### When Working on Apps

1. **Respect Existing Patterns**: When modifying an app, follow its existing conventions
2. **App Documentation**: Refer to `apps/[app-name]/docs/` for app-specific guidelines
3. **Gradual Migration**: If proposing architectural changes, plan gradual migrations rather than major rewrites
4. **Creative Freedom**: Balance consistency with preserving the creative and experimental nature of each project

## 7. Version Management and Releases

1. **Independent Versioning**: Each app maintains its own version using Nx release configuration
2. **Conventional Commits**: Use conventional commit format to drive automatic version bumps:
   - `feat:` for new features (minor version bump)
   - `fix:` for bug fixes (patch version bump)
   - `feat!:` or `BREAKING CHANGE:` for breaking changes (major version bump)
3. **Automatic Changelog**: Each app generates its own `CHANGELOG.md` based on commits
4. **Release Tags**: Git tags follow the pattern `app-name@version` (e.g., `duo-chrome@1.2.0`)
5. **Release Commands**:
   - `nx release --projects=app-name`: Release specific app
   - `nx release`: Release all apps with changes

## 8. Testing Strategy

### Visual Testing with Playwright

1. **End-to-End Testing**: Use Playwright for testing visual applications and user interactions
2. **Screenshot Testing**: Capture and compare visual outputs for regression testing
3. **App-Specific Tests**: Each app can have its own test suite in `tests/` or `e2e/`
4. **Cross-App Testing**: Shared test utilities in `test/` directory

### Test Commands

- `nx test app-name`: Run tests for specific app
- `nx run-many --target=test --all`: Run all tests
- `pnpm test:e2e`: Run end-to-end tests
- `pnpm test:e2e:ui`: Run tests with Playwright UI

### Creative Testing Considerations

- Test interactive features and user controls
- Verify save/export functionality works correctly
- Ensure responsive behavior across different screen sizes
- Test performance with complex generative algorithms

## 9. Documentation Standards

1. **Component Documentation**: Use JSDoc for complex functions and creative algorithms
2. **Architecture Documentation**: Maintain high-level architecture documents in `docs/architecture/`
3. **Plan Files**: All major changes must be documented in a plan file in `docs/plans/` as per the planning process
4. **App-Specific Documentation**: Each app maintains documentation in `apps/[app-name]/docs/`
5. **Creative Documentation**: Document artistic intent, algorithm parameters, and interaction patterns
6. **README Files**: Each app should have a comprehensive README explaining its purpose and usage

## 10. Git Commits 

### **Mandatory Git Commit Workflow**

When you are asked to create a commit, you **MUST** follow these steps in order:

1.  **Analyze Changes:** Run `git status` and `git diff --staged` to understand the modifications (unless `status` output provided by user).
2.  **Evaluate for Changelog:** Review the changes against the criteria in `.github/changelog-management.md`.
3.  **Determine Changelog Type:** Classify changes using the hybrid changelog system:
    - **Monorepo Changelog** (`/CHANGELOG.md`): Infrastructure, shared libraries, Nx config, build tools, cross-app changes
    - **App Changelog** (`apps/[app]/CHANGELOG.md`): App-specific features, fixes, UI changes
4.  **Ask About Changelog:** If the changes meet the criteria (e.g., new features, UI changes, bug fixes), you **MUST** ask the user: "Should I create a changelog entry for these changes?" You may also provide advice on whether an entry seems warranted and which changelog it should go to.
5.  **Create Changelog (if approved):** If the user agrees, update the appropriate changelog(s) according to the hybrid system.
6.  **Propose Commit Message:** After handling the changelog, draft a commit message that follows the Conventional Commits specification. **STOP HERE and wait for explicit user approval.**
7.  **Wait for Manual Approval:** You **MUST** wait for the user to explicitly approve the commit message and confirm they have tested the changes. **DO NOT proceed to commit without this explicit approval.** The user may need to manually test, review, or modify the code before committing.
8.  **Commit Changes (only after approval):** **ONLY AFTER** the user has given explicit approval, stage the `CHANGELOG.md` file (if modified) and run `git commit` with the approved message. **NEVER commit autonomously.**

### See `./changelog-management.md` for detailed instructions on pre-commit changelog rules.

### Commit Message Guidelines for Hybrid Changelogs

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification with these scope patterns for proper changelog routing:

#### **Monorepo Changelog Routing**
Use these scopes and keywords to route changes to the workspace changelog:

```bash
# Infrastructure and build changes
feat(monorepo): implement hybrid changelog generation system
fix(nx): resolve workspace release configuration conflicts
chore(build): update Vite configuration for all apps
docs(workspace): update development workflow guidelines

# Shared library changes  
feat(libs/p5-utils): add pressure-sensitive drawing utilities
fix(libs/color-palettes): resolve RISO color mapping issue
perf(libs/version-display): optimize component rendering

# Cross-app improvements
feat(workspace): add automated screenshot generation
fix(monorepo): resolve inter-app dependency issues
chore(release): update version bump automation
```

#### **App Changelog Routing**
Use app names in scope for app-specific changes:

```bash
# App-specific features and fixes
feat(duo-chrome): add color inversion feature  
fix(dragline): resolve mouse tracking accuracy issues
perf(computational-collage): optimize image processing
docs(crude-collage): update user interaction guide

# App-specific UI and functionality
feat(monochromifier): add save-as-transparent option
fix(those-shape-things): resolve shape rotation bug
style(duo-chrome): improve responsive layout
```

#### **Edge Cases and Multi-Area Changes**
For changes affecting both shared components and specific apps:

```bash
# Primary impact determines changelog (shared lib = monorepo)
feat(libs/p5-utils): add drawing function, update duo-chrome integration

# Breaking changes affecting multiple apps
feat(monorepo)!: update shared color palette API across all apps

# Documentation spanning multiple areas  
docs(monorepo): update app integration workflow and examples
```

#### **Commit Message Best Practices**

1. **Use Descriptive Scopes**: Choose scopes that clearly indicate the area of impact
2. **Include Keywords**: For monorepo routing, include infrastructure keywords in commit messages
3. **Be Specific**: Avoid generic scopes like "misc" or "various"
4. **Conventional Format**: Always follow `type(scope): description` format
5. **Breaking Changes**: Use `!` or `BREAKING CHANGE:` footer for major changes

#### **Examples by Change Type**

| Change Type | Scope Pattern | Example |
|-------------|---------------|---------|
| New shared library | `libs/[library-name]` | `feat(libs/p5-utils): add canvas export utilities` |
| Nx configuration | `nx`, `workspace`, `monorepo` | `feat(nx): add workspace changelog support` |
| Build system | `build`, `ci`, `deploy` | `fix(build): resolve Vite configuration conflicts` |
| Documentation | `docs(monorepo)` or `docs(app-name)` | `docs(monorepo): update hybrid changelog workflow` |
| App feature | `app-name` | `feat(duo-chrome): implement layer system` |
| App bug fix | `app-name` | `fix(crude-collage): resolve canvas resize issues` |
| Cross-app change | `monorepo`, `workspace` | `feat(monorepo): standardize version display across apps` |

## 11. Error Handling

1. **Graceful Degradation**: Creative apps should handle errors gracefully without breaking the user experience
2. **Console Logging**: Use consistent logging for debugging generative algorithms
3. **User Feedback**: Provide clear feedback when save operations or exports fail
4. **Canvas Error Recovery**: Implement fallback mechanisms for p5.js canvas issues

## 12. Deployment

### GitHub Pages
- Each app can be deployed independently to GitHub Pages
- Use the deployment scripts in `scripts/` for automated deployment
- Follow the guides in `docs/deployment/` for setup instructions

### Build Process
- `nx build app-name`: Build specific app for production
- `nx run-many --target=build --all`: Build all apps
- Each app outputs to `dist/apps/[app-name]/`

### Asset Management
- Static assets go in `apps/[app-name]/public/`
- Generated screenshots and exports are typically excluded from version control
- Use `.gitignore` appropriately for build artifacts and generated content

---
*These instructions should be followed to ensure consistency, maintainability, and quality across the GenArt monorepo codebase.*
