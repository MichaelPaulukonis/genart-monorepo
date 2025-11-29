/**
 * HistoryEntry Type Definition
 *
 * Represents a single snapshot of a duo-chrome composition state.
 * Stores all parameters needed to recreate a composition exactly.
 *
 * @typedef {Object} HistoryEntry
 * @property {string} id - Unique identifier (timestamp-based)
 * @property {number} timestamp - Date.now() when captured
 *
 * @property {Object} imageA - Image A state
 * @property {number} imageA.index - Position in imgs array
 * @property {string} imageA.filename - Image filename
 * @property {string} imageA.colorName - Color name from palette
 * @property {number} imageA.scale - Scale factor (0.05 - 5.0)
 *
 * @property {Object} imageB - Image B state
 * @property {number} imageB.index - Position in imgs array
 * @property {string} imageB.filename - Image filename
 * @property {string} imageB.colorName - Color name from palette
 * @property {number} imageB.scale - Scale factor (0.05 - 5.0)
 *
 * @property {number} paletteIndex - Current palette selection
 * @property {number} blendModeIndex - Current blend mode
 * @property {number} backgroundModeIndex - Current background mode
 * @property {number} activeImageIndex - Which image is active (0 or 1)
 *
 * @property {string} source - How entry was created: 'manual' | 'random' | 'url' | 'modified'
 * @property {string} [thumbnail] - Base64 encoded thumbnail (optional, generated on demand)
 */

/**
 * Creates a new HistoryEntry with the given parameters.
 *
 * @param {Object} params - Entry parameters
 * @returns {HistoryEntry} - New history entry
 */
export function createHistoryEntry (params) {
  const {
    imageA,
    imageB,
    paletteIndex,
    blendModeIndex,
    backgroundModeIndex,
    activeImageIndex,
    source = 'manual',
    thumbnail = null
  } = params

  // Generate unique ID based on timestamp with random suffix for uniqueness
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const timestamp = Date.now()

  return {
    id,
    timestamp,
    imageA: {
      index: imageA.index,
      filename: imageA.filename,
      colorName: imageA.colorName,
      scale: parseFloat(imageA.scale)
    },
    imageB: {
      index: imageB.index,
      filename: imageB.filename,
      colorName: imageB.colorName,
      scale: parseFloat(imageB.scale)
    },
    paletteIndex,
    blendModeIndex,
    backgroundModeIndex,
    activeImageIndex,
    source,
    thumbnail
  }
}

/**
 * Validates that a history entry has all required fields.
 *
 * @param {Object} entry - Entry to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateHistoryEntry (entry) {
  if (!entry || typeof entry !== 'object') {
    return false
  }

  // Check required top-level fields
  const requiredFields = ['id', 'timestamp', 'imageA', 'imageB', 'paletteIndex',
    'blendModeIndex', 'backgroundModeIndex', 'activeImageIndex', 'source']

  for (const field of requiredFields) {
    if (!(field in entry)) {
      return false
    }
  }

  // Check image objects
  const requiredImageFields = ['index', 'filename', 'colorName', 'scale']

  for (const imageField of ['imageA', 'imageB']) {
    const image = entry[imageField]
    if (!image || typeof image !== 'object') {
      return false
    }

    for (const field of requiredImageFields) {
      if (!(field in image)) {
        return false
      }
    }
  }

  return true
}
