import { validateImageFile, showErrorMessage } from '../../../libs/p5-utils/src/index.js'

export function mouseDragged(p, state, { drawPaintLine, applyBoundaryConstraints, buildCombinedLayer }) {
  if (state.isDrawingLine) {
    state.endPoint = { x: p.mouseX, y: p.mouseY }
    state.dirty = true
  } else if (state.isCropping) {
    state.cropEnd = { x: p.mouseX, y: p.mouseY }
    state.dirty = true
  } else if (state.appMode === state.modes.EDIT && state.editTool === state.editTools.PAINT && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
    drawPaintLine()
  } else if (state.appMode === state.modes.ADJUST && state.isDragging) {
    // Update view position based on drag
    const finalScale = state.view.zoom * state.view.baseScale
    state.view.x -= (p.mouseX - state.dragStartX) / finalScale
    state.view.y -= (p.mouseY - state.dragStartY) / finalScale
    state.dragStartX = p.mouseX
    state.dragStartY = p.mouseY
    applyBoundaryConstraints()
    buildCombinedLayer(state.img)
    state.dirty = true
  }
}

export function mouseReleased(p, state, { drawLine, performCrop }) {
  if (state.isDrawingLine) {
    drawLine(state.startPoint, state.endPoint)
    state.isDrawingLine = false
  } else if (state.isCropping) {
    state.isCropping = false
    performCrop()
    state.dirty = true
  } else if (state.isDragging) {
    state.isDragging = false
  }
  state.previousMouse = { x: 0, y: 0 }
}

export function mousePressed(p, state, { drawPaintLine }) {
  if (state.appMode === state.modes.EDIT && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
    if (state.editTool === state.editTools.PAINT) {
      if (p.keyIsDown(91)) {
        state.isDrawingLine = true
        state.startPoint = { x: p.mouseX, y: p.mouseY }
        state.endPoint = { x: p.mouseX, y: p.mouseY }
      } else {
        state.previousMouse = { x: p.mouseX, y: p.mouseY }
        drawPaintLine()
      }
    } else if (state.editTool === state.editTools.CROP) {
      state.isCropping = true
      state.cropStart = { x: p.mouseX, y: p.mouseY }
      state.cropEnd = { x: p.mouseX, y: p.mouseY }
      state.dirty = true
    }
  }
  else if (state.appMode === state.modes.ADJUST && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
    // Start dragging the view
    state.isDragging = true
    state.dragStartX = p.mouseX
    state.dragStartY = p.mouseY
  }
}

export function specialKeys(p, state, { buildPaintLayer, buildCombinedLayer }) {
  const change = p.keyIsDown(p.SHIFT) ? 0.01 : 0.1
  let handledKey = false

  if (state.appMode === state.modes.EDIT && state.editTool === state.editTools.PAINT) {
    if (p.keyIsDown(p.RIGHT_ARROW)) {
      state.brushSize = p.constrain(state.brushSize + (p.keyIsDown(p.SHIFT) ? 1 : 10), 1, 300)
      buildPaintLayer(state.img)
      handledKey = true
    } else if (p.keyIsDown(p.LEFT_ARROW)) {
      state.brushSize = p.constrain(state.brushSize - (p.keyIsDown(p.SHIFT) ? 1 : 10), 1, 300)
      buildPaintLayer(state.img)
      handledKey = true
    } else if (p.keyIsDown(p.BACKSPACE) || p.keyIsDown(p.DELETE)) {
      state.paintLayer.clear()
      buildPaintLayer(state.img)
      state.dirty = true
      handledKey = true
    }
  } else if (state.appMode === state.modes.ADJUST) {
    if (p.keyIsDown(p.RIGHT_ARROW)) {
      state.view.zoom = p.constrain(state.view.zoom + change, 0.1, 10)
      buildCombinedLayer(state.img)
      handledKey = true
    } else if (p.keyIsDown(p.LEFT_ARROW)) {
      state.view.zoom = p.constrain(state.view.zoom - change, 0.1, 10)
      buildCombinedLayer(state.img)
      handledKey = true
    }
  }

  if (p.keyIsDown(p.UP_ARROW)) {
    state.threshold = p.constrain(state.threshold + change * 100, 0, 255)
    buildCombinedLayer(state.img)
    handledKey = true
  } else if (p.keyIsDown(p.DOWN_ARROW)) {
    state.threshold = p.constrain(state.threshold - change * 100, 0, 255)
    buildCombinedLayer(state.img)
    handledKey = true
  }

  return handledKey ? false : undefined
}

export function handleKeys(p, state, { undoCrop, buildCombinedLayer, buildPaintLayer, switchToAdjustMode, createSaveImage, generateFilename, fitBoth, fitWidth, fitHeight }) {
  if (p.key === 'z' && (p.keyIsDown(p.CONTROL) || p.keyIsDown(91))) {
    undoCrop()
    return false
  }
  if (p.key === 'i') {
    state.invert = !state.invert
    state.backgroundColor = state.invert ? p.color(0, 0, 0) : p.color(255, 255, 255)
    state.bwCachedImage = null
    buildCombinedLayer(state.img)
    state.dirty = true
    return false
  }
  if (p.key === 't') {
    state.transparencyModeEnabled = !state.transparencyModeEnabled
    state.bwCachedImage = null // Clear cache to force regeneration
    buildCombinedLayer(state.img)
    state.dirty = true
    return false
  }
  if (p.key === 'o') {
    // Toggle OSD (On-Screen Display)
    state.showOSD = !state.showOSD
    state.dirty = true
    return false
  }
  if (p.key === 'd' && state.appMode === state.modes.ADJUST) {
    // Reset drag position when in adjust mode
    state.view.x = 0
    state.view.y = 0
    buildCombinedLayer(state.img)
    state.dirty = true
    return false
  }
  if (p.key === 'r' && !p.keyIsDown(p.CONTROL) && !p.keyIsDown(91)) {
    // Only reset if 'r' is pressed alone (not CMD+R or Ctrl+R)
    state.threshold = 128
    fitBoth(state.img) // Re-run the initial fit
    state.dirty = true
    return false
  }

  if (state.appMode === state.modes.ADJUST) {
    if (p.key === '1') {
      fitBoth(state.img)
      return false
    }
    if (p.key === '2') {
      fitWidth(state.img)
      return false
    }
    if (p.key === '3') {
      fitHeight(state.img)
      return false
    }
  }

  if (state.appMode === state.modes.EDIT) {
    if (p.key === 'p') {
      state.editTool = state.editTools.PAINT
      state.dirty = true
      return false
    }
    if (p.key === 'c') {
      state.editTool = state.editTools.CROP
      state.dirty = true
      return false
    }
    if (state.editTool === state.editTools.PAINT && p.key === 'x') {
      state.modal.eraseMode = !state.modal.eraseMode
      state.dirty = true
      return false
    }
  }

  if (p.key === 'e') {
    if (window.infoBoxControls) window.infoBoxControls.hide()
    if (state.appMode === state.modes.ADJUST) {
      state.appMode = state.modes.EDIT
      state.editTool = state.editTools.PAINT // Default to paint
      p.resizeCanvas(state.img.width * state.paintScale, state.img.height * state.paintScale)
      const tempBuff = p.createGraphics(state.img.width, state.img.height)
      tempBuff.elt.id = `temp_edit_on.${p.frameCount}`
      tempBuff.pixelDensity(state.density)
      tempBuff.imageMode(p.CENTER)
      state.displayLayer.remove()
      state.displayLayer = tempBuff
      buildPaintLayer(state.img)
      state.previousMouse = { x: p.mouseX, y: p.mouseY }
    } else {
      switchToAdjustMode()
    }
    state.dirty = true
    return false
  }

  if (p.key === 'c' && (p.keyIsDown(p.CONTROL) || p.keyIsDown(91))) {
    state.autoCrop = !state.autoCrop
    buildCombinedLayer(state.img) // Re-render with new autocrop setting
    state.dirty = true
    console.log('AutoCrop toggled:', state.autoCrop)
    return false
  }

  if (p.key === '?') {
    if (window.infoBoxControls) {
      window.infoBoxControls.toggle()
    }
    return false
  } else if (p.key === 'h' || p.key === 'H') {
    state.modal.showUI = !state.modal.showUI
    state.dirty = true
    return false
  } else if (
    p.key === 's' &&
    state.appMode === state.modes.ADJUST &&
    (p.keyIsDown(p.CONTROL) || p.keyIsDown(91))
  ) {
    const saveImage = createSaveImage()
    p.save(saveImage, generateFilename())
    return false
  }
}

export function keyReleased(p, state, { drawLine }) {
  if (p.keyCode === 91 && state.isDrawingLine) {
    drawLine(state.startPoint, state.endPoint)
    state.isDrawingLine = false
  }
}

export function handleFile(p, state, { processImage }, file) {
  const validation = validateImageFile(file);

  if (!validation.valid) {
    showErrorMessage(validation.message);
    return;
  }

  state.modal.processing = true
  state.img = null
  p.loadImage(file.data, loadedImg => {
    state.img = loadedImg
    processImage(loadedImg)
  })
}
