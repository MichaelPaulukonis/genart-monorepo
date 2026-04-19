// One-shot axe-core accessibility audit via Playwright
// Usage: node scripts/a11y-audit.mjs [url]
import { chromium } from '@playwright/test'

const url = process.argv[2] || 'http://localhost:5178'

const browser = await chromium.launch()
const page = await browser.newPage()

console.log(`Navigating to ${url} ...`)
await page.goto(url, { waitUntil: 'networkidle' })

// Expand all collapsed panels so their content is in the DOM and visible
const expanded = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('.panel-collapse-btn'))
  let count = 0
  for (const btn of btns) {
    const panel = btn.closest('.control-panel')
    if (panel && panel.classList.contains('is-collapsed')) {
      btn.click()
      count++
    }
  }
  // Show hidden control panels (Edit Controls, etc.)
  const hidden = Array.from(document.querySelectorAll('.control-panel.hidden'))
  for (const p of hidden) p.classList.remove('hidden')
  // Open About and Help modals so their content is audited
  const modals = Array.from(document.querySelectorAll('.info-box.hidden'))
  for (const m of modals) m.classList.remove('hidden')
  return { expandedPanels: count, revealedHidden: hidden.length, revealedModals: modals.length }
})
console.log(`Expanded ${expanded.expandedPanels} collapsed panel(s), revealed ${expanded.revealedHidden} hidden panel(s), opened ${expanded.revealedModals} modal(s)`)

// Small wait for any CSS transitions
await page.waitForTimeout(300)

// Inject axe-core from CDN
await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js' })

// Run the audit
const results = await page.evaluate(async () => {
  return await window.axe.run(document, {
    runOnly: ['wcag2a', 'wcag2aa', 'best-practice']
  })
})

await browser.close()

const { violations, incomplete } = results

console.log(`\n=== Axe-core Audit: ${url} ===\n`)
console.log(`Violations : ${violations.length}`)
console.log(`Incomplete : ${incomplete.length} (needs manual review)\n`)

if (violations.length === 0) {
  console.log('No violations found.')
} else {
  for (const v of violations) {
    const impact = v.impact.toUpperCase().padEnd(8)
    console.log(`[${impact}] ${v.id} — ${v.description}`)
    console.log(`  Help: ${v.helpUrl}`)
    for (const node of v.nodes) {
      console.log(`  • ${node.target.join(', ')}`)
      if (node.failureSummary) {
        console.log(`    ${node.failureSummary.replace(/\n/g, '\n    ')}`)
      }
    }
    console.log()
  }
}

if (incomplete.length) {
  console.log('--- Needs manual review ---')
  for (const i of incomplete) {
    console.log(`[REVIEW  ] ${i.id} — ${i.description}`)
    for (const node of i.nodes) {
      console.log(`  • ${node.target.join(', ')}`)
    }
  }
}
