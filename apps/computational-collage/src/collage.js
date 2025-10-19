import saveAs from 'file-saver'
import '../css/collage.style.css'
import { Pane } from 'tweakpane'
import * as JSZip from 'jszip'
import { sketch } from 'p5js-wrapper'
import 'p5js-wrapper/sound'
// import './p5.pattern.js'
// import { PTN } from './p5.pattern.js'
import { datestring, filenamer } from './filelib'
import { CroppableImage, OutlineableImage, Images } from './images'
import { AboutDialog } from './AboutDialog.js'

const imagesContainer = document.getElementById('images')
const overlay = document.getElementById('overlay')

const sounds = [] // array for sound effects
let actionSound // Sound for actions inclu save, blend & clear uploads
const images = [] // array for source images
const cimages = new Images()
let patternImages = []
let solids = []
let isHorizontal = true // Initial boolean value of pattern direction
let isBlended = false // Initial bool value of the image blending status
let displayCanvas // canvas

const COLS = createColors(
  'https://coolors.co/bcf8ec-aed9e0-9fa0c3-8b687f-7b435b'
)

const activityModes = {
  DRAWING: 'draw',
  GALLERY: 'gallery'
}
let activity = activityModes.DRAWING

const addins = {
  Pattern: 'pattern',
  Solid: 'solid'
}

const CIRCULAR_SOURCES = {
  ALL: 'all',
  CROPPED: 'cropped',
  OUTLINED: 'outlined'
}

const cropStrategies = ['CENTER', 'TOP-LEFT', 'BOTTOM-RIGHT', 'RANDOM']
const fragmentStrategies = {
  LOCATION_FRAGMENT: 'location',
  FULL_CENTERED: 'fullcenter',
  RANDOM: 'random'
}

const resetCircularLayers = () => [[], [], []]

// combine these?
const circularLayers = resetCircularLayers()
let circularCollections = [[], [], []]

const circularLayerConfig = (ang, rs, re, ss, se, ra, rl, l) => ({
  active: true,
  angle: ang,
  rotationStart: rs,
  rotationEnd: re,
  scaleStart: ss,
  scaleEnd: se,
  angleRange: ra,
  lengthRange: rl,
  length: l
})

const rand = (min, max) => Math.random() * (max - min + 1) + min

// zero-index, and don't you forget it!
const layer0Config = circularLayerConfig(
  0,
  0,
  0,
  0.4,
  1.5,
  Math.PI * 5,
  2000,
  1000
)
// NOTE: scaleEnd was original a random int
const layer1Config = circularLayerConfig(
  90,
  -Math.PI / 6,
  Math.PI / 6,
  0.1,
  rand(0.8, 2),
  Math.PI * 5,
  2000,
  1000
)
const layer2Config = circularLayerConfig(0, -5, 5, 0.3, 3.0, 15, 1000, 1000)

const config = {
  addin: addins.Solid,
  mondrianStripes: true,
  mondrianTileSize: 400,
  currentMode: null,
  stripeSize: 1,
  outline: true,
  outlineColor: 'black',
  circle: false,
  outlineWeight: 100,
  stripMin: 100,
  stripMax: 1000,
  stripCount: 100,
  mondrianProb: 1.2,
  mondrianProbFactor: 0.7,
  cropStrategy: 'CENTER',
  solidProb: 0.8,
  fragmentStrategy: fragmentStrategies.RANDOM,
  patternsReady: false,
  layer0Config,
  layer1Config,
  layer2Config,
  source: CIRCULAR_SOURCES.ALL,
  mute: true
}

let uploadBtn, downloadBtn, clearBtn, blendBtn, resetBtn
let namer = filenamer(datestring())
const modes = [
  [mode0, 'Image gallery'],
  [mode1, 'Full-length strips'],
  [mode2, 'Collaging random chunks'],
  [mode3, 'Circular arrangements'],
  [mode4, 'Floating pixels'],
  [mode5, 'Mondrian boxes'],
  [mode6, 'Horizontal free strips'],
  [mode7, 'Mondrian stripes'],
  [mode8, 'Horizontally stretched'],
  [mode9, 'Concentric circle splashes']
]

let target // graphics object at full size
const pane = new Pane()

sketch.preload = () => {
  // Load consistently-named images into an array
  for (let i = 0; i < 6; i++) {
    images[i] = loadImage('./uploads/trees' + i + '.jpg')
  }
  console.log('images loaded')

  // Load sounds: Sound from Zapsplat.com
  for (let i = 0; i < 4; i++) {
    sounds[i] = loadSound('./uploads/sound' + i + '.mp3')
  }

  actionSound = loadSound('./uploads/glassy0.mp3')
  console.log('sounds loaded')
}

sketch.setup = () => {
  noLoop()
  displayCanvas = createCanvas(500, 500)
  displayCanvas.drop(handleFile)

  overlay.addEventListener('drop', event => {
    event.preventDefault()
    for (const item of event.dataTransfer.files) handleFile(item)
  })
  // Prevent the default behavior for dragover events
  overlay.addEventListener('dragover', event => {
    event.preventDefault()
  })

  target = createGraphics(displayCanvas.width * 4, displayCanvas.height * 4)
  makeSolids()

  setupButtons()

  const tab = pane.addTab({
    pages: [
      { title: 'Parameters' },
      { title: 'Collage Modes' },
      { title: 'mode3' }
    ]
  })
  const parmTab = tab.pages[0]
  const modeTab = tab.pages[1]
  const mode3Tab = tab.pages[2]

  parmTab
    .addButton({
      title: 'Patterns',
      label: 'load' // optional
    })
    .on('click', () => makePatterns())
  parmTab.addBinding(config, 'addin', {
    options: addins
  })
  parmTab
    .addButton({
      title: 'Load solids',
      label: ''
    })
    .on('click', () => getColorSolids())
  parmTab.addBinding(config, 'mondrianStripes')
  parmTab.addBinding(config, 'mondrianTileSize', {
    min: 100,
    max: 1000,
    step: 50
  })
  parmTab.addBinding(config, 'stripeSize', { min: 1, max: 50, step: 1 })
  parmTab.addBinding(config, 'mondrianProb', { min: 0.05, max: 2, step: 0.05 })
  parmTab.addBinding(config, 'mondrianProbFactor', {
    min: 0.1,
    max: 0.95,
    step: 0.05
  })

  parmTab.addBinding(config, 'outline')
  parmTab.addBinding(config, 'circle')
  parmTab.addBinding(config, 'outlineWeight', { min: 1, max: 200, step: 1 })
  parmTab.addBinding(config, 'stripMin', { min: 50, max: 2000, step: 25 })
  parmTab.addBinding(config, 'stripMax', { min: 50, max: 2000, step: 25 })
  parmTab.addBinding(config, 'stripCount', { min: 1, max: 200, step: 1 })
  parmTab.addBinding(config, 'solidProb', { min: 0, max: 1, step: 0.1 })
  parmTab
    .addBlade({
      view: 'list',
      label: 'cropping',
      options: cropStrategies.map(strat => ({ text: strat, value: strat })),
      value: cropStrategies[0]
    })
    .on('change', ({ value }) => {
      config.cropStrategy = value
    })
  parmTab.addBinding(config, 'fragmentStrategy', {
    options: fragmentStrategies
  })

  modes.forEach(m =>
    modeTab
      .addButton({
        title: m[1]
      })
      .on('click', () => m[0]())
  )

  mode3Tab
    .addBlade({
      view: 'list',
      label: 'sources',
      options: Object.values(CIRCULAR_SOURCES).map(strat => ({
        text: strat,
        value: strat
      })),
      value: config.source
    })
    .on('change', ({ value }) => {
      config.source = value
    })

  mode3Tab.addBinding(config.layer0Config, 'active', { label: 'Layer 1 active' })
  mode3Tab.addBinding(config.layer1Config, 'active', { label: 'Layer 2 active' })
  mode3Tab.addBinding(config.layer2Config, 'active', { label: 'Layer 3 active' })

  const lc0 = mode3Tab.addFolder({
    title: 'Layer 1',
    expanded: false // optional
  })

  lc0.addBinding(config.layer0Config, 'angle', {
    min: -180,
    max: 180,
    step: 1
  })
  lc0.addBinding(config.layer0Config, 'rotationStart', {
    min: -180,
    max: 180,
    step: 1
  })
  lc0.addBinding(config.layer0Config, 'rotationEnd', {
    min: -180,
    max: 180,
    step: 1
  })
  lc0.addBinding(config.layer0Config, 'scaleStart', {
    min: 0.1,
    max: 10,
    step: 0.1
  })
  lc0.addBinding(config.layer0Config, 'scaleEnd', {
    min: 0.1,
    max: 10,
    step: 0.1
  })
  lc0.addBinding(config.layer0Config, 'length', {
    min: 100,
    max: 2000,
    step: 10
  })
  lc0.addBinding(config.layer0Config, 'angleRange', {
    min: 0,
    max: 30,
    step: 1
  })
  lc0.addBinding(config.layer0Config, 'lengthRange', {
    min: 100,
    max: 2000,
    step: 10
  })

  const lc1 = mode3Tab.addFolder({
    title: 'Layer 2',
    expanded: false // optional
  })

  lc1.addBinding(config.layer1Config, 'angle', {
    min: -180,
    max: 180,
    step: 1
  })
  lc1.addBinding(config.layer1Config, 'rotationStart', {
    min: -180,
    max: 180,
    step: 1
  })
  lc1.addBinding(config.layer1Config, 'rotationEnd', {
    min: -180,
    max: 180,
    step: 1
  })
  lc1.addBinding(config.layer1Config, 'scaleStart', {
    min: 0.1,
    max: 10,
    step: 0.1
  })
  lc1.addBinding(config.layer1Config, 'scaleEnd', {
    min: 0.1,
    max: 10,
    step: 0.1
  })
  lc1.addBinding(config.layer1Config, 'length', {
    min: 100,
    max: 2000,
    step: 10
  })
  lc1.addBinding(config.layer1Config, 'angleRange', {
    min: 0,
    max: 30,
    step: 1
  })
  lc1.addBinding(config.layer1Config, 'lengthRange', {
    min: 100,
    max: 2000,
    step: 10
  })

  const lc2 = mode3Tab.addFolder({
    title: 'Layer 3',
    expanded: false // optional
  })

  lc2.addBinding(config.layer2Config, 'angle', {
    min: -180,
    max: 180,
    step: 1
  })
  lc2.addBinding(config.layer2Config, 'rotationStart', {
    min: -180,
    max: 180,
    step: 1
  })
  lc2.addBinding(config.layer2Config, 'rotationEnd', {
    min: -180,
    max: 180,
    step: 1
  })
  lc2.addBinding(config.layer2Config, 'scaleStart', {
    min: 0.1,
    max: 10,
    step: 0.1
  })
  lc2.addBinding(config.layer2Config, 'scaleEnd', {
    min: 0.1,
    max: 10,
    step: 0.1
  })
  lc2.addBinding(config.layer2Config, 'length', {
    min: 100,
    max: 2000,
    step: 10
  })
  lc2.addBinding(config.layer2Config, 'angleRange', {
    min: 0,
    max: 30,
    step: 1
  })
  lc2.addBinding(config.layer2Config, 'lengthRange', {
    min: 100,
    max: 2000,
    step: 10
  })

  for (let i = 0; i < images.length; i++) {
    const cropped = squareCrop(images[i])
    cropped.resize(target.width, 0)
    cimages.add(new CroppableImage({ img: images[i], cropped }))
  }

  background(0)

  buildGallery(cimages)
  toggleGallery()
  playSound(random(sounds))

  // Initialize AboutDialog
  window.aboutDialog = new AboutDialog()
}

const playSound = (sound) => {
  if (config.mute) return
  sound.play()
}

const randPattern = (t) => {
  const ptArr = [
    PTN.noise(0.5),
    PTN.noiseGrad(0.4),
    PTN.stripe(t / int(random(6, 12))),
    PTN.stripeCircle(t / int(random(6, 12))),
    PTN.stripePolygon(int(random(3, 7)), int(random(6, 12))),
    PTN.stripeRadial(TAU / int(random(6, 30))),
    PTN.wave(t / int(random(1, 3)), t / int(random(10, 20)), t / 5, t / 10),
    PTN.dot(t / 10, (t / 10) * random(0.2, 1)),
    PTN.checked(t / int(random(5, 20)), t / int(random(5, 20))),
    PTN.cross(t / int(random(10, 20)), t / int(random(20, 40))),
    PTN.triangle(t / int(random(5, 20)), t / int(random(5, 20)))
  ]
  return random(ptArr)
}

const getColorSolids = () => {
  const selectedId = getSelectedImages()[0].dataset.uuid
  const img = cimages.byId(selectedId).original
  const colors = getDominantColors(img, 5, 30)
  makeSolids(colors)
}

const makeSolids = (colors = null) => {
  colors = colors || [
    'tomato',
    'powderblue',
    'yellowgreen',
    'white',
    'salmon',
    'turquoise'
  ]
  const temp = createGraphics(500, 500)

  solids = colors.map(color => {
    temp.background(color)
    const img = createImage(2000, 2000)
    img.copy(temp, 0, 0, 500, 500, 0, 0, 2000, 2000)
    return img
  })
  temp.remove()
}

const makePatterns = () => {
  const pats = []
  const temp = createGraphics(500, 500)
  const palette = shuffle(COLS, true)

  const xSpan = 500
  const ySpan = 500
  for (let i = 0; i < 10; i++) {
    temp.patternColors(shuffle(palette))
    temp.pattern(randPattern(100))
    temp.patternAngle((int(random(4)) * PI) / 4)
    temp.push()
    // temp.rotate(isDraw * HALF_PI);

    const rn = random()
    if (rn > 0.66) temp.rectPattern(0, 0, xSpan, ySpan, xSpan, 0, 0, 0)
    else if (rn > 0.33) {
      temp.arcPattern(
        xSpan / 2,
        ySpan / 2,
        xSpan * 2,
        ySpan * 2,
        PI,
        (TAU / 4) * 3
      )
    } else {
      temp.trianglePattern(
        xSpan / 2,
        ySpan / 2,
        -xSpan / 2,
        ySpan / 2,
        xSpan / 2,
        -ySpan / 2
      )
    }

    const img = createImage(2000, 2000)
    img.copy(temp, 0, 0, 500, 500, 0, 0, img.width, img.height)
    console.log(`created pattern ${i + 1}`)
    pats.push(img)
    temp.pop()
  }

  temp.remove()
  patternImages = pats
  config.patternsReady = true
}

const squareCrop = img => {
  const w = img.width
  const h = img.height
  let min = Math.min(w, h)
  let x, y

  switch (config.cropStrategy) {
    case 'CENTER':
      x = (w - min) / 2
      y = (h - min) / 2
      break
    case 'TOP-LEFT':
      x = 0
      y = 0
      break
    case 'BOTTOM-RIGHT':
      x = w - min
      y = h - min
      break
    case 'RANDOM':
      if (min > 500) {
        min = min - random(0, min - 500)
      }
      x = random(0, w - min)
      y = random(0, h - min)
      break
  }

  return img.get(x, y, min, min)
}

function setupButtons() {
  const btnX = 20
  let btnYStart = 160
  const btnYStep = 40
  const white = color(255)
  const dark = color(30)
  const blackTrans = color(0, 0, 0, 80)

  // Upload button
  uploadBtn = createButton('upload')
  uploadBtn.mousePressed(dropFiles)
  uploadBtn.position(btnX, btnYStart)
  uploadBtn.style('background-color', dark)
  uploadBtn.style('color', white)
  uploadBtn.style('border', '1px')
  uploadBtn.style('border', dark)
  uploadBtn.style('width', '60px')
  uploadBtn.style('padding-top', '3px')
  uploadBtn.style('padding-bottom', '3px')

  // Clear uploads button
  clearBtn = createButton('clear')
  clearBtn.position(btnX, btnYStart)
  clearBtn.mousePressed(clearUploads)
  clearBtn.style('background-color', dark)
  clearBtn.style('color', white)
  clearBtn.style('border', '1px')
  clearBtn.style('border', dark)
  clearBtn.style('width', '60px')
  clearBtn.style('padding-top', '3px')
  clearBtn.style('padding-bottom', '3px')
  clearBtn.hide()

  // Download button
  downloadBtn = createButton('save')
  downloadBtn.mousePressed(download)
  downloadBtn.position(btnX, (btnYStart += btnYStep))
  downloadBtn.style('background-color', dark)
  downloadBtn.style('color', white)
  downloadBtn.style('border', '1px')
  downloadBtn.style('border', dark)
  downloadBtn.style('width', '60px')
  downloadBtn.style('padding-top', '3px')
  downloadBtn.style('padding-bottom', '3px')

  // A list of mode buttons
  for (let n = 0; n < 10; n++) {
    let modeBtn
    if (n === 0) {
      modeBtn = createButton('gallery')
    } else {
      modeBtn = createButton('mode ' + n)
    }
    modeBtn.elt.title = modes[n].length > 1 ? modes[n][1] : `Mode ${n}`

    modeBtn.mousePressed(modes[n][0])
    modeBtn.position(btnX, btnYStart + btnYStep * (n + 1))
    // TODO: move into css
    modeBtn.style('background-color', blackTrans)
    modeBtn.style('color', white)
    modeBtn.style('border', '1px solid white')
    modeBtn.style('width', '60px')
    modeBtn.style('padding-top', '3px')
    modeBtn.style('padding-bottom', '3px')
  }

  // Blend mode button
  blendBtn = createButton('blend')
  blendBtn.mousePressed(blendLightest)
  blendBtn.position(btnX, btnYStart + btnYStep * 11) // sub-optimal
  blendBtn.style('background-color', blackTrans)
  blendBtn.style('color', white)
  blendBtn.style('border', 'none')
  blendBtn.style('padding-top', '3px')
  blendBtn.style('padding-bottom', '3px')

  // Reset blend mode button
  resetBtn = createButton('clear blend')
  resetBtn.mousePressed(resetBlend)
  resetBtn.position(btnX, btnYStart + btnYStep * 11)
  resetBtn.style('background-color', blackTrans)
  resetBtn.style('color', white)
  resetBtn.style('border', 'none')
  resetBtn.style('padding-top', '3px')
  resetBtn.style('padding-bottom', '3px')
  resetBtn.hide()
}

sketch.keyTyped = () => {
  // perform action invariant of activity
  const shifted = keyIsDown(SHIFT)
  if (config.currentMode === mode3 && '!@#'.includes(key)) {
    const downShiftVal = '!@#'.indexOf(key)
    circularLayers[downShiftVal] = layerGen[`genLayer${downShiftVal}`](
      circularCollections[downShiftVal]
    )()
    drawMode3(circularLayers)
  } else if ('0123456789'.includes(key)) {
    modes[key][0]()
  } else if (activity === activityModes.GALLERY) {
    if (key === 'x') {
      const sels = getSelectedImages()
      deleteImage(sels)
    } else if (key === 'c') {
      clearUploads()
      namer = filenamer(datestring())
    } else if (key === 'd') {
      duplicateRecrop(getSelectedImages())
    } else if (key === 'g') {
      toggleGallery()
    }
  } else {
    if (key === 's') {
      download()
    } else if (key === 'a') {
      config.circle = !config.circle
    } else if (key === 'b') {
      blendLightest()
    } else if (key === 'r') {
      resetBlend()
    } else if (key === 'g') {
      toggleGallery()
    } else if (key === 'i') {
      pane.hidden = !pane.hidden
    } else if (key === 'u') {
      dropFiles()
    } else if (key === 'o') {
      config.outline = !config.outline
    } else if (key === 'h') {
      isHorizontal = !isHorizontal
    } else if (key === 'p') {
      config.mondrianProbFactor = +(
        (config.mondrianProbFactor - 0.1 + 0.9) %
        0.9
      ).toFixed(1)
      config.mondrianProbFactor =
        config.mondrianProbFactor === 0 ? 0.9 : config.mondrianProbFactor
    } else if (key === 'm') {
      config.mondrianStripes = !config.mondrianStripes
      playSound(actionSound)
    } else if (key === 'n') {
      config.stripeSize += 1 % 20
    } else if (key === 'l') {
      config.mondrianProb = (config.mondrianProb + 0.1) % 1
    } else if (key === 'z') {
      config.mondrianTileSize = ((config.mondrianTileSize + 25) % 1000) + 25
      console.log(config.mondrianTileSize)
    } else if (key === 'q') {
      window.aboutDialog.toggle()
    } else if (key === '`') {
      if (config.currentMode === null) return false
      frameRate(5)
      for (let i = 0; i < 30; i++) {
        config.currentMode()
        // repeated saves don't work so well - I get 18/20 or worse.
        // I "solved" this problem by using a custom library - see polychrometext
        // except it still doesn't work, here. Something else must have come into play.
        // TODO: convert to canvas-sketch which saves great
        download()
        console.log(`saved collage ${i}`)
      }
    }
  }
  return false
}

function dropFiles() {
  fill(60)
  noStroke()
  rect(0, 0, displayCanvas.width, displayCanvas.height)

  fill(255)
  textSize(24)
  textAlign(CENTER)
  text(
    'Drag image files onto the canvas.',
    displayCanvas.width / 2,
    displayCanvas.height / 2
  )
}

const getImageVectorKeys = zip => {
  const names = Object.keys(zip.files)
  const imageName = names.find(n => n.endsWith('png'))
  const vectorName = names.find(n => n.endsWith('json'))
  return { imageName, vectorName }
}

// Handle file uploads
async function handleFile(file) {
  if (file.type.startsWith('image')) {
    loadImage(URL.createObjectURL(file), img => {
      const cropped = squareCrop(img)
      cropped.resize(target.width, 0)
      const ci = new CroppableImage({ img, cropped })
      cimages.add(ci)
      const source = cropped.canvas.toDataURL()
      const text = `${img.width}x${img.height}`
      addImageToGallery(source, ci.uuid, text)
    })
  } else if (file.type === 'application/zip' || file.subtype === 'zip') {
    const zip = await JSZip.loadAsync(file)
    const { imageName, vectorName } = getImageVectorKeys(zip)
    const jsonData = await zip.file(vectorName).async('string')
    const vectors = JSON.parse(jsonData)

    const data = await zip.file(imageName).async('blob')
    const objectURL = URL.createObjectURL(data)
    loadImage(objectURL, img => {
      const oi = new OutlineableImage({ img, vectors })
      cimages.add(oi)
      const source = img.canvas.toDataURL()
      const text = `${img.width}x${img.height}`
      addImageToGallery(source, oi.uuid, text)
    })
  } else {
    console.log('Not an image file or image-outline bundle!')
  }
}

const duplicateRecrop = items => {
  let source = null
  let cloned = null
  items.forEach(item => {
    const imgObj = cimages.images.find(i => i.uuid === item.dataset.uuid)
    let text = ''
    if (imgObj instanceof OutlineableImage) {
      cloned = imgObj.clone
      cimages.add(cloned)
      text = `${cloned.original.width}x${cloned.original.height}`
      source = cloned.orig.canvas.toDataURL()
    } else {
      const tempCropMode = config.cropStrategy
      config.cropStrategy = 'RANDOM'
      cloned = imgObj.clone
      cloned.cropped = squareCrop(cloned.original)
      cloned.cropped.resize(target.width, 0)
      cimages.add(cloned)
      config.cropStrategy = tempCropMode
      text = `${cloned.original.width}x${cloned.original.height}`
      source = cloned.cropped.canvas.toDataURL()
    }
    addImageToGallery(source, cloned.uuid, text)
  })
}

// Clear upload files
function clearUploads() {
  deleteImage(getAllImages())
}

const saver = (canvas, name) => {
  canvas.toBlob(blob => saveAs(blob, name))
}

function download(ctx = target) {
  // actionSound.play();
  const name = namer() + '.png'
  saver(ctx.drawingContext.canvas, name)
  console.log('downloaded ' + name)
}

// returns an array of DOM elements
function getSelectedImages() {
  const selectedItems = document.querySelectorAll('.gallery-image.selected')
  return [...selectedItems]
}

function getAllImages() {
  const allItems = document.querySelectorAll('.gallery-image')
  return [...allItems]
}

function addImageToGallery(source, uuid, overlayText = '') {
  const galleryItem = document.createElement('div')
  galleryItem.classList.add('gallery-image')
  galleryItem.style['background-image'] = `url('${source}')`
  galleryItem.dataset.uuid = uuid
  // via https://stackoverflow.com/a/8452798/41153
  if (overlayText !== '') {
    const overlay = document.createElement('div')
    overlay.classList.add('imageinfo')
    overlay.innerHTML = overlayText
    galleryItem.appendChild(overlay)
  }
  const border = document.createElement('div')
  border.classList.add('border')
  galleryItem.appendChild(border)

  galleryItem.addEventListener('click', evt =>
    evt.currentTarget.classList.toggle('selected')
  )

  imagesContainer.appendChild(galleryItem)
}

// display the size of the image as an overlay text
const buildGallery = cimgs => {
  for (let i = 0; i < cimgs.images.length; i++) {
    const img = cimgs.images[i]
    const source =
      img instanceof OutlineableImage
        ? img.orig.canvas.toDataURL()
        : img.cropped.canvas.toDataURL()
    const text = `${img.orig.width}x${img.orig.height}`
    addImageToGallery(source, cimgs.images[i].uuid, text)
  }
}

const hideGallery = () => {
  overlay.classList.remove('active')
}
const toggleGallery = () => {
  if (overlay.classList.contains('active')) {
    activity = activityModes.DRAWING
    pane.hidden = false
  } else {
    activity = activityModes.GALLERY
    config.currentMode = mode0
    pane.hidden = true
  }
  overlay.classList.toggle('active')
}

const deleteImage = items =>
  items.forEach(element => {
    cimages.remove(element.dataset.uuid)
    element.remove()
  })

function mode0() {
  toggleGallery()

  playSound(sounds[0])
}

const modeInit = mode => {
  activity = activityModes.DRAWING
  config.currentMode = mode
  hideGallery()
  pane.hidden = false
}

// Full-length strips
function mode1() {
  modeInit(mode1)
  if (isHorizontal) {
    for (let y = 0; y < target.height; y += 10) {
      const img = cimages.random.cropped

      // pick a y point to get the strip
      const stripYPosition = int(random(0, img.height - 10))

      // use get() to extract a strip of the image
      const strip = img.get(0, stripYPosition, img.width, 10)

      target.image(strip, 0, y)
    }
    isHorizontal = false
  } else {
    // Toggle to vertical
    for (let x = 0; x < target.width; x += 10) {
      const img = cimages.random.cropped

      // pick a x point to get the strip
      const stripXPosition = int(random(0, img.width - 10))

      // use get() to extract a strip of the image
      const strip = img.get(stripXPosition, 0, 10, img.width)
      target.image(strip, x, 0)
    }
    isHorizontal = true
  }
  // TODO: need a better solution
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  playSound(random(sounds))
}

// Collaging random chunks
function mode2() {
  modeInit(mode2)
  target.clear()

  target.image(cimages.random.cropped, 0, 0)

  if (config.outline) {
    target.strokeWeight(config.outlineWeight)
    target.stroke(config.outlineColor)
    target.noFill()
  }

  for (let i = 0; i < config.stripCount; i++) {
    const img = cimages.random.cropped
    const stripW = random(config.stripMin, config.stripMax)
    const stripH = random(config.stripMin, config.stripMax)
    const stripX = random(stripW / -2, target.width)
    const stripY = random(stripH / -2, target.height)
    const strip = img.get(stripX, stripY, stripW, stripH)

    if (config.circle) {
      const customMask = createGraphics(stripW, stripH)
      customMask.noStroke()
      customMask.fill(255)
      customMask.circle(stripW / 2, stripH / 2, Math.min(stripH, stripW))
      strip.mask(customMask)
      customMask.remove()
      target.circle(
        stripX + stripW / 2,
        stripY + stripH / 2,
        Math.min(stripH, stripW)
      )
    } else {
      target.rect(stripX, stripY, stripW, stripH)
    }
    target.image(strip, stripX, stripY)
  }

  if (config.outline) {
    target.rect(0, 0, target.width, target.height)
  }
  target.strokeWeight(0)

  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  playSound(random(sounds))
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5)
}

function splitArrayByRatio(arr, ratios) {
  const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0)
  const totalLength = arr.length

  const result = []
  let startIndex = 0

  for (let i = 0; i < ratios.length; i++) {
    const subArrayLength = Math.ceil((totalLength * ratios[i]) / totalRatio)
    result.push(arr.slice(startIndex, startIndex + subArrayLength))
    startIndex += subArrayLength
  }

  // Handle any remaining elements
  if (startIndex < totalLength) {
    result[result.length - 1] = result[result.length - 1].concat(
      arr.slice(startIndex)
    )
  }

  return result
}

const layerGen = {
  genLayer0: null,
  genLayer1: null,
  genLayer2: null
}

layerGen.genLayer0 = imgs => {
  return () =>
    generateCollageItems({
      imgObjs: imgs,
      count: int(random(2, 10)),
      // angle: 0,
      // length: target.height / 2,
      // angleRange: PI * 5,
      // lengthRange: target.height,
      // scaleStart: 0.4,
      // scaleEnd: 1.5,
      // rotationStart: 0,
      // rotationEnd: 0
      angle: config.layer0Config.angle,
      length: config.layer0Config.length, // target.height * 0.66,
      angleRange: config.layer0Config.angleRange, // PI * 5,
      lengthRange: config.layer0Config.lengthRange, // target.height * 0.66,
      scaleStart: config.layer0Config.scaleStart, // 0.1,
      scaleEnd: config.layer0Config.scaleEnd, // random(0.8, 2.0),
      rotationStart: config.layer0Config.rotationStart,
      rotationEnd: config.layer0Config.rotationEnd
    })
}

// layerImages, count, angle, length, rangeA, rangeL, scaleStart, scaleEnd, rotationStart, rotationEnd

// layer2Items = generateCollageItems(layer2Images, random(10, 25), 0, height * 0.15, PI * 5, 150, 0.1, random(0.3, 0.8), -PI / 6, PI / 6);

layerGen.genLayer1 = imgs => {
  return () =>
    generateCollageItems({
      imgObjs: imgs,
      count: int(random(10, 25)),
      // angle: 0, // 90,
      // length: target.height * 0.5, // target.height / 2,
      // angleRange: PI * 5,
      // lengthRange: 150, // target.height,
      // scaleStart: 0.1,
      // scaleEnd: random(0.8, 2.0),
      // rotationStart: -PI / 6,
      // rotationEnd: PI / 6
      angle: config.layer1Config.angle,
      length: config.layer1Config.length, // target.height * 0.66,
      angleRange: config.layer1Config.angleRange, // PI * 5,
      lengthRange: config.layer1Config.lengthRange, // target.height * 0.66,
      scaleStart: config.layer1Config.scaleStart, // 0.1,
      scaleEnd: config.layer1Config.scaleEnd, // random(0.8, 2.0),
      rotationStart: config.layer1Config.rotationStart,
      rotationEnd: config.layer1Config.rotationEnd
    })
}

// generateCollageItems(layer3Images, random(10, 25), 0, height * 0.66, PI * 5, height * 0.66, 0.1, random(0.2, 0.5), -0.05, 0.05);

layerGen.genLayer2 = imgs => {
  return () =>
    generateCollageItems({
      imgObjs: imgs,
      count: int(random(10, 25)),
      angle: config.layer2Config.angle,
      length: config.layer2Config.length, // target.height * 0.66,
      angleRange: config.layer2Config.angleRange, // PI * 5,
      lengthRange: config.layer2Config.lengthRange, // target.height * 0.66,
      scaleStart: config.layer2Config.scaleStart, // 0.1,
      scaleEnd: config.layer2Config.scaleEnd, // random(0.8, 2.0),
      rotationStart: config.layer2Config.rotationStart,
      rotationEnd: config.layer2Config.rotationEnd
    })
}

// shift-1,2,3 to redraw (& randomize?) that layer
function mode3() {
  let sourceImages = []
  switch (config.source) {
    case CIRCULAR_SOURCES.CROPPED:
      sourceImages = cimages.croppeds
      break
    case CIRCULAR_SOURCES.OUTLINED:
      sourceImages = cimages.outlineds
      break
    case CIRCULAR_SOURCES.ALL:
    default:
      sourceImages = cimages.images
  }
  if (sourceImages.length === 0) {
    console.log(`no '${config.source}' images`)
    return
  }

  modeInit(mode3)

  circularCollections = splitArrayByRatio(
    shuffleArray(sourceImages),
    [11, 5, 22]
  )

  circularLayers[0] = layerGen.genLayer0(circularCollections[0])()
  circularLayers[1] = layerGen.genLayer1(circularCollections[1])()
  circularLayers[2] = layerGen.genLayer2(circularCollections[2])()

  drawMode3(circularLayers)
}

const drawMode3 = layers => {
  // I keep changing my mind on this
  target.background(255)

  // drawing in reverse because.... layer 3 is the largest, always ???
  for (let i = layers.length - 1; i >= 0; i--) {
    if (config[`layer${i}Config`].active) drawCollageitems(layers[i])
  }

  outlineCanvas()

  target.imageMode(CORNER)
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  playSound(random(sounds))
}

function outlineCanvas() {
  if (config.outline) {
    target.strokeWeight(config.outlineWeight)
    target.stroke('black')
    target.noFill()
    target.rect(0, 0, target.width, target.height)
  }
}

function generateCollageItems({
  imgObjs,
  count,
  angle,
  length,
  angleRange,
  lengthRange,
  scaleStart,
  scaleEnd,
  rotationStart,
  rotationEnd
}) {
  const layerItems = []
  for (let i = 0; i < imgObjs.length; i++) {
    const img = imgObjs[i]
    for (let j = 0; j < count; j++) {
      const item = new OutlineableCollageItem(img, null, config.outlineWeight)
      item.angle = angle + random(-angleRange / 2, angleRange / 2)
      item.length = length + random(-lengthRange / 2, lengthRange / 2)
      item.scaling = random(scaleStart, scaleEnd)
      // item.thickness = config.outlineWeight
      item.rotation = item.angle + HALF_PI + random(rotationStart, rotationEnd)
      layerItems.push(item)
    }
  }
  return layerItems
}

// TODO: I do need a copy of the original
// because we need to draw the vectors
// and that code is within the OutlineableImage class
// draw(x,y) - but it will need a lot of other info passed in
// this is a wrapper around OutlineableImage
function OutlineableCollageItem(outlineableImg) {
  this.angle = 0
  this.length = 0
  this.rotation = 0
  this.scaling = 1
  this.image = outlineableImg.original
  this.vectors = outlineableImg.vectors
  this.oi = outlineableImg
}

function drawCollageitems(layerItems) {
  target.strokeWeight(0)
  target.noFill()

  if (config.outline) {
    target.strokeWeight(config.outlineWeight)
    target.stroke('black')
  }

  for (let i = 0; i < layerItems.length; i++) {
    const item = layerItems[i]
    target.push()
    target.translate(
      target.width / 2 + cos(item.angle) * item.length,
      target.height / 2 + sin(item.angle) * item.length
    )
    target.rotate(item.rotation)

    if (item.oi && item.oi.draw) {
      target.imageMode(CORNER)
      item.oi.draw({ x: 0, y: 0, scaling: item.scaling, target, config })
    } else {
      target.imageMode(CENTER)
      target.rect(
        (-item.image.width * item.scaling * 0.2) / 2,
        (-item.image.height * item.scaling * 0.2) / 2,
        item.image.width * item.scaling * 0.2,
        item.image.height * item.scaling * 0.2
      )
      target.image(
        item.image,
        0,
        0,
        item.image.width * item.scaling * 0.2,
        item.image.height * item.scaling * 0.2
      )
    }
    target.pop()
  }
}

// Floating pixels
function mode4() {
  modeInit(mode4)

  target.fill(0)
  target.rect(0, 0, target.width, target.height)
  target.noStroke()
  for (let i = 0; i < 900; i++) {
    const img = cimages.random.cropped

    const stripX = random(target.width)
    const stripY = random(target.height)
    const stripW = random(40, 50)
    const stripH = random(40, 50)
    if (random(0, 1) > 0.3) {
      const c = img.get(stripX, stripY)
      target.fill(c)
      target.rect(stripX, stripY, stripW, stripH)
    } else {
      const strip = img.get(stripX, stripY, stripW, stripH)
      target.image(strip, stripX, stripY)
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  playSound(random(sounds))
}

// TODO: check if a box is a subset/superset of another box,
// and then .... uh, something
// this is an elaboration of mode2/mode7
// try to integrate mode7 and make these more flexible?
function mode5() {
  modeInit(mode5)

  const coinflip = () => random() < config.solidProb
  target.image(cimages.random.cropped, 0, 0)

  if (config.outline) {
    target.strokeWeight(config.outlineWeight)
    target.stroke('black')
    target.noFill()
  }

  // these are not strips, they are overall images
  // but still, not as many showing up as expected
  for (let i = 0; i < config.stripCount; i++) {
    const cf = coinflip()
    const img = cf
      ? random(
        config.addin === addins.Solid || !config.patternsReady
          ? solids
          : patternImages
      )
      : cimages.random.cropped

    const stripW = random(config.stripMin, config.stripMax)
    const stripH = config.circle
      ? stripW
      : random(config.stripMin, config.stripMax)
    const stripX = Math.round(random(stripW / -2, target.width))
    const stripY = Math.round(random(stripH / -2, target.height))

    let strip
    switch (config.fragmentStrategy) {
      case fragmentStrategies.LOCATION_FRAGMENT:
        strip = img.get(stripX, stripY, stripW, stripH)
        break
      case fragmentStrategies.RANDOM:
        strip = img.get(
          random(0, img.width - stripW),
          random(0, img.height - stripH),
          stripW,
          stripH
        )
        break
      case fragmentStrategies.FULL_CENTERED:
        const scale = img.width / Math.max(stripW, stripH)
        strip = createImage(stripW, stripH)
        const scaledWidth = stripW * scale
        const scaledHeight = stripH * scale
        strip.copy(
          img,
          img.width / 2 - scaledWidth / 2,
          img.height / 2 - scaledHeight / 2,
          scaledWidth,
          scaledHeight,
          0,
          0,
          stripW,
          stripH
        )
    }

    if (config.circle) {
      const customMask = createGraphics(stripW, stripH)
      customMask.noStroke()
      customMask.fill(255)
      customMask.circle(stripW / 2, stripH / 2, Math.min(stripH, stripW))
      strip.mask(customMask)
      customMask.remove()
      target.circle(
        stripX + stripW / 2,
        stripY + stripH / 2,
        Math.min(stripH, stripW)
      )
      target.image(strip, stripX, stripY)
    } else {
      target.rect(stripX, stripY, stripW, stripH)
      target.image(strip, stripX, stripY)
    }
  }

  if (config.outline) {
    target.rect(0, 0, target.width, target.height)
  }

  target.strokeWeight(0)
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  playSound(random(sounds))
}

// Horizontal free strips
function mode6() {
  modeInit(mode6)

  target.noStroke()
  const tileHeight = 5
  const tileCountY = target.height / tileHeight

  for (let gridY = 0; gridY < tileCountY; gridY++) {
    let x = 0
    while (x < target.width) {
      const tileWidth = random(15, 80)
      const y = gridY * tileHeight
      const img = cimages.random.cropped

      // Base grid tile
      target.rect(x, y, tileWidth, tileHeight)

      if (random(0, 1) > 0.7) {
        const c = img.get(x, gridY * tileHeight)
        target.fill(c)
        target.rect(
          round(random(x - 10, x + 10)),
          round(random(y - 10, y + 10)),
          tileWidth,
          tileHeight
        )
      } else {
        // Offset tile
        const strip = img.get(x, y, tileWidth, tileHeight)
        target.image(
          strip,
          round(random(x - 10, x + 10)),
          round(random(y - 10, y + 10))
        )
      }

      x += tileWidth
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  playSound(random(sounds))
}

// Mondrian stripes
function mode7() {
  modeInit(mode7)

  target.noStroke()

  mondrian(
    target.width,
    target.height,
    1,
    1,
    config.mondrianProb,
    random(2) < 1
  )
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  playSound(random(sounds))
}

// Horizontally stretched
function mode8() {
  modeInit(mode8)

  target.noStroke()
  const backGrnd = cimages.random.cropped

  for (let j = 0; j < target.height; j += 5) {
    // get color of pixel at point
    const c = backGrnd.get(target.width / 2, j)
    target.fill(c)
    target.rect(0, j, target.width, 5)
  }

  for (let i = 0; i < 200; i++) {
    const img = cimages.random.cropped

    const stripX = random(target.width)
    const stripY = random(target.height)
    const stripW = random(50, 150)
    const stripH = random(50, 150)

    for (let j = 0; j < stripH; j++) {
      const c = img.get(stripX, stripY + j)
      target.fill(c)
      target.rect(stripX, stripY + j, stripW, 1)
    }
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)
  playSound(random(sounds))
}

// Concentric circle splashes
// variation ideas: single image, over circles on that
function mode9() {
  modeInit(mode9)

  target.fill(0)
  target.noStroke()
  target.rect(0, 0, target.width, target.height)
  target.noFill()
  target.blendMode(LIGHTEST)

  for (let i = 0; i < 450; i++) {
    const img = cimages.random.cropped

    const X = random(target.width)
    const Y = random(target.height)
    const R = random(5, 200)
    const interval = int(random(4, 10))
    const numColors = int(random(1, 3))
    target.strokeWeight(int(random(1, 3)))

    // Color palette
    const colors = []
    for (let n = 0; n < numColors; n++) {
      colors[n] = img.get(
        min(target.width - 2, X + 2 * n),
        min(target.height - 2, Y + 2 * n)
      )
    }

    let cIndex = 0

    // Draw con-centric circles
    for (let r = 0; r < R; r += interval) {
      target.stroke(colors[cIndex])
      target.circle(X, Y, r)

      if (cIndex === numColors - 1) {
        cIndex = 0
      } else {
        cIndex++
      }
    }
  }
  if (!isBlended) {
    target.blendMode(BLEND)
  }
  image(target, 0, 0, displayCanvas.width, displayCanvas.height)

  sounds[3].play()
}

const factor = {
  low: 0.3,
  high: 0.7
}

// wrapper
function mondrian(w, h, x, y, prob, vertical) {
  mondrianInner(w, h, x, y, prob, vertical)

  if (config.outline) {
    target.noFill()
    target.strokeWeight(config.outlineWeight)
    target.stroke('black')
    target.rect(0, 0, target.width, target.height)
    target.strokeWeight(0)
  }
}

// Draw mondrian-style grid of collages
// may have originally been based on https://github.com/ronikaufman/mondrian_generator/blob/master/mondrian_generator.pde
// might be interesting to follow-up with some circles
// positioned on lines and intersections
// but we'd have to have knowledge of where lines had been drawn....
function mondrianInner(w, h, x, y, prob, vertical) {
  // Recursion calls: Divide againv
  const coinFlip = random(1) < prob
  if (coinFlip) {
    if (vertical) {
      const wDivision = floor(random(w * factor.low, w * factor.high))
      mondrianInner(wDivision, h, x, y, prob * config.mondrianProbFactor, false)
      mondrianInner(
        w - wDivision,
        h,
        x + wDivision,
        y,
        prob * config.mondrianProbFactor,
        false
      )
    } else {
      const hDivision = floor(random(h * factor.low, h * factor.high))
      mondrianInner(w, hDivision, x, y, prob * config.mondrianProbFactor, true)
      mondrianInner(
        w,
        h - hDivision,
        x,
        y + hDivision,
        prob * config.mondrianProbFactor,
        true
      )
    }
  } else {
    // Base case: Draw rectangle
    const img = cimages.random.cropped
    const tileHeight = max(h, 0)
    const tileWidth = max(w, 0)
    if (config.outline) {
      target.stroke('black')
      target.strokeWeight(config.outlineWeight)
      target.noFill()
      target.rect(x, y, tileWidth, tileHeight)
    }
    target.strokeWeight(0)
    if (
      config.mondrianStripes &&
      (tileWidth > config.mondrianTileSize ||
        tileHeight > config.mondrianTileSize)
    ) {
      // Draw horizontal stripes
      if (random(1) > 0.5) {
        for (let j = 0; j < tileHeight; j += config.stripeSize) {
          const c = img.get(x, y + j)

          target.fill(c)
          target.rect(x, y + j, tileWidth, config.stripeSize)
        }
      } else {
        // Draw vertical strips
        for (let j = 0; j < tileWidth; j += config.stripeSize) {
          const c = img.get(x + j, y)

          target.fill(c)
          target.rect(x + j, y, config.stripeSize, tileHeight)
        }
      }
    } else {
      const strip = img.get(x, y, tileWidth, tileHeight)
      if (tileHeight !== 0 && tileWidth !== 0) {
        target.rect(x, y, tileWidth, tileHeight)
        target.image(strip, x, y)
      }
    }
  }
}

// Reset default blend mode
function resetBlend() {
  target.blendMode(BLEND)
  isBlended = false
  resetBtn.hide()
  blendBtn.show()
  actionSound.play()
}

// Set to Lightest image blend mode
function blendLightest() {
  target.blendMode(LIGHTEST)
  isBlended = true
  resetBtn.show()
  blendBtn.hide()
  actionSound.play()
}

function createColors(url) {
  const slaIndex = url.lastIndexOf('/')
  const colStr = url.slice(slaIndex + 1)
  const colArr = colStr.split('-')
  for (let i = 0; i < colArr.length; i++) colArr[i] = '#' + colArr[i]
  return colArr
}

function getDominantColors(img, numColors, colorDistance = 8) {
  // Resize the image to a smaller size to speed up the analysis
  img.resize(10, 10)

  // Get the pixel data
  img.loadPixels()
  const pixels = img.pixels

  // Create a histogram of the pixel colors
  const histogram = {}
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]

    // Group similar colors together
    const key = `${Math.round(r / colorDistance) * colorDistance},${Math.round(g / colorDistance) * colorDistance
      },${Math.round(b / colorDistance) * colorDistance}`
    if (histogram[key]) {
      histogram[key]++
    } else {
      histogram[key] = 1
    }
  }

  // Sort the histogram by frequency and get the top numColors colors
  const sortedColors = Object.entries(histogram)
    .sort((a, b) => b[1] - a[1])
    .slice(0, numColors)
    .map(entry => {
      const [r, g, b] = entry[0].split(',').map(Number)
      return color(r, g, b)
    })

  return sortedColors
}