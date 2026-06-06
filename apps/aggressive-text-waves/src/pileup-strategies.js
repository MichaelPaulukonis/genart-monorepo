import { rejectBounce } from './strategies/reject-bounce.js'
import { cascade } from './strategies/cascade.js'
import { softExclusion } from './strategies/soft-exclusion.js'
import { crystallize, crystallizePostResolve } from './strategies/crystallize.js'

// Registry of selectable pileup-mitigation strategies for nonOverlap mode.
// Key = params.pileupStrategy value; value = (word, ctx) => boolean.
export const PILEUP_STRATEGIES = {
  rejectBounce,
  cascade,
  softExclusion,
  crystallize
}

// Optional post-resolve hooks: name -> (wordObjects, grid, cols, rows).
// Called once after the claim loop for strategies that need a global pass.
export const PILEUP_POST = {
  crystallize: crystallizePostResolve
}

// Options for the Tweakpane list (order = display order).
export const PILEUP_STRATEGY_OPTIONS = [
  { text: 'reject + bounce', value: 'rejectBounce' },
  { text: 'cascade', value: 'cascade' },
  { text: 'soft exclusion', value: 'softExclusion' },
  { text: 'crystallize', value: 'crystallize' }
]
