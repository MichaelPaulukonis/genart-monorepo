# Design Document

## Overview

The automated version management system needs to be restructured to resolve the conflict between nx.json's granular git configuration and the top-level `nx release` command. The solution involves using nx release subcommands (version, changelog, publish) instead of the top-level command, while maintaining the existing independent project structure and deployment workflow.

## Architecture

### Current Problem Analysis

The error occurs because:
1. nx.json contains git configuration in the `changelog.git` section
2. The release-deploy target uses `nx release --projects=duo-chrome` 
3. Nx treats this as a conflict between top-level and granular git configurations

### Solution Architecture

The fix involves restructuring the release process to use nx release subcommands:
- `nx release version` - handles version bumping based on conventional commits
- `nx release changelog` - generates changelogs and handles git operations
- Deployment remains separate using the existing gh-pages approach

## Components and Interfaces

### 1. Nx Configuration (nx.json)

**Current Configuration:**
- Independent project relationships
- Conventional commits enabled
- Project-specific changelogs
- Git commit and tag operations in changelog section

**Required Changes:**
- Move git configuration to top-level `release.git` section
- Remove granular git config from changelog section
- Maintain existing project patterns and conventional commits

### 2. Project Targets (project.json)

**Current release-deploy Target:**
```json
{
  "release-deploy": {
    "dependsOn": ["build"],
    "executor": "nx:run-commands",
    "options": {
      "commands": [
        "nx release --projects=duo-chrome",
        "npx gh-pages -d dist/apps/duo-chrome --repo https://github.com/michaelpaulukonis/duo-chrome.git"
      ],
      "parallel": false
    }
  }
}
```

**New release-deploy Target:**
```json
{
  "release-deploy": {
    "dependsOn": ["build"],
    "executor": "nx:run-commands",
    "options": {
      "commands": [
        "nx release version --projects=duo-chrome",
        "nx release changelog --projects=duo-chrome",
        "npx gh-pages -d dist/apps/duo-chrome --repo https://github.com/michaelpaulukonis/duo-chrome.git"
      ],
      "parallel": false
    }
  }
}
```

### 3. Documentation Updates

**Version and Deploy Guide:**
- Update quick commands section with corrected syntax
- Add troubleshooting for the specific error encountered
- Include examples of subcommand usage
- Provide validation steps

## Data Models

### Release Configuration Schema

```json
{
  "release": {
    "projectsRelationship": "independent",
    "projects": ["apps/*"],
    "releaseTagPattern": "{projectName}@{version}",
    "git": {
      "commit": true,
      "tag": true
    },
    "version": {
      "conventionalCommits": true
    },
    "changelog": {
      "projectChangelogs": true
    }
  }
}
```

### Project Target Schema

```json
{
  "targets": {
    "release-deploy": {
      "dependsOn": ["build"],
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx release version --projects={projectName}",
          "nx release changelog --projects={projectName}",
          "npx gh-pages -d dist/apps/{projectName} --repo {repoUrl}"
        ],
        "parallel": false
      }
    }
  }
}
```

## Error Handling

### 1. Version Command Failures
- **Scenario**: No conventional commits found since last release
- **Handling**: Provide clear message about commit requirements
- **Recovery**: Guide user to check git history and commit format

### 2. Changelog Generation Failures
- **Scenario**: Git operations fail due to permissions or conflicts
- **Handling**: Separate version and changelog steps for easier debugging
- **Recovery**: Allow manual git operations if automated ones fail

### 3. Deployment Failures
- **Scenario**: GitHub Pages deployment fails
- **Handling**: Keep deployment separate from versioning so versions aren't lost
- **Recovery**: Allow re-running deployment without re-versioning

### 4. Configuration Conflicts
- **Scenario**: Future nx.json changes cause similar conflicts
- **Handling**: Use subcommands consistently to avoid top-level conflicts
- **Recovery**: Provide migration guide for configuration updates

## Testing Strategy

### 1. Configuration Validation
- Verify nx.json changes don't break existing functionality
- Test that git operations work correctly with new configuration
- Validate that conventional commits still trigger appropriate version bumps

### 2. Release Process Testing
- Test single-app release workflow
- Test multi-app release workflow
- Test dry-run functionality
- Verify git tags are created correctly

### 3. Deployment Verification
- Confirm GitHub Pages deployment still works
- Test deployment with version updates
- Verify deployed apps reflect correct versions

### 4. Error Scenario Testing
- Test behavior when no changes are detected
- Test behavior with malformed conventional commits
- Test recovery from partial failures

## Implementation Approach

### Phase 1: Configuration Fix
1. Update nx.json to move git config to top-level
2. Update all app project.json files to use subcommands
3. Test configuration changes with dry-run

### Phase 2: Documentation Update
1. Update version-and-deploy.md with corrected commands
2. Add troubleshooting section for common errors
3. Include validation steps and examples

### Phase 3: Validation
1. Test release-deploy on a single app
2. Verify git operations and GitHub Pages deployment
3. Update any remaining issues found during testing

## Migration Strategy

### Backward Compatibility
- Existing git tags and version history remain intact
- No changes to version numbering scheme
- Deployment URLs and processes unchanged

### Rollback Plan
- Keep backup of original nx.json and project.json files
- Document original command structure for reference
- Provide steps to revert if issues arise

## Performance Considerations

### Command Execution Time
- Subcommands may add slight overhead compared to single command
- Parallel execution disabled to ensure proper sequencing
- Build caching remains effective for unchanged projects

### Git Operations
- Separate version and changelog steps allow better error isolation
- Git operations remain atomic within each subcommand
- Tag creation timing preserved for proper release tracking