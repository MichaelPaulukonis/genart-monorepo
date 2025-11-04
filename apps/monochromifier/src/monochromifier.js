/* eslint no-labels: 0 */
import { p5 } from 'p5js-wrapper'
import '../css/style.css'

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
  let isDrawingLine = false;
  let startPoint = { x: 0, y: 0 };
  let endPoint = { x: 0, y: 0 };

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
  // let offsetMax = 0

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
        p.push();
        p.stroke('red');
        p.strokeWeight(brushSize * paintScale);
        p.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
        p.pop();
      }

      if (modal.showUI) displayUI()
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
    paintLayer.stroke(255);
    paintLayer.strokeWeight(brushSize);
    if (modal.eraseMode) {
      paintLayer.erase();
    }
    paintLayer.line(
      start.x / paintScale,
      start.y / paintScale,
      end.x / paintScale,
      end.y / paintScale
    );
    paintLayer.noErase();
    buildPaintLayer(img);
    dirty = true;
  }

  p.mouseDragged = function () {
    if (isDrawingLine) {
      endPoint = { x: p.mouseX, y: p.mouseY };
      dirty = true;
    } else if (modal.paintMode && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      drawPaintLine();
    }
  }

  p.mouseReleased = function () {
    if (isDrawingLine) {
      drawLine(startPoint, endPoint);
      isDrawingLine = false;
    }
    previousMouse = { x: 0, y: 0 }
  }

  p.mousePressed = function () {
    if (modal.paintMode && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      if (p.keyIsDown(91)) {
        isDrawingLine = true;
        startPoint = { x: p.mouseX, y: p.mouseY };
        endPoint = { x: p.mouseX, y: p.mouseY };
      } else {
        previousMouse = { x: p.mouseX, y: p.mouseY };
        drawPaintLine();
      }
    }
  }

  const specialKeys = () => {
    const change = p.keyIsDown(p.SHIFT) ? 1 : 10

    if (modal.paintMode) {
      if (p.keyIsDown(p.RIGHT_ARROW)) {
        brushSize = p.constrain(brushSize + change, 1, 300)
        buildPaintLayer(img)
      } else if (p.keyIsDown(p.LEFT_ARROW)) {
        brushSize = p.constrain(brushSize - change, 1, 300)
        buildPaintLayer(img)
      } else if (p.keyIsDown(p.BACKSPACE) || p.keyIsDown(p.DELETE)) {
        paintLayer.clear()
        buildPaintLayer(img)
        dirty = true
      }
    } else {
      if (p.keyIsDown(p.RIGHT_ARROW)) {
        sizeRatio = p.constrain(sizeRatio + change / 100, 0.01, 10)
        buildCombinedLayer(img)
      } else if (p.keyIsDown(p.LEFT_ARROW)) {
        sizeRatio = p.constrain(sizeRatio - change / 100, 0.01, 10)
        buildCombinedLayer(img)
      }
    }

    if (p.keyIsDown(p.UP_ARROW)) {
      threshold = p.constrain(threshold + change, 0, 255)
      buildCombinedLayer(img)
    } else if (p.keyIsDown(p.DOWN_ARROW)) {
      threshold = p.constrain(threshold - change, 0, 255)
      buildCombinedLayer(img)
    }

    return false
  }

  p.keyPressed = () => handleKeys()

  const handleKeys = () => {
    if (p.key === 'i') {
      invert = !invert
      backgroundColor = invert ? p.color(0, 0, 0) : p.color(255, 255, 255)
      bwCachedImage = null
      buildCombinedLayer(img)
      dirty = true
    }
    if (p.key === 't') {
      transparencyModeEnabled = !transparencyModeEnabled
      bwCachedImage = null // Clear cache to force regeneration
      buildCombinedLayer(img)
      dirty = true
    }
    if (p.key === 'r') {
      threshold = 128
      sizeRatio = 1
      offset.horizontal = 0
      offset.vertical = 0
      buildCombinedLayer(img)
      dirty = true
    }

    if (modal.paintMode && p.key === 'x') {
      modal.eraseMode = !modal.eraseMode
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
    }
    if (p.key === '?') {
      modal.showHelp = !modal.showHelp
      dirty = true
    } else if (p.key === 'h' || p.key === 'H') {
      modal.showUI = !modal.showUI
      dirty = true
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
    } else if (
      p.key === 's' &&
      !modal.paintMode &&
      (p.keyIsDown(p.CONTROL) || p.keyIsDown(91))
    ) {
      const saveImage = createSaveImage()
      p.save(saveImage, generateFilename())
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
    }
    return false // Prevent default browser behavior
  }

  p.keyReleased = function () {
    if (p.keyCode === 91 && isDrawingLine) {
      drawLine(startPoint, endPoint);
      isDrawingLine = false;
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

  const createSaveImage = () => {
    if (transparencyModeEnabled) {
      const scaleRatio = calculateScaleRatio(img, outputSize)
      const scaledWidth = Math.round(img.width * scaleRatio)
      const scaledHeight = Math.round(img.height * scaleRatio)

      // 1. Create a black and white (non-transparent) version of the image
      const bwImg = getMonochromeImage(img, threshold, false) 

      // 2. Create a composite buffer and draw the b&w image and paint layer
      const compositeBuffer = p.createGraphics(scaledWidth, scaledHeight)
      compositeBuffer.pixelDensity(density)
      compositeBuffer.image(
        bwImg,
        0 + offset.horizontal,
        0 + offset.vertical,
        scaledWidth,
        scaledHeight,
        0,
        0,
        img.width,
        img.height
      )
      if (paintLayer) {
        compositeBuffer.image(
          paintLayer,
          0 + offset.horizontal,
          0 + offset.vertical,
          scaledWidth,
          scaledHeight
        )
      }

      // 3. Process the composite buffer for transparency
      compositeBuffer.loadPixels();
      for (let i = 0; i < compositeBuffer.pixels.length; i += 4) {
        const r = compositeBuffer.pixels[i];
        const g = compositeBuffer.pixels[i+1];
        const b = compositeBuffer.pixels[i+2];
        const avg = (r + g + b) / 3;

        let shouldBeTransparent;
        if (invert) {
          shouldBeTransparent = avg <= transparencyThreshold;
        } else {
          shouldBeTransparent = avg >= 255 - transparencyThreshold;
        }

        if (shouldBeTransparent) {
          compositeBuffer.pixels[i+3] = 0;
        } else {
          compositeBuffer.pixels[i] = 0;
          compositeBuffer.pixels[i+1] = 0;
          compositeBuffer.pixels[i+2] = 0;
          compositeBuffer.pixels[i+3] = 255;
        }
      }
      compositeBuffer.updatePixels();

      // 4. Crop and export
      const croppedImg = cropTransparentWhitespace(compositeBuffer)

      const finalScaleRatio = calculateScaleRatio(croppedImg, outputSize)
      const finalWidth = Math.round(croppedImg.width * finalScaleRatio * sizeRatio)
      const finalHeight = Math.round(croppedImg.height * finalScaleRatio * sizeRatio)

      const finalSaveBuffer = p.createGraphics(finalWidth, finalHeight)
      finalSaveBuffer.pixelDensity(density)
      finalSaveBuffer.clear()
      finalSaveBuffer.image(croppedImg, 0, 0, finalWidth, finalHeight)

      return finalSaveBuffer
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
            // Determine what should be transparent based on original pixel values
            // and invert mode
            let shouldBeTransparent

            if (invert) {
              // In inverted mode: original black pixels (now white) should be transparent
              // original white pixels (now black) should remain black
              shouldBeTransparent = avg <= transparencyThreshold
            } else {
              // In normal mode: original white pixels should be transparent
              // original black pixels should remain black
              shouldBeTransparent = avg >= 255 - transparencyThreshold
            }

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

    combinedLayer.image(
      newImg,
      0 + offset.horizontal,
      0 + offset.vertical,
      scaledWidth,
      scaledHeight,
      0,
      0,
      img.width,
      img.height
    )
    combinedLayer.image(
      paintLayer,
      0 + offset.horizontal,
      0 + offset.vertical,
      scaledWidth,
      scaledHeight
    )

    const croppedImg = cropWhitespace(combinedLayer)

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

  const cropWhitespace = buffer => {
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
      !modal.paintMode ? `fit method: ${scaleMethod}` : '',
      !modal.paintMode ? `invert: ${invert ? 'inverted' : 'normal'}` : '',
      `transparency: ${transparencyModeEnabled ? 'ON' : 'OFF'}`,
      transparencyModeEnabled ? `transparency threshold: ${transparencyThreshold}` : '',
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
      `,
      70,
      70
    )
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
