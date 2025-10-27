#!/usr/bin/env node

/**
 * Version Correction Script
 * 
 * Fixes version mismatches between package.json and git tags by:
 * - Removing incorrect git tags
 * - Updating package.json to correct version
 * - Creating new git tag with correct version
 * - Updating changelog to reflect correct history
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionFixer {
  constructor() {
    this.args = this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
      project: null,
      targetVersion: null,
      syncToTag: false,
      dryRun: false,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--project=')) {
        parsed.project = arg.split('=')[1];
      } else if (arg === '--project' && i + 1 < args.length) {
        parsed.project = args[++i];
      } else if (arg.startsWith('--target-version=')) {
        parsed.targetVersion = arg.split('=')[1];
      } else if (arg === '--target-version' && i + 1 < args.length) {
        parsed.targetVersion = args[++i];
      } else if (arg === '--sync-to-tag') {
        parsed.syncToTag = true;
      } else if (arg === '--dry-run') {
        parsed.dryRun = true;
      } else if (arg === '--help' || arg === '-h') {
        parsed.help = true;
      }
    }

    return parsed;
  }

  showHelp() {
    console.log(`
Version Correction Script

Usage:
  node scripts/fix-version.js --project=<name> --target-version=<version>
  node scripts/fix-version.js --project=<name> --sync-to-tag

Options:
  --project <name>           Project name (e.g., duo-chrome)
  --target-version <version> Set specific target version (e.g., 0.3.0)
  --sync-to-tag             Sync package.json to match latest git tag
  --dry-run                 Show what would be done without making changes
  --help, -h                Show this help message

Examples:
  # Fix duo-chrome to version 0.3.0
  node scripts/fix-version.js --project=duo-chrome --target-version=0.3.0

  # Sync package.json to match git tag
  node scripts/fix-version.js --project=duo-chrome --sync-to-tag

  # Preview changes without applying them
  node scripts/fix-version.js --project=duo-chrome --target-version=0.3.0 --dry-run
`);
  }

  validateArgs() {
    if (this.args.help) {
      this.showHelp();
      process.exit(0);
    }

    if (!this.args.project) {
      console.error('❌ Error: --project is required');
      this.showHelp();
      process.exit(1);
    }

    if (!this.args.targetVersion && !this.args.syncToTag) {
      console.error('❌ Error: Either --target-version or --sync-to-tag is required');
      this.showHelp();
      process.exit(1);
    }

    // Validate project exists
    const projectPath = path.join('apps', this.args.project);
    if (!fs.existsSync(projectPath)) {
      console.error(`❌ Error: Project '${this.args.project}' not found at ${projectPath}`);
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

  getCurrentVersionState() {
    const project = this.args.project;
    const packageJsonPath = path.join('apps', project, 'package.json');
    
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

    return {
      project,
      packageVersion,
      latestTag,
      latestTagVersion,
      packageJsonPath
    };
  }

  removeIncorrectTags() {
    const project = this.args.project;
    const tagPattern = `${project}@*`;
    
    console.log(`🔍 Finding tags for project: ${project}`);
    
    const tags = this.execCommand(
      `git tag --list "${tagPattern}"`,
      { silent: true, allowFailure: true }
    );

    if (!tags) {
      console.log('ℹ️  No existing tags found');
      return [];
    }

    const tagList = tags.split('\n').filter(tag => tag.trim());
    console.log(`📋 Found tags: ${tagList.join(', ')}`);

    if (this.args.dryRun) {
      console.log(`🔮 [DRY RUN] Would remove tags: ${tagList.join(', ')}`);
      return tagList;
    }

    // Remove all existing tags for this project
    for (const tag of tagList) {
      console.log(`🗑️  Removing tag: ${tag}`);
      
      // Remove local tag
      this.execCommand(`git tag -d ${tag}`, { allowFailure: true });
      
      // Also remove from remote if it exists
      try {
        this.execCommand(
          `git push origin :refs/tags/${tag}`,
          { allowFailure: true, silent: true }
        );
        console.log(`🌐 Removed tag from remote: ${tag}`);
      } catch (error) {
        // Remote tag might not exist, that's okay
        console.log(`ℹ️  Tag ${tag} not found on remote (or no remote configured)`);
      }
    }

    return tagList;
  }

  updatePackageJson(targetVersion) {
    const state = this.getCurrentVersionState();
    
    console.log(`📝 Updating ${state.packageJsonPath} version: ${state.packageVersion} → ${targetVersion}`);
    
    if (this.args.dryRun) {
      console.log(`🔮 [DRY RUN] Would update package.json version to ${targetVersion}`);
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(state.packageJsonPath, 'utf8'));
    packageJson.version = targetVersion;
    
    fs.writeFileSync(
      state.packageJsonPath, 
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    
    console.log(`✅ Updated package.json version to ${targetVersion}`);
  }

  createNewTag(version) {
    const project = this.args.project;
    const tagName = `${project}@${version}`;
    
    console.log(`🏷️  Creating new tag: ${tagName}`);
    
    if (this.args.dryRun) {
      console.log(`🔮 [DRY RUN] Would create tag: ${tagName}`);
      return;
    }

    // Create annotated tag with message
    const message = `chore(release): ${project} v${version}`;
    this.execCommand(`git add apps/${project}/package.json`);
    this.execCommand(`git commit -m "${message}" --allow-empty`);
    this.execCommand(`git tag -a ${tagName} -m "${message}"`);
    
    console.log(`✅ Created tag: ${tagName}`);
  }

  updateChangelog(version) {
    const project = this.args.project;
    const changelogPath = path.join('apps', project, 'CHANGELOG.md');
    
    if (!fs.existsSync(changelogPath)) {
      console.log(`ℹ️  No changelog found at ${changelogPath}, skipping changelog update`);
      return;
    }

    console.log(`📄 Updating changelog for version ${version}`);
    
    if (this.args.dryRun) {
      console.log(`🔮 [DRY RUN] Would update changelog with version ${version}`);
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const newEntry = `# ${version} (${currentDate})

Version corrected from previous mismatch. This release includes:
- Interactive controls system with A/B image selection
- Individual size control and image navigation
- Comprehensive user interface improvements
- Performance optimizations and testing infrastructure

`;

    const existingContent = fs.readFileSync(changelogPath, 'utf8');
    const updatedContent = newEntry + existingContent;
    
    fs.writeFileSync(changelogPath, updatedContent);
    console.log(`✅ Updated changelog with version ${version}`);
  }

  run() {
    this.validateArgs();
    
    console.log('🔧 Version Correction Script');
    console.log('============================');
    
    const state = this.getCurrentVersionState();
    
    console.log(`📊 Current State:`);
    console.log(`   Project: ${state.project}`);
    console.log(`   Package.json: ${state.packageVersion}`);
    console.log(`   Latest Git Tag: ${state.latestTag || 'none'}`);
    console.log(`   Latest Tag Version: ${state.latestTagVersion || 'none'}`);
    console.log('');

    let targetVersion;
    
    if (this.args.syncToTag) {
      if (!state.latestTagVersion) {
        console.error('❌ Error: No git tags found to sync to');
        process.exit(1);
      }
      targetVersion = state.latestTagVersion;
      console.log(`🎯 Syncing to git tag version: ${targetVersion}`);
    } else {
      targetVersion = this.args.targetVersion;
      console.log(`🎯 Setting target version: ${targetVersion}`);
    }

    if (this.args.dryRun) {
      console.log('\n🔮 DRY RUN MODE - No changes will be made\n');
    }

    // Step 1: Remove incorrect tags
    console.log('\n📋 Step 1: Remove incorrect tags');
    const removedTags = this.removeIncorrectTags();

    // Step 2: Update package.json
    console.log('\n📝 Step 2: Update package.json');
    this.updatePackageJson(targetVersion);

    // Step 3: Create new tag
    console.log('\n🏷️  Step 3: Create new tag');
    this.createNewTag(targetVersion);

    // Step 4: Update changelog
    console.log('\n📄 Step 4: Update changelog');
    this.updateChangelog(targetVersion);

    console.log('\n✅ Version correction completed successfully!');
    
    if (!this.args.dryRun) {
      console.log('\n📋 Next steps:');
      console.log('1. Review the changes with: git log --oneline -5');
      console.log('2. Push changes with: git push && git push --tags');
      console.log('3. Test the release process with: nx release version --projects=' + this.args.project + ' --dry-run');
    }
  }
}

// Run the script
const fixer = new VersionFixer();
fixer.run();