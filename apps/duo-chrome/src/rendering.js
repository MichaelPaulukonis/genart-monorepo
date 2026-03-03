import { backgroundModes } from './background-modes.js'

/**
 * Creates the canvas rendering system.
 *
 * @param {object} deps
 * @param {object} deps.p - p5 instance
 * @param {Array}  deps.imageColorPairs - mutable array of image/color pairs
 * @param {object} deps.controlState - mutable control state object
 * @param {{ get: () => number }} deps.backgroundModeIndex
 * @param {{ get: () => number }} deps.blendModeIndex
 */
export function createRenderer ({
  p,
  imageColorPairs,
  controlState,
  backgroundModeIndex,
  blendModeIndex
}) {
  function createMonochromeImage (img, monoColor) {
    const scaleRatio = p.calculateScaleRatio(img)
    const scaledWidth = Math.round(img.width * scaleRatio)
    const scaledHeight = Math.round(img.height * scaleRatio)

    const tempColorLayer = p.createGraphics(scaledWidth, scaledHeight)
    tempColorLayer.background(monoColor)

    const layer = p.createGraphics(scaledWidth, scaledHeight)
    layer.image(img, 0, 0, scaledWidth, scaledHeight)
    layer.drawingContext.globalCompositeOperation = 'source-in'
    layer.image(tempColorLayer, 0, 0, scaledWidth, scaledHeight)

    tempColorLayer.remove()
    return layer
  }

  function createOptimizedMonochromeImage (img, monoColor) {
    const startTime = performance.now()
    const layer = createMonochromeImage(img, monoColor)
    const endTime = performance.now()
    const creationTime = endTime - startTime
    if (creationTime > 50) {
      console.warn(`Slow layer creation: ${creationTime.toFixed(2)}ms for image`)
    }
    return layer
  }

  function drawActiveImageIndicator () {
    const activeIndex = controlState.activeImageIndex
    const activePair = imageColorPairs[activeIndex]

    if (!activePair.layer) return

    const imageWidth = activePair.layer.width * activePair.scale
    const imageHeight = activePair.layer.height * activePair.scale
    const imageX = p.width / 2
    const imageY = p.height / 2

    p.push()
    p.blendMode(p.BLEND)

    const currentBackgroundMode = backgroundModes[backgroundModeIndex.get()]
    const isLightBackground = currentBackgroundMode.color[0] > 127

    const borderColor = isLightBackground ? p.color(0, 0, 0, 255) : p.color(255, 255, 255, 255)
    const shadowColor = isLightBackground ? p.color(255, 255, 255, 200) : p.color(0, 0, 0, 200)

    p.rectMode(p.CENTER)
    p.noFill()

    p.stroke(shadowColor)
    p.strokeWeight(6)
    p.rect(imageX, imageY, imageWidth + 8, imageHeight + 8)

    p.stroke(borderColor)
    p.strokeWeight(3)
    p.rect(imageX, imageY, imageWidth + 8, imageHeight + 8)

    const cornerSize = 20
    const halfWidth = (imageWidth + 8) / 2
    const halfHeight = (imageHeight + 8) / 2

    p.stroke(shadowColor)
    p.strokeWeight(4)

    // Top-left corner
    p.line(imageX - halfWidth, imageY - halfHeight, imageX - halfWidth + cornerSize, imageY - halfHeight)
    p.line(imageX - halfWidth, imageY - halfHeight, imageX - halfWidth, imageY - halfHeight + cornerSize)
    // Top-right corner
    p.line(imageX + halfWidth, imageY - halfHeight, imageX + halfWidth - cornerSize, imageY - halfHeight)
    p.line(imageX + halfWidth, imageY - halfHeight, imageX + halfWidth, imageY - halfHeight + cornerSize)
    // Bottom-left corner
    p.line(imageX - halfWidth, imageY + halfHeight, imageX - halfWidth + cornerSize, imageY + halfHeight)
    p.line(imageX - halfWidth, imageY + halfHeight, imageX - halfWidth, imageY + halfHeight - cornerSize)
    // Bottom-right corner
    p.line(imageX + halfWidth, imageY + halfHeight, imageX + halfWidth - cornerSize, imageY + halfHeight)
    p.line(imageX + halfWidth, imageY + halfHeight, imageX + halfWidth, imageY + halfHeight - cornerSize)

    p.stroke(borderColor)
    p.strokeWeight(2)

    // Top-left corner
    p.line(imageX - halfWidth, imageY - halfHeight, imageX - halfWidth + cornerSize, imageY - halfHeight)
    p.line(imageX - halfWidth, imageY - halfHeight, imageX - halfWidth, imageY - halfHeight + cornerSize)
    // Top-right corner
    p.line(imageX + halfWidth, imageY - halfHeight, imageX + halfWidth - cornerSize, imageY - halfHeight)
    p.line(imageX + halfWidth, imageY - halfHeight, imageX + halfWidth, imageY - halfHeight + cornerSize)
    // Bottom-left corner
    p.line(imageX - halfWidth, imageY + halfHeight, imageX - halfWidth + cornerSize, imageY + halfHeight)
    p.line(imageX - halfWidth, imageY + halfHeight, imageX - halfWidth, imageY + halfHeight - cornerSize)
    // Bottom-right corner
    p.line(imageX + halfWidth, imageY + halfHeight, imageX + halfWidth - cornerSize, imageY + halfHeight)
    p.line(imageX + halfWidth, imageY + halfHeight, imageX + halfWidth, imageY + halfHeight - cornerSize)

    p.noStroke()
    p.textAlign(p.CENTER, p.CENTER)
    p.textSize(16)
    p.textStyle(p.BOLD)

    const labelY = imageY - halfHeight - 25
    const labelText = activeIndex === 0 ? 'IMAGE A' : 'IMAGE B'
    const textWidth = p.textWidth(labelText)

    p.fill(shadowColor)
    p.rect(imageX + 1, labelY + 1, textWidth + 12, 22, 5)
    p.fill(isLightBackground ? p.color(255, 255, 255, 220) : p.color(0, 0, 0, 220))
    p.rect(imageX, labelY, textWidth + 10, 20, 5)
    p.fill(shadowColor)
    p.text(labelText, imageX + 1, labelY + 1)
    p.fill(borderColor)
    p.text(labelText, imageX, labelY)

    p.pop()
  }

  function updateScreen () {
    if (!controlState.needsRedraw) return

    const startTime = performance.now()

    p.clear()
    const currentBackgroundMode = backgroundModes[backgroundModeIndex.get()]
    p.background(currentBackgroundMode.color)
    p.blendMode(p[currentBackgroundMode.blendModes[blendModeIndex.get()]])

    imageColorPairs.forEach((pair) => {
      if (pair.layer) {
        const scaledWidth = pair.layer.width * pair.scale
        const scaledHeight = pair.layer.height * pair.scale
        p.image(pair.layer, p.width / 2, p.height / 2, scaledWidth, scaledHeight)
      }
    })

    if (controlState.showIndicators) {
      drawActiveImageIndicator()
    }

    controlState.needsRedraw = false

    const endTime = performance.now()
    const frameTime = endTime - startTime
    if (frameTime > 16.67) {
      console.warn(`Slow frame detected: ${frameTime.toFixed(2)}ms (target: 16.67ms for 60fps)`)
    }
    controlState.lastFrameTime = frameTime
    controlState.frameCount++
  }

  function requestScreenUpdate () {
    controlState.needsRedraw = true
    if (!controlState.animationFrameRequested) {
      controlState.animationFrameRequested = true
      requestAnimationFrame(() => {
        updateScreen()
        controlState.animationFrameRequested = false
      })
    }
  }

  function cleanupGraphicsObjects () {
    console.log('Cleaning up graphics objects...')
    imageColorPairs.forEach((pair, index) => {
      if (pair.layer && pair.layer.remove) {
        console.log(`Removing layer for image ${index}`)
        pair.layer.remove()
        pair.layer = null
      }
    })
    console.log('Graphics cleanup complete')
  }

  function getPerformanceStats () {
    return {
      lastFrameTime: controlState.lastFrameTime,
      frameCount: controlState.frameCount,
      averageFrameTime: controlState.frameCount > 0
        ? (controlState.totalFrameTime || controlState.lastFrameTime) / controlState.frameCount
        : 0
    }
  }

  return {
    createMonochromeImage,
    createOptimizedMonochromeImage,
    drawActiveImageIndicator,
    updateScreen,
    requestScreenUpdate,
    cleanupGraphicsObjects,
    getPerformanceStats
  }
}
