import { p5 } from 'p5js-wrapper'
import '../css/style.css'
import '../../../libs/version-display/version-display.css'
import { displayUI, drawOSD, displayProcessingText, drawGrid } from './ui.js'
import { mouseDragged, mouseReleased, mousePressed, specialKeys, handleKeys, keyReleased, handleFile, getHandleAtPosition, isInsideRect } from './input.js'
import { WebGLProcessor } from './webgl-processor.js'

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

    cropState: 'idle', // 'idle', 'drawing', 'adjusting', 'dragging_handle', 'moving'
    activeHandle: null,
    hoveredHandle: null,
    cropStart: { x: 0, y: 0 },
    cropEnd: { x: 0, y: 0 },

    undoStack: [],

    // Grid State
    showGrid: false,
    showGridControls: true,
    gridType: '1-split',
    gridColor: '#FF0000',
    gridOpacity: 150,
    gridThickness: 2,

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
      showUI: true,
      processing: false,
      eraseMode: false,
      refit: false
    },

    showHalftoneControls: true,
    halftone: {
      enabled: false,
      patternType: 0, // 0: Dots, 1: Lines, 2: Dither
      dotSize: 8,
      angle: 45
    },

    webglProcessor: null
  }

  p.preload = function () {
    state.img = p.loadImage(
      './sample_images/mona_square.jpeg'
    )
  }

  p.setup = function () {
    p.noSmooth()
    p.pixelDensity(state.density)
    const c = p.createCanvas(state.displaySize, state.displaySize)
    c.drop((file) => handleFile(p, state, { processImage }, file))
    p.imageMode(p.CENTER)
    state.backgroundColor = p.color(255, 255, 255)
    p.background(state.backgroundColor)

    state.displayLayer = p.createGraphics(state.outputSize, state.outputSize)
    state.displayLayer.noSmooth()
    state.displayLayer.pixelDensity(state.density)
    state.displayLayer.imageMode(p.CENTER)

    state.webglProcessor = new WebGLProcessor(p, state.outputSize, state.outputSize)
    state.webglProcessor.init({
      monochrome: { vert: './shaders/monochrome.vert', frag: './shaders/monochrome.frag' },
      halftone: { vert: './shaders/monochrome.vert', frag: './shaders/halftone.frag' }
    }).then(() => {
      if (state.img) {
        buildCombinedLayer(state.img)
      }
    })

    loadSettings()
    initGridControls()
    initHalftoneControls()

    processImage(state.img)
  }

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('monochromifier_grid_settings')
      if (saved) {
        const settings = JSON.parse(saved)
        state.showGrid = settings.showGrid ?? state.showGrid
        state.showGridControls = settings.showGridControls ?? state.showGridControls
        state.gridType = settings.gridType ?? state.gridType
        state.gridColor = settings.gridColor ?? state.gridColor
        state.gridOpacity = settings.gridOpacity ?? state.gridOpacity
        state.gridThickness = settings.gridThickness ?? state.gridThickness
      }

      const savedHalftone = localStorage.getItem('monochromifier_halftone_settings')
      if (savedHalftone) {
        const h = JSON.parse(savedHalftone)
        state.showHalftoneControls = h.showHalftoneControls ?? state.showHalftoneControls
        state.halftone.enabled = h.enabled ?? state.halftone.enabled
        state.halftone.patternType = h.patternType ?? state.halftone.patternType
        state.halftone.dotSize = h.dotSize ?? state.halftone.dotSize
        state.halftone.angle = h.angle ?? state.halftone.angle
      }
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }

  const saveSettings = () => {
    try {
      const settings = {
        showGrid: state.showGrid,
        showGridControls: state.showGridControls,
        gridType: state.gridType,
        gridColor: state.gridColor,
        gridOpacity: state.gridOpacity,
        gridThickness: state.gridThickness
      }
      localStorage.setItem('monochromifier_grid_settings', JSON.stringify(settings))

      const halftoneSettings = {
        showHalftoneControls: state.showHalftoneControls,
        enabled: state.halftone.enabled,
        patternType: state.halftone.patternType,
        dotSize: state.halftone.dotSize,
        angle: state.halftone.angle
      }
      localStorage.setItem('monochromifier_halftone_settings', JSON.stringify(halftoneSettings))
    } catch (e) {
      console.error('Failed to save settings', e)
    }
  }

  const initGridControls = () => {
    const gridToggle = document.getElementById('grid-toggle')
    const gridType = document.getElementById('grid-type')
    const gridColor = document.getElementById('grid-color')
    const gridOpacity = document.getElementById('grid-opacity')
    const gridThickness = document.getElementById('grid-thickness')

    if (!gridToggle) return // Elements might not exist if HTML not updated

    gridToggle.checked = state.showGrid
    gridType.value = state.gridType
    gridColor.value = state.gridColor
    gridOpacity.value = state.gridOpacity
    gridThickness.value = state.gridThickness

    gridToggle.addEventListener('change', (e) => { e.stopPropagation(); state.showGrid = e.target.checked; state.dirty = true; saveSettings() })
    gridType.addEventListener('change', (e) => { e.stopPropagation(); state.gridType = e.target.value; state.dirty = true; saveSettings() })
    gridColor.addEventListener('input', (e) => { e.stopPropagation(); state.gridColor = e.target.value; state.dirty = true; saveSettings() })
    gridOpacity.addEventListener('input', (e) => { e.stopPropagation(); state.gridOpacity = e.target.value; state.dirty = true; saveSettings() })
    gridThickness.addEventListener('input', (e) => { e.stopPropagation(); state.gridThickness = e.target.value; state.dirty = true; saveSettings() })
  }

  const initHalftoneControls = () => {
    const toggle = document.getElementById('halftone-toggle')
    const type = document.getElementById('halftone-type')
    const size = document.getElementById('halftone-size')
    const angle = document.getElementById('halftone-angle')

    if (!toggle) return

    toggle.checked = state.halftone.enabled
    type.value = state.halftone.patternType
    size.value = state.halftone.dotSize
    angle.value = state.halftone.angle

    toggle.addEventListener('change', (e) => { 
      e.stopPropagation()
      state.halftone.enabled = e.target.checked
      state.dirty = true
      saveSettings() 
      buildCombinedLayer(state.img)
    })
    type.addEventListener('change', (e) => { 
      e.stopPropagation()
      state.halftone.patternType = parseInt(e.target.value)
      state.dirty = true
      saveSettings()
      buildCombinedLayer(state.img)
    })
    size.addEventListener('input', (e) => { 
      e.stopPropagation()
      state.halftone.dotSize = parseFloat(e.target.value)
      state.dirty = true
      saveSettings()
      buildCombinedLayer(state.img)
    })
    angle.addEventListener('input', (e) => { 
      e.stopPropagation()
      state.halftone.angle = parseFloat(e.target.value)
      state.dirty = true
      saveSettings()
      buildCombinedLayer(state.img)
    })
  }

  const updatePaintScale = (w, h) => {
    const maxSize = Math.max(w, h)
    state.paintScale = state.displaySize / maxSize
  }

  const setupPaintBuffer = ({ width, height }) => {
    updatePaintScale(width, height)
    state.paintLayer && state.paintLayer.remove()
    state.paintLayer = p.createGraphics(width, height)
    state.paintLayer.noSmooth()
    state.paintLayer.elt.id = `paint.${p.frameCount}`
    state.paintLayer.pixelDensity(state.density)
    state.paintLayer.imageMode(p.CENTER)
    state.paintLayer.clear()
  }

  const setupCombinedBuffer = () => { // No width, height parameters
    state.combinedLayer && state.combinedLayer.remove()
    state.combinedLayer = p.createGraphics(state.outputSize, state.outputSize) // Always outputSize
    state.combinedLayer.noSmooth()
    state.combinedLayer.elt.id = `combined.${p.frameCount}`
    state.combinedLayer.pixelDensity(state.density)
    // combinedLayer.imageMode(p.CENTER) // This might need to be adjusted or removed
  }

  p.draw = function () {
    if (state.modal.processing) {
      displayProcessingText(p)
      return
    }
    if (state.modal.refit) {
      processImage(state.img)
      return
    }
    specialKeys(p, state, { buildPaintLayer, buildCombinedLayer })

    // Always clear background
    p.background(state.backgroundColor)

    if (state.displayLayer) {
      // Draw the display layer
      p.image(state.displayLayer, p.width / 2, p.height / 2, p.width, p.height)

      if (state.appMode === state.modes.EDIT && state.editTool === state.editTools.PAINT) {
        // draw brush
        p.stroke(0)
        p.strokeWeight(1)
        p.fill(255)
        p.ellipse(p.mouseX, p.mouseY, state.brushSize * state.paintScale)
      }

      if (state.isDrawingLine) {
        p.push()
        p.stroke('red')
        p.strokeWeight(state.brushSize * state.paintScale)
        p.line(state.startPoint.x, state.startPoint.y, state.endPoint.x, state.endPoint.y)
        p.pop()
      }

      if (state.cropState !== 'idle') {
        const x = Math.min(state.cropStart.x, state.cropEnd.x)
        const y = Math.min(state.cropStart.y, state.cropEnd.y)
        const w = Math.abs(state.cropEnd.x - state.cropStart.x)
        const h = Math.abs(state.cropEnd.y - state.cropStart.y)

        p.push()

        // Scrim
        p.fill(0, 150)
        p.noStroke()
        // Top
        p.rect(0, 0, p.width, y)
        // Bottom
        p.rect(0, y + h, p.width, p.height - (y + h))
        // Left
        p.rect(0, y, x, h)
        // Right
        p.rect(x + w, y, p.width - (x + w), h)

        // Crop Rect
        p.noFill()
        p.stroke(255)
        p.strokeWeight(1)
        p.rect(x, y, w, h)

        // Grid (Rule of Thirds)
        p.stroke(255, 100)
        p.line(x + w / 3, y, x + w / 3, y + h)
        p.line(x + 2 * w / 3, y, x + 2 * w / 3, y + h)
        p.line(x, y + h / 3, x + w, y + h / 3)
        p.line(x, y + 2 * h / 3, x + w, y + 2 * h / 3)

        // Handles
        if (state.cropState === 'adjusting' || state.cropState === 'dragging_handle') {
          const handles = {
            tl: { x: x, y: y, cursor: 'nwse-resize' },
            tr: { x: x + w, y: y, cursor: 'nesw-resize' },
            bl: { x: x, y: y + h, cursor: 'nesw-resize' },
            br: { x: x + w, y: y + h, cursor: 'nwse-resize' },
            tm: { x: x + w / 2, y: y, cursor: 'ns-resize' },
            bm: { x: x + w / 2, y: y + h, cursor: 'ns-resize' },
            lm: { x: x, y: y + h / 2, cursor: 'ew-resize' },
            rm: { x: x + w, y: y + h / 2, cursor: 'ew-resize' }
          }

          for (const [id, pos] of Object.entries(handles)) {
            const isHovered = state.hoveredHandle === id
            const isActive = state.activeHandle === id
            const size = (isHovered || isActive) ? 12 : 8

            p.fill(isActive ? '#FFD700' : (isHovered ? '#00BFFF' : 255)) // Gold if active, DeepSkyBlue if hovered, else white
            p.stroke(0)
            p.strokeWeight(1)
            p.rect(pos.x - size / 2, pos.y - size / 2, size, size)

            if (isHovered && state.cropState === 'adjusting') {
              p.cursor(pos.cursor)
            }
          }

          if (!state.hoveredHandle && isInsideRect(state, p.mouseX, p.mouseY) && state.cropState === 'adjusting') {
            p.cursor('move')
          } else if (!state.hoveredHandle && state.cropState === 'adjusting') {
            p.cursor(p.CROSS)
          }
        }

        p.pop()
      }

      drawGrid(p, state)

      // Update hovered handle
      if (state.appMode === state.modes.EDIT && state.editTool === state.editTools.CROP) {
        if (state.cropState === 'adjusting' || state.cropState === 'dragging_handle') {
          state.hoveredHandle = getHandleAtPosition(p, state, p.mouseX, p.mouseY)
        } else {
          state.hoveredHandle = null
        }
      } else {
        state.hoveredHandle = null
      }

      if (state.modal.showUI) displayUI(p, state)

      // Update HTML UI visibility
      const gridControls = document.getElementById('grid-controls')
      if (gridControls) {
        if (state.modal.showUI && state.showGridControls) {
          gridControls.classList.remove('hidden')
        } else {
          gridControls.classList.add('hidden')
        }
      }

      const halftoneControls = document.getElementById('halftone-controls')
      if (halftoneControls) {
        if (state.modal.showUI && state.showHalftoneControls) {
          halftoneControls.classList.remove('hidden')
        } else {
          halftoneControls.classList.add('hidden')
        }
      }

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
          // Default cross for crop if not over handle
          if (!state.hoveredHandle && state.cropState === 'idle') {
            p.cursor(p.CROSS)
          }
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
    const x = p.constrain(Math.round(Math.min(state.cropStart.x, state.cropEnd.x) / state.paintScale), 0, state.img.width)
    const y = p.constrain(Math.round(Math.min(state.cropStart.y, state.cropEnd.y) / state.paintScale), 0, state.img.height)
    const w = p.constrain(Math.round(Math.abs(state.cropEnd.x - state.cropStart.x) / state.paintScale), 1, state.img.width - x)
    const h = p.constrain(Math.round(Math.abs(state.cropEnd.y - state.cropStart.y) / state.paintScale), 1, state.img.height - y)

    if (w < 10 || h < 10) return // Ignore tiny crops

    // 3. Crop the main image
    const newImg = state.img.get(x, y, w, h)

    // 4. Crop the paint layer
    const newPaintLayer = p.createGraphics(w, h)
    newPaintLayer.image(state.paintLayer, 0, 0, w, h, x, y, w, h)
    state.paintLayer.remove()
    state.paintLayer = newPaintLayer

    state.img = newImg
    updatePaintScale(w, h)

    // Set fit mode to fitToCanvas after cropping (Feature 66.3) - This is now handled by fitBoth in setupAdjustMode

    // 5. Reset state and switch to ADJUST mode
    state.cropState = 'idle'
    // setupAdjustMode(true)
    // adjustCanvas()
    cropCleanup()
  }

  const undoCrop = () => {
    if (state.undoStack.length === 0) return
    const lastState = state.undoStack.pop()

    state.img = lastState.img
    state.paintLayer.remove()
    state.paintLayer = lastState.paintLayer
    updatePaintScale(state.img.width, state.img.height)

    // setupAdjustMode(true)
    // adjustCanvas()
    cropCleanup()
  }

  const adjustCanvas = () => {
    p.resizeCanvas(state.displaySize, state.displaySize)
    const tempBuff = p.createGraphics(state.outputSize, state.outputSize)
    tempBuff.noSmooth()
    tempBuff.elt.id = `temp_adjust_on.${p.frameCount}`
    tempBuff.pixelDensity(state.density)
    tempBuff.imageMode(p.CENTER)
    state.displayLayer.remove()
    state.displayLayer = tempBuff
  }

  const setupEditMode = () => {
    state.appMode = state.modes.EDIT
    state.editTool = state.editTools.PAINT // Default to paint
    p.resizeCanvas(state.img.width * state.paintScale, state.img.height * state.paintScale)
    const tempBuff = p.createGraphics(state.img.width, state.img.height)
    tempBuff.noSmooth()
    tempBuff.elt.id = `temp_edit_on.${p.frameCount}`
    tempBuff.pixelDensity(state.density)
    tempBuff.imageMode(p.CENTER)
    state.displayLayer.remove()
    state.displayLayer = tempBuff
    buildPaintLayer(state.img)
    state.previousMouse = { x: p.mouseX, y: p.mouseY }
  }

  const cropCleanup = () => {
    // Reset view parameters after a crop/undo and refit the new image
    state.bwCachedImage = null
    state.combinedLayer?.remove()
    state.combinedLayer = null
    fitBoth(state.img, false)
    state.cropState = 'idle'
    state.dirty = true
    // setupAdjustMode()
    setupEditMode()
  }

  const setupAdjustMode = () => {
    state.appMode = state.modes.ADJUST
    adjustCanvas()
    buildCombinedLayer(state.img)
  }

  p.keyPressed = () => handleKeys(p, state, { undoCrop, buildCombinedLayer, buildPaintLayer, setupAdjustMode, setupEditMode, createSaveImage, generateFilename, fitBoth, fitWidth, fitHeight, performCrop })

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
    return state.displayLayer
  }

  const getMonochromeImage = (img, threshold, forSave = false) => {
    if (state.bwCachedImage && state.lastThreshold === threshold && !forSave) {
      return state.bwCachedImage
    }

    const newImg = p.createImage(img.width, img.height)
    newImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height)

    newImg.loadPixels()
    for (let i = 0; i < newImg.pixels.length; i += 4) {
      const r = newImg.pixels[i]
      const g = newImg.pixels[i + 1]
      const b = newImg.pixels[i + 2]
      const a = newImg.pixels[i + 3]
      const avg = (r + g + b) / 3

      if (forSave && state.transparencyModeEnabled) {
        // Transparency mode logic for saving
        if (a === 0) {
          // Already transparent pixels stay transparent
          newImg.pixels[i] = 0
          newImg.pixels[i + 1] = 0
          newImg.pixels[i + 2] = 0
          newImg.pixels[i + 3] = 0
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
            newImg.pixels[i] = 0
            newImg.pixels[i + 1] = 0
            newImg.pixels[i + 2] = 0
            newImg.pixels[i + 3] = 0
          } else {
            // Keep as black and opaque (always black in transparency mode)
            newImg.pixels[i] = 0
            newImg.pixels[i + 1] = 0
            newImg.pixels[i + 2] = 0
            newImg.pixels[i + 3] = 255
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
          newImg.pixels[i] = p.red(state.backgroundColor)
          newImg.pixels[i + 1] = p.green(state.backgroundColor)
          newImg.pixels[i + 2] = p.blue(state.backgroundColor)
        } else {
          newImg.pixels[i] = state.invert ? 255 : 0 // Invert black to white
          newImg.pixels[i + 1] = state.invert ? 255 : 0 // Invert black to white
          newImg.pixels[i + 2] = state.invert ? 255 : 0 // Invert black to white
        }
        newImg.pixels[i + 3] = 255 // Set alpha to fully opaque
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
    let sourceBuffer
    if (state.webglProcessor && state.webglProcessor.isReady) {
      sourceBuffer = state.webglProcessor.process(state, img)
    } else {
      sourceBuffer = getMonochromeImage(img, state.threshold)
    }

    state.displayLayer.clear()
    if (!state.transparencyModeEnabled) {
      state.displayLayer.background(state.backgroundColor)
    }

    state.displayLayer.imageMode(p.CENTER)
    state.displayLayer.image(sourceBuffer, state.displayLayer.width / 2, state.displayLayer.height / 2)
    // Note: paintLayer is already composited in the shader if we use processedBuffer,
    // but in EDIT mode we draw it manually to allow real-time feedback during strokes.
    // However, the shader also samples uTexPaint. 
    // To avoid double-drawing, we could disable uTexPaint in shader for EDIT mode, 
    // OR just draw it on top here. Drawing on top is safer for the "Edit" feel.
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
    if (!state.webglProcessor || !state.webglProcessor.isReady) {
      // Fallback to CPU processing while shaders load
      const newImg = getMonochromeImage(img, state.threshold)
      if (state.combinedLayer === null) {
        setupCombinedBuffer()
      }
      state.combinedLayer.clear()
      state.combinedLayer.push()
      const centerX = Math.round(state.combinedLayer.width / 2)
      const centerY = Math.round(state.combinedLayer.height / 2)
      state.combinedLayer.translate(centerX, centerY)
      const finalScale = state.view.zoom * state.view.baseScale
      state.combinedLayer.scale(finalScale)
      state.combinedLayer.translate(-state.view.x, -state.view.y)
      state.combinedLayer.imageMode(p.CENTER)
      state.combinedLayer.image(newImg, 0, 0)
      state.combinedLayer.image(state.paintLayer, 0, 0)
      state.combinedLayer.pop()
    } else {
      // WebGL Path: process full source image + paint layer with shader
      const processedBuffer = state.webglProcessor.process(state, img)

      if (state.combinedLayer === null) {
        setupCombinedBuffer()
      }
      state.combinedLayer.clear()
      state.combinedLayer.push()

      const centerX = Math.round(state.combinedLayer.width / 2)
      const centerY = Math.round(state.combinedLayer.height / 2)
      state.combinedLayer.translate(centerX, centerY)

      const finalScale = state.view.zoom * state.view.baseScale
      state.combinedLayer.scale(finalScale)
      state.combinedLayer.translate(-state.view.x, -state.view.y)

      // The processedBuffer is already the correct size (outputSize x outputSize)
      // containing the full source image + paint layer at original resolution
      state.combinedLayer.imageMode(p.CENTER)
      state.combinedLayer.image(processedBuffer, 0, 0)

      state.combinedLayer.pop()
    }

    // The result is directly displayed.
    state.displayLayer.clear()
    if (!state.transparencyModeEnabled) {
      state.displayLayer.background(state.backgroundColor)
    }

    state.displayLayer.imageMode(p.CENTER)
    state.displayLayer.image(
      state.combinedLayer,
      Math.round(state.displayLayer.width / 2),
      Math.round(state.displayLayer.height / 2),
      state.displayLayer.width,
      state.displayLayer.height
    )

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
    let pixels
    let scanWidth, scanHeight
    let tempLayer = null

    if (state.webglProcessor && state.webglProcessor.isReady) {
      // Process at native resolution (no zoom/pan)
      state.webglProcessor.process(state, img)
      pixels = state.webglProcessor.getProcessedPixels()

      scanWidth = img.width
      scanHeight = img.height
    } else {
      // Fallback to CPU-heavy path
      const source = getMonochromeImage(img, state.threshold)
      tempLayer = p.createGraphics(source.width, source.height)
      tempLayer.pixelDensity(state.density)
      tempLayer.image(source, 0, 0)
      tempLayer.image(state.paintLayer, 0, 0)
      tempLayer.loadPixels()
      pixels = tempLayer.pixels
      scanWidth = tempLayer.width
      scanHeight = tempLayer.height
    }

    let top = -1
    let bottom = -1
    let left = -1
    let right = -1

    const bgR = p.red(state.backgroundColor)
    const bgG = p.green(state.backgroundColor)
    const bgB = p.blue(state.backgroundColor)

    // Find top
    for (let y = 0; y < scanHeight; y++) {
      for (let x = 0; x < scanWidth; x++) {
        const index = (x + y * scanWidth) * 4
        const r = pixels[index]
        const g = pixels[index + 1]
        const b = pixels[index + 2]
        const a = pixels[index + 3]

        let isContent = false
        if (state.transparencyModeEnabled) {
          isContent = a > 0
        } else {
          isContent = (r !== bgR || g !== bgG || b !== bgB)
        }

        if (isContent) {
          top = y
          break
        }
      }
      if (top !== -1) break
    }

    // Image is blank
    if (top === -1) {
      if (tempLayer) tempLayer.remove()
      return { x: 0, y: 0, width: img.width, height: img.height, isEmpty: true }
    }

    // Find bottom
    for (let y = scanHeight - 1; y >= 0; y--) {
      for (let x = 0; x < scanWidth; x++) {
        const index = (x + y * scanWidth) * 4
        const r = pixels[index]
        const g = pixels[index + 1]
        const b = pixels[index + 2]
        const a = pixels[index + 3]

        let isContent = false
        if (state.transparencyModeEnabled) {
          isContent = a > 0
        } else {
          isContent = (r !== bgR || g !== bgG || b !== bgB)
        }

        if (isContent) {
          bottom = y
          break
        }
      }
      if (bottom !== -1) break
    }

    // Find left
    for (let x = 0; x < scanWidth; x++) {
      for (let y = 0; y < scanHeight; y++) {
        const index = (x + y * scanWidth) * 4
        const r = pixels[index]
        const g = pixels[index + 1]
        const b = pixels[index + 2]
        const a = pixels[index + 3]

        let isContent = false
        if (state.transparencyModeEnabled) {
          isContent = a > 0
        } else {
          isContent = (r !== bgR || g !== bgG || b !== bgB)
        }

        if (isContent) {
          left = x
          break
        }
      }
      if (left !== -1) break
    }

    // Find right
    for (let x = scanWidth - 1; x >= 0; x--) {
      for (let y = 0; y < scanHeight; y++) {
        const index = (x + y * scanWidth) * 4
        const r = pixels[index]
        const g = pixels[index + 1]
        const b = pixels[index + 2]
        const a = pixels[index + 3]

        let isContent = false
        if (state.transparencyModeEnabled) {
          isContent = a > 0
        } else {
          isContent = (r !== bgR || g !== bgG || b !== bgB)
        }

        if (isContent) {
          right = x
          break
        }
      }
      if (right !== -1) break
    }

    if (tempLayer) tempLayer.remove()
    return { x: left, y: top, width: right - left + 1, height: bottom - top + 1, isEmpty: false }
  }

  const fitBoth = (img, render = true) => {
    const contentBounds = state.autoCrop ? getContentBounds(img) : { x: 0, y: 0, width: img.width, height: img.height, isEmpty: false }
    if (contentBounds.isEmpty) { // Don't fit an empty image
      state.view.baseScale = 1.0
      state.view.zoom = 1.0
      state.view.x = 0
      state.view.y = 0
      if (render) buildCombinedLayer(img)
      return
    }
    const scaleX = state.outputSize / contentBounds.width
    const scaleY = state.outputSize / contentBounds.height
    state.view.baseScale = Math.min(scaleX, scaleY)
    state.view.zoom = 1.0

    // Center the content relative to the image center
    state.view.x = (contentBounds.x + contentBounds.width / 2) - img.width / 2
    state.view.y = (contentBounds.y + contentBounds.height / 2) - img.height / 2

    if (render) buildCombinedLayer(img)
  }

  const fitWidth = (img) => {
    const contentBounds = state.autoCrop ? getContentBounds(img) : { x: 0, y: 0, width: img.width, height: img.height, isEmpty: false }
    if (contentBounds.isEmpty) return
    state.view.baseScale = state.outputSize / contentBounds.width
    state.view.zoom = 1.0

    // Center the content relative to the image center
    state.view.x = (contentBounds.x + contentBounds.width / 2) - img.width / 2
    state.view.y = (contentBounds.y + contentBounds.height / 2) - img.height / 2

    buildCombinedLayer(img)
  }

  const fitHeight = (img) => {
    const contentBounds = state.autoCrop ? getContentBounds(img) : { x: 0, y: 0, width: img.width, height: img.height, isEmpty: false }
    if (contentBounds.isEmpty) return
    state.view.baseScale = state.outputSize / contentBounds.height
    state.view.zoom = 1.0

    // Center the content relative to the image center
    state.view.x = (contentBounds.x + contentBounds.width / 2) - img.width / 2
    state.view.y = (contentBounds.y + contentBounds.height / 2) - img.height / 2

    buildCombinedLayer(img)
  }
}

new p5(sketch) // eslint-disable-line no-new, new-cap
