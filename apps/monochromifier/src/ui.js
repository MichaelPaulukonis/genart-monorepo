import { formatVersion } from './utils/version.js'

export function displayUI(p, state) {
  const { view, invert, autoCrop, showOSD, appMode, modes, editTool, editTools, modal, brushSize, threshold, transparencyModeEnabled, transparencyThreshold } = state;

  const adjustModeText = [
    `zoom: ${(view.zoom * 100).toFixed(0)}%`,
    `pan: (${Math.round(view.x)}, ${Math.round(view.y)})`,
    `autocrop: ${autoCrop ? 'ON' : 'OFF'}`,
    `OSD: ${showOSD ? 'ON' : 'OFF'}`
  ]

  const editModeText = [
    `tool: ${editTool}`,
    `erase mode: ${modal.eraseMode ? 'ON' : 'OFF'}`
  ]
  const paintToolText = [
    `brush size: ${brushSize}`
  ]

  let modeText = []
  if (appMode === modes.ADJUST) {
    modeText = adjustModeText
  } else if (appMode === modes.EDIT) {
    modeText = editModeText
    if (editTool === editTools.PAINT) {
      modeText = [...modeText, ...paintToolText]
    }
  }

  const uiText = [
    `threshold: ${threshold}`,
    `mode: ${appMode}`,
    ...modeText,
    `transparency: ${transparencyModeEnabled ? 'ON' : 'OFF'}`,
    transparencyModeEnabled ? `transparency threshold: ${transparencyThreshold}` : ''
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

export function drawOSD(p, state) {
  const { img, showOSD, view, outputSize } = state;
  if (!img || !showOSD) return

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

  // Draw original image thumbnail
  p.push()
  p.imageMode(p.CORNER)
  p.tint(255, 200)
  p.image(img, thumbX, thumbY, thumbWidth, thumbHeight)
  p.noTint()
  p.pop()

  // 1. Calculate the visible portion of the image in image pixels.
  const finalScale = view.zoom * view.baseScale;
  const visibleWidthInPixels = outputSize / finalScale;
  const visibleHeightInPixels = outputSize / finalScale;

  // The view.x/y are pan offsets from the center.
  const viewportCenterX = (img.width / 2) + view.x;
  const viewportCenterY = (img.height / 2) + view.y;

  const visibleXInPixels = viewportCenterX - (visibleWidthInPixels / 2);
  const visibleYInPixels = viewportCenterY - (visibleHeightInPixels / 2);

  // 2. Convert these pixel-space coordinates to OSD thumbnail coordinates.
  const rectX = thumbX + (visibleXInPixels * thumbScale);
  const rectY = thumbY + (visibleYInPixels * thumbScale);
  const rectWidth = visibleWidthInPixels * thumbScale;
  const rectHeight = visibleHeightInPixels * thumbScale;

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

export function displayHelpScreen(p) {
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
      r - Reset view and threshold
      i - Invert image
      t - Toggle transparency mode
      o - Toggle OSD (position overlay)
      e - Toggle Edit Mode

      ADJUST Mode:
      d - Reset pan
      → / ← - Zoom in/out
      1 - Fit image to canvas (fit both)
      2 - Fit image to canvas width
      3 - Fit image to canvas height
      CMD-s - Save image
      Click + Drag - Pan image

      EDIT Mode:
      p - Activate PAINT tool
      c - Activate CROP tool
      x - Toggle erase mode (in PAINT tool)
      → / ← - increase/decrease brush size (in PAINT tool)
      CMD-click - Draw a line (in PAINT tool)

      Global:
      ↑ / ↓ - increase/decrease threshold
      CMD-c - Toggle autocrop
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

export function displayProcessingText(p) {
  p.fill(p.color('#e75397'), 150)
  p.rect(50, 50, p.width - 100, 100, 10)

  p.fill(255)
  p.textSize(16)
  p.textAlign(p.CENTER, p.CENTER)
  p.text('Processing image, please wait...', p.width / 2, 100)
}
