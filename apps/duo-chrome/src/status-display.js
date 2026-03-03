import { backgroundModes } from './background-modes.js'
import { filterImages } from './utils/image-filtering.js'
import { getThemeById } from './utils/theme-management.js'

/**
 * Creates the status panel rendering system.
 *
 * @param {object} deps
 * @param {Array}    deps.imageColorPairs - mutable array of image/color pairs
 * @param {object}   deps.controlState   - mutable control state
 * @param {{ get: () => number }} deps.backgroundModeIndex
 * @param {{ get: () => number }} deps.blendModeIndex
 * @param {Function} deps.getLoopAnimationController - returns controller (may be null)
 * @param {Array}    deps.imgs            - full image list for theme counts
 */
export function createStatusDisplay ({
  imageColorPairs,
  controlState,
  backgroundModeIndex,
  blendModeIndex,
  getLoopAnimationController,
  imgs
}) {
  function update () {
    const statusOverlay = document.getElementById('status-overlay')
    if (!statusOverlay) return

    const formatName = (filename) => {
      if (!filename) return '-'
      const name = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      return name.length > 22 ? '\u2026' + name.slice(-20) : name
    }

    const filenameA = document.getElementById('status-filename-a')
    const filenameB = document.getElementById('status-filename-b')
    if (filenameA && imageColorPairs[0].img) {
      filenameA.textContent = formatName(imageColorPairs[0].img)
      filenameA.title = imageColorPairs[0].img
    }
    if (filenameB && imageColorPairs[1].img) {
      filenameB.textContent = formatName(imageColorPairs[1].img)
      filenameB.title = imageColorPairs[1].img
    }

    const swatchA = document.getElementById('status-swatch-a')
    const swatchB = document.getElementById('status-swatch-b')
    if (swatchA && imageColorPairs[0].color) swatchA.style.backgroundColor = imageColorPairs[0].color.color
    if (swatchB && imageColorPairs[1].color) swatchB.style.backgroundColor = imageColorPairs[1].color.color

    const colorA = document.getElementById('status-color-a')
    const colorB = document.getElementById('status-color-b')
    if (colorA && imageColorPairs[0].color) colorA.textContent = imageColorPairs[0].color.name
    if (colorB && imageColorPairs[1].color) colorB.textContent = imageColorPairs[1].color.name

    const themeA = document.getElementById('status-theme-a')
    const themeB = document.getElementById('status-theme-b')
    const assignments = controlState.themeAssignments || [null, null]

    if (themeA) {
      if (assignments[0]) {
        const theme = getThemeById(assignments[0])
        if (theme) {
          const count = filterImages(imgs, theme.filter).length
          themeA.textContent = `${theme.name}${count === 0 ? ' (empty)' : ''}`
          themeA.style.color = count === 0 ? 'var(--dc-accent-amber)' : 'var(--dc-accent-green)'
        } else {
          themeA.textContent = 'Unknown'
          themeA.style.color = 'var(--dc-text-muted)'
        }
      } else {
        themeA.textContent = 'None'
        themeA.style.color = 'var(--dc-text-muted)'
      }
    }

    if (themeB) {
      if (assignments[1]) {
        const theme = getThemeById(assignments[1])
        if (theme) {
          const count = filterImages(imgs, theme.filter).length
          themeB.textContent = `${theme.name}${count === 0 ? ' (empty)' : ''}`
          themeB.style.color = count === 0 ? 'var(--dc-accent-amber)' : 'var(--dc-accent-green)'
        } else {
          themeB.textContent = 'Unknown'
          themeB.style.color = 'var(--dc-text-muted)'
        }
      } else {
        themeB.textContent = 'None'
        themeB.style.color = 'var(--dc-text-muted)'
      }
    }

    const scaleA = document.getElementById('status-scale-a')
    const scaleB = document.getElementById('status-scale-b')
    if (scaleA) scaleA.textContent = parseFloat(imageColorPairs[0].scale).toFixed(2)
    if (scaleB) scaleB.textContent = parseFloat(imageColorPairs[1].scale).toFixed(2)

    const statusImageA = document.getElementById('status-image-a')
    const statusImageB = document.getElementById('status-image-b')
    if (statusImageA && statusImageB) {
      statusImageA.classList.toggle('active', controlState.activeImageIndex === 0)
      statusImageB.classList.toggle('active', controlState.activeImageIndex === 1)
    }

    const blendModeVal = document.getElementById('status-blend-mode-value')
    if (blendModeVal) {
      const currentBgMode = backgroundModes[backgroundModeIndex.get()]
      blendModeVal.textContent = currentBgMode.blendModes[blendModeIndex.get()]
    }

    const loopController = getLoopAnimationController()
    const loopEnabled = document.getElementById('status-loop-enabled')
    const loopLength = document.getElementById('status-loop-length')
    const loopFps = document.getElementById('status-loop-fps')
    const loopFrame = document.getElementById('status-loop-frame')
    const loopFallback = document.getElementById('status-loop-fallback')

    if (loopEnabled) loopEnabled.textContent = loopController?.enabled ? 'On' : 'Off'
    if (loopLength) {
      const totalFrames = loopController?.walk?.length || 0
      loopLength.textContent = totalFrames > 0 ? `${totalFrames}` : '-'
    }
    if (loopFps) loopFps.textContent = loopController ? `${loopController.fps}` : '-'
    if (loopFrame) {
      const totalFrames = loopController?.walk?.length || 0
      loopFrame.textContent = totalFrames > 0
        ? `${loopController.currentFrameIndex + 1} / ${totalFrames}`
        : '-'
    }
    if (loopFallback) {
      const metadata = loopController?.lastGenerationMetadata
      if (metadata?.isLoopFallback) {
        loopFallback.textContent = `Fallback: ${metadata.requestedLoopLength} -> ${metadata.achievedLoopLength}`
        loopFallback.classList.remove('hidden')
      } else {
        loopFallback.textContent = ''
        loopFallback.classList.add('hidden')
      }
    }
  }

  // V3: status panel is always visible in the rack; show() just refreshes the display
  function show () {
    update()
  }

  function toggle () {
    const statusOverlay = document.getElementById('status-overlay')
    if (!statusOverlay) return
    statusOverlay.classList.toggle('is-collapsed')
    const btn = document.getElementById('monitor-collapse')
    if (btn) btn.textContent = statusOverlay.classList.contains('is-collapsed') ? '+' : '−'
  }

  return { update, show, toggle }
}
