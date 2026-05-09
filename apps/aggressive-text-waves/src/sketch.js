import '../css/style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'

const sourceText = `Now is the winter of our discontent
Made glorious summer by this sun of York;
And all the clouds that lour'd upon our house
In the deep bosom of the ocean buried.
Now are our brows bound with victorious wreaths;
Our bruised arms hung up for monuments;
Our stern alarums changed to merry meetings,
Our dreadful marches to delightful measures.
Grim-visaged war hath smooth'd his wrinkled front;
And now, instead of mounting barbed steeds
To fright the souls of fearful adversaries,
He capers nimbly in a lady's chamber
To the lascivious pleasing of a lute.`

const params = {
  stepMode: false,
  speed: 0.1,
  scale: 20,
  verticalRatio: 0.0,
  gravityStrength: 0.6,
  centerSpeed: 0.005,
  xOffsetSpeed: 0.11,
  yOffsetSpeed: 0.164,
  zOffsetSpeed: 0.001,
  sourceCount: 1
}

const pane = new Pane()

// eslint-disable-next-line no-new
new p5((p) => {
  let cols, rows
  let words
  let grid = []
  let wordObjects = []
  let zoff = 0
  let gravitySources = []
  let showCenter = false
  const backgroundLetters = "..........,,,,,:::::;;;;;'''''".split('')

  const btn = pane.addButton({ title: 'Step: OFF' })
  btn.on('click', () => {
    params.stepMode = !params.stepMode
    btn.title = params.stepMode ? 'Step: ON' : 'Step: OFF'
    p.canvas.focus()
    if (!params.stepMode) p.loop()
  })

  let prevScale = params.scale
  pane.addBinding(params, 'speed', { min: 0, max: 1, step: 0.01 })
  pane.addBinding(params, 'scale', { min: 10, max: 50, step: 1 })
    .on('change', () => {
      if (params.scale === prevScale) return
      prevScale = params.scale
      init()
    })
  pane.addBinding(params, 'verticalRatio', { min: 0, max: 1, step: 0.05, label: 'vert ratio' })
  pane.addBinding(params, 'gravityStrength', { min: -1, max: 1, step: 0.05, label: 'gravity (+attract/-repel)' })
  pane.addBinding(params, 'centerSpeed', { min: 0.001, max: 0.1, step: 0.001, label: 'center speed' })
  pane.addBinding(params, 'xOffsetSpeed', { min: 0.001, max: 1, step: 0.001 })
  pane.addBinding(params, 'yOffsetSpeed', { min: 0.001, max: 1, step: 0.001 })
  pane.addBinding(params, 'zOffsetSpeed', { min: 0.001, max: 1, step: 0.001 })
  pane.addBinding(params, 'sourceCount', { min: 0, max: 5, step: 1, label: 'sources' })
    .on('change', () => buildSources())

  p.keyPressed = () => {
    if (p.key === 'c' || p.key === 'C') showCenter = !showCenter
    if (p.key === '?') window.aboutControls && window.aboutControls.toggle()
  }

  class Cell {
    constructor (x, y, scale) {
      this.x = x
      this.y = y
      this.letter = ' '
      this.scale = scale
    }

    clear () { this.letter = ' ' }
    setLetter (letter) { this.letter = letter }

    display () {
      p.fill(0)
      p.text(
        this.letter,
        this.x * this.scale + this.scale / 2,
        this.y * this.scale + this.scale / 2
      )
    }
  }

  class Word {
    constructor (text, x, y, ctx) {
      this.ctx = ctx
      this.text = text
      this.x = x
      this.y = y
      this.xoff = this.ctx.random(1000)
      this.yoff = this.ctx.random(1000)
      this.zoff = this.ctx.random(1000)
      this.isVertical = Math.random() < params.verticalRatio
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

    resolveOverlap (words) {
      for (const word of words) {
        if (word !== this) {
          const overlap = this.touches(word)
          if (overlap > 0) {
            if (this.isVertical === word.isVertical) {
              if (this.isVertical) {
                const dir = this.y < word.y ? -1 : 1
                this.y += dir
                word.y -= dir
              } else {
                const dir = Math.random() < 0.5 ? -1 : 1
                this.y += dir
                word.y -= dir
              }
            } else {
              if (this.isVertical) {
                this.y += 1
              } else {
                this.x += 1
              }
            }
          }
        }
      }
    }

    update (words, sources) {
      const personalX = this.ctx.floor(this.ctx.noise(this.xoff, this.zoff) * cols)
      const personalY = this.ctx.floor(this.ctx.noise(this.yoff, this.zoff) * rows)

      const halfLen = this.ctx.floor(this.text.length / 2)

      const avgStrength = params.gravityStrength
      let targetX, targetY

      if (avgStrength >= 0) {
        let gravTargetX = personalX
        let gravTargetY = personalY
        if (sources.length > 0) {
          let sumX = 0
          let sumY = 0
          for (const src of sources) {
            sumX += src.x - (this.isVertical ? 0 : halfLen)
            sumY += src.y - (this.isVertical ? halfLen : 0)
          }
          gravTargetX = sumX / sources.length
          gravTargetY = sumY / sources.length
        }
        targetX = this.ctx.floor(this.ctx.lerp(personalX, gravTargetX, avgStrength))
        targetY = this.ctx.floor(this.ctx.lerp(personalY, gravTargetY, avgStrength))
      } else {
        const s = Math.abs(avgStrength)
        let fleeX = 0
        let fleeY = 0

        for (const src of sources) {
          const sx = src.x - (this.isVertical ? 0 : halfLen)
          const sy = src.y - (this.isVertical ? halfLen : 0)
          const dx = personalX - sx
          const dy = personalY - sy
          fleeX += dx !== 0 ? Math.sign(dx) : (Math.random() > 0.5 ? 1 : -1)
          fleeY += dy !== 0 ? Math.sign(dy) : (Math.random() > 0.5 ? 1 : -1)
        }

        if (fleeX === 0) fleeX = Math.random() > 0.5 ? 1 : -1
        if (fleeY === 0) fleeY = Math.random() > 0.5 ? 1 : -1

        targetX = this.ctx.floor(this.x + Math.sign(fleeX) * s * cols * 0.5)
        targetY = this.ctx.floor(this.y + Math.sign(fleeY) * s * rows * 0.5)
      }

      const step = Math.random() < (params.speed * params.speed) ? 1 : 0

      if (step > 0) {
        const dx = targetX - this.x
        const dy = targetY - this.y
        this.x += dx !== 0 ? Math.sign(dx) : 0
        this.y += dy !== 0 ? Math.sign(dy) : 0
        if (Math.random() > Math.abs(avgStrength)) {
          this.resolveOverlap(words)
        }
      }

      if (this.x < 0) this.x = cols
      if (this.x > cols) this.x = 0
      if (this.y < 0) this.y = rows
      if (this.y > rows) this.y = 0

      this.xoff += params.xOffsetSpeed
      this.yoff += params.yOffsetSpeed
      this.zoff += params.zOffsetSpeed
    }

    assignToGrid (grid) {
      for (let i = 0; i < this.text.length; i++) {
        const x = this.isVertical ? this.x : (this.x + i) % cols
        const y = this.isVertical ? (this.y + i) % rows : this.y
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
          grid[y][x].setLetter(this.text.charAt(i))
        }
      }
    }
  }

  function buildSources () {
    gravitySources = []
    for (let i = 0; i < params.sourceCount; i++) {
      gravitySources.push({
        x: 0,
        y: 0,
        strength: params.gravityStrength,
        xoff: p.random(1000),
        yoff: p.random(1000) + 1000
      })
    }
  }

  function init () {
    cols = p.floor(p.width / params.scale)
    rows = p.floor(p.height / params.scale)
    p.textSize(params.scale - 4)
    grid = []
    wordObjects = []

    for (let y = 0; y < rows; y++) {
      const row = []
      for (let x = 0; x < cols; x++) {
        row.push(new Cell(x, y, params.scale))
      }
      grid.push(row)
    }

    for (let i = 0; i < words.length; i++) {
      const w = new Word(words[i], 0, 0, p)
      w.x = p.floor(p.noise(w.xoff, w.zoff) * cols)
      w.y = p.floor(p.noise(w.yoff, w.zoff) * rows)
      wordObjects.push(w)
    }

    buildSources()
  }

  p.setup = () => {
    p.createCanvas(800, 800)
    p.frameRate(10)
    p.textAlign(p.CENTER, p.CENTER)
    words = p.splitTokens(sourceText.toUpperCase(), ' ,.;\n')
    init()
  }

  p.draw = () => {
    p.background(255)
    zoff += 0.01

    for (const src of gravitySources) {
      src.xoff += params.centerSpeed
      src.yoff += params.centerSpeed
      src.x = p.noise(src.xoff) * cols
      src.y = p.noise(src.yoff) * rows
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        grid[y][x].clear()
        const n = p.noise(x * 0.1, y * 0.1, zoff)
        const char = backgroundLetters[p.floor(n * backgroundLetters.length)]
        grid[y][x].setLetter(char)
      }
    }

    for (let i = 0; i < wordObjects.length; i++) {
      wordObjects[i].update(wordObjects, gravitySources)
      wordObjects[i].assignToGrid(grid)
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        grid[y][x].display()
      }
    }

    if (showCenter) {
      for (const src of gravitySources) {
        const cx = p.floor(src.x)
        const cy = p.floor(src.y)
        if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
          p.noStroke()
          p.fill(255, 221, 0)
          p.rect(cx * params.scale, cy * params.scale, params.scale, params.scale)
          p.fill(0)
          p.text(grid[cy][cx].letter, cx * params.scale + params.scale / 2, cy * params.scale + params.scale / 2)
        }
      }
    }

    if (params.stepMode) p.noLoop()
  }
})
