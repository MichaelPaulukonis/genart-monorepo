import { validateImageFile, showErrorMessage } from '../../../libs/p5-utils/src/index.js'

function normalizeCropRect(state) {
  const x1 = Math.min(state.cropStart.x, state.cropEnd.x)
  const y1 = Math.min(state.cropStart.y, state.cropEnd.y)
  const x2 = Math.max(state.cropStart.x, state.cropEnd.x)
  const y2 = Math.max(state.cropStart.y, state.cropEnd.y)
  state.cropStart = { x: x1, y: y1 }
  state.cropEnd = { x: x2, y: y2 }
}

export function getHandleAtPosition(p, state, mx, my) {
  const x = Math.min(state.cropStart.x, state.cropEnd.x)
  const y = Math.min(state.cropStart.y, state.cropEnd.y)
  const w = Math.abs(state.cropEnd.x - state.cropStart.x)
  const h = Math.abs(state.cropEnd.y - state.cropStart.y)
  const handleSize = 15 // Hit tolerance

  const handles = {
    tl: { x: x, y: y },
    tr: { x: x + w, y: y },
    bl: { x: x, y: y + h },
    br: { x: x + w, y: y + h },
    tm: { x: x + w / 2, y: y },
    bm: { x: x + w / 2, y: y + h },
    lm: { x: x, y: y + h / 2 },
    rm: { x: x + w, y: y + h / 2 }
  }

  for (const [key, pos] of Object.entries(handles)) {
    if (p.dist(mx, my, pos.x, pos.y) < handleSize) {
      return key
    }
  }
  return null
}

export function isInsideRect(state, mx, my) {
  const x = Math.min(state.cropStart.x, state.cropEnd.x)
  const y = Math.min(state.cropStart.y, state.cropEnd.y)
  const w = Math.abs(state.cropEnd.x - state.cropStart.x)
  const h = Math.abs(state.cropEnd.y - state.cropStart.y)
  return mx > x && mx < x + w && my > y && my < y + h
}

export function mouseDragged(p, state, { drawPaintLine, applyBoundaryConstraints, buildCombinedLayer }) {
  if (state.isDrawingLine) {
    state.endPoint = { x: p.mouseX, y: p.mouseY }
    state.dirty = true
  } else if (state.cropState === 'drawing') {
    state.cropEnd = { x: p.constrain(p.mouseX, 0, p.width), y: p.constrain(p.mouseY, 0, p.height) }
    state.dirty = true
  } else if (state.cropState === 'dragging_handle') {
    const mx = p.constrain(p.mouseX, 0, p.width)
    const my = p.constrain(p.mouseY, 0, p.height)

    if (state.activeHandle === 'br') state.cropEnd = { x: mx, y: my }
    if (state.activeHandle === 'tl') state.cropStart = { x: mx, y: my }
    if (state.activeHandle === 'tr') { state.cropEnd.x = mx; state.cropStart.y = my }
    if (state.activeHandle === 'bl') { state.cropStart.x = mx; state.cropEnd.y = my }

    if (state.activeHandle === 'rm') state.cropEnd.x = mx
    if (state.activeHandle === 'bm') state.cropEnd.y = my
    if (state.activeHandle === 'lm') state.cropStart.x = mx
    if (state.activeHandle === 'tm') state.cropStart.y = my

    state.dirty = true
  } else if (state.cropState === 'moving') {
    const dx = p.mouseX - state.dragStartX
    const dy = p.mouseY - state.dragStartY

    // Constrain movement to canvas bounds
    const currentW = state.cropEnd.x - state.cropStart.x
    const currentH = state.cropEnd.y - state.cropStart.y

    let newX = state.cropStart.x + dx
    let newY = state.cropStart.y + dy

    // Simple constraint: keep TL and BR inside
    if (newX < 0) newX = 0
    if (newY < 0) newY = 0
    if (newX + currentW > p.width) newX = p.width - currentW
    if (newY + currentH > p.height) newY = p.height - currentH

    state.cropStart = { x: newX, y: newY }
    state.cropEnd = { x: newX + currentW, y: newY + currentH }

    state.dragStartX = p.mouseX
    state.dragStartY = p.mouseY
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
  } else if (state.cropState === 'drawing' || state.cropState === 'dragging_handle' || state.cropState === 'moving') {
    normalizeCropRect(state)
    state.cropState = 'adjusting'
    state.activeHandle = null
    state.dirty = true
  } else if (state.isDragging) {
    state.isDragging = false
  }
  state.previousMouse = { x: 0, y: 0 }
}

function isUIElement(event) {
  if (!event || !event.target) return false
  const target = event.target
  // Ignore events if they originate from a control panel or info box
  return target.closest('.control-panel') || target.closest('.info-box')
}

export function mousePressed(p, state, { drawPaintLine }) {
  // Best practice: Ignore events that originate from UI overlays
  if (isUIElement(p.mouseEvent)) return

  // Definitive check: only allow processing if the target is the canvas
  if (p.mouseEvent && p.mouseEvent.target && p.mouseEvent.target.tagName !== 'CANVAS') return

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
      if (state.cropState === 'idle' || state.cropState === undefined) { // Start new crop
        state.cropState = 'drawing'
        state.cropStart = { x: p.mouseX, y: p.mouseY }
        state.cropEnd = { x: p.mouseX, y: p.mouseY }
        state.dirty = true
      } else if (state.cropState === 'adjusting') {
        const handle = getHandleAtPosition(p, state, p.mouseX, p.mouseY)
        if (handle) {
          state.cropState = 'dragging_handle'
          state.activeHandle = handle
          state.dirty = true
        } else if (isInsideRect(state, p.mouseX, p.mouseY)) {
          state.cropState = 'moving'
          state.dragStartX = p.mouseX
          state.dragStartY = p.mouseY
          state.dirty = true
        } else {
          // Start new crop if clicked outside
          state.cropState = 'drawing'
          state.cropStart = { x: p.mouseX, y: p.mouseY }
          state.cropEnd = { x: p.mouseX, y: p.mouseY }
          state.dirty = true
        }
      }
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

export function handleKeys(p, state, { undoCrop, buildCombinedLayer, buildPaintLayer, setupAdjustMode, setupEditMode, createSaveImage, generateFilename, fitBoth, fitWidth, fitHeight, performCrop }) {
  // Prevent browser scroll on arrow keys — actual handling is in specialKeys (draw loop)
  if (p.keyCode === p.UP_ARROW || p.keyCode === p.DOWN_ARROW ||
      p.keyCode === p.LEFT_ARROW || p.keyCode === p.RIGHT_ARROW) {
    return false
  }

  // Commit Crop on Enter
  if (state.cropState === 'adjusting' && p.keyCode === p.ENTER) {
    performCrop()
    return false
  }
  // Cancel Crop on Escape
  if (state.cropState === 'adjusting' && p.keyCode === p.ESCAPE) {
    state.cropState = 'idle'
    state.dirty = true
    return false
  }

  if (p.key === 'z' && (p.keyIsDown(p.CONTROL) || p.keyIsDown(91))) {
    undoCrop()
    return false
  }
  if (p.key === 'i') {
    state.invert = !state.invert
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
  if (state.appMode === state.modes.ADJUST && p.key === 'r' && !p.keyIsDown(p.CONTROL) && !p.keyIsDown(91)) {
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
      // If switching away from crop, reset crop state
      state.cropState = 'idle'
      state.dirty = true
      return false
    }
    if (p.key === 'c') {
      state.editTool = state.editTools.CROP
      state.dirty = true
      return false
    }
    if (p.key === 'r') {
      if (state.editTool === state.editTools.CROP && state.cropState !== 'idle') {
        state.cropState = 'idle'
        state.dirty = true
      } else if (state.undoStack.length > 0) {
        undoCrop()
      }
      return false
    }
    if (state.editTool === state.editTools.PAINT && p.key === 'x') {
      state.modal.eraseMode = !state.modal.eraseMode
      state.dirty = true
      return false
    }
  }

  if (p.key === 'a') {
    if (window.aboutControls) window.aboutControls.toggle()
    return false
  }

  if (p.key === 'e') {
    if (window.infoBoxControls) window.infoBoxControls.hide()
    if (window.aboutControls) window.aboutControls.hide()
    if (state.appMode === state.modes.ADJUST) {
      setupEditMode()
    } else {
      setupAdjustMode()
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
  } else if (p.key === 'g') {
    state.showGridControls = !state.showGridControls
    state.dirty = true
    return false
  } else if (p.key === 'j') {
    state.showHalftoneControls = !state.showHalftoneControls
    state.dirty = true
    return false
  } else if (p.key === 'k') {
    state.showGridControls = !state.showGridControls
    state.dirty = true
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