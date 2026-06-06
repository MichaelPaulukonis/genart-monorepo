import { rejectBounce } from './strategies/reject-bounce.js'
import { cascade } from './strategies/cascade.js'
import { softExclusion } from './strategies/soft-exclusion.js'

// Registry of selectable pileup-mitigation strategies for nonOverlap mode.
// Key = params.pileupStrategy value; value = (word, ctx) => boolean.
export const PILEUP_STRATEGIES = {
  rejectBounce,
  cascade,
  softExclusion
}

// Options for the Tweakpane list (order = display order).
export const PILEUP_STRATEGY_OPTIONS = [
  { text: 'reject + bounce', value: 'rejectBounce' },
  { text: 'cascade', value: 'cascade' },
  { text: 'soft exclusion', value: 'softExclusion' }
]
