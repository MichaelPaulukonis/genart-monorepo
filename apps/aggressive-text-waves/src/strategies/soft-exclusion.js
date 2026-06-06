// Pileup strategy: enhanced soft exclusion.
// Contract: (word, ctx) => boolean. Push velocity away from each blocker with
// an inverse-square repulsion (strongest when nearly coincident), then try to
// claim this frame; if still blocked, hold position. The repulsion persists
// into next frame's physics, so words ease apart instead of hard-bouncing.
// ctx = { blockers, grid, cols, rows, tryClaim, strategy, depth? }
const REPULSION = 0.3

export function softExclusion (word, ctx) {
  for (const blocker of ctx.blockers) {
    let dx = word.posX - blocker.posX
    let dy = word.posY - blocker.posY
    let dist2 = dx * dx + dy * dy
    if (dist2 === 0) {
      // coincident: pick a random escape direction so they don't stick
      dx = word.ctx.random() - 0.5
      dy = word.ctx.random() - 0.5
      dist2 = dx * dx + dy * dy || 1
    }
    const mag = Math.sqrt(dist2) || 1
    const force = REPULSION / (dist2 + 1)
    word.vx += (dx / mag) * force
    word.vy += (dy / mag) * force
  }
  if (ctx.tryClaim(word)) return true
  return word.revert()
}
