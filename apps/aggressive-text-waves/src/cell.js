export class Cell {
  constructor (x, y, scale, ctx) {
    this.x = x
    this.y = y
    this.letter = ' '
    this.scale = scale
    this.ctx = ctx
  }

  clear () { this.letter = ' ' }
  setLetter (letter) { this.letter = letter }

  display () {
    this.ctx.fill(0)
    this.ctx.text(
      this.letter,
      this.x * this.scale + this.scale / 2,
      this.y * this.scale + this.scale / 2
    )
  }
}
