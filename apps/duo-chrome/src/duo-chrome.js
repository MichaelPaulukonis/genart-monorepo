import { p5 } from 'p5js-wrapper'
import { RISOCOLORS, PALETTE, PALETTE_TWO } from './risocolors'
import { imgs } from './imagelist'
import { getFormattedVersion } from './utils/version.js'
import '../css/style.css'

// inspired by https://bsky.app/profile/leedoughty.bsky.social/post/3ldh2esstd22h
// https://leedoughty.com/

/** TODO:
  size an element down from max size by maybe 20% at random
  play with larger, too?
  square image plus square image are max v max and a kinda boring
**/

function getRandomUniqueItem (arr, excludeItems) {
  const filteredArr = arr.filter(item => !excludeItems.includes(item))
  if (filteredArr.length === 0) {
    throw new RangeError('getRandomUniqueItem: no available items to select')
  }
  const randomIndex = Math.floor(Math.random() * filteredArr.length)
  return filteredArr[randomIndex]
}

let currentBlendModeIndex = 0 // Start with the first blend mode

const backgroundModes = [
  {
    color: [0, 0, 0],
    blendModes: ['ADD', 'EXCLUSION', 'SCREEN', 'DIFFERENCE', 'LIGHTEST']
  },
  {
    color: [255, 255, 255],
    blendModes: ['MULTIPLY', 'EXCLUSION', 'DIFFERENCE', 'DARKEST', 'HARD_LIGHT']
  }
]

const sketch = function (p) {
  let currentPair = 0 // Track which image-color pair to update next
  let pause = false
  let autoSave = false
  let colorLayer1 = null
  let currentBackgroundModeIndex = 0 // Start with the first background mode
  const COLORS = [RISOCOLORS, PALETTE, PALETTE_TWO]
  let colorIndex = 0

  const imageColorPairs = [
    { img: null, color: null, layer: null, scale: 1 },
    { img: null, color: null, layer: null, scale: 1 }
  ]

  p.setup = function () {
    p.pixelDensity(2)
    // display mode
    // const c = p.createCanvas(p.windowWidth, p.windowHeight);
    // production mode
    const c = p.createCanvas(1000, 1000)
    c.elt.focus()
    p.imageMode(p.CENTER)
    colorLayer1 = p.createGraphics(100, 100)
    setBlendModeAndBackground()
    initializeImageColorPairs() // Initialize both pairs initially
    updateImageColorPair(0)
    updateImageColorPair(1)
  }

  p.mousePressed = function () {
    loadNewImagesAndColors() // Update one pair at a time
  }

  p.keyPressed = function () {
    if ((p.keyIsDown(p.CONTROL) || p.keyIsDown(91)) && p.key === 's') {
      p.saveCanvas(generateFilename())
      return false // Prevent default browser behavior
    } else if (p.key === 'b') {
      toggleBackgroundColor()
      regenerateLayers()
    } else if (p.key === 'c') {
      colorIndex = (colorIndex + 1) % COLORS.length
    } else if (p.key === 'm') {
      cycleBlendMode()
    } else if (p.key === 'p' || p.keyCode === 32) {
      pause = !pause
      console.log(`pause: ${pause}`)
    } else if (p.key === 'S') {
      autoSave = !autoSave
      console.log(`autoSave: ${autoSave}`)
    } else if (p.key === 'h' || p.key === 'i') {
      toggleHelpOverlay()
    }
  }

  p.draw = () => {
    if (!pause && p.frameCount % 30 === 0) {
      loadNewImagesAndColors()
      if (autoSave) {
        p.saveCanvas(generateFilename())
      }
    }
  }

  function setBlendModeAndBackground () {
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex]
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]])
    p.background(p.color(...currentBackgroundMode.color))
  }

  function toggleBackgroundColor () {
    currentBackgroundModeIndex =
      (currentBackgroundModeIndex + 1) % backgroundModes.length
    currentBlendModeIndex = 0 // Reset to the first blend mode for the new background
    setBlendModeAndBackground()
    updateScreen()
  }

  function regenerateLayers () {
    imageColorPairs.forEach((pair, index) => {
      if (pair.img && pair.color) {
        p.loadImage('./images/' + pair.img, function (img) {
          if (
            imageColorPairs[index].layer &&
            imageColorPairs[index].layer.remove
          ) {
            imageColorPairs[index].layer.remove()
          }
          imageColorPairs[index].layer = createMonochromeImage(
            img,
            p.color(pair.color.color)
          )
          updateScreen()
        })
      }
    })
  }

  function cycleBlendMode () {
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex]
    currentBlendModeIndex =
      (currentBlendModeIndex + 1) % currentBackgroundMode.blendModes.length
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]])
    updateScreen()
  }

  function generateFilename () {
    const d = new Date()
    return `duo_chrome_image.${d.getFullYear()}.${
      d.getMonth() + 1
    }.${d.getDate()}.${d.getHours()}${d.getMinutes()}${d.getSeconds()}.png`
  }

  async function toggleHelpOverlay () {
    const helpOverlay = document.getElementById('help-overlay')
    if (helpOverlay) {
      // If showing the overlay, populate version info
      if (helpOverlay.classList.contains('hidden')) {
        const versionInfo = document.getElementById('version-info')
        if (versionInfo) {
          try {
            const version = await getFormattedVersion()
            versionInfo.textContent = version
          } catch (error) {
            console.warn('Failed to load version info:', error)
            versionInfo.textContent = 'v1.0.0'
          }
        }
      }
      helpOverlay.classList.toggle('hidden')
    }
  }

  function initializeImageColorPairs () {
    imageColorPairs[0].img = getRandomUniqueItem(imgs, [])
    imageColorPairs[0].color = getRandomUniqueItem(COLORS[colorIndex], [])
    imageColorPairs[1].img = getRandomUniqueItem(imgs, [imageColorPairs[0].img])
    imageColorPairs[1].color = getRandomUniqueItem(COLORS[colorIndex], [
      imageColorPairs[0].color
    ])
  }

  function loadNewImagesAndColors () {
    updateImageColorPair(currentPair)
    currentPair = (currentPair + 1) % 2 // Toggle between 0 and 1
  }

  function updateImageColorPair (pairIndex) {
    // NOTE: this gets a filename, not an image
    const selectedImage = getRandomUniqueItem(
      imgs,
      imageColorPairs.map(pair => pair.img)
    )
    const selectedColor = getRandomUniqueItem(
      COLORS[colorIndex],
      imageColorPairs.map(pair => pair.color)
    )

    imageColorPairs[pairIndex].img = selectedImage
    imageColorPairs[pairIndex].color = selectedColor
    imageColorPairs[pairIndex].scale = p.random(0.8, 1.2).toFixed(2)

    p.loadImage('./images/' + selectedImage, img => {
      if (
        imageColorPairs[pairIndex].layer &&
        imageColorPairs[pairIndex].layer.remove
      ) {
        imageColorPairs[pairIndex].layer.remove()
      }
      imageColorPairs[pairIndex].layer = createMonochromeImage(
        img,
        p.color(selectedColor.color)
      )
      updateScreen()
    })
  }

  function updateScreen () {
    p.clear()
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex]
    p.background(currentBackgroundMode.color)
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]])
    imageColorPairs.forEach(pair => {
      if (pair.layer) {
        p.image(
          pair.layer,
          p.width / 2,
          p.height / 2,
          pair.layer.width * pair.scale,
          pair.layer.height * pair.scale
        )
      }
    })
  }

  const createMonochromeImage = (img, monoColor) => {
    const scaleRatio = p.calculateScaleRatio(img)
    const scaledWidth = Math.round(img.width * scaleRatio)
    const scaledHeight = Math.round(img.height * scaleRatio)

    colorLayer1.background(monoColor)

    const layer = p.createGraphics(scaledWidth, scaledHeight)
    layer.image(img, 0, 0, scaledWidth, scaledHeight)
    layer.drawingContext.globalCompositeOperation = 'source-in'
    layer.image(colorLayer1, 0, 0, scaledWidth, scaledHeight)

    return layer
  }

  p.calculateScaleRatio = function (img) {
    const maxCanvasSize = Math.min(p.width, p.height) * 0.8
    const maxImgSize = Math.max(img.width, img.height)
    return maxCanvasSize / maxImgSize
  }
}

new p5(sketch) // eslint-disable-line no-new, new-cap
