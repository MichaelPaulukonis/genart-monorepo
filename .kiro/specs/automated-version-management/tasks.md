# Implementation Plan

- [x] 1. Fix nx.json configuration to resolve git conflicts

  - Update nx.json to move git configuration from changelog section to top-level release.git
  - Remove granular git configuration that conflicts with top-level release commands
  - Preserve existing independent project relationships and conventional commits settings
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Update duo-chrome project configuration

  - [x] 2.1 Modify duo-chrome project.json release-deploy target to use nx release subcommands

    - Replace single `nx release --projects=duo-chrome` with separate version and changelog commands
    - Maintain proper command sequencing with parallel: false
    - Preserve existing build dependency and GitHub Pages deployment
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Test duo-chrome release-deploy target functionality
    - Execute dry-run to verify configuration changes work correctly
    - Validate that version bumping and changelog generation function properly
    - Confirm GitHub Pages deployment still works with updated commands
    - _Requirements: 1.1, 1.5, 3.3_

- [x] 3. Update remaining app configurations

  - [x] 3.1 Update crude-collage-painter project.json with corrected release-deploy target

    - Replace `nx release --projects=crude-collage-painter` with separate version and changelog commands
    - Apply same subcommand structure as duo-chrome
    - Maintain build dependencies and deployment configuration
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.2 Update those-shape-things project.json with corrected release-deploy target

    - Replace `nx release --projects=those-shape-things` with separate version and changelog commands
    - Apply same subcommand structure as other apps
    - Ensure consistent target configuration across all apps
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.3 Update computational-collage project.json with corrected release-deploy target

    - Replace `nx release --projects=computational-collage` with separate version and changelog commands
    - Apply same subcommand structure as other apps
    - Verify all apps have consistent release-deploy target structure
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.4 Update dragline project.json with corrected release-deploy target
    - Replace `nx release --projects=dragline` with separate version and changelog commands
    - Apply same subcommand structure as other apps
    - Complete consistent configuration across all monorepo apps
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 4. Update documentation and validation

  - [x] 4.1 Update version-and-deploy.md with corrected commands and troubleshooting

    - Replace incorrect `nx release --projects=app-name` examples with working subcommand syntax
    - Add troubleshooting section for the specific git configuration conflict error
    - Include validation steps to verify successful releases and deployments
    - Update quick reference commands to reflect corrected implementation
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 4.2 Add comprehensive examples for single and multi-app workflows
    - Document corrected single-app release process using subcommands
    - Provide examples for releasing multiple apps with updated configuration
    - Include dry-run examples for testing changes before execution
    - Document relationship between conventional commits and version increments
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 5. Validation and testing

  - [ ] 5.1 Perform end-to-end testing of corrected release system

    - Test single-app release workflow with one application
    - Verify git tagging and changelog generation work correctly
    - Confirm GitHub Pages deployment functions with updated commands
    - Validate that conventional commits trigger appropriate version bumps
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.3_

  - [ ] 5.2 Create integration tests for release-deploy targets
    - Write automated tests to verify release-deploy target functionality
    - Test error handling for common failure scenarios
    - Validate configuration changes don't break existing functionality
    - _Requirements: 1.5, 3.3_

- [x] 6. Document new app setup process

  - [x] 6.1 Create comprehensive new app setup guide

    - Document step-by-step process for adding automated versioning to new apps
    - Include project.json configuration template with release-deploy target
    - Provide GitHub repository setup requirements and naming conventions
    - Document first release process using --first-release flag
    - Include troubleshooting section for common new app setup issues
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 6.2 Create project.json template for new apps

    - Design reusable project.json template with automated version management
    - Include parameterized release-deploy target configuration
    - Document required customizations (app name, port, repository URL)
    - Provide validation checklist for new app configuration
    - _Requirements: 3.1, 3.2, 4.1_

  - [x] 6.3 Document integration with existing monorepo workflow

    - Explain how new apps inherit nx.json release configuration
    - Document conventional commit requirements for version bumping
    - Provide examples of adding new apps to existing release workflows
    - Include best practices for maintaining consistent versioning across apps
    - _Requirements: 2.1, 2.2, 4.2, 4.3_
