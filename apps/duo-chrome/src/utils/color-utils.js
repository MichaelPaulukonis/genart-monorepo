/**
 * Normalizes a color value to a lowercase 6-character hex string (#rrggbb).
 * - Accepts RGB arrays [r, g, b], 3-char shorthand '#abc', and full '#rrggbb' strings.
 * - Returns '' for invalid or missing input.
 */
export function normalizeHexColor (value) {
  if (!value) return ''
  if (Array.isArray(value)) {
    const h = n => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, '0')
    return `#${h(value[0])}${h(value[1])}${h(value[2])}`
  }
  if (typeof value !== 'string') return ''
  const hex = value.trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }
  return hex
}

/**
 * Converts an [r, g, b] array to a '#rrggbb' hex string.
 * Returns '' for invalid input.
 */
export function rgbArrayToHex (rgb) {
  if (!Array.isArray(rgb) || rgb.length < 3) return ''
  const [r, g, b] = rgb
  const toHex = (n) => Number(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Returns a random item from arr that is not in excludeItems.
 * Throws RangeError if no available items remain.
 */
export function getRandomUniqueItem (arr, excludeItems) {
  const filteredArr = arr.filter(item => !excludeItems.includes(item))
  if (filteredArr.length === 0) {
    throw new RangeError('getRandomUniqueItem: no available items to select')
  }
  const randomIndex = Math.floor(Math.random() * filteredArr.length)
  return filteredArr[randomIndex]
}
