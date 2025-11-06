/* eslint no-labels: 0 */
import { p5 } from 'p5js-wrapper'
import '../css/style.css'
import '../../../libs/version-display/version-display.css'
import { formatVersion } from './utils/version.js'

const sketch = function (p) {
  let img
  let threshold = 128
  let lastThreshold = null
  let backgroundColor
  let displayLayer
  let paintLayer
  let paintScale = 1.0
  let combinedLayer = null
  let bwCachedImage = null
  let dirty = false
  let invert = false
  let sizeRatio = 1.0
  let brushSize = 10
  let transparencyModeEnabled = true // Default to enabled
  let autoCrop = true // Default to enabled
  let isDrawingLine = false
  let startPoint = { x: 0, y: 0 }
  let endPoint = { x: 0, y: 0 }

  const transparencyThreshold = 128 // Threshold for gray pixels in transparency mode
  const density = 1 // need to use density in size calculations for both w+h
  // but if we render offscreen, why worry about pixeldensity ?!?!?
  const displaySize = 600
  const outputSize = 2000
  let previousMouse = { x: 0, y: 0 }
  const offset = {
    vertical: 0,
    horizontal: 0,
    verticalMax: 0,
    horizontalMax: 0
  }

  // Image dragging state
  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let imageOffsetX = 0
  let imageOffsetY = 0
  let showOSD = true // On-Screen Display for image positioning

  const scaleMethods = {
    fitToWidth: 'fitToWidth',
    fitToHeight: 'fitToHeight',
    fitToCanvas: 'fitToCanvas'
  }

  let scaleMethod = scaleMethods.fitToWidth

  const modal = {
    showHelp: false,
    showUI: true,
    processing: false,
    paintMode: false,
    eraseMode: false,
    refit: false
  }

  p.preload = function () {
    img = p.loadImage(
      './sample_images/mona.crosshairs.png'
    )
  }

  p.setup = function () {
    p.pixelDensity(density)
    const c = p.createCanvas(displaySize, displaySize)
    c.drop(handleFile)
    p.imageMode(p.CENTER)
    backgroundColor = p.color(255, 255, 255)
    p.background(backgroundColor)

    displayLayer = p.createGraphics(outputSize, outputSize)
    displayLayer.pixelDensity(density)
    displayLayer.imageMode(p.CENTER)
    processImage(img)
  }

  const setupPaintBuffer = ({ width, height }) => {
    const maxSize = Math.max(width, height)
    paintScale = displaySize / maxSize
    paintLayer && paintLayer.remove()
    paintLayer = p.createGraphics(width, height)
    paintLayer.elt.id = `paint.${p.frameCount}`
    paintLayer.pixelDensity(density)
    paintLayer.imageMode(p.CENTER)
    paintLayer.clear()
  }

  const setupCombinedBuffer = ({ width, height }) => {
    combinedLayer && combinedLayer.remove()
    combinedLayer = p.createGraphics(width, height)
    combinedLayer.elt.id = `combined.${p.frameCount}`
    combinedLayer.pixelDensity(density)
    // combinedLayer.imageMode(p.CENTER)
  }

  p.draw = function () {
    if (modal.showHelp) {
      displayHelpScreen()
      return
    }
    if (modal.processing) {
      displayProcessingText()
      return
    }
    if (modal.refit) {
      processImage(img)
      return
    }
    specialKeys()
    if (displayLayer && dirty) {
      p.background(backgroundColor)
      p.image(displayLayer, p.width / 2, p.height / 2, p.width, p.height)
      dirty = false

      if (modal.paintMode) {
        // draw brush
        p.stroke(0)
        p.strokeWeight(1)
        p.fill(255)
        p.ellipse(p.mouseX, p.mouseY, brushSize * paintScale)
        dirty = true
      }

      if (isDrawingLine) {
        p.push()
        p.stroke('red')
        p.strokeWeight(brushSize * paintScale)
        p.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y)
        p.pop()
      }

      if (modal.showUI) displayUI()
      if (showOSD && !modal.paintMode) drawOSD()

      // Visual feedback when dragging
      if (isDragging && !modal.paintMode) {
        p.push()
        p.stroke(255, 100, 100, 150)
        p.strokeWeight(2)
        p.noFill()
        p.rect(0, 0, p.width, p.height)
        p.pop()
      }

      // Set cursor based on mode
      if (!modal.paintMode && !modal.showHelp) {
        p.cursor(isDragging ? 'grabbing' : 'grab')
      } else if (modal.paintMode) {
        p.cursor(p.CROSS)
      }
    }
  }

  const drawPaintLine = () => {
    paintLayer.stroke(255)
    paintLayer.strokeWeight(brushSize)
    if (modal.eraseMode) {
      paintLayer.erase()
    }
    paintLayer.line(
      previousMouse.x / paintScale,
      previousMouse.y / paintScale,
      p.mouseX / paintScale,
      p.mouseY / paintScale
    )
    paintLayer.noErase()
    previousMouse = { x: p.mouseX, y: p.mouseY }
    buildPaintLayer(img)
    dirty = true
  }

  const drawLine = (start, end) => {
    paintLayer.stroke(255)
    paintLayer.strokeWeight(brushSize)
    if (modal.eraseMode) {
      paintLayer.erase()
    }
    paintLayer.line(
      start.x / paintScale,
      start.y / paintScale,
      end.x / paintScale,
      end.y / paintScale
    )
    paintLayer.noErase()
    buildPaintLayer(img)
    dirty = true
  }

  p.mouseDragged = function () {
    if (isDrawingLine) {
      endPoint = { x: p.mouseX, y: p.mouseY }
      dirty = true
    } else if (modal.paintMode && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      drawPaintLine()
    } else if (isDragging && !modal.paintMode) {
      // Image dragging when not in paint mode
      imageOffsetX += p.mouseX - dragStartX
      imageOffsetY += p.mouseY - dragStartY
      dragStartX = p.mouseX
      dragStartY = p.mouseY
      applyBoundaryConstraints()
      buildCombinedLayer(img)
      dirty = true
    }
  }

  p.mouseReleased = function () {
    if (isDrawingLine) {
      drawLine(startPoint, endPoint)
      isDrawingLine = false
    } else if (isDragging) {
      isDragging = false
    }
    previousMouse = { x: 0, y: 0 }
  }

  p.mousePressed = function () {
    if (modal.paintMode && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      if (p.keyIsDown(91)) {
        isDrawingLine = true
        startPoint = { x: p.mouseX, y: p.mouseY }
        endPoint = { x: p.mouseX, y: p.mouseY }
      } else {
        previousMouse = { x: p.mouseX, y: p.mouseY }
        drawPaintLine()
      }
    } else if (!modal.paintMode && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      // Start dragging the image when not in paint mode
      isDragging = true
      dragStartX = p.mouseX
      dragStartY = p.mouseY
    }
  }

  const specialKeys = () => {
    const change = p.keyIsDown(p.SHIFT) ? 1 : 10
    let handledKey = false

    if (modal.paintMode) {
      if (p.keyIsDown(p.RIGHT_ARROW)) {
        brushSize = p.constrain(brushSize + change, 1, 300)
        buildPaintLayer(img)
        handledKey = true
      } else if (p.keyIsDown(p.LEFT_ARROW)) {
        brushSize = p.constrain(brushSize - change, 1, 300)
        buildPaintLayer(img)
        handledKey = true
      } else if (p.keyIsDown(p.BACKSPACE) || p.keyIsDown(p.DELETE)) {
        paintLayer.clear()
        buildPaintLayer(img)
        dirty = true
        handledKey = true
      }
    } else {
      if (p.keyIsDown(p.RIGHT_ARROW)) {
        sizeRatio = p.constrain(sizeRatio + change / 100, 0.01, 10)
        buildCombinedLayer(img)
        handledKey = true
      } else if (p.keyIsDown(p.LEFT_ARROW)) {
        sizeRatio = p.constrain(sizeRatio - change / 100, 0.01, 10)
        buildCombinedLayer(img)
        handledKey = true
      }
    }

    if (p.keyIsDown(p.UP_ARROW)) {
      threshold = p.constrain(threshold + change, 0, 255)
      buildCombinedLayer(img)
      handledKey = true
    } else if (p.keyIsDown(p.DOWN_ARROW)) {
      threshold = p.constrain(threshold - change, 0, 255)
      buildCombinedLayer(img)
      handledKey = true
    }

    return handledKey ? false : undefined
  }

  p.keyPressed = () => handleKeys()

  const handleKeys = () => {
    if (p.key === 'i') {
      invert = !invert
      backgroundColor = invert ? p.color(0, 0, 0) : p.color(255, 255, 255)
      bwCachedImage = null
      buildCombinedLayer(img)
      dirty = true
      return false
    }
    if (p.key === 't') {
      transparencyModeEnabled = !transparencyModeEnabled
      bwCachedImage = null // Clear cache to force regeneration
      buildCombinedLayer(img)
      dirty = true
      return false
    }
    if (p.key === 'o') {
      // Toggle OSD (On-Screen Display)
      showOSD = !showOSD
      dirty = true
      return false
    }
    if (p.key === 'd' && !modal.paintMode) {
      // Reset drag position when not in paint mode
      imageOffsetX = 0
      imageOffsetY = 0
      buildCombinedLayer(img)
      dirty = true
      return false
    }
    if (p.key === 'r' && !p.keyIsDown(p.CONTROL) && !p.keyIsDown(91)) {
      // Only reset if 'r' is pressed alone (not CMD+R or Ctrl+R)
      threshold = 128
      sizeRatio = 1
      offset.horizontal = 0
      offset.vertical = 0
      imageOffsetX = 0
      imageOffsetY = 0
      buildCombinedLayer(img)
      dirty = true
      return false
    }

    if (modal.paintMode && p.key === 'x') {
      modal.eraseMode = !modal.eraseMode
      return false
    } else if (p.key === 'c') {
      autoCrop = !autoCrop
      dirty = true // Update UI to show the change
      console.log('AutoCrop toggled:', autoCrop)
    } else if (p.key === 'p') {
      modal.showHelp = false
      modal.paintMode = !modal.paintMode
      dirty = true // just for the UI
      if (modal.paintMode) {
        p.cursor(p.CROSS)
        p.resizeCanvas(img.width * paintScale, img.height * paintScale)
        const tempBuff = p.createGraphics(img.width, img.height)
        tempBuff.elt.id = `temp_paint_on.${p.frameCount}`
        tempBuff.pixelDensity(density)
        tempBuff.imageMode(p.CENTER)
        displayLayer.remove()
        displayLayer = tempBuff
        buildPaintLayer(img)
        previousMouse = { x: p.mouseX, y: p.mouse }
      } else {
        p.cursor()
        p.resizeCanvas(displaySize, displaySize)
        const tempBuff = p.createGraphics(outputSize, outputSize)
        tempBuff.elt.id = `temp_paint_off.${p.frameCount}`
        tempBuff.pixelDensity(density)
        tempBuff.imageMode(p.CENTER)
        displayLayer.remove()
        displayLayer = tempBuff
        buildCombinedLayer(img)
      }
      return false
    }
    if (p.key === '?') {
      modal.showHelp = !modal.showHelp
      dirty = true
      return false
    } else if (p.key === 'h' || p.key === 'H') {
      modal.showUI = !modal.showUI
      dirty = true
      return false
    } else if (p.key === 'f' || p.key === 'F') {
      // toggle fit method
      scaleMethod =
        scaleMethod === scaleMethods.fitToWidth
          ? scaleMethods.fitToHeight
          : scaleMethod === scaleMethods.fitToHeight
            ? scaleMethods.fitToCanvas
            : scaleMethods.fitToWidth
      modal.refit = true
      dirty = true
      return false
    } else if (
      p.key === 's' &&
      !modal.paintMode &&
      (p.keyIsDown(p.CONTROL) || p.keyIsDown(91))
    ) {
      const saveImage = createSaveImage()
      p.save(saveImage, generateFilename())
      return false
    } else if (p.key === '>') {
      if (scaleMethod === scaleMethods.fitToWidth) {
        offset.vertical = Math.min(offset.vertical + 100, offset.verticalMax)
      } else if (scaleMethod === scaleMethods.fitToHeight) {
        offset.horizontal = Math.min(
          offset.horizontal + 100,
          offset.horizontalMax
        )
      }
      dirty = true
      buildCombinedLayer(img)
      return false
    } else if (p.key === '<') {
      if (scaleMethod === scaleMethods.fitToWidth) {
        offset.vertical = Math.max(offset.vertical - 100, -offset.verticalMax)
      } else if (scaleMethod === scaleMethods.fitToHeight) {
        offset.horizontal = Math.max(
          offset.horizontal - 100,
          -offset.horizontalMax
        )
      }
      dirty = true
      buildCombinedLayer(img)
      return false
    }
    // Allow browser default behavior for unhandled keys
  }

  p.keyReleased = function () {
    if (p.keyCode === 91 && isDrawingLine) {
      drawLine(startPoint, endPoint)
      isDrawingLine = false
    }
  }

  function generateFilename() {
    const d = new Date()
    const modeIndicator = transparencyModeEnabled ? '-transparent' : ''
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
    if (transparencyModeEnabled) {
      // For transparency mode, use the same flow as standard mode but apply transparency
      // Create a copy of displayLayer and apply transparency processing
      const exportCanvas = p.createGraphics(displayLayer.width, displayLayer.height)
      exportCanvas.pixelDensity(density)
      exportCanvas.image(displayLayer, 0, 0)

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
          const bw = avg > threshold ? 255 : 0

          const shouldBeTransparent = bw >= 255 - transparencyThreshold

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
      return displayLayer
    }
  }

  const getMonochromeImage = (img, threshold, forSave = false) => {
    if (bwCachedImage && lastThreshold === threshold && !forSave) {
      return bwCachedImage
    }

    const newImg = p.createImage(img.width, img.height)
    newImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height)

    newImg.loadPixels()
    for (let y = 0; y < img.height * density; y++) {
      for (let x = 0; x < img.width * density; x++) {
        const index = (x + y * img.width * density) * 4
        const r = newImg.pixels[index]
        const g = newImg.pixels[index + 1]
        const b = newImg.pixels[index + 2]
        const a = newImg.pixels[index + 3]
        const avg = (r + g + b) / 3

        if (forSave && transparencyModeEnabled) {
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
            if (invert) {
              bw = 255 - bw
            }

            // Determine what should be transparent based on display values
            // White pixels on screen (bw = 255) should be transparent
            const shouldBeTransparent = bw >= 255 - transparencyThreshold

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

          if (invert) {
            bw = 255 - bw
          }

          if (a === 0 || bw === (invert ? 0 : 255)) {
            // Transparent pixel (a = 0) sets to background color
            newImg.pixels[index] = p.red(backgroundColor)
            newImg.pixels[index + 1] = p.green(backgroundColor)
            newImg.pixels[index + 2] = p.blue(backgroundColor)
          } else {
            newImg.pixels[index] = invert ? 255 : 0 // Invert black to white
            newImg.pixels[index + 1] = invert ? 255 : 0 // Invert black to white
            newImg.pixels[index + 2] = invert ? 255 : 0 // Invert black to white
          }
          newImg.pixels[index + 3] = 255 // Set alpha to fully opaque
        }
      }
    }
    newImg.updatePixels()

    if (!forSave) {
      bwCachedImage = newImg
      lastThreshold = threshold
    }

    return newImg
  }

  const buildPaintLayer = img => {
    const newImg = getMonochromeImage(img, threshold)
    displayLayer.background(backgroundColor)
    displayLayer.image(newImg, displayLayer.width / 2, displayLayer.height / 2)
    displayLayer.image(
      paintLayer,
      displayLayer.width / 2,
      displayLayer.height / 2
    )

    dirty = true
  }

  const applyBoundaryConstraints = () => {
    if (!img) return

    const scaleRatio = calculateScaleRatio(img, outputSize)
    const scaledWidth = Math.round(img.width * scaleRatio)
    const scaledHeight = Math.round(img.height * scaleRatio)

    // Ensure at least 25% of the image remains visible within the output canvas
    const minVisible = 0.25

    // Calculate the maximum allowed offsets
    // The image can be moved so that 75% is hidden, but 25% must remain visible
    const maxOffsetX = scaledWidth * (1 - minVisible)
    const maxOffsetY = scaledHeight * (1 - minVisible)

    // Calculate the minimum allowed offsets
    // The image can be moved so that it's mostly off-screen on the opposite side
    const minOffsetX = -(outputSize - scaledWidth * minVisible)
    const minOffsetY = -(outputSize - scaledHeight * minVisible)

    // Apply constraints
    imageOffsetX = p.constrain(imageOffsetX, minOffsetX, maxOffsetX)
    imageOffsetY = p.constrain(imageOffsetY, minOffsetY, maxOffsetY)
  }

  const buildCombinedLayer = img => {
    const scaleRatio = calculateScaleRatio(img, outputSize)
    const scaledWidth = Math.round(img.width * scaleRatio)
    const scaledHeight = Math.round(img.height * scaleRatio)

    // TODO: if the entire image is not display
    // no need to process the entire image
    const newImg = getMonochromeImage(img, threshold)

    if (combinedLayer === null) {
      setupCombinedBuffer({ width: scaledWidth, height: scaledHeight })
    }

    // Clear the combined layer only if it exists and we're dragging
    // to prevent artifacts from previous positions
    if (isDragging || imageOffsetX !== 0 || imageOffsetY !== 0) {
      combinedLayer.clear()
    }

    combinedLayer.image(
      newImg,
      0 + offset.horizontal + imageOffsetX,
      0 + offset.vertical + imageOffsetY,
      scaledWidth,
      scaledHeight,
      0,
      0,
      img.width,
      img.height
    )
    combinedLayer.image(
      paintLayer,
      0 + offset.horizontal + imageOffsetX,
      0 + offset.vertical + imageOffsetY,
      scaledWidth,
      scaledHeight
    )

    const croppedImg = cropWhitespace(combinedLayer, autoCrop)

    // Scale the cropped image to ensure it is as large as possible
    // and apply zoom
    const finalScaleRatio = calculateScaleRatio(croppedImg, outputSize)
    const finalWidth = Math.round(
      croppedImg.width * finalScaleRatio * sizeRatio
    )
    const finalHeight = Math.round(
      croppedImg.height * finalScaleRatio * sizeRatio
    )
    const finalImg = p.createImage(finalWidth, finalHeight)

    finalImg.copy(
      croppedImg,
      0,
      0,
      croppedImg.width,
      croppedImg.height,
      0,
      0,
      finalWidth,
      finalHeight
    )

    displayLayer.background(backgroundColor)
    displayLayer.image(
      finalImg,
      displayLayer.width / 2,
      displayLayer.height / 2
    )
    dirty = true
  }

  const calculateScaleRatio = function (img, size = outputSize) {
    // canvas size should be a square, normally
    // if not, we can reconsider everything
    switch (scaleMethod) {
      case scaleMethods.fitToWidth:
        return size / img.width

      case scaleMethods.fitToHeight:
        return size / img.height

      case scaleMethods.fitToCanvas:
      default:
        return size / Math.max(img.width, img.height)
    }
  }

  const calculateOffsetMax = function (img, size = outputSize) {
    switch (scaleMethod) {
      case scaleMethods.fitToWidth:
        return Math.max(
          Math.floor(((img.height * size) / img.width - size) / 2),
          0
        )

      case scaleMethods.fitToHeight:
        return Math.max(
          Math.floor(((img.width * size) / img.height - size) / 2),
          0
        )

      case scaleMethods.fitToCanvas:
      default:
        return 0
    }
  }

  function processImage(img) {
    if (!modal.refit) {
      bwCachedImage = null // this is not required for refit
      setupPaintBuffer(img)
    }
    modal.processing = false
    combinedLayer && combinedLayer.remove()
    combinedLayer = null
    offset.vertical = 0
    offset.horizontal = 0
    offset.verticalMax = 0
    offset.horizontalMax = 0
    imageOffsetX = 0
    imageOffsetY = 0

    const offsetMax = calculateOffsetMax(img, outputSize)

    if (scaleMethod === scaleMethods.fitToWidth) {
      offset.verticalMax = offsetMax
    } else if (scaleMethod === scaleMethods.fitToHeight) {
      offset.horizontalMax = offsetMax
    }

    buildCombinedLayer(img)
    modal.refit = false
    dirty = true
  }

  function handleFile(file) {
    if (file.type === 'image') {
      modal.processing = true
      img = null
      p.loadImage(file.data, loadedImg => {
        img = loadedImg
        processImage(loadedImg)
      })
    }
  }

  const cropWhitespace = (buffer, shouldCrop = true) => {
    // If cropping is disabled, return the original buffer as an image
    if (!shouldCrop) {
      const originalImg = p.createImage(buffer.width, buffer.height)
      originalImg.copy(
        buffer,
        0,
        0,
        buffer.width,
        buffer.height,
        0,
        0,
        buffer.width,
        buffer.height
      )
      return originalImg
    }

    buffer.loadPixels()
    let top = 0
    let bottom = buffer.height - 1
    let left = 0
    let right = buffer.width - 1

    // Find top boundary
    outer: for (let y = 0; y < buffer.height * density; y++) {
      for (let x = 0; x < buffer.width * density; x++) {
        const index = (x + y * buffer.width * density) * 4
        if (
          buffer.pixels[index] !== p.red(backgroundColor) ||
          buffer.pixels[index + 1] !== p.green(backgroundColor) ||
          buffer.pixels[index + 2] !== p.blue(backgroundColor)
        ) {
          top = y
          break outer
        }
      }
    }

    // Find bottom boundary
    outer: for (let y = buffer.height * density - 1; y >= 0; y--) {
      for (let x = 0; x < buffer.width * density; x++) {
        const index = (x + y * buffer.width * density) * 4
        if (
          buffer.pixels[index] !== p.red(backgroundColor) ||
          buffer.pixels[index + 1] !== p.green(backgroundColor) ||
          buffer.pixels[index + 2] !== p.blue(backgroundColor)
        ) {
          bottom = y
          break outer
        }
      }
    }

    // Find left boundary
    outer: for (let x = 0; x < buffer.width * density; x++) {
      for (let y = 0; y < buffer.height * density; y++) {
        const index = (x + y * buffer.width * density) * 4
        if (
          buffer.pixels[index] !== p.red(backgroundColor) ||
          buffer.pixels[index + 1] !== p.green(backgroundColor) ||
          buffer.pixels[index + 2] !== p.blue(backgroundColor)
        ) {
          left = x
          break outer
        }
      }
    }

    // Find right boundary
    outer: for (let x = buffer.width * density - 1; x >= 0; x--) {
      for (let y = 0; y < buffer.width * density; y++) {
        const index = (x + y * buffer.width * density) * 4
        if (
          buffer.pixels[index] !== p.red(backgroundColor) ||
          buffer.pixels[index + 1] !== p.green(backgroundColor) ||
          buffer.pixels[index + 2] !== p.blue(backgroundColor)
        ) {
          right = x
          break outer
        }
      }
    }

    const croppedWidth = right - left + 1
    const croppedHeight = bottom - top + 1
    const croppedImg = p.createImage(croppedWidth, croppedHeight)
    croppedImg.copy(
      buffer,
      left,
      top,
      croppedWidth,
      croppedHeight,
      0,
      0,
      croppedWidth,
      croppedHeight
    )
    return croppedImg
  }

  const cropTransparentWhitespace = buffer => {
    buffer.loadPixels()
    let top = 0
    let bottom = buffer.height - 1
    let left = 0
    let right = buffer.width - 1

    // Find top boundary - look for non-transparent pixels
    outer: for (let y = 0; y < buffer.height * density; y++) {
      for (let x = 0; x < buffer.width * density; x++) {
        const index = (x + y * buffer.width * density) * 4
        const alpha = buffer.pixels[index + 3]
        if (alpha > 0) { // Found non-transparent pixel
          top = y
          break outer
        }
      }
    }

    // Find bottom boundary
    outer: for (let y = buffer.height * density - 1; y >= 0; y--) {
      for (let x = 0; x < buffer.width * density; x++) {
        const index = (x + y * buffer.width * density) * 4
        const alpha = buffer.pixels[index + 3]
        if (alpha > 0) {
          bottom = y
          break outer
        }
      }
    }

    // Find left boundary
    outer: for (let x = 0; x < buffer.width * density; x++) {
      for (let y = 0; y < buffer.height * density; y++) {
        const index = (x + y * buffer.width * density) * 4
        const alpha = buffer.pixels[index + 3]
        if (alpha > 0) {
          left = x
          break outer
        }
      }
    }

    // Find right boundary
    outer: for (let x = buffer.width * density - 1; x >= 0; x--) {
      for (let y = 0; y < buffer.height * density; y++) {
        const index = (x + y * buffer.width * density) * 4
        const alpha = buffer.pixels[index + 3]
        if (alpha > 0) {
          right = x
          break outer
        }
      }
    }

    const croppedWidth = right - left + 1
    const croppedHeight = bottom - top + 1
    const croppedBuffer = p.createGraphics(croppedWidth, croppedHeight)
    croppedBuffer.pixelDensity(density)
    croppedBuffer.clear()
    croppedBuffer.image(buffer, -left, -top)

    return croppedBuffer
  }

  const displayUI = () => {
    const offsetAmount =
      scaleMethod === scaleMethods.fitToWidth
        ? offset.vertical
        : offset.horizontal
    const uiText = [
      `threshold: ${threshold}`,
      !modal.paintMode ? `zoom: ${(sizeRatio * 100).toFixed(0)}%` : '',
      !modal.paintMode ? `offset: ${offsetAmount}` : '',
      !modal.paintMode ? `drag offset: (${Math.round(imageOffsetX)}, ${Math.round(imageOffsetY)})` : '',
      !modal.paintMode ? `fit method: ${scaleMethod}` : '',
      !modal.paintMode ? `invert: ${invert ? 'inverted' : 'normal'}` : '',
      `transparency: ${transparencyModeEnabled ? 'ON' : 'OFF'}`,
      transparencyModeEnabled ? `transparency threshold: ${transparencyThreshold}` : '',
      !modal.paintMode ? `autocrop: ${autoCrop ? 'ON' : 'OFF'}` : '',
      !modal.paintMode ? `OSD: ${showOSD ? 'ON' : 'OFF'}` : '',
      `paint mode: ${modal.paintMode ? 'ON' : 'OFF'}`,
      modal.paintMode ? `brush size: ${brushSize}` : '',
      modal.paintMode ? `erase mode: ${modal.eraseMode ? 'ON' : 'OFF'}` : ''
    ].filter(Boolean)

    const boxWidth = 200
    const boxHeight = uiText.length * 20 + 20

    p.fill(0, 150)
    p.noStroke()
    p.rect(5, p.height - boxHeight - 5, boxWidth, boxHeight, 10)

    p.fill('white')
    p.textSize(16)
    p.textAlign(p.LEFT, p.TOP)
    uiText.forEach((text, index) => {
      p.text(text, 10, p.height - boxHeight + 10 + index * 20)
    })
  }

  const drawOSD = () => {
    if (!img) return

    const osdSize = 150
    const osdPadding = 10
    const osdX = p.width - osdSize - osdPadding
    const osdY = osdPadding

    // Calculate thumbnail scale to fit within OSD
    const thumbScale = Math.min(osdSize / img.width, osdSize / img.height)
    const thumbWidth = img.width * thumbScale
    const thumbHeight = img.height * thumbScale

    // Center thumbnail within OSD area
    const thumbX = osdX + (osdSize - thumbWidth) / 2
    const thumbY = osdY + (osdSize - thumbHeight) / 2

    // Draw OSD background
    p.fill(0, 150)
    p.noStroke()
    p.rect(osdX - 5, osdY - 5, osdSize + 10, osdSize + 10, 5)

    // Draw original image thumbnail (temporarily use CORNER mode for precise positioning)
    p.push()
    p.imageMode(p.CORNER)
    p.tint(255, 200) // Slight transparency for contrast
    p.image(img, thumbX, thumbY, thumbWidth, thumbHeight)
    p.noTint()
    p.pop()

    // Calculate viewport rectangle based on current offsets and scale
    const scaleRatio = calculateScaleRatio(img, outputSize)

    // Calculate visible area in image coordinates
    // Account for center-based zoom and drag offsets

    // Key insight: When you drag the image, you're changing what part of the original
    // image is visible. Dragging the image right means you see the left part of the image.

    // Start with the display canvas size (what we can see)
    const displayWidth = displayLayer.width
    const displayHeight = displayLayer.height

    // Calculate what portion of the image is visible due to zoom
    // When zoomed in, we see a smaller portion of the image
    const viewportWidthInDisplay = displayWidth / sizeRatio
    const viewportHeightInDisplay = displayHeight / sizeRatio

    // Convert drag offsets to original image coordinates
    // Note: drag offsets work in the opposite direction - dragging image right
    // means we're seeing the left portion of the image
    const dragOffsetInImageCoords = {
      x: -(imageOffsetX + offset.horizontal) / scaleRatio,
      y: -(imageOffsetY + offset.vertical) / scaleRatio
    }

    // Calculate the center of what we're viewing in original image coordinates
    const imageCenterX = img.width / 2
    const imageCenterY = img.height / 2
    const viewCenterX = imageCenterX + dragOffsetInImageCoords.x
    const viewCenterY = imageCenterY + dragOffsetInImageCoords.y

    // Calculate the viewport dimensions in original image coordinates
    const viewportWidthInImage = viewportWidthInDisplay / scaleRatio
    const viewportHeightInImage = viewportHeightInDisplay / scaleRatio

    // Calculate viewport bounds (don't clamp to image bounds - allow showing outside)
    const visibleX = viewCenterX - viewportWidthInImage / 2
    const visibleY = viewCenterY - viewportHeightInImage / 2
    const visibleWidth = viewportWidthInImage
    const visibleHeight = viewportHeightInImage

    // Convert to thumbnail coordinates
    const rectX = thumbX + (visibleX * thumbScale)
    const rectY = thumbY + (visibleY * thumbScale)
    const rectWidth = visibleWidth * thumbScale
    const rectHeight = visibleHeight * thumbScale

    // Draw viewport rectangle
    p.noFill()
    p.stroke(255, 100, 100)
    p.strokeWeight(2)
    p.rect(rectX, rectY, rectWidth, rectHeight)

    // Draw OSD border
    p.noFill()
    p.stroke(255, 150)
    p.strokeWeight(1)
    p.rect(osdX, osdY, osdSize, osdSize)
  }

  function displayHelpScreen() {
    p.fill(50, 150)
    p.rect(50, 50, p.width - 100, p.height - 100, 10)

    p.fill(255)
    p.textSize(16)
    p.textAlign(p.LEFT, p.TOP)
    p.text(
      `
      Help Screen:

      ? - Show/Hide this help screen
      h - Show/Hide UI
      r - Reset to default settings
      i - Invert image
      t - Toggle transparency mode
      c - Toggle autocrop
      o - Toggle OSD (position overlay)
      d - Reset drag position
      p - Paint
      x - Toggle erase mode
      CMD-click - Draw a line
      → - increase zoom
      ← - decrease zoom
      > - increase offset (h/v)
      < - decrease offset (h/v)
      ↑ - increase threshold
      ↓ - decrease threshold
      → - increase brush size
      ← - decrease brush size
      CMD-s - Save image
      
      Drag image (non-paint mode):
      Click + Drag - Move source image position
      `,
      70,
      70
    )

    // Display version information at the bottom of the help screen
    p.textSize(12)
    p.textAlign(p.CENTER, p.BOTTOM)
    p.fill(200)
    try {
      formatVersion().then(version => {
        // Store version for display
        if (!p._versionText) {
          p._versionText = version
        }
      }).catch(() => {
        p._versionText = 'v0.2.0'
      })
    } catch (error) {
      p._versionText = 'v0.2.0'
    }

    if (p._versionText) {
      p.text(p._versionText, p.width / 2, p.height - 70)
    }
  }

  function displayProcessingText() {
    p.fill(p.color('#e75397'), 150)
    p.rect(50, 50, p.width - 100, 100, 10)

    p.fill(255)
    p.textSize(16)
    p.textAlign(p.CENTER, p.CENTER)
    p.text('Processing image, please wait...', p.width / 2, 100)
  }
}

new p5(sketch) // eslint-disable-line no-new, new-cap
