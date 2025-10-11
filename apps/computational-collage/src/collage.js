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