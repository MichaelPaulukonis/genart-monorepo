import '../css/style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'
import { Cell } from './cell.js'
import { Word } from './word.js'

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
  scale: 20,
  verticalRatio: 0.0,
  centerSpeed: 0.005,
  xOffsetSpeed: 0.11,
  yOffsetSpeed: 0.164,
  zOffsetSpeed: 0.001,
  sourceCount: 1,
  maxSpeed: 0.5,
  damping: 0.85,
  wanderForce: 0.08,
  gravityForce: 0.15,
  separationForce: 0.2
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
  const backgroundChars = "..........,,,,,:::::;;;;;'''''".split('')
  const SOURCE_PALETTES = [
    { repel: [0, 150, 255],   attract: [255, 200, 0]   },
    { repel: [180, 0, 220],   attract: [255, 120, 0]   },
    { repel: [0, 200, 180],   attract: [255, 50, 80]   },
    { repel: [0, 180, 80],    attract: [220, 0, 180]   },
    { repel: [80, 80, 200],   attract: [180, 220, 0]   }
  ]

  const btn = pane.addButton({ title: 'Step: OFF' })
  btn.on('click', () => {
    params.stepMode = !params.stepMode
    btn.title = params.stepMode ? 'Step: ON' : 'Step: OFF'
    p.canvas.focus()
    if (!params.stepMode) p.loop()
  })

  let prevScale = params.scale
  pane.addBinding(params, 'scale', { min: 10, max: 50, step: 1 })
    .on('change', () => {
      if (params.scale === prevScale) return
      prevScale = params.scale
      init()
    })
  pane.addBinding(params, 'verticalRatio', { min: 0, max: 1, step: 0.05, label: 'vert ratio' })

  const gravityFolder = pane.addFolder({ title: 'gravity' })
  gravityFolder.addBinding(params, 'centerSpeed', { min: 0.001, max: 0.1, step: 0.001, label: 'center speed' })
  gravityFolder.addBinding(params, 'sourceCount', { min: 0, max: 5, step: 1, label: 'sources' })
    .on('change', () => buildSources())
  const sourcesFolder = gravityFolder.addFolder({ title: 'source strengths' })

  const physicsFolder = pane.addFolder({ title: 'physics' })
  physicsFolder.addBinding(params, 'maxSpeed', { min: 0.05, max: 3, step: 0.05 })
  physicsFolder.addBinding(params, 'damping', { min: 0.5, max: 0.99, step: 0.01 })
  physicsFolder.addBinding(params, 'wanderForce', { min: 0, max: 0.5, step: 0.01, label: 'wander' })
  physicsFolder.addBinding(params, 'gravityForce', { min: 0, max: 1, step: 0.01, label: 'gravity force' })
  physicsFolder.addBinding(params, 'separationForce', { min: 0, max: 1, step: 0.01, label: 'separation' })
  physicsFolder.addBinding(params, 'xOffsetSpeed', { min: 0.001, max: 1, step: 0.001 })
  physicsFolder.addBinding(params, 'yOffsetSpeed', { min: 0.001, max: 1, step: 0.001 })
  physicsFolder.addBinding(params, 'zOffsetSpeed', { min: 0.001, max: 1, step: 0.001 })

  p.keyPressed = () => {
    if (p.key === 'c' || p.key === 'C') showCenter = !showCenter
    if (p.key === '?') window.aboutControls && window.aboutControls.toggle()
  }

  function buildSources () {
    const target = params.sourceCount
    while (gravitySources.length < target) {
      gravitySources.push({
        x: 0,
        y: 0,
        strength: 0.6,
        xoff: p.random(1000),
        yoff: p.random(1000) + 1000
      })
    }
    gravitySources.splice(target)
    rebuildSourceUI()
  }

  function rebuildSourceUI () {
    sourcesFolder.children.slice().forEach(c => c.dispose())
    gravitySources.forEach((src, i) => {
      sourcesFolder.addBinding(src, 'strength', {
        min: -1,
        max: 1,
        step: 0.05,
        label: 'strength ' + (i + 1)
      })
    })
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
        row.push(new Cell(x, y, params.scale, p))
      }
      grid.push(row)
    }

    for (let i = 0; i < words.length; i++) {
      const startX = p.noise(p.random(1000)) * cols
      const startY = p.noise(p.random(1000)) * rows
      const w = new Word(words[i], startX, startY, p, params)
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
    rebuildSourceUI()
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
        const char = backgroundChars[p.floor(n * backgroundChars.length)]
        grid[y][x].setLetter(char)
      }
    }

    for (let i = 0; i < wordObjects.length; i++) {
      wordObjects[i].update(wordObjects, gravitySources, cols, rows)
      wordObjects[i].assignToGrid(grid, cols, rows)
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        grid[y][x].display()
      }
    }

    if (showCenter) {
      const neutral = p.color(255, 255, 255)
      gravitySources.forEach((src, i) => {
        const cx = p.floor(src.x)
        const cy = p.floor(src.y)
        if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
          const palette = SOURCE_PALETTES[i % SOURCE_PALETTES.length]
          let col
          if (src.strength >= 0) {
            const hot = p.color(...palette.attract)
            col = p.lerpColor(neutral, hot, src.strength)
          } else {
            const cold = p.color(...palette.repel)
            col = p.lerpColor(neutral, cold, -src.strength)
          }
          p.noStroke()
          p.fill(col)
          p.rect(cx * params.scale, cy * params.scale, params.scale, params.scale)
          p.fill(0)
          p.text(grid[cy][cx].letter, cx * params.scale + params.scale / 2, cy * params.scale + params.scale / 2)
        }
      })
    }

    if (params.stepMode) p.noLoop()
  }
})
