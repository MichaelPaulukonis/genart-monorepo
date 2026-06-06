// Pileup strategy: displacement cascade (shove blockers forward along the
// mover's velocity, energy loss per step, bounded recursion depth).
// Contract: (word, ctx) => boolean. Return true if the word was placed
// (claimed via ctx.tryClaim); false if it gave up (word.revert()).
// ctx = { blockers, grid, cols, rows, tryClaim, strategy, depth? }
//
const MAX_DEPTH = 3

// Displacement cascade: shove each blocker forward along the mover's velocity
// (energy loss per recursion step), freeing its old cells and re-placing it;
// recurse on still-blocked blockers up to MAX_DEPTH. Then claim the mover if
// the path cleared, else stay put.
//
// KNOWN LIMITATIONS (cascade reads as disjointed vs reject-bounce; see memory
// project-text-waves-zlayering). Not yet addressed — cascade is the lower-pref
// strategy:
//   1. The recursive blocker.handleOverlap({ ...ctx }) call spreads the
//      ORIGINAL mover's ctx.blockers, not the sub-blocker's own current
//      blockers, so deeper levels re-process the wrong words.
//   2. At depth >= 1 the push uses the sub-blocker's own vx/vy, not the
//      original mover's attenuated impulse, so a stationary intermediate word
//      transmits ~zero displacement.
export function cascade (word, ctx) {
  const depth = ctx.depth || 0
  if (depth >= MAX_DEPTH) return word.revert()

  const loss = Math.pow(0.8, depth + 1)
  const pushX = word.vx * loss
  const pushY = word.vy * loss

  for (const blocker of ctx.blockers) {
    // free the blocker's current cells so it can be re-placed
    for (const { x, y } of blocker.stripCells(ctx.cols, ctx.rows)) {
      if (ctx.grid[y][x].occupiedBy === blocker) ctx.grid[y][x].occupiedBy = null
    }
    blocker.posX += pushX
    blocker.posY += pushY
    if (blocker.posX < 0) blocker.posX += ctx.cols
    if (blocker.posX >= ctx.cols) blocker.posX -= ctx.cols
    if (blocker.posY < 0) blocker.posY += ctx.rows
    if (blocker.posY >= ctx.rows) blocker.posY -= ctx.rows
    blocker.x = Math.floor(blocker.posX)
    blocker.y = Math.floor(blocker.posY)
    if (!ctx.tryClaim(blocker)) {
      blocker.handleOverlap({ ...ctx, depth: depth + 1 })
    }
  }

  if (ctx.tryClaim(word)) return true
  return word.revert()
}
