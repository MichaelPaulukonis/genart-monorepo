#!/usr/bin/env node

/**
 * Utility Verification Script
 * 
 * Runs verification tests across all apps to ensure the testing utilities
 * work correctly with different p5.js implementations in the monorepo.
 */

const { execSync } = require('child_process')

const APPS = [
  'duo-chrome',
  'crude-collage-painter',
  'those-shape-things',
  'computational-collage'
]

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

function runTest(app, testFile = 'monorepo-integration.spec.js') {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`Testing ${app} with ${testFile}`, 'bright')
  log(`${'='.repeat(60)}`, 'cyan')

  try {
    const env = {
      ...process.env,
      TEST_APP: app,
      NODE_OPTIONS: '--max-old-space-size=4096' // Increase memory limit
    }
    const command = `npx playwright test test/e2e/${testFile} --reporter=list --workers=1`

    log(`Running: ${command}`, 'blue')
    log(`Environment: TEST_APP=${app}`, 'blue')

    const output = execSync(command, {
      env,
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 180000 // 3 minute timeout per test
    })

    log(`✅ ${app} tests passed`, 'green')

    // Show summary from output
    const lines = output.split('\n')
    const summaryLines = lines.filter(line =>
      line.includes('passed') ||
      line.includes('failed') ||
      line.includes('Running') ||
      line.includes('✓') ||
      line.includes('×')
    )

    if (summaryLines.length > 0) {
      log('\nTest Summary:', 'yellow')
      summaryLines.forEach(line => log(`  ${line}`, 'reset'))
    }

    return { app, success: true, output }

  } catch (error) {
    log(`❌ ${app} tests failed`, 'red')
    log(`Error: ${error.message}`, 'red')

    // Show error output
    if (error.stdout) {
      log('\nStdout:', 'yellow')
      log(error.stdout, 'reset')
    }

    if (error.stderr) {
      log('\nStderr:', 'yellow')
      log(error.stderr, 'reset')
    }

    return { app, success: false, error: error.message }
  }
}

function runVerificationSuite() {
  log('🧪 Starting Playwright Utilities Verification Suite', 'bright')
  log(`Testing ${APPS.length} apps with testing utilities`, 'cyan')

  const results = []

  // Test basic integration for all apps
  log('\n📋 Phase 1: Basic Integration Tests', 'magenta')
  for (const app of APPS) {
    const result = runTest(app, 'monorepo-integration.spec.js')
    results.push(result)

    // Add delay between tests to prevent memory buildup and allow server stabilization
    if (result.success) {
      log(`✅ ${app} completed, waiting before next test...`, 'green')
      // Longer delay to allow memory cleanup and server stabilization
      require('child_process').execSync('sleep 5')
    } else {
      log(`❌ ${app} failed, waiting before next test...`, 'red')
      require('child_process').execSync('sleep 3')
    }
  }

  // Test comprehensive verification on duo-chrome (converted to instance mode)
  log('\n🔍 Phase 2: Comprehensive Utility Verification', 'magenta')
  log('⚠️  Running memory-intensive comprehensive tests...', 'yellow')

  try {
    const duoChromeResult = runTest('duo-chrome', 'duo-chrome-verification.spec.js')
    results.push({ ...duoChromeResult, phase: 'comprehensive' })
  } catch (error) {
    log('⚠️  Comprehensive test failed, likely due to memory constraints', 'yellow')
    log('💡 Try running individual tests: TEST_APP=duo-chrome npm run test:e2e', 'blue')
    results.push({
      app: 'duo-chrome',
      success: false,
      error: 'Memory constraints - run individually',
      phase: 'comprehensive'
    })
  }

  // Generate summary report
  log('\n📊 VERIFICATION SUMMARY', 'bright')
  log('='.repeat(60), 'cyan')

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  log(`Total Tests: ${results.length}`, 'blue')
  log(`Passed: ${passed}`, passed > 0 ? 'green' : 'reset')
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'reset')

  if (failed > 0) {
    log('\n❌ FAILED TESTS:', 'red')
    results.filter(r => !r.success).forEach(result => {
      log(`  - ${result.app}: ${result.error}`, 'red')
    })
  }

  if (passed > 0) {
    log('\n✅ PASSED TESTS:', 'green')
    results.filter(r => r.success).forEach(result => {
      const phase = result.phase ? ` (${result.phase})` : ''
      log(`  - ${result.app}${phase}`, 'green')
    })
  }

  // Recommendations
  log('\n💡 RECOMMENDATIONS:', 'yellow')

  if (failed === 0) {
    log('  ✅ All utilities are working correctly!', 'green')
    log('  ✅ Testing infrastructure is ready for use', 'green')
    log('  📝 Consider adding app-specific test suites', 'blue')
  } else {
    log('  ⚠️  Some tests failed - check app configurations', 'yellow')
    log('  🔧 Verify p5.js instance mode conversions are complete', 'yellow')
    log('  📋 Check app-specific keyboard shortcuts and interactions', 'yellow')
  }

  log('\n🎯 NEXT STEPS:', 'cyan')
  log('  1. Run individual app tests: TEST_APP=app-name npm run test:e2e', 'blue')
  log('  2. Create app-specific test suites using the utilities', 'blue')
  log('  3. Set up CI/CD integration for automated testing', 'blue')
  log('  4. Add visual regression baselines: npm run test:e2e:update', 'blue')

  return results
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    log('Playwright Utilities Verification Script', 'bright')
    log('\nUsage:', 'yellow')
    log('  node test/scripts/verify-utilities.js [options]', 'blue')
    log('\nOptions:', 'yellow')
    log('  --help, -h     Show this help message', 'blue')
    log('  --app <name>   Test specific app only', 'blue')
    log('  --basic        Run only basic integration tests', 'blue')
    log('\nExamples:', 'yellow')
    log('  node test/scripts/verify-utilities.js', 'blue')
    log('  node test/scripts/verify-utilities.js --app duo-chrome', 'blue')
    log('  node test/scripts/verify-utilities.js --basic', 'blue')
    process.exit(0)
  }

  if (args.includes('--app')) {
    const appIndex = args.indexOf('--app')
    const app = args[appIndex + 1]

    if (!APPS.includes(app)) {
      log(`❌ Invalid app: ${app}`, 'red')
      log(`Available apps: ${APPS.join(', ')}`, 'yellow')
      process.exit(1)
    }

    log(`🎯 Testing single app: ${app}`, 'bright')
    const result = runTest(app, 'monorepo-integration.spec.js')

    if (!result.success) {
      process.exit(1)
    }

  } else if (args.includes('--basic')) {
    log('🧪 Running Basic Integration Tests Only', 'bright')

    const results = []
    for (const app of APPS) {
      const result = runTest(app, 'monorepo-integration.spec.js')
      results.push(result)
    }

    const failed = results.filter(r => !r.success).length
    if (failed > 0) {
      process.exit(1)
    }

  } else {
    const results = runVerificationSuite()
    const failed = results.filter(r => !r.success).length

    if (failed > 0) {
      process.exit(1)
    }
  }
}

module.exports = { runVerificationSuite, runTest, APPS }