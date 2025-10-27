# Design Document

## Overview

This design addresses the duo-chrome versioning issue and establishes a robust version management system that prevents future mismatches between package.json versions and git tags. The solution includes immediate fixes, validation mechanisms, and comprehensive documentation.

## Architecture

### Current State Analysis

**Problem Root Cause:**
- Git tag: `duo-chrome@1.0.0` (source of truth for Nx)
- Package.json: `"version": "0.2.0"` (manually edited, ignored by Nx)
- Nx calculated: 1.0.0 → 2.0.0 (major bump due to significant feature addition)
- Expected: 0.2.0 → 0.3.0 (minor bump)

**Why This Happened:**
1. Nx uses git tags as the authoritative version source
2. Manual package.json edits don't affect git tag history
3. Conventional commits since last tag triggered version calculation from tag, not package.json

### Solution Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Git Tags      │    │  Package.json    │    │  Validation     │
│ (Source of      │◄──►│  (Must Match     │◄──►│  Script         │
│  Truth)         │    │   Latest Tag)    │    │ (Pre-release)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    Nx Release Process   │
                    │  (Conventional Commits) │
                    └─────────────────────────┘
```

## Components and Interfaces

### 1. Version Correction Script
**Purpose:** Fix the current duo-chrome version mismatch
**Interface:**
```bash
./scripts/fix-version.js --project=duo-chrome --target-version=0.3.0
```

**Functionality:**
- Remove incorrect git tags
- Update package.json to correct version
- Create new git tag with correct version
- Update changelog to reflect correct history

### 2. Pre-Release Validation Script
**Purpose:** Prevent future version mismatches
**Interface:**
```bash
./scripts/validate-versions.js [--project=<name>] [--fix]
```

**Functionality:**
- Compare package.json version with latest git tag
- Report mismatches with clear error messages
- Optionally auto-fix simple mismatches
- Integration point for release process

### 3. Enhanced Release Process
**Purpose:** Integrate validation into existing workflow
**Interface:**
- Modify existing `release-deploy` target
- Add validation step before version calculation
- Provide clear error messages and resolution steps

### 4. Documentation Updates
**Purpose:** Provide comprehensive guidance
**Components:**
- Updated version-and-deploy.md with troubleshooting section
- New troubleshooting guide for version mismatches
- Examples of common scenarios and solutions

## Data Models

### Version State Model
```typescript
interface VersionState {
  project: string;
  packageJsonVersion: string;
  latestGitTag: string;
  isInSync: boolean;
  suggestedAction: 'none' | 'fix-package' | 'fix-tag' | 'manual-review';
}
```

### Validation Result Model
```typescript
interface ValidationResult {
  project: string;
  status: 'valid' | 'mismatch' | 'error';
  currentState: VersionState;
  errorMessage?: string;
  resolutionSteps?: string[];
}
```

## Error Handling

### Version Mismatch Detection
1. **Pre-release validation** catches mismatches before they cause problems
2. **Clear error messages** explain the specific mismatch found
3. **Resolution guidance** provides step-by-step fix instructions
4. **Automatic fixes** for simple cases (package.json behind git tag)

### Error Message Examples
```
❌ Version Mismatch Detected for duo-chrome:
   Package.json: 0.2.0
   Latest Git Tag: duo-chrome@1.0.0
   
   This mismatch will cause unexpected version bumps.
   
   Resolution Options:
   1. Run: ./scripts/fix-version.js --project=duo-chrome --sync-to-tag
   2. Or manually update package.json to match git tag
   3. For complex cases, see: docs/troubleshooting/version-mismatches.md
```

### Rollback Strategy
- Git tag removal for incorrect releases
- Package.json restoration from git history
- Changelog correction procedures
- Communication plan for published versions

## Testing Strategy

### Unit Tests
- Version comparison logic
- Git tag parsing and validation
- Package.json version extraction
- Error message generation

### Integration Tests
- Full validation workflow
- Fix script execution
- Release process with validation
- Error handling scenarios

### Manual Testing Scenarios
1. **Current Issue Recreation:** Test fix for duo-chrome 0.2.0 → 1.0.0 mismatch
2. **Prevention Testing:** Attempt release with intentional mismatch
3. **Auto-fix Testing:** Test automatic resolution of simple mismatches
4. **Complex Scenarios:** Test edge cases and manual resolution paths

## Implementation Phases

### Phase 1: Immediate Fix (duo-chrome)
1. Create version correction script
2. Fix duo-chrome version mismatch
3. Verify correct version progression
4. Update changelog

### Phase 2: Prevention System
1. Create pre-release validation script
2. Integrate validation into release targets
3. Test validation with intentional mismatches
4. Document error scenarios

### Phase 3: Documentation & Process
1. Update version-and-deploy.md
2. Create troubleshooting guide
3. Add examples and common scenarios
4. Create team guidelines for version management

### Phase 4: Monitoring & Maintenance
1. Add validation to CI/CD if applicable
2. Create periodic version audit script
3. Monitor for future issues
4. Refine documentation based on usage