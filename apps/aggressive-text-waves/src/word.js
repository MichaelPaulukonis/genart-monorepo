import { PILEUP_STRATEGIES } from './pileup-strategies.js'

export class Word {
  constructor (text, x, y, ctx, params) {
    this.ctx = ctx
    this.params = params
    this.text = text
    this.posX = x
    this.posY = y
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.prevPosX = x
    this.prevPosY = y
    this.stuckFrames = 0
    this.isLocked = false
    this.xoff = this.ctx.random(1000)
    this.yoff = this.ctx.random(1000)
    this.zoff = this.ctx.random(1000)
    this.isVertical = this.ctx.random() < params.verticalRatio
  }

  touches (other) {
    if (this.isVertical === other.isVertical) {
      if (this.isVertical) {
        if (this.x !== other.x) return 0
        const { minWord, maxWord } =
          this.y < other.y
            ? { minWord: this, maxWord: other }
            : { minWord: other, maxWord: this }
        const overlap = maxWord.y - (minWord.y + minWord.text.length)
        return overlap >= 0 ? 0 : -overlap
      } else {
        if (this.y !== other.y) return 0
        const { minWord, maxWord } =
          this.x < other.x
            ? { minWord: this, maxWord: other }
            : { minWord: other, maxWord: this }
        const overlap = maxWord.x - (minWord.x + minWord.text.length)
        return overlap >= 0 ? 0 : -overlap
      }
    } else {
      if (this.isVertical) {
        if (
          other.x >= this.x &&
          other.x < this.x + 1 &&
          this.y >= other.y &&
          this.y < other.y + other.text.length
        ) {
          return 1
        }
      } else {
        if (
          this.x >= other.x &&
          this.x < other.x + other.text.length &&
          other.y >= this.y &&
          other.y < this.y + 1
        ) {
          return 1
        }
      }
      return 0
    }
  }

  _applySeparation (words) {
    const params = this.params
    for (const word of words) {
      if (word === this) continue
      const overlap = this.touches(word)
      if (overlap <= 0) continue
      let dx, dy
      if (this.isVertical === word.isVertical) {
        if (this.isVertical) {
          dx = 0
          dy = this.y < word.y ? -overlap : overlap
        } else {
          dx = 0
          dy = this.posY >= word.posY ? overlap : -overlap
        }
      } else {
        dx = this.isVertical ? 0 : overlap
        dy = this.isVertical ? overlap : 0
      }
      const mag = Math.sqrt(dx * dx + dy * dy) || 1
      this.vx += (dx / mag) * params.separationForce
      this.vy += (dy / mag) * params.separationForce
    }
  }

  update (words, sources, cols, rows) {
    if (this.isLocked) return // crystallized: immovable, no physics
    const params = this.params
    const halfLen = Math.floor(this.text.length / 2)

    // wandering force from noise — map noise [0,1] to force direction [-1,1]
    const nx = this.ctx.noise(this.xoff, this.zoff) * 2 - 1
    const ny = this.ctx.noise(this.yoff, this.zoff) * 2 - 1
    this.vx += nx * params.wanderForce
    this.vy += ny * params.wanderForce

    // gravity/repulsion as incremental force
    for (const src of sources) {
      if (src.strength === 0) continue
      const tx = src.x - (this.isVertical ? 0 : halfLen)
      const ty = src.y - (this.isVertical ? halfLen : 0)
      let dx = tx - this.posX
      let dy = ty - this.posY
      if (src.strength < 0) {
        // repulsion: flip direction toward antipodal point; guard dx===0/dy===0 to avoid wrong-direction force
        if (dx !== 0) dx = dx > 0 ? dx - cols / 2 : dx + cols / 2
        if (dy !== 0) dy = dy > 0 ? dy - rows / 2 : dy + rows / 2
      }
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const forceMag = Math.abs(src.strength) * params.gravityForce
      this.vx += (dx / dist) * forceMag
      this.vy += (dy / dist) * forceMag
    }

    // separation
    const avgMag = sources.length > 0
      ? sources.reduce((s, src) => s + Math.abs(src.strength), 0) / sources.length
      : 0
    if (this.ctx.random() > avgMag) {
      this._applySeparation(words)
    }

    // clamp velocity
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > params.maxSpeed) {
      this.vx = (this.vx / speed) * params.maxSpeed
      this.vy = (this.vy / speed) * params.maxSpeed
    }

    // apply velocity
    this.posX += this.vx
    this.posY += this.vy

    // dampen
    this.vx *= params.damping
    this.vy *= params.damping

    // wrap
    if (this.posX < 0) this.posX += cols
    if (this.posX >= cols) this.posX -= cols
    if (this.posY < 0) this.posY += rows
    if (this.posY >= rows) this.posY -= rows

    // integer grid coords
    this.x = Math.floor(this.posX)
    this.y = Math.floor(this.posY)

    this.xoff += params.xOffsetSpeed
    this.yoff += params.yOffsetSpeed
    this.zoff += params.zOffsetSpeed
  }

  // mark the current position as the last successfully-placed one
  commitPosition () {
    this.prevPosX = this.posX
    this.prevPosY = this.posY
    this.stuckFrames = 0
  }

  // revert to previous committed position; returns false (word not newly placed)
  revert () {
    this.posX = this.prevPosX
    this.posY = this.prevPosY
    this.x = Math.floor(this.posX)
    this.y = Math.floor(this.posY)
    return false
  }

  // ctx: { blockers, grid, cols, rows, tryClaim, strategy, depth? }
  // dispatch to the selected pileup strategy; fall back to revert if unknown
  handleOverlap (ctx) {
    const strategy = PILEUP_STRATEGIES[ctx.strategy]
    if (strategy) return strategy(this, ctx)
    return this.revert()
  }

  stripCells (cols, rows) {
    const cells = []
    for (let i = 0; i < this.text.length; i++) {
      const x = this.isVertical ? this.x : (this.x + i) % cols
      const y = this.isVertical ? (this.y + i) % rows : this.y
      cells.push({ x, y, char: this.text.charAt(i) })
    }
    return cells
  }
}
