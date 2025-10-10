/**
 * Shared p5.js utilities for creative coding projects
 */

/**
 * Get a random unique item from an array, excluding specified items
 * @param {Array} arr - The array to select from
 * @param {Array} excludeItems - Items to exclude from selection
 * @returns {*} A random item from the filtered array
 * @throws {RangeError} When no items are available to select
 */
export function getRandomUniqueItem(arr, excludeItems = []) {
  const filteredArr = arr.filter(item => !excludeItems.includes(item))
  if (filteredArr.length === 0) {
    throw new RangeError('getRandomUniqueItem: no available items to select')
  }
  const randomIndex = Math.floor(Math.random() * filteredArr.length)
  return filteredArr[randomIndex]
}

/**
 * Get a random item from an array
 * @param {Array} arr - The array to select from
 * @returns {*} A random item from the array
 */
export function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generate a date string for file naming
 * @returns {string} Date string in format YYYYMMDDHHMMSS
 */
export function datestring() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const secs = String(d.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}${hour}${min}${secs}`
}

/**
 * Create a file namer function with incrementing counter
 * @param {string} prefix - Prefix for the filename
 * @returns {Function} Function that generates incremental filenames
 */
export function createFilenamer(prefix) {
  let frame = 0
  return () => {
    const name = `${prefix}-${String(frame).padStart(6, '0')}`
    frame += 1
    return name
  }
}

/**
 * Map a value from one range to another
 * @param {number} value - The value to map
 * @param {number} start1 - Start of the first range
 * @param {number} stop1 - End of the first range
 * @param {number} start2 - Start of the second range
 * @param {number} stop2 - End of the second range
 * @returns {number} The mapped value
 */
export function mapRange(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
}

/**
 * Constrain a value between min and max
 * @param {number} value - The value to constrain
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} The constrained value
 */
export function constrain(value, min, max) {
  return Math.min(Math.max(value, min), max)
}