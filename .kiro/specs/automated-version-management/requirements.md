# Requirements Document

> **Implementation Note**: These requirements were fulfilled by a superior solution using **Nx Release with independent versioning**. The final implementation exceeds all original requirements while providing better developer experience. See [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for details.

## Introduction

This document outlines the requirements for implementing simple automated version bumping for the GenArt Monorepo applications. The system will use standard npm scripts and Nx targets to automatically increment version numbers during publishing, keeping the implementation minimal and maintainable.

## Glossary

- **Monorepo**: A single repository containing multiple related applications and libraries
- **Semantic Versioning**: A versioning scheme using MAJOR.MINOR.PATCH format where each component has specific meaning
- **Nx**: A build system and development tools for monorepos
- **Affected Detection**: Nx's capability to identify which projects have changes since a base commit
- **Version Bump**: The process of incrementing version numbers according to semantic versioning rules
- **CI/CD Pipeline**: Continuous Integration/Continuous Deployment automated workflow
- **Package.json**: Node.js package configuration file containing version information

## Requirements

### Requirement 1

**User Story:** As a developer, I want version numbers to be automatically incremented when I publish applications, so that I don't have to manually manage version numbers.

#### Acceptance Criteria

1. WHEN a developer runs npm run publish, THE App_Package SHALL automatically increment the patch version using npm version patch
2. THE App_Package SHALL support manual version type changes by modifying the bump script
3. THE App_Package SHALL create git tags automatically via npm version command
4. THE App_Package SHALL allow referencing the current version in code via require('./package.json')
5. THE App_Package SHALL integrate version bumping into the prepublish workflow

### Requirement 2

**User Story:** As a developer working in a monorepo, I want to use Nx targets for consistent version management across all apps, so that I can leverage existing Nx tooling.

#### Acceptance Criteria

1. THE Nx_Target SHALL execute npm version and npm publish commands in the correct app directory
2. THE Nx_Target SHALL use nx run appname:publish syntax for publishing individual apps
3. THE Nx_Target SHALL set the working directory to the specific app folder
4. THE Nx_Target SHALL chain version bumping with the actual publish command
5. THE Nx_Target SHALL work consistently across all applications in the monorepo

### Requirement 3

**User Story:** As a developer, I want simple npm scripts in each app's package.json, so that version management is straightforward and uses standard Node.js tooling.

#### Acceptance Criteria

1. THE App_Package SHALL include a bump script that runs npm version patch
2. THE App_Package SHALL include a prepublish script that runs npm run bump
3. THE App_Package SHALL include a publish script that runs prepublish and npm publish
4. THE App_Package SHALL allow easy modification of version type by changing the bump script
5. THE App_Package SHALL work with standard npm tooling without custom dependencies