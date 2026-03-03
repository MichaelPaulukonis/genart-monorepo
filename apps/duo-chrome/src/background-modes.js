import { normalizeHexColor, rgbArrayToHex } from './utils/color-utils.js'

export const backgroundModes = [
  {
    color: [0, 0, 0],
    blendModes: ['ADD', 'EXCLUSION', 'SCREEN', 'BLEND', 'DIFFERENCE', 'LIGHTEST']
  },
  {
    color: [255, 255, 255],
    blendModes: ['MULTIPLY', 'EXCLUSION', 'BLEND', 'DIFFERENCE', 'DARKEST', 'HARD_LIGHT']
  }
]

/**
 * Creates the background/blend system.
 *
 * @param {object} deps
 * @param {object} deps.p - p5 instance
 * @param {Array}  deps.imageColorPairs - mutable array of image/color pairs
 * @param {{ get: () => number, set: (v: number) => void }} deps.colorIndex
 * @param {{ get: () => number, set: (v: number) => void }} deps.backgroundModeIndex
 * @param {{ get: () => number, set: (v: number) => void }} deps.blendModeIndex
 * @param {Array}  deps.ALL_PALETTES
 * @param {Function} deps.createMonochromeImage
 * @param {Function} deps.requestScreenUpdate
 * @param {Function} deps.updateStatusDisplay
 * @param {Function} deps.captureHistoryImmediate
 * @param {string}   deps.imgSource
 */
export function createBackgroundSystem ({
  p,
  imageColorPairs,
  colorIndex,
  backgroundModeIndex,
  blendModeIndex,
  ALL_PALETTES,
  createMonochromeImage,
  requestScreenUpdate,
  updateStatusDisplay,
  captureHistoryImmediate,
  imgSource
}) {
  function getCurrentBackgroundHexColor () {
    const mode = backgroundModes[backgroundModeIndex.get()]
    return normalizeHexColor(rgbArrayToHex(mode?.color || []))
  }

  function getPaletteWithoutBackground () {
    const backgroundHex = getCurrentBackgroundHexColor()
    const palette = ALL_PALETTES[colorIndex.get()] || []
    const filtered = palette.filter(entry => {
      const c = entry?.color
      const colorHex = Array.isArray(c)
        ? normalizeHexColor(rgbArrayToHex(c))
        : normalizeHexColor(c)
      return colorHex !== backgroundHex
    })
    return filtered.length > 0 ? filtered : palette
  }

  function setBlendModeAndBackground () {
    const currentBackgroundMode = backgroundModes[backgroundModeIndex.get()]
    p.blendMode(p[currentBackgroundMode.blendModes[blendModeIndex.get()]])
    p.background(p.color(...currentBackgroundMode.color))
  }

  function regenerateLayers () {
    imageColorPairs.forEach((pair, index) => {
      if (pair.img && pair.color) {
        p.loadImage(imgSource + pair.img, function (img) {
          if (imageColorPairs[index].layer && imageColorPairs[index].layer.remove) {
            imageColorPairs[index].layer.remove()
          }
          imageColorPairs[index].layer = createMonochromeImage(img, p.color(pair.color.color))
          requestScreenUpdate()
        })
      }
    })
  }

  function toggleBackgroundColor () {
    backgroundModeIndex.set((backgroundModeIndex.get() + 1) % backgroundModes.length)
    blendModeIndex.set(0)
    setBlendModeAndBackground()

    const newBgHex = getCurrentBackgroundHexColor()
    const toHex = c => Array.isArray(c) ? normalizeHexColor(rgbArrayToHex(c)) : normalizeHexColor(c)
    let colorChanged = false
    imageColorPairs.forEach((pair, i) => {
      if (pair.color && toHex(pair.color.color) === newBgHex) {
        const palette = getPaletteWithoutBackground()
        const otherColor = imageColorPairs[1 - i]?.color
        const otherHex = otherColor ? toHex(otherColor.color) : null
        const choices = palette.filter(c => toHex(c.color) !== otherHex)
        const pool = choices.length > 0 ? choices : palette
        pair.color = pool[Math.floor(Math.random() * pool.length)]
        colorChanged = true
      }
    })
    if (colorChanged) regenerateLayers()

    requestScreenUpdate()
    updateStatusDisplay()
    captureHistoryImmediate('manual')
  }

  function cycleBlendMode () {
    const currentBackgroundMode = backgroundModes[backgroundModeIndex.get()]
    blendModeIndex.set((blendModeIndex.get() + 1) % currentBackgroundMode.blendModes.length)
    p.blendMode(p[currentBackgroundMode.blendModes[blendModeIndex.get()]])
    requestScreenUpdate()
    updateStatusDisplay()
    captureHistoryImmediate('manual')
  }

  return {
    getCurrentBackgroundHexColor,
    getPaletteWithoutBackground,
    setBlendModeAndBackground,
    toggleBackgroundColor,
    cycleBlendMode,
    regenerateLayers
  }
}
