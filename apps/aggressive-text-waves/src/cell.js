export class Cell {
  constructor (x, y, scale, ctx) {
    this.x = x
    this.y = y
    this.letter = ' '
    this.scale = scale
    this.ctx = ctx
    this.isWord = false
    this.occupiedBy = null
  }

  clear () {
    this.letter = ' '
    this.isWord = false
    this.occupiedBy = null
  }

  setLetter (letter) { this.letter = letter }
  setWordLetter (letter) { this.letter = letter; this.isWord = true }

  display (alpha = 255) {
    this.ctx.fill(0, alpha)
    this.ctx.text(
      this.letter,
      this.x * this.scale + this.scale / 2,
      this.y * this.scale + this.scale / 2
    )
  }
}
