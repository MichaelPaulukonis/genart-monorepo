// Pileup strategy: displacement cascade (shove blockers forward along the
// mover's velocity, energy loss per step, bounded recursion depth).
// Contract: (word, ctx) => boolean. Return true if the word was placed
// (claimed via ctx.tryClaim); false if it gave up (word.revert()).
// ctx = { blockers, grid, cols, rows, tryClaim, strategy, depth? }
//
// PLACEHOLDER — filled in by the Strategy C worktree. Reverts for now.
export function cascade (word, ctx) {
  return word.revert()
}
