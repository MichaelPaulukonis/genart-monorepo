// Pileup strategy: hard rejection + bounce.
// Contract: (word, ctx) => boolean. Return true if the word was placed
// (claimed via ctx.tryClaim); false if it gave up (word.revert()).
// ctx = { blockers, grid, cols, rows, tryClaim, strategy, depth? }
//
// PLACEHOLDER — filled in by the Strategy A worktree. Reverts for now.
export function rejectBounce (word, ctx) {
  return word.revert()
}
