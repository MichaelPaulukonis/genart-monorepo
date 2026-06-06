// Pileup strategy: hard rejection + bounce.
// Contract: (word, ctx) => boolean. Return true if the word was placed
// (claimed via ctx.tryClaim); false if it gave up (word.revert()).
// ctx = { blockers, grid, cols, rows, tryClaim, strategy, depth? }
//
// Hard rejection + bounce: revert to last legal position, reverse + halve
// velocity (visible bounce), add small jitter to break lockstep oscillation,
// then re-claim. Returns whether the re-claim succeeded.
export function rejectBounce (word, ctx) {
  word.revert()
  word.vx *= -0.5
  word.vy *= -0.5
  word.vx += (word.ctx.random() - 0.5) * 0.05
  word.vy += (word.ctx.random() - 0.5) * 0.05
  return ctx.tryClaim(word)
}
