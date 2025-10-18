# Implementation Plan

**Note**: During implementation, we pivoted to use Nx Release with independent versioning instead of manual npm scripts. See [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for details.

## Final Implementation (Nx Release Approach)

- [x] 1. Configure Nx Release with independent versioning
  - Configure nx.json with independent project relationship
  - Enable conventional commits for automatic version detection
  - Set up project changelogs and custom git tag patterns
  - _Replaces original tasks 1.x and 2.x with superior solution_

- [x] 2. Create release-deploy targets for integrated workflow
  - Add release-deploy targets to all project.json files
  - Integrate Nx Release with existing GitHub Pages deployment
  - Use npx gh-pages for shared dependency management
  - _Provides better integration than original manual approach_

- [x] 3. Optimize shared dependencies
  - Move gh-pages to root level as shared dependency
  - Update all deployment commands to use npx gh-pages
  - Remove duplicate dependencies from individual apps
  - _Improves monorepo dependency management_

- [x] 4. Create comprehensive documentation
  - Complete version management guide with Nx Release
  - Quick reference for common workflows
  - Real-world workflow examples and scenarios
  - Update README with new version management system
  - _Exceeds original documentation requirements_

## Original Plan (Superseded)

- [x] 1.1 Update duo-chrome package.json with version scripts

  - Add "bump": "npm version patch" script
  - Add "prepublish": "npm run bump" script
  - Add "version-publish": "npm run prepublish && npm publish" script (avoid conflict with existing publish)
  - _Requirements: 1.1, 1.2, 1.5, 3.1, 3.2, 3.5_

- [x] 1.2 Update crude-collage-painter package.json with version scripts

  - Add "bump": "npm version patch" script
  - Add "prepublish": "npm run bump" script
  - Rename existing "publish" to "deploy" to avoid conflicts
  - Add "version-publish": "npm run prepublish && npm publish" script
  - _Requirements: 1.1, 1.2, 1.5, 3.1, 3.2, 3.5_

- [x] 1.3 Update those-shape-things package.json with version scripts

  - Add "bump": "npm version patch" script
  - Add "prepublish": "npm run bump" script
  - Add "version-publish": "npm run prepublish && npm publish" script
  - _Requirements: 1.1, 1.2, 1.5, 3.1, 3.2, 3.5_

- [x] 1.4 Update computational-collage package.json with version scripts

  - Add "bump": "npm version patch" script
  - Add "prepublish": "npm run bump" script
  - Add "version-publish": "npm run prepublish && npm publish" script
  - _Requirements: 1.1, 1.2, 1.5, 3.1, 3.2, 3.5_

- [x] 1.5 Update dragline package.json with version scripts

  - Add "bump": "npm version patch" script
  - Add "prepublish": "npm run bump" script
  - Add "version-publish": "npm run prepublish && npm publish" script
  - _Requirements: 1.1, 1.2, 1.5, 3.1, 3.2, 3.5_

- [ ] 2. Add Nx publish targets to project.json files

  - Create publish targets using nx:run-commands executor for all apps
  - Set appropriate working directories and commands
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.1 Add publish target to duo-chrome project.json

  - Create publish target using nx:run-commands executor
  - Set command to "npm version patch && npm publish"
  - Set cwd to "apps/duo-chrome"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.2 Add publish target to crude-collage-painter project.json

  - Create publish target using nx:run-commands executor
  - Set command to "npm version patch && npm publish"
  - Set cwd to "apps/crude-collage-painter"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.3 Add publish target to those-shape-things project.json

  - Create publish target using nx:run-commands executor
  - Set command to "npm version patch && npm publish"
  - Set cwd to "apps/those-shape-things"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.4 Create project.json for computational-collage and add publish target

  - Create missing project.json file following the pattern of other apps
  - Add standard Nx targets (dev, build, preview, lint, deploy)
  - Add publish target using nx:run-commands executor
  - Set command to "npm version patch && npm publish"
  - Set cwd to "apps/computational-collage"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.5 Add publish target to dragline project.json

  - Create publish target using nx:run-commands executor
  - Set command to "npm version patch && npm publish"
  - Set cwd to "apps/dragline"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Test version management implementation

  - Test both npm scripts and Nx targets approaches
  - Verify version increments and git tag creation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [ ] 3.1 Test npm scripts approach with one app

  - Navigate to app directory and run npm run version-publish
  - Verify version increments in package.json
  - Verify git tag is created
  - Verify package publishes successfully (or dry-run if not publishing to registry)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3.2 Test Nx targets approach with one app

  - Run nx run appname:publish from monorepo root
  - Verify version increments in package.json
  - Verify git tag is created
  - Verify package publishes successfully (or dry-run if not publishing to registry)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]\* 3.3 Test error scenarios

  - Test with dirty git working directory
  - Test with existing version tag
  - Test with network issues during publish
  - Verify appropriate error messages are shown
  - _Requirements: 1.1, 2.1_

- [ ] 4. Create documentation and usage examples

  - Document both approaches with clear examples
  - Add troubleshooting and version referencing guidance
  - _Requirements: 1.4, 2.5, 3.4_

- [ ] 4.1 Update README with version management instructions

  - Document npm scripts approach with examples
  - Document Nx targets approach with examples
  - Add section on changing version types (patch/minor/major)
  - Include troubleshooting section for common issues
  - _Requirements: 1.4, 2.5, 3.4_

- [ ] 4.2 Add code examples for version referencing

  - Show how to import version from package.json in app code
  - Add example of displaying version in app UI
  - Document best practices for version usage
  - _Requirements: 1.4_

- [ ]\* 5.1 Add version type configuration options

  - Create helper scripts for minor and major version bumps
  - Add npm scripts for different version types
  - Document when to use each version type
  - _Requirements: 1.2, 3.4_

- [ ]\* 5.2 Add CI/CD integration examples
  - Create example GitHub Actions workflow
  - Document automated publishing strategies
  - Add examples for different deployment scenarios
  - _Requirements: 2.5_
