#!/usr/bin/env node

/**
 * Version Validation Script
 * 
 * Prevents version mismatches by:
 * - Comparing package.json version with latest git tag
 * - Reporting mismatches with clear error messages
 * - Providing resolution steps
 * - Optionally auto-fixing simple mismatches
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionValidator {
  constructor() {
    this.args = this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
      project: null,
      fix: false,
      all: false,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--project=')) {
        parsed.project = arg.split('=')[1];
      } else if (arg === '--project' && i + 1 < args.length) {
        parsed.project = args[++i];
      } else if (arg === '--fix') {
        parsed.fix = true;
      } else if (arg === '--all') {
        parsed.all = true;
      } else if (arg === '--help' || arg === '-h') {
        parsed.help = true;
      }
    }

    return parsed;
  }

  showHelp() {
    console.log(`
Version Validation Script

Usage:
  node scripts/validate-versions.js [--project=<name>] [--fix] [--all]

Options:
  --project <name>      Validate specific project (e.g., duo-chrome)
  --all                 Validate all projects in apps/ directory
  --fix                 Automatically fix simple mismatches (package.json behind git tag)
  --help, -h            Show this help message

Examples:
  # Validate duo-chrome
  node scripts/validate-versions.js --project=duo-chrome

  # Validate all projects
  node scripts/validate-versions.js --all

  # Validate and auto-fix duo-chrome
  node scripts/validate-versions.js --project=duo-chrome --fix

Exit Codes:
  0 - All versions are in sync
  1 - Version mismatches found (or other errors)
  2 - Mismatches found but auto-fixed
`);
  }

  validateArgs() {
    if (this.args.help) {
      this.showHelp();
      process.exit(0);
    }

    if (!this.args.project && !this.args.all) {
      console.error('❌ Error: Either --project or --all is required');
      this.showHelp();
      process.exit(1);
    }

    if (this.args.project && this.args.all) {
      console.error('❌ Error: Cannot use both --project and --all');
      this.showHelp();
      process.exit(1);
    }
  }

  execCommand(command, options = {}) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8', 
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options 
      });
      return result ? result.trim() : '';
    } catch (error) {
      if (!options.allowFailure) {
        console.error(`❌ Command failed: ${command}`);
        console.error(error.message);
        process.exit(1);
      }
      return null;
    }
  }

  getProjectList() {
    if (this.args.project) {
      return [this.args.project];
    }

    // Get all projects from apps/ directory
    const appsDir = path.join(process.cwd(), 'apps');
    if (!fs.existsSync(appsDir)) {
      console.error('❌ Error: apps/ directory not found');
      process.exit(1);
    }

    const projects = fs.readdirSync(appsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => {
        // Only include directories that have package.json
        const packageJsonPath = path.join(appsDir, name, 'package.json');
        return fs.existsSync(packageJsonPath);
      });

    return projects;
  }

  getVersionState(project) {
    const packageJsonPath = path.join('apps', project, 'package.json');
    
    // Validate project exists
    if (!fs.existsSync(packageJsonPath)) {
      return {
        project,
        status: 'error',
        errorMessage: `Project '${project}' not found at ${packageJsonPath}`,
        packageJsonVersion: null,
        latestGitTag: null,
        latestTagVersion: null,
        isInSync: false,
        suggestedAction: 'manual-review'
      };
    }

    try {
      // Get package.json version
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const packageVersion = packageJson.version;

      // Get latest git tag for this project
      const tagPattern = `${project}@*`;
      const latestTag = this.execCommand(
        `git tag --list "${tagPattern}" --sort=-version:refname | head -1`,
        { silent: true, allowFailure: true }
      );

      const latestTagVersion = latestTag ? latestTag.split('@')[1] : null;

      // Determine sync status and suggested action
      const isInSync = packageVersion === latestTagVersion;
      let suggestedAction = 'none';
      let status = 'valid';

      if (!isInSync) {
        status = 'mismatch';
        if (!latestTagVersion) {
          suggestedAction = 'create-initial-tag';
        } else if (this.compareVersions(packageVersion, latestTagVersion) < 0) {
          suggestedAction = 'fix-package'; // package.json is behind
        } else if (this.compareVersions(packageVersion, latestTagVersion) > 0) {
          suggestedAction = 'fix-tag'; // package.json is ahead
        } else {
          suggestedAction = 'manual-review';
        }
      }

      return {
        project,
        status,
        packageJsonVersion: packageVersion,
        latestGitTag: latestTag,
        latestTagVersion,
        isInSync,
        suggestedAction,
        packageJsonPath
      };
    } catch (error) {
      return {
        project,
        status: 'error',
        errorMessage: `Failed to read project data: ${error.message}`,
        packageJsonVersion: null,
        latestGitTag: null,
        latestTagVersion: null,
        isInSync: false,
        suggestedAction: 'manual-review'
      };
    }
  }

  compareVersions(version1, version2) {
    // Simple semantic version comparison
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  generateResolutionSteps(state) {
    const steps = [];
    
    switch (state.suggestedAction) {
      case 'fix-package':
        steps.push(`Update package.json to match git tag: ${state.latestTagVersion}`);
        steps.push(`Run: node scripts/fix-version.js --project=${state.project} --sync-to-tag`);
        break;
        
      case 'fix-tag':
        steps.push(`Package.json (${state.packageJsonVersion}) is ahead of git tag (${state.latestTagVersion})`);
        steps.push(`This usually means you manually edited package.json`);
        steps.push(`Option 1: Sync package.json to tag: node scripts/fix-version.js --project=${state.project} --sync-to-tag`);
        steps.push(`Option 2: Create new tag: node scripts/fix-version.js --project=${state.project} --target-version=${state.packageJsonVersion}`);
        break;
        
      case 'create-initial-tag':
        steps.push(`No git tags found for ${state.project}`);
        steps.push(`Create initial tag: node scripts/fix-version.js --project=${state.project} --target-version=${state.packageJsonVersion}`);
        break;
        
      case 'manual-review':
        steps.push(`Complex version mismatch requires manual review`);
        steps.push(`See: docs/troubleshooting/version-mismatches.md`);
        break;
        
      default:
        steps.push(`No action needed - versions are in sync`);
    }
    
    return steps;
  }

  autoFix(state) {
    if (!this.args.fix) {
      return false;
    }

    // Only auto-fix simple cases where package.json is behind git tag
    if (state.suggestedAction !== 'fix-package') {
      console.log(`⚠️  Cannot auto-fix ${state.project}: ${state.suggestedAction} requires manual intervention`);
      return false;
    }

    console.log(`🔧 Auto-fixing ${state.project}: ${state.packageJsonVersion} → ${state.latestTagVersion}`);
    
    try {
      // Update package.json to match git tag
      const packageJson = JSON.parse(fs.readFileSync(state.packageJsonPath, 'utf8'));
      packageJson.version = state.latestTagVersion;
      
      fs.writeFileSync(
        state.packageJsonPath, 
        JSON.stringify(packageJson, null, 2) + '\n'
      );
      
      console.log(`✅ Fixed ${state.project}: Updated package.json to ${state.latestTagVersion}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to auto-fix ${state.project}: ${error.message}`);
      return false;
    }
  }

  displayResults(results) {
    const validProjects = results.filter(r => r.status === 'valid');
    const mismatchedProjects = results.filter(r => r.status === 'mismatch');
    const errorProjects = results.filter(r => r.status === 'error');
    const fixedProjects = results.filter(r => r.fixed);

    console.log('\n📊 Version Validation Results');
    console.log('============================');

    if (validProjects.length > 0) {
      console.log(`\n✅ Valid (${validProjects.length}):`);
      validProjects.forEach(state => {
        console.log(`   ${state.project}: ${state.packageJsonVersion} ✓`);
      });
    }

    if (fixedProjects.length > 0) {
      console.log(`\n🔧 Auto-Fixed (${fixedProjects.length}):`);
      fixedProjects.forEach(state => {
        console.log(`   ${state.project}: ${state.originalVersion} → ${state.packageJsonVersion} ✓`);
      });
    }

    if (mismatchedProjects.length > 0) {
      console.log(`\n❌ Mismatched (${mismatchedProjects.length}):`);
      mismatchedProjects.forEach(state => {
        console.log(`\n   ${state.project}:`);
        console.log(`     Package.json: ${state.packageJsonVersion}`);
        console.log(`     Latest Git Tag: ${state.latestTagVersion || 'none'}`);
        console.log(`     Resolution Steps:`);
        this.generateResolutionSteps(state).forEach(step => {
          console.log(`       • ${step}`);
        });
      });
    }

    if (errorProjects.length > 0) {
      console.log(`\n💥 Errors (${errorProjects.length}):`);
      errorProjects.forEach(state => {
        console.log(`   ${state.project}: ${state.errorMessage}`);
      });
    }

    // Summary
    console.log(`\n📋 Summary:`);
    console.log(`   Total Projects: ${results.length}`);
    console.log(`   Valid: ${validProjects.length}`);
    console.log(`   Auto-Fixed: ${fixedProjects.length}`);
    console.log(`   Mismatched: ${mismatchedProjects.length}`);
    console.log(`   Errors: ${errorProjects.length}`);

    return {
      hasIssues: mismatchedProjects.length > 0 || errorProjects.length > 0,
      hasAutoFixes: fixedProjects.length > 0
    };
  }

  run() {
    this.validateArgs();
    
    console.log('🔍 Version Validation Script');
    console.log('============================');
    
    const projects = this.getProjectList();
    console.log(`\n📋 Validating ${projects.length} project(s): ${projects.join(', ')}`);
    
    const results = [];
    
    for (const project of projects) {
      console.log(`\n🔍 Checking ${project}...`);
      const state = this.getVersionState(project);
      
      if (state.status === 'mismatch' && this.args.fix) {
        const originalVersion = state.packageJsonVersion;
        const wasFixed = this.autoFix(state);
        
        if (wasFixed) {
          // Re-check the state after fix
          const fixedState = this.getVersionState(project);
          fixedState.fixed = true;
          fixedState.originalVersion = originalVersion;
          results.push(fixedState);
        } else {
          results.push(state);
        }
      } else {
        results.push(state);
      }
    }

    const summary = this.displayResults(results);
    
    // Exit with appropriate code
    if (summary.hasIssues) {
      console.log('\n❌ Version mismatches detected. Please resolve before releasing.');
      process.exit(1);
    } else if (summary.hasAutoFixes) {
      console.log('\n✅ All version mismatches have been auto-fixed.');
      process.exit(2);
    } else {
      console.log('\n✅ All versions are in sync. Ready for release!');
      process.exit(0);
    }
  }
}

// Run the script
const validator = new VersionValidator();
validator.run();