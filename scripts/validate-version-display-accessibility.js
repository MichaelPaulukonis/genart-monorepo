#!/usr/bin/env node

/**
 * Version Display Accessibility Validator
 * 
 * Validates that version display colors meet WCAG AA contrast requirements
 * and checks for common accessibility issues.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// WCAG AA contrast ratio requirement
const MIN_CONTRAST_RATIO = 4.5

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Calculate relative luminance
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1.r, color1.g, color1.b)
  const lum2 = getLuminance(color2.r, color2.g, color2.b)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Extract color values from CSS custom properties
 */
function extractColorsFromCSS(cssContent) {
  const colors = {}
  
  // Extract actual color values from :root section
  const rootSection = cssContent.match(/:root\s*{([^}]+)}/s)
  if (rootSection) {
    const rootContent = rootSection[1]
    
    // Extract text color
    const textMatch = rootContent.match(/--version-text-color:\s*([^;]+);/)
    if (textMatch) colors.text = textMatch[1].trim()
    
    // Extract border color  
    const borderMatch = rootContent.match(/--version-border-color:\s*([^;]+);/)
    if (borderMatch) colors.border = borderMatch[1].trim()
    
    // Extract background color
    const bgMatch = rootContent.match(/--version-bg-color:\s*([^;]+);/)
    if (bgMatch) colors.background = bgMatch[1].trim()
  }
  
  return colors
}

/**
 * Validate accessibility of version display colors
 */
function validateAccessibility() {
  console.log('🔍 Validating Version Display Accessibility...\n')
  
  try {
    // Read the shared CSS library
    const cssPath = join(process.cwd(), 'libs/version-display/version-display.css')
    const cssContent = readFileSync(cssPath, 'utf8')
    
    // Extract colors
    const colors = extractColorsFromCSS(cssContent)
    console.log('📋 Extracted Colors:')
    console.log(`   Text: ${colors.text || 'Not found'}`)
    console.log(`   Border: ${colors.border || 'Not found'}`)
    console.log(`   Background: ${colors.background || 'Not found'}\n`)
    
    let hasErrors = false
    
    // Validate text color contrast
    if (colors.text && colors.text.startsWith('#')) {
      const textColor = hexToRgb(colors.text)
      const whiteBackground = { r: 255, g: 255, b: 255 }
      
      if (textColor) {
        const contrastRatio = getContrastRatio(textColor, whiteBackground)
        console.log(`📊 Text Contrast Analysis:`)
        console.log(`   ${colors.text} on white background`)
        console.log(`   Contrast ratio: ${contrastRatio.toFixed(2)}:1`)
        
        if (contrastRatio >= MIN_CONTRAST_RATIO) {
          console.log(`   ✅ PASS - Meets WCAG AA requirement (${MIN_CONTRAST_RATIO}:1)\n`)
        } else {
          console.log(`   ❌ FAIL - Below WCAG AA requirement (${MIN_CONTRAST_RATIO}:1)\n`)
          hasErrors = true
        }
      }
    } else {
      console.log('⚠️  Warning: Could not validate text color (not a hex value)\n')
    }
    
    // Check for accessibility features in CSS
    console.log('🔧 Accessibility Features Check:')
    
    const features = [
      { name: 'Focus indicators', pattern: /outline.*solid/, found: false },
      { name: 'High contrast support', pattern: /@media.*prefers-contrast.*high/, found: false },
      { name: 'Reduced motion support', pattern: /@media.*prefers-reduced-motion/, found: false },
      { name: 'Text selection enabled', pattern: /user-select:\s*text/, found: false },
      { name: 'Font smoothing', pattern: /-webkit-font-smoothing/, found: false }
    ]
    
    features.forEach(feature => {
      feature.found = feature.pattern.test(cssContent)
      console.log(`   ${feature.found ? '✅' : '❌'} ${feature.name}`)
    })
    
    const missingFeatures = features.filter(f => !f.found).length
    if (missingFeatures > 0) {
      console.log(`\n⚠️  ${missingFeatures} accessibility features missing`)
      hasErrors = true
    } else {
      console.log('\n✅ All accessibility features present')
    }
    
    // Final result
    console.log('\n' + '='.repeat(50))
    if (hasErrors) {
      console.log('❌ ACCESSIBILITY VALIDATION FAILED')
      console.log('   Please address the issues above')
      process.exit(1)
    } else {
      console.log('✅ ACCESSIBILITY VALIDATION PASSED')
      console.log('   Version display meets accessibility requirements')
    }
    
  } catch (error) {
    console.error('❌ Error validating accessibility:', error.message)
    process.exit(1)
  }
}

// Run validation
validateAccessibility()