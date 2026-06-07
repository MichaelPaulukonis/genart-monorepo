import '../css/style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'
import { Cell } from './cell.js'
import { Word } from './word.js'
import { resolveOccupancy } from './occupancy.js'
import { PILEUP_STRATEGY_OPTIONS } from './pileup-strategies.js'
import { saveWithFallback, checkServer, isServerAvailable } from './utils/save-local.js'
import { createOffscreenCanvas } from '@genart/p5-utils'
import { BUNDLED_TEXTS, createBundledSource, createUserTextSource, createTumblrSource } from './text-sources.js'
import { createTextModal } from './text-modal.js'

const textModal = createTextModal()
const textSources = [
  ...BUNDLED_TEXTS.map(createBundledSource),
  createTumblrSource(),
  createUserTextSource({ getText: () => textModal.open() })
]

const OFFSCREEN_SIZE = 2000
const ONSCREEN_SIZE = 800

const params = {
  stepMode: false,
  showOutline: true,
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
  separationForce: 0.2,
  overlapMode: 'gibberish',
  pileupStrategy: 'rejectBounce',
  softRepulsion: 0.3
}

// eslint-disable-next-line no-new
new p5((p) => {
  const pane = new Pane()
  let cols, rows
  let words
  let grid = []
  let wordObjects = []
  let backgroundZoff = 0
  let lastResolve = { relaxed: 0 }
  const gravitySources = []
  let showCenter = false
  let showOccupancy = false
  let pg
  let offscreenScale
  let displayOffscreen
  const backgroundChars = "..........,,,,,:::::;;;;;'''''".split('')
  const SOURCE_PALETTES = [
    { repel: [0, 150, 255], attract: [255, 200, 0] },
    { repel: [180, 0, 220], attract: [255, 120, 0] },
    { repel: [0, 200, 180], attract: [255, 50, 80] },
    { repel: [0, 180, 80], attract: [220, 0, 180] },
    { repel: [80, 80, 200], attract: [180, 220, 0] }
  ]

  pane.addBinding(params, 'showOutline', { label: 'outline' })
    .on('change', () => { if (params.stepMode) render() })

  const btn = pane.addButton({ title: 'Step: OFF' })

  function toggleStep () {
    params.stepMode = !params.stepMode
    btn.title = params.stepMode ? 'Step: ON' : 'Step: OFF'
    if (!params.stepMode) p.loop()
    else p.noLoop()
  }

  btn.on('click', () => { toggleStep(); p.canvas.focus() })

  let streaming = false
  let streamFrame = 0
  const recordBtn = pane.addButton({ title: 'Record: OFF' })

  function toggleRecord () {
    streaming = !streaming
    streamFrame = 0
    recordBtn.title = streaming ? 'Record: ON' : 'Record: OFF'
  }

  recordBtn.on('click', () => { toggleRecord(); p.canvas.focus() })

  let prevScale = params.scale
  pane.addBinding(params, 'scale', { min: 10, max: 50, step: 1 })
    .on('change', () => {
      if (params.scale === prevScale) return
      prevScale = params.scale
      init()
    })
  pane.addBinding(params, 'verticalRatio', { min: 0, max: 1, step: 0.05, label: 'vert ratio' })

  // crystallize is the only strategy that locks words; if we leave it (or leave
  // nonOverlap), release any locks so words don't stay frozen/faded forever
  function clearLocksIfInactive () {
    if (params.overlapMode !== 'nonOverlap' || params.pileupStrategy !== 'crystallize') {
      for (const w of wordObjects) w.isLocked = false
    }
  }

  pane.addBlade({
    view: 'list',
    label: 'overlap',
    options: [
      { text: 'gibberish', value: 'gibberish' },
      { text: 'nonOverlap', value: 'nonOverlap' }
    ],
    value: params.overlapMode
  }).on('change', (ev) => { params.overlapMode = ev.value; clearLocksIfInactive() })

  pane.addBlade({
    view: 'list',
    label: 'pileup',
    options: PILEUP_STRATEGY_OPTIONS,
    value: params.pileupStrategy
  }).on('change', (ev) => { params.pileupStrategy = ev.value; clearLocksIfInactive() })

  pane.addBinding(params, 'softRepulsion', { min: 0, max: 2, step: 0.05, label: 'soft repel' })

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

  let lastBundledSource = textSources[0]
  const textStatus = { status: '' }

  async function loadFromSource (source) {
    if (!source) return
    const wasStepping = params.stepMode
    if (!wasStepping) p.noLoop()
    if (source.isNetworkSource) {
      textStatus.status = 'Loading...'
      statusBlade.refresh()
    }
    try {
      const newWords = await source.fetchWords()
      if (newWords !== null) {
        words = newWords
        init()
        if (!source.isNetworkSource && source.id !== 'user-input') {
          lastBundledSource = source
        }
      }
      textStatus.status = ''
    } catch (_err) {
      const fallback = lastBundledSource
      textStatus.status = `Failed — using ${fallback.name}`
      words = fallback.fetchWords()
      init()
      setTimeout(() => { textStatus.status = ''; statusBlade.refresh() }, 3000)
    }
    statusBlade.refresh()
    if (!wasStepping) p.loop()
    p.canvas.focus()
  }

  const textFolder = pane.addFolder({ title: 'text' })
  const sourceOptions = textSources
    .filter(s => s.id !== 'user-input')
    .map(s => ({ text: s.name, value: s.id }))
  let selectedSourceId = textSources[0].id
  textFolder.addBlade({
    view: 'list',
    label: 'source',
    options: sourceOptions,
    value: selectedSourceId
  }).on('change', (ev) => { selectedSourceId = ev.value })
  textFolder.addButton({ title: 'Load' }).on('click', () => {
    loadFromSource(textSources.find(s => s.id === selectedSourceId))
  })
  textFolder.addButton({ title: 'Custom Text...' }).on('click', () => {
    loadFromSource(textSources.find(s => s.id === 'user-input'))
  })
  const statusBlade = textFolder.addBinding(textStatus, 'status', { readonly: true, label: 'info' })

  p.keyPressed = () => {
    if (p.key === ' ') toggleStep()
    if (p.key === 'n' || p.key === 'N') { if (params.stepMode) { update(); render() } }
    if (p.key === 'c' || p.key === 'C') showCenter = !showCenter
    if (p.key === 'd' || p.key === 'D') showOccupancy = !showOccupancy
    if (p.key === 'o' || p.key === 'O') {
      params.showOutline = !params.showOutline
      pane.refresh()
      if (params.stepMode) render()
    }
    if (p.key === 's' || p.key === 'S') {
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      saveWithFallback(p, pg, `aggressive-text-waves-${ts}.png`)
    }
    if (p.key === 'r' || p.key === 'R') toggleRecord()
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
    const cellSize = params.scale * offscreenScale
    pg.textSize((params.scale - 4) * offscreenScale)
    grid = []
    wordObjects = []

    for (let y = 0; y < rows; y++) {
      const row = []
      for (let x = 0; x < cols; x++) {
        row.push(new Cell(x, y, cellSize, pg))
      }
      grid.push(row)
    }

    for (let i = 0; i < words.length; i++) {
      const startX = p.random(cols)
      const startY = p.random(rows)
      const w = new Word(words[i], startX, startY, p, params)
      wordObjects.push(w)
    }

    buildSources()
  }

  function update () {
    backgroundZoff += params.zOffsetSpeed

    for (const src of gravitySources) {
      src.xoff += params.centerSpeed
      src.yoff += params.centerSpeed
      src.x = p.noise(src.xoff) * cols
      src.y = p.noise(src.yoff) * rows
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        grid[y][x].clear()
        const n = p.noise(x * 0.1, y * 0.1, backgroundZoff)
        const char = backgroundChars[p.floor(n * backgroundChars.length)]
        grid[y][x].setLetter(char)
      }
    }

    // Phase 1: physics (no stamping)
    for (let i = 0; i < wordObjects.length; i++) {
      wordObjects[i].update(wordObjects, gravitySources, cols, rows)
    }
    // Phase 2: deterministic occupancy commit
    lastResolve = resolveOccupancy({
      wordObjects,
      grid,
      cols,
      rows,
      overlapMode: params.overlapMode,
      pileupStrategy: params.pileupStrategy
    })
  }

  function render () {
    const cellSize = params.scale * offscreenScale

    pg.background(255)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x]
        // crystallized (locked) words render faded/ghostly
        cell.display(cell.occupiedBy && cell.occupiedBy.isLocked ? 90 : 255)
      }
    }

    if (params.showOutline) {
      pg.stroke(0)
      pg.strokeWeight(2 * offscreenScale)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (!grid[y][x].isWord) continue
          const px = x * cellSize
          const py = y * cellSize
          const s = cellSize
          if (y === 0 || !grid[y - 1][x].isWord) pg.line(px, py, px + s, py)
          if (y === rows - 1 || !grid[y + 1][x].isWord) pg.line(px, py + s, px + s, py + s)
          if (x === 0 || !grid[y][x - 1].isWord) pg.line(px, py, px, py + s)
          if (x === cols - 1 || !grid[y][x + 1].isWord) pg.line(px + s, py, px + s, py + s)
        }
      }
    }
    pg.noStroke()

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
          pg.noStroke()
          pg.fill(col)
          pg.rect(cx * cellSize, cy * cellSize, cellSize, cellSize)
          pg.fill(0)
          pg.text(grid[cy][cx].letter, cx * cellSize + cellSize / 2, cy * cellSize + cellSize / 2)
        }
      })
    }

    if (showOccupancy && params.overlapMode === 'nonOverlap') {
      pg.noStroke()
      pg.fill(0, 180, 255, 80)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[y][x].occupiedBy !== null) {
            pg.rect(x * cellSize, y * cellSize, cellSize, cellSize)
          }
        }
      }
    }

    // mode badge
    const badgeFlash = lastResolve.relaxed > 0
    pg.noStroke()
    pg.fill(badgeFlash ? p.color(220, 40, 40) : p.color(0, 0, 0, 160))
    pg.rect(0, 0, 220 * offscreenScale, 34 * offscreenScale)
    pg.fill(255)
    pg.textSize(18 * offscreenScale)
    pg.textAlign(pg.LEFT, pg.CENTER)
    pg.text(`mode: ${params.overlapMode}${badgeFlash ? ' (relax!)' : ''}`,
      8 * offscreenScale, 17 * offscreenScale)
    pg.textAlign(pg.CENTER, pg.CENTER)
    pg.textSize((params.scale - 4) * offscreenScale)

    displayOffscreen()
  }

  p.setup = () => {
    p.createCanvas(ONSCREEN_SIZE, ONSCREEN_SIZE)
    p.frameRate(10)
    ;({ pg, scale: offscreenScale, display: displayOffscreen } = createOffscreenCanvas(p, {
      outputSize: OFFSCREEN_SIZE,
      displaySize: ONSCREEN_SIZE
    }))
    pg.textAlign(pg.CENTER, pg.CENTER)
    words = textSources[0].fetchWords()
    init()
    rebuildSourceUI()
    checkServer()
  }

  p.draw = () => {
    update()
    render()

    if (streaming && isServerAvailable() !== false) {
      streamFrame++
      saveWithFallback(p, pg, `aggressive-text-waves-${String(streamFrame).padStart(4, '0')}.png`)
    }
  }
})
