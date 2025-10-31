#!/usr/bin/env node
/**
 * Changelog Validation Tool
 *
 * Validates commit messages and changelog entries according to the GenArt
 * monorepo hybrid changelog classification system.
 *
 * Usage:
 *   node scripts/validate-changelog.js [options]
 *
 * Options:
 *   --commit-msg <message>  Validate a specific commit message
 *   --staged               Validate staged changes
 *   --check-changelogs     Validate changelog file formats
 *   --all                  Run all validations
 */

const fs = require('fs')
const { execSync } = require('child_process')

// Configuration based on docs/changelog-classification-system.md
const MONOREPO_KEYWORDS = [
  'nx.json', 'nx', 'monorepo', 'workspace',
  'libs/', 'lib/', 'docs/', 'build', 'ci',
  'chore(release)', 'version', 'release', 'deploy'
]

const MONOREPO_SCOPES = [
  'monorepo', 'workspace', 'nx', 'build', 'ci', 'deploy', 'release',
  'libs/p5-utils', 'libs/color-palettes', 'libs/version-display', 'libs/version-utils'
]

const APP_SCOPES = [
  'duo-chrome', 'crude-collage-painter', 'computational-collage',
  'dragline', 'monochromifier', 'those-shape-things'
]

const VALID_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf'
]

class ChangelogValidator {
  constructor () {
    this.errors = []
    this.warnings = []
  }

  // Validate conventional commit format
  validateCommitMessage (message) {
    const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|test|chore|perf)(\(.+\))?(!)?: .{1,100}$/

    if (!conventionalCommitRegex.test(message)) {
      this.errors.push('Commit message does not follow Conventional Commits format')
      return false
    }

    const match = message.match(/^(\w+)(\(([^)]+)\))?(!)?: (.+)$/)
    if (!match) return false

    const [, type, , scope, breaking, description] = match

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      this.errors.push(`Invalid commit type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}`)
    }

    // Validate scope routing
    if (scope) {
      this.validateScopeRouting(type, scope, description, breaking)
    } else {
      this.warnings.push('Commit message lacks scope - consider adding scope for better changelog routing')
    }

    return this.errors.length === 0
  }

  validateScopeRouting (type, scope, description, breaking) {
    const isMonorepoScope = MONOREPO_SCOPES.some(s => scope.startsWith(s))
    const isAppScope = APP_SCOPES.includes(scope)
    const hasMonorepoKeywords = MONOREPO_KEYWORDS.some(keyword =>
      description.toLowerCase().includes(keyword.toLowerCase()) ||
      scope.toLowerCase().includes(keyword.toLowerCase())
    )

    // Check for scope/keyword mismatches
    if (isAppScope && hasMonorepoKeywords) {
      this.warnings.push(
        `App scope "${scope}" with infrastructure keywords detected. ` +
        'Consider using monorepo scope if this affects shared infrastructure.'
      )
    }

    if (isMonorepoScope && !hasMonorepoKeywords) {
      this.warnings.push(
        `Monorepo scope "${scope}" without infrastructure keywords. ` +
        'Verify this change actually affects shared infrastructure.'
      )
    }

    // Breaking changes validation
    if (breaking && !isMonorepoScope) {
      this.warnings.push(
        'Breaking change detected in app scope. Consider if this affects multiple apps and should use monorepo scope.'
      )
    }

    // Unknown scope validation
    if (!isMonorepoScope && !isAppScope && !scope.startsWith('libs/')) {
      this.warnings.push(`Unknown scope: ${scope}. Consider using a recognized scope for proper changelog routing.`)
    }
  }

  // Validate changelog file format
  validateChangelogFormat (filePath) {
    if (!fs.existsSync(filePath)) {
      this.warnings.push(`Changelog file does not exist: ${filePath}`)
      return false
    }

    const content = fs.readFileSync(filePath, 'utf8')

    // Check for basic structure
    if (!content.includes('# ')) {
      this.errors.push(`Changelog missing main heading: ${filePath}`)
    }

    if (!content.includes('## Unreleased') && !content.includes('## [Unreleased]')) {
      this.warnings.push(`Changelog missing Unreleased section: ${filePath}`)
    }

    // Check for proper Markdown formatting
    const lines = content.split('\n')
    let inUnreleased = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.match(/^##\s+\[?Unreleased\]?/)) {
        inUnreleased = true
        continue
      }

      if (inUnreleased && line.match(/^##\s+/)) {
        break
      }

      if (inUnreleased && line.trim() && !line.startsWith('#')) {
        // Validate list formatting
        if (line.startsWith('- ') || line.startsWith('* ')) {
          // Good list format
        } else if (line.match(/^[A-Za-z]/)) {
          this.warnings.push(`Changelog entry should use list format (- or *): "${line.trim()}"`)
        }
      }
    }

    return this.errors.length === 0
  }

  // Validate staged changes for potential routing issues
  validateStagedChanges () {
    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim().split('\n').filter(Boolean)

      if (stagedFiles.length === 0) {
        this.warnings.push('No staged changes to validate')
        return true
      }

      // Analyze staged files for routing hints
      const hasMonorepoFiles = stagedFiles.some(file =>
        file.startsWith('libs/') ||
        file === 'nx.json' ||
        file === 'package.json' ||
        file.startsWith('docs/') ||
        file.startsWith('tools/') ||
        file.startsWith('scripts/')
      )

      const hasAppFiles = stagedFiles.some(file => file.startsWith('apps/'))

      if (hasMonorepoFiles && hasAppFiles) {
        this.warnings.push(
          'Staged changes affect both monorepo infrastructure and apps. ' +
          'Consider separate commits for better changelog routing.'
        )
      }

      // Get the latest commit message to validate
      try {
        const lastCommitMsg = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim()
        this.validateCommitMessage(lastCommitMsg)
      } catch (e) {
        // No commits yet, skip validation
      }
    } catch (error) {
      this.errors.push(`Error checking staged changes: ${error.message}`)
    }

    return this.errors.length === 0
  }

  // Check all changelog files in the monorepo
  validateAllChangelogs () {
    const changelogFiles = []

    // Root changelog
    if (fs.existsSync('CHANGELOG.md')) {
      changelogFiles.push('CHANGELOG.md')
    }

    // App changelogs
    try {
      const apps = fs.readdirSync('apps', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

      apps.forEach(app => {
        const changelogPath = `apps/${app}/CHANGELOG.md`
        if (fs.existsSync(changelogPath)) {
          changelogFiles.push(changelogPath)
        }
      })
    } catch (e) {
      this.warnings.push('Could not read apps directory')
    }

    changelogFiles.forEach(file => {
      this.validateChangelogFormat(file)
    })

    return this.errors.length === 0
  }

  // Run all validations
  runAll () {
    this.validateStagedChanges()
    this.validateAllChangelogs()
    return this.errors.length === 0
  }

  // Print results
  printResults () {
    if (this.errors.length > 0) {
      console.log('\n❌ Validation Errors:')
      this.errors.forEach(error => console.log(`  • ${error}`))
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Validation Warnings:')
      this.warnings.forEach(warning => console.log(`  • ${warning}`))
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All validations passed!')
    }

    return this.errors.length === 0
  }
}

// CLI handling
function main () {
  const args = process.argv.slice(2)
  const validator = new ChangelogValidator()

  if (args.includes('--commit-msg')) {
    const msgIndex = args.indexOf('--commit-msg')
    const message = args[msgIndex + 1]
    if (!message) {
      console.error('Error: --commit-msg requires a message argument')
      process.exit(1)
    }
    validator.validateCommitMessage(message)
  } else if (args.includes('--staged')) {
    validator.validateStagedChanges()
  } else if (args.includes('--check-changelogs')) {
    validator.validateAllChangelogs()
  } else if (args.includes('--all')) {
    validator.runAll()
  } else {
    console.log('Changelog Validation Tool')
    console.log('')
    console.log('Usage:')
    console.log('  node scripts/validate-changelog.js --commit-msg "feat(duo-chrome): add feature"')
    console.log('  node scripts/validate-changelog.js --staged')
    console.log('  node scripts/validate-changelog.js --check-changelogs')
    console.log('  node scripts/validate-changelog.js --all')
    process.exit(0)
  }

  const result = validator.printResults()
  process.exit(result ? 0 : 1)
}

if (require.main === module) {
  main()
}

module.exports = { ChangelogValidator }
