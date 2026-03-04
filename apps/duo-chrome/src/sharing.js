import { backgroundModes } from './background-modes.js'

/**
 * Creates the URL-based composition sharing system.
 *
 * @param {object}   deps
 * @param {Array}    deps.imageColorPairs
 * @param {object}   deps.controlState
 * @param {{ get: () => number, set: (v: number) => void }} deps.colorIndex
 * @param {{ get: () => number, set: (v: number) => void }} deps.blendModeIndex
 * @param {{ get: () => number, set: (v: number) => void }} deps.backgroundModeIndex
 * @param {Function} deps.getColorMaps   - returns the COLOR_MAPS array
 * @param {Array}    deps.imgs
 * @param {Function} deps.onPause        - called to pause the app
 * @param {Function} deps.onPaletteUpdate - called when palette index changes
 * @param {Function} deps.onRestoreImages - called to load images after state restoration
 */
export function createSharingSystem ({
  imageColorPairs,
  controlState,
  colorIndex,
  blendModeIndex,
  backgroundModeIndex,
  getColorMaps,
  imgs,
  onPause,
  onPaletteUpdate,
  onRestoreImages
}) {
  // ── private helpers ──────────────────────────────────────────────────────────

  async function copyToClipboard (text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error)
    }
  }

  function showShareFeedback (message, type = 'success') {
    let feedback = document.getElementById('share-feedback')

    if (!feedback) {
      feedback = document.createElement('div')
      feedback.id = 'share-feedback'
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: white;
        z-index: 10000;
        transition: opacity 0.3s ease;
        pointer-events: none;
        max-width: 300px;
        word-wrap: break-word;
      `
      document.body.appendChild(feedback)
    }

    feedback.style.backgroundColor = type === 'error' ? '#ff4444' : '#4CAF50'
    feedback.textContent = message
    feedback.style.opacity = '1'

    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback)
        }
      }, 300)
    }, 3000)
  }

  // ── public API ───────────────────────────────────────────────────────────────

  /**
   * Serializes the current composition state into URL parameters.
   * @returns {URLSearchParams}
   */
  function serializeCompositionState () {
    const params = new URLSearchParams()

    params.set('imageA', controlState.imageIndices[0])
    params.set('imageB', controlState.imageIndices[1])

    if (imageColorPairs[0].color) {
      params.set('colorA', imageColorPairs[0].color.name)
    }
    if (imageColorPairs[1].color) {
      params.set('colorB', imageColorPairs[1].color.name)
    }

    params.set('scaleA', parseFloat(imageColorPairs[0].scale).toFixed(2))
    params.set('scaleB', parseFloat(imageColorPairs[1].scale).toFixed(2))

    params.set('blendMode', blendModeIndex.get())
    params.set('bgMode', backgroundModeIndex.get())
    params.set('palette', colorIndex.get())

    params.set('active', controlState.activeImageIndex)
    params.set('v', '1')

    return params
  }

  /**
   * Generates a shareable URL and uses the Web Share API if available.
   * Falls back to copying the URL to the clipboard.
   */
  async function generateShareURL () {
    try {
      const params = serializeCompositionState()
      const baseURL = `${window.location.origin}${window.location.pathname}`
      const shareURL = `${baseURL}?${params.toString()}`

      window.history.replaceState(null, null, shareURL)

      const shareData = {
        title: 'Duo-Chrome Composition',
        text: 'Check out this duotone composition I made!',
        url: shareURL
      }

      if (navigator.share && navigator.canShare(shareData)) {
        console.log('Using Web Share API')
        await navigator.share(shareData)
        showShareFeedback('Composition shared!')
      } else {
        console.log('Web Share API not available, falling back to clipboard')
        await copyToClipboard(shareURL)
        showShareFeedback('URL copied to clipboard!')
      }

      console.log('Share URL generated:', shareURL)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to share:', error)
        showShareFeedback('Failed to share composition', 'error')
      } else {
        console.log('Share action cancelled by user.')
      }
    }
  }

  /**
   * Restores composition state from URL parameters.
   * Called on page load to recreate shared compositions.
   * @returns {boolean} true if a composition was restored
   */
  function restoreCompositionFromURL () {
    const params = new URLSearchParams(window.location.search)

    const imageA = params.get('imageA')
    const imageB = params.get('imageB')

    if (!imageA && !imageB) {
      return false
    }

    console.log('Restoring composition from URL:', window.location.search)

    try {
      const colorMaps = getColorMaps()

      const paletteParam = params.get('palette')
      if (paletteParam) {
        const paletteIndex = parseInt(paletteParam)
        if (paletteIndex >= 0 && paletteIndex < colorMaps.length) {
          colorIndex.set(paletteIndex)
          onPaletteUpdate(paletteIndex)
        }
      }

      if (imageA) {
        const imageAIndex = parseInt(imageA)
        if (imageAIndex >= 0 && imageAIndex < imgs.length) {
          controlState.imageIndices[0] = imageAIndex
          imageColorPairs[0].img = imgs[imageAIndex]
        }
      }

      if (imageB) {
        const imageBIndex = parseInt(imageB)
        if (imageBIndex >= 0 && imageBIndex < imgs.length) {
          controlState.imageIndices[1] = imageBIndex
          imageColorPairs[1].img = imgs[imageBIndex]
        }
      }

      const currentColorMaps = getColorMaps()
      const colorAName = params.get('colorA')
      if (colorAName) {
        const colorA = currentColorMaps[colorIndex.get()].get(colorAName)
        if (colorA) {
          imageColorPairs[0].color = colorA
        }
      }

      const colorBName = params.get('colorB')
      if (colorBName) {
        const colorB = currentColorMaps[colorIndex.get()].get(colorBName)
        if (colorB) {
          imageColorPairs[1].color = colorB
        }
      }

      const scaleAParam = params.get('scaleA')
      if (scaleAParam) {
        const scaleA = parseFloat(scaleAParam)
        if (scaleA >= 0.05 && scaleA <= 5.0) {
          imageColorPairs[0].scale = scaleA.toFixed(2)
          controlState.manualSizeControl[0] = true
        }
      }

      const scaleBParam = params.get('scaleB')
      if (scaleBParam) {
        const scaleB = parseFloat(scaleBParam)
        if (scaleB >= 0.05 && scaleB <= 5.0) {
          imageColorPairs[1].scale = scaleB.toFixed(2)
          controlState.manualSizeControl[1] = true
        }
      }

      const bgModeParam = params.get('bgMode')
      const blendModeParam = params.get('blendMode')

      if (bgModeParam) {
        const bgIndex = parseInt(bgModeParam)
        if (bgIndex >= 0 && bgIndex < backgroundModes.length) {
          backgroundModeIndex.set(bgIndex)
          blendModeIndex.set(0)
          if (blendModeParam) {
            const blendIndex = parseInt(blendModeParam)
            const newBgMode = backgroundModes[backgroundModeIndex.get()]
            if (blendIndex >= 0 && blendIndex < newBgMode.blendModes.length) {
              blendModeIndex.set(blendIndex)
            }
          }
        }
      } else if (blendModeParam) {
        const blendIndex = parseInt(blendModeParam)
        const currentBgMode = backgroundModes[backgroundModeIndex.get()]
        if (blendIndex >= 0 && blendIndex < currentBgMode.blendModes.length) {
          blendModeIndex.set(blendIndex)
        }
      }

      const activeParam = params.get('active')
      if (activeParam) {
        const activeIndex = parseInt(activeParam)
        if (activeIndex === 0 || activeIndex === 1) {
          controlState.activeImageIndex = activeIndex
        }
      }

      controlState.isManualMode = true
      onPause()
      console.log('App paused to preserve shared composition')

      onRestoreImages()

      showShareFeedback('Composition loaded from URL')
      console.log('Composition restored successfully')
      return true
    } catch (error) {
      console.error('Failed to restore composition from URL:', error)
      showShareFeedback('Failed to load composition from URL', 'error')
      return false
    }
  }

  return { generateShareURL, serializeCompositionState, restoreCompositionFromURL }
}
