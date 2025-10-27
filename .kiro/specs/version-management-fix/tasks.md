# Implementation Plan

- [ ] 1. Create version correction script for immediate fix
  - Create `scripts/fix-version.js` with command-line interface for correcting version mismatches
  - Implement git tag removal and recreation functionality
  - Add package.json version update capabilities
  - Include changelog correction features
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Fix duo-chrome version mismatch
  - [ ] 2.1 Analyze current duo-chrome version state
    - Document current package.json version vs git tag mismatch
    - Identify the intended version progression path
    - _Requirements: 1.1_

  - [ ] 2.2 Remove incorrect git tags
    - Remove `duo-chrome@2.0.0` tag that caused the version jump
    - Verify tag removal doesn't affect other projects
    - _Requirements: 1.2_

  - [ ] 2.3 Set correct version and create proper tag
    - Update duo-chrome package.json to intended version (0.3.0)
    - Create new git tag `duo-chrome@0.3.0` to match package.json
    - _Requirements: 1.2_

  - [ ] 2.4 Update changelog to reflect correct history
    - Correct changelog entries to show proper version progression
    - Document the version correction in changelog
    - _Requirements: 1.3_

- [ ] 3. Create pre-release validation system
  - [ ] 3.1 Implement version validation script
    - Create `scripts/validate-versions.js` with project-specific validation
    - Add comparison logic between package.json and latest git tag
    - Implement clear error reporting with resolution steps
    - _Requirements: 2.4, 2.5, 4.1, 4.3_

  - [ ] 3.2 Add auto-fix capabilities for simple mismatches
    - Implement automatic package.json updates when behind git tag
    - Add confirmation prompts for automatic fixes
    - _Requirements: 4.2_

  - [ ] 3.3 Integrate validation into release process
    - Modify project.json release targets to include validation step
    - Ensure validation runs before version calculation
    - Add proper error handling and process termination
    - _Requirements: 2.3, 4.4_

- [ ] 4. Create comprehensive documentation
  - [ ] 4.1 Update version-and-deploy.md with troubleshooting section
    - Add section explaining version mismatch issues
    - Include step-by-step resolution procedures
    - Document prevention strategies
    - _Requirements: 3.1, 3.3_

  - [ ] 4.2 Create detailed troubleshooting guide
    - Create `docs/troubleshooting/version-mismatches.md`
    - Include common scenarios and their solutions
    - Add examples of validation script usage
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 4.3 Document Nx version calculation process
    - Explain how Nx uses git tags vs package.json
    - Document conventional commit impact on version bumps
    - Include examples of version progression scenarios
    - _Requirements: 3.2_

- [ ] 5. Test and validate the complete system
  - [ ] 5.1 Test version correction on duo-chrome
    - Verify correct version progression after fix
    - Test that subsequent releases work as expected
    - Validate changelog accuracy
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 5.2 Test validation system with intentional mismatches
    - Create test scenarios with version mismatches
    - Verify validation script catches all mismatch types
    - Test error messages and resolution guidance
    - _Requirements: 2.4, 2.5, 4.1, 4.3_

  - [ ]* 5.3 Create automated tests for validation logic
    - Write unit tests for version comparison functions
    - Test git tag parsing and package.json reading
    - Validate error message generation
    - _Requirements: 2.4, 4.1_

- [ ] 6. Deploy and monitor the solution
  - [ ] 6.1 Apply the fix to duo-chrome in production
    - Run the version correction script on duo-chrome
    - Verify the fix resolves the immediate issue
    - Test a follow-up release to confirm normal operation
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 6.2 Update team documentation and processes
    - Share updated documentation with team
    - Add validation to standard release checklist
    - Create guidelines for manual version changes
    - _Requirements: 3.1, 3.3, 3.4_