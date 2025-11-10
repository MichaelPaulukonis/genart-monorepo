import { p5 } from 'p5js-wrapper'
import '../css/style.css'
import '../../../libs/version-display/version-display.css'
import { formatVersion } from './utils/version.js'
import { displayUI, drawOSD, displayHelpScreen, displayProcessingText } from './ui.js'
import { mouseDragged, mouseReleased, mousePressed, specialKeys, handleKeys, keyReleased, handleFile } from './input.js'

const sketch = function (p) {
  const state = {
    img: null,
    threshold: 128,
    lastThreshold: null,
    backgroundColor: null,
    displayLayer: null,
    paintLayer: null,
    paintScale: 1.0,
    combinedLayer: null,
    bwCachedImage: null,
    dirty: false,
    invert: false,
    sizeRatio: 1.0,
    brushSize: 10,
    transparencyModeEnabled: true, // Default to enabled
    autoCrop: true, // Default to enabled
    isDrawingLine: false,
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 },

    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,

    isCropping: false,
    cropStart: { x: 0, y: 0 },
    cropEnd: { x: 0, y: 0 },

    undoStack: [],

    transparencyThreshold: 128, // Threshold for gray pixels in transparency mode
    density: 1, // need to use density in size calculations for both w+h
    // but if we render offscreen, why worry about pixeldensity ?!?!?
    displaySize: 800,
    outputSize: 2000,
    previousMouse: { x: 0, y: 0 },

    view: {
      x: 0, // Pan offset X, in image pixels
      y: 0, // Pan offset Y, in image pixels
      zoom: 1.0, // User-controlled zoom, defaults to 1.0
      baseScale: 1.0 // Calculated by fit actions
    },

    showOSD: true, // On-Screen Display for image positioning

    modes: {
      ADJUST: 'ADJUST',
      EDIT: 'EDIT'
    },
    editTools: {
      PAINT: 'PAINT',
      CROP: 'CROP'
    },
    appMode: 'ADJUST',
    editTool: 'PAINT',

    modal: {
      showHelp: false,
      showUI: true,
      processing: false,
      eraseMode: false,
      refit: false
    }
  }

  p.preload = function () {
    state.img = p.loadImage(
      './sample_images/mona.crosshairs.png'
    )
  }

  p.setup = function () {
    p.pixelDensity(state.density)
    const c = p.createCanvas(state.displaySize, state.displaySize)
    c.drop((file) => handleFile(p, state, { processImage }, file))
    p.imageMode(p.CENTER)
    state.backgroundColor = p.color(255, 255, 255)
    p.background(state.backgroundColor)

    state.displayLayer = p.createGraphics(state.outputSize, state.outputSize)
    state.displayLayer.pixelDensity(state.density)
    state.displayLayer.imageMode(p.CENTER)
    processImage(state.img)
  }

  const setupPaintBuffer = ({ width, height }) => {
    const maxSize = Math.max(width, height)
    state.paintScale = state.displaySize / maxSize
    state.paintLayer && state.paintLayer.remove()
    state.paintLayer = p.createGraphics(width, height)
    state.paintLayer.elt.id = `paint.${p.frameCount}`
    state.paintLayer.pixelDensity(state.density)
    state.paintLayer.imageMode(p.CENTER)
    state.paintLayer.clear()
  }

  const setupCombinedBuffer = () => { // No width, height parameters
    state.combinedLayer && state.combinedLayer.remove()
    state.combinedLayer = p.createGraphics(state.outputSize, state.outputSize) // Always outputSize
    state.combinedLayer.elt.id = `combined.${p.frameCount}`
    state.combinedLayer.pixelDensity(state.density)
    // combinedLayer.imageMode(p.CENTER) // This might need to be adjusted or removed
  }

  p.draw = function () {
    if (state.modal.showHelp) {
      displayHelpScreen(p)
      return
    }
    if (state.modal.processing) {
      displayProcessingText(p)
      return
    }
    if (state.modal.refit) {
      processImage(state.img)
      return
    }
    specialKeys(p, state, { buildPaintLayer, buildCombinedLayer })
    if (state.displayLayer && state.dirty) {
      p.background(state.backgroundColor)
      p.image(state.displayLayer, p.width / 2, p.height / 2, p.width, p.height)
      state.dirty = false

      if (state.appMode === state.modes.EDIT && state.editTool === state.editTools.PAINT) {
        // draw brush
        p.stroke(0)
        p.strokeWeight(1)
        p.fill(255)
        p.ellipse(p.mouseX, p.mouseY, state.brushSize * state.paintScale)
        state.dirty = true
      }

      if (state.isDrawingLine) {
        p.push()
        p.stroke('red')
        p.strokeWeight(state.brushSize * state.paintScale)
        p.line(state.startPoint.x, state.startPoint.y, state.endPoint.x, state.endPoint.y)
        p.pop()
      }

      if (state.isCropping) {
        p.push()
        p.noFill()
        p.stroke('red')
        p.strokeWeight(1)
        p.rect(state.cropStart.x, state.cropStart.y, state.cropEnd.x - state.cropStart.x, state.cropEnd.y - state.cropStart.y)
        p.pop()
        state.dirty = true
      }

      if (state.modal.showUI) displayUI(p, state)
      if (state.showOSD && state.appMode === state.modes.ADJUST) drawOSD(p, state)

      // Visual feedback when dragging
      if (state.isDragging && state.appMode === state.modes.ADJUST) {
        p.push()
        p.stroke(255, 100, 100, 150)
        p.strokeWeight(2)
        p.noFill()
        p.rect(0, 0, p.width, p.height)
        p.pop()
      }

      // Set cursor based on mode
      if (state.appMode === state.modes.ADJUST && !state.modal.showHelp) {
        p.cursor(state.isDragging ? 'grabbing' : 'grab')
      } else if (state.appMode === state.modes.EDIT) {
        if (state.editTool === state.editTools.PAINT) {
          // The brush ellipse is drawn, so a simple cursor is fine..
          p.cursor(p.CROSS)
        } else if (state.editTool === state.editTools.CROP) {
          p.cursor(p.CROSS)
        }
      }
    }
  }

  const drawPaintLine = () => {
    state.paintLayer.stroke(255)
    state.paintLayer.strokeWeight(state.brushSize)
    if (state.modal.eraseMode) {
      state.paintLayer.erase()
    }
    state.paintLayer.line(
      state.previousMouse.x / state.paintScale,
      state.previousMouse.y / state.paintScale,
      p.mouseX / state.paintScale,
      p.mouseY / state.paintScale
    )
    state.paintLayer.noErase()
    state.previousMouse = { x: p.mouseX, y: p.mouseY }
    buildPaintLayer(state.img)
    state.dirty = true
  }

  const drawLine = (start, end) => {
    state.paintLayer.stroke(255)
    state.paintLayer.strokeWeight(state.brushSize)
    if (state.modal.eraseMode) {
      state.paintLayer.erase()
    }
    state.paintLayer.line(
      start.x / state.paintScale,
      start.y / state.paintScale,
      end.x / state.paintScale,
      end.y / state.paintScale
    )
    state.paintLayer.noErase()
    buildPaintLayer(state.img)
    state.dirty = true
  }

  p.mouseDragged = function () { mouseDragged(p, state, { drawPaintLine, applyBoundaryConstraints, buildCombinedLayer }) }

  p.mouseReleased = function () { mouseReleased(p, state, { drawLine, performCrop }) }

  p.mousePressed = function () { mousePressed(p, state, { drawPaintLine }) }

  const performCrop = () => {
    // 1. Save state for undo
    const currentState = {
      img: state.img.get(),
      paintLayer: p.createGraphics(state.paintLayer.width, state.paintLayer.height)
    }
    currentState.paintLayer.image(state.paintLayer, 0, 0, state.paintLayer.width, state.paintLayer.height)
    state.undoStack.push(currentState)

    // 2. Calculate crop dimensions in image space
    const x = Math.round(Math.min(state.cropStart.x, state.cropEnd.x) / state.paintScale)
    const y = Math.round(Math.min(state.cropStart.y, state.cropEnd.y) / state.paintScale)
    const w = Math.round(Math.abs(state.cropEnd.x - state.cropStart.x) / state.paintScale)
    const h = Math.round(Math.abs(state.cropEnd.y - state.cropStart.y) / state.paintScale)

    if (w < 1 || h < 1) return // Ignore tiny crops

    // 3. Crop the main image
    const newImg = state.img.get(x, y, w, h)

    // 4. Crop the paint layer
    const newPaintLayer = p.createGraphics(w, h)
    newPaintLayer.image(state.paintLayer, 0, 0, w, h, x, y, w, h)
    state.paintLayer.remove()
    state.paintLayer = newPaintLayer

    state.img = newImg

    // Set fit mode to fitToCanvas after cropping (Feature 66.3) - This is now handled by fitBoth in switchToAdjustMode

    // 5. Reset state and switch to ADJUST mode
    switchToAdjustMode(true)
  }

  const undoCrop = () => {
    if (state.undoStack.length === 0) return
    const lastState = state.undoStack.pop()

    state.img = lastState.img
    state.paintLayer.remove()
    state.paintLayer = lastState.paintLayer

    switchToAdjustMode(true)
  }

  const switchToAdjustMode = (fromCrop = false) => {
    state.appMode = state.modes.ADJUST
    p.resizeCanvas(state.displaySize, state.displaySize)
    const tempBuff = p.createGraphics(state.outputSize, state.outputSize)
    tempBuff.elt.id = `temp_adjust_on.${p.frameCount}`
    tempBuff.pixelDensity(state.density)
    tempBuff.imageMode(p.CENTER)
    state.displayLayer.remove()
    state.displayLayer = tempBuff

    if (fromCrop) {
      // Reset view parameters after a crop/undo and refit the new image
      state.bwCachedImage = null
      state.combinedLayer?.remove()
      state.combinedLayer = null
      fitBoth(state.img)
    } else {
      buildCombinedLayer(state.img)
    }
  }

  p.keyPressed = () => handleKeys(p, state, { undoCrop, buildCombinedLayer, buildPaintLayer, switchToAdjustMode, createSaveImage, generateFilename, fitBoth, fitWidth, fitHeight })



  p.keyReleased = function () { keyReleased(p, state, { drawLine }) }

  function generateFilename() {
    const d = new Date()
    const modeIndicator = state.transparencyModeEnabled ? '-transparent' : ''
    return (
      'monochrome_image.' +
      d.getFullYear() +
      '.' +
      (d.getMonth() + 1) +
      '.' +
      d.getDate() +
      d.getHours() +
      d.getMinutes() +
      d.getSeconds() +
      modeIndicator +
      '.png'
    )
  }

  // Create save image that matches exactly what user sees on screen
  const createSaveImage = () => {
    if (state.transparencyModeEnabled) {
      // For transparency mode, use the same flow as standard mode but apply transparency
      // Create a copy of displayLayer and apply transparency processing
      const exportCanvas = p.createGraphics(state.displayLayer.width, state.displayLayer.height)
      exportCanvas.pixelDensity(state.density)
      exportCanvas.image(state.displayLayer, 0, 0)

      // Process for transparency mode
      exportCanvas.loadPixels()
      for (let i = 0; i < exportCanvas.pixels.length; i += 4) {
        const r = exportCanvas.pixels[i]
        const g = exportCanvas.pixels[i + 1]
        const b = exportCanvas.pixels[i + 2]
        const a = exportCanvas.pixels[i + 3]

        if (a > 0) { // Only process non-transparent pixels
          const avg = (r + g + b) / 3

          // displayLayer already contains correctly processed (inverted) pixels
          // Just determine transparency based on the processed values
          const bw = avg > state.threshold ? 255 : 0

          const shouldBeTransparent = bw >= 255 - state.transparencyThreshold

          if (shouldBeTransparent) {
            exportCanvas.pixels[i + 3] = 0 // Make transparent
          } else {
            // Keep as black and opaque
            exportCanvas.pixels[i] = 0
            exportCanvas.pixels[i + 1] = 0
            exportCanvas.pixels[i + 2] = 0
            exportCanvas.pixels[i + 3] = 255
          }
        }
      }
      exportCanvas.updatePixels()
      return exportCanvas
    } else {
      // For standard mode, use the existing displayLayer
      return state.displayLayer
    }
  }

  const getMonochromeImage = (img, threshold, forSave = false) => {
    if (state.bwCachedImage && state.lastThreshold === threshold && !forSave) {
      return state.bwCachedImage
    }

    const newImg = p.createImage(img.width, img.height)
    newImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height)

    newImg.loadPixels()
    for (let y = 0; y < img.height * state.density; y++) {
      for (let x = 0; x < img.width * state.density; x++) {
        const index = (x + y * img.width * state.density) * 4
        const r = newImg.pixels[index]
        const g = newImg.pixels[index + 1]
        const b = newImg.pixels[index + 2]
        const a = newImg.pixels[index + 3]
        const avg = (r + g + b) / 3

        if (forSave && state.transparencyModeEnabled) {
          // Transparency mode logic for saving
          if (a === 0) {
            // Already transparent pixels stay transparent
            newImg.pixels[index] = 0
            newImg.pixels[index + 1] = 0
            newImg.pixels[index + 2] = 0
            newImg.pixels[index + 3] = 0
          } else {
            // First convert to black/white like display mode
            let bw = avg > threshold ? 255 : 0
            if (state.invert) {
              bw = 255 - bw
            }

            // Determine what should be transparent based on display values
            // White pixels on screen (bw = 255) should be transparent
            const shouldBeTransparent = bw >= 255 - state.transparencyThreshold

            if (shouldBeTransparent) {
              // Make transparent
              newImg.pixels[index] = 0
              newImg.pixels[index + 1] = 0
              newImg.pixels[index + 2] = 0
              newImg.pixels[index + 3] = 0
            } else {
              // Keep as black and opaque (always black in transparency mode)
              newImg.pixels[index] = 0
              newImg.pixels[index + 1] = 0
              newImg.pixels[index + 2] = 0
              newImg.pixels[index + 3] = 255
            }
          }
        } else {
          // Standard mode (for display or non-transparent save)
          let bw = avg > threshold ? 255 : 0

          if (state.invert) {
            bw = 255 - bw
          }

          if (a === 0 || bw === (state.invert ? 0 : 255)) {
            // Transparent pixel (a = 0) sets to background color
            newImg.pixels[index] = p.red(state.backgroundColor)
            newImg.pixels[index + 1] = p.green(state.backgroundColor)
            newImg.pixels[index + 2] = p.blue(state.backgroundColor)
          } else {
            newImg.pixels[index] = state.invert ? 255 : 0 // Invert black to white
            newImg.pixels[index + 1] = state.invert ? 255 : 0 // Invert black to white
            newImg.pixels[index + 2] = state.invert ? 255 : 0 // Invert black to white
          }
          newImg.pixels[index + 3] = 255 // Set alpha to fully opaque
        }
      }
    }
    newImg.updatePixels()

    if (!forSave) {
      state.bwCachedImage = newImg
      state.lastThreshold = threshold
    }

    return newImg
  }

  const buildPaintLayer = img => {
    const newImg = getMonochromeImage(img, state.threshold)
    state.displayLayer.background(state.backgroundColor)
    state.displayLayer.image(newImg, state.displayLayer.width / 2, state.displayLayer.height / 2)
    state.displayLayer.image(
      state.paintLayer,
      state.displayLayer.width / 2,
      state.displayLayer.height / 2
    )

    state.dirty = true
  }

  const applyBoundaryConstraints = () => {
    // This function can be expanded to constrain camera movement
    // For now, we'll allow free movement
  }

  const buildCombinedLayer = img => {
    const newImg = getMonochromeImage(img, state.threshold)

    if (state.combinedLayer === null) {
      setupCombinedBuffer()
    }

    state.combinedLayer.clear()
    state.combinedLayer.push()

    // 1. Center the transform origin
    state.combinedLayer.translate(state.combinedLayer.width / 2, state.combinedLayer.height / 2)

    // 2. Apply the unified view transform
    const finalScale = state.view.zoom * state.view.baseScale
    state.combinedLayer.scale(finalScale)
    state.combinedLayer.translate(-state.view.x, -state.view.y)

    // 3. Draw the image and paint layer at their native resolution, centered on the view
    state.combinedLayer.imageMode(p.CENTER)
    state.combinedLayer.image(newImg, 0, 0) // Draw at native resolution
    state.combinedLayer.image(state.paintLayer, 0, 0)

    state.combinedLayer.pop()

    // The result is directly displayed. No more cropping at the end of the pipe.
    state.displayLayer.background(state.backgroundColor)
    state.displayLayer.image(
      state.combinedLayer,
      state.displayLayer.width / 2,
      state.displayLayer.height / 2,
      state.displayLayer.width,
      state.displayLayer.height
    )

    // Force displayLayer to be monochrome for display
    state.displayLayer.loadPixels()
    for (let i = 0; i < state.displayLayer.pixels.length; i += 4) {
      const r = state.displayLayer.pixels[i]
      const g = state.displayLayer.pixels[i + 1]
      const b = state.displayLayer.pixels[i + 2]
      const avg = (r + g + b) / 3
      const bw = avg > state.threshold ? 255 : 0 // Use actual threshold
      state.displayLayer.pixels[i] = bw
      state.displayLayer.pixels[i + 1] = bw
      state.displayLayer.pixels[i + 2] = bw
      state.displayLayer.pixels[i + 3] = 255 // Ensure opaque
    }
    state.displayLayer.updatePixels()

    state.dirty = true
  }

  function processImage(img) {
    if (!state.modal.refit) {
      state.bwCachedImage = null // this is not required for refit
      setupPaintBuffer(img)
    }
    state.modal.processing = false
    state.combinedLayer && state.combinedLayer.remove()
    state.combinedLayer = null

    fitBoth(img) // This will set the initial view and call buildCombinedLayer

    state.modal.refit = false
    state.dirty = true
  }



  const getContentBounds = (img) => {
    // This is computationally expensive, but necessary for accurate bounds.
    // Create a temporary buffer to combine the monochrome image and the paint layer.
    const source = getMonochromeImage(img, state.threshold)
    const tempLayer = p.createGraphics(source.width, source.height)
    tempLayer.pixelDensity(state.density)
    tempLayer.image(source, 0, 0)
    tempLayer.image(state.paintLayer, 0, 0)

    tempLayer.loadPixels()
    let top = -1
    let bottom = -1
    let left = -1
    let right = -1

    // Find top
    for (let y = 0; y < tempLayer.height; y++) {
      for (let x = 0; x < tempLayer.width; x++) {
        const index = (x + y * tempLayer.width) * 4
        if (tempLayer.pixels[index] !== p.red(state.backgroundColor) || tempLayer.pixels[index + 1] !== p.green(state.backgroundColor) || tempLayer.pixels[index + 2] !== p.blue(state.backgroundColor)) {
          top = y
          break
        }
      }
      if (top !== -1) break
    }

    // Image is blank
    if (top === -1) {
      tempLayer.remove()
      return { x: 0, y: 0, width: img.width, height: img.height, isEmpty: true }
    }

    // Find bottom
    for (let y = tempLayer.height - 1; y >= 0; y--) {
      for (let x = 0; x < tempLayer.width; x++) {
        const index = (x + y * tempLayer.width) * 4
        if (tempLayer.pixels[index] !== p.red(state.backgroundColor) || tempLayer.pixels[index + 1] !== p.green(state.backgroundColor) || tempLayer.pixels[index + 2] !== p.blue(state.backgroundColor)) {
          bottom = y
          break
        }
      }
      if (bottom !== -1) break
    }

    // Find left
    for (let x = 0; x < tempLayer.width; x++) {
      for (let y = 0; y < tempLayer.height; y++) {
        const index = (x + y * tempLayer.width) * 4
        if (tempLayer.pixels[index] !== p.red(state.backgroundColor) || tempLayer.pixels[index + 1] !== p.green(state.backgroundColor) || tempLayer.pixels[index + 2] !== p.blue(state.backgroundColor)) {
          left = x
          break
        }
      }
      if (left !== -1) break
    }

    // Find right
    for (let x = tempLayer.width - 1; x >= 0; x--) {
      for (let y = 0; y < tempLayer.height; y++) {
        const index = (x + y * tempLayer.width) * 4
        if (tempLayer.pixels[index] !== p.red(state.backgroundColor) || tempLayer.pixels[index + 1] !== p.green(state.backgroundColor) || tempLayer.pixels[index + 2] !== p.blue(state.backgroundColor)) {
          right = x
          break
        }
      }
      if (right !== -1) break
    }

    tempLayer.remove()
    return { x: left, y: top, width: right - left + 1, height: bottom - top + 1, isEmpty: false }
  }

  const fitBoth = (img) => {
    const contentBounds = state.autoCrop ? getContentBounds(img) : { x: 0, y: 0, width: img.width, height: img.height, isEmpty: false }
    if (contentBounds.isEmpty) { // Don't fit an empty image
      state.view.baseScale = 1.0
      state.view.zoom = 1.0
      state.view.x = 0
      state.view.y = 0
      buildCombinedLayer(img)
      return
    }
    const scaleX = state.outputSize / contentBounds.width
    const scaleY = state.outputSize / contentBounds.height
    state.view.baseScale = Math.min(scaleX, scaleY)
    state.view.zoom = 1.0
    state.view.x = 0 // Reset pan
    state.view.y = 0 // Reset pan
    buildCombinedLayer(img)
  }

  const fitWidth = (img) => {
    const contentBounds = state.autoCrop ? getContentBounds(img) : { x: 0, y: 0, width: img.width, height: img.height, isEmpty: false }
    if (contentBounds.isEmpty) return
    state.view.baseScale = state.outputSize / contentBounds.width
    state.view.zoom = 1.0
    state.view.x = 0 // Reset pan
    state.view.y = 0 // Reset pan
    buildCombinedLayer(img)
  }

  const fitHeight = (img) => {
    const contentBounds = state.autoCrop ? getContentBounds(img) : { x: 0, y: 0, width: img.width, height: img.height, isEmpty: false }
    if (contentBounds.isEmpty) return
    state.view.baseScale = state.outputSize / contentBounds.height
    state.view.zoom = 1.0
    state.view.x = 0 // Reset pan
    state.view.y = 0 // Reset pan
    buildCombinedLayer(img)
  }



}

new p5(sketch) // eslint-disable-line no-new, new-cap
