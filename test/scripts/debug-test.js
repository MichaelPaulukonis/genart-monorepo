#!/usr/bin/env node

/**
 * Debug Test Script
 * 
 * Helps debug differences between direct test runs and verification script runs
 */

const { execSync } = require('child_process')

const app = process.argv[2] || 'duo-chrome'

console.log(`🔍 Debugging test differences for ${app}`)
console.log('=' .repeat(50))

console.log('\n1. Testing direct run:')
try {
  const directOutput = execSync(`npm run test:e2e test/e2e/monorepo-integration.spec.js`, {
    env: { ...process.env, TEST_APP: app },
    encoding: 'utf8',
    stdio: 'pipe'
  })
  console.log('✅ Direct run succeeded')
  console.log('Output:', directOutput.split('\n').slice(-5).join('\n'))
} catch (error) {
  console.log('❌ Direct run failed')
  console.log('Error:', error.message)
}

console.log('\n2. Testing verification script style run:')
try {
  const verifyOutput = execSync(`npx playwright test test/e2e/monorepo-integration.spec.js --reporter=list --workers=1`, {
    env: { 
      ...process.env, 
      TEST_APP: app,
      NODE_OPTIONS: '--max-old-space-size=4096'
    },
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 180000
  })
  console.log('✅ Verification style run succeeded')
  console.log('Output:', verifyOutput.split('\n').slice(-5).join('\n'))
} catch (error) {
  console.log('❌ Verification style run failed')
  console.log('Error:', error.message)
  if (error.stdout) {
    console.log('Stdout:', error.stdout.split('\n').slice(-10).join('\n'))
  }
}

console.log('\n3. Environment comparison:')
console.log('TEST_APP:', process.env.TEST_APP || 'undefined')
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS || 'undefined')
console.log('Current working directory:', process.cwd())