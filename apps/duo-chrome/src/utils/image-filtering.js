/**
 * @typedef {Object} FilterDefinition
 * @property {string} [searchString] - Text to search for in filenames
 * @property {string} [name] - Optional name for the filter (Themes)
 */

/**
 * Filters a list of image filenames based on a filter definition.
 *
 * @param {string[]} images - Array of image filenames
 * @param {FilterDefinition} filterDef - The filter criteria
 * @returns {string[]} Filtered array of images
 */
export function filterImages (images, filterDef) {
  if (!filterDef || !filterDef.searchString) {
    return [...images]
  }

  const query = filterDef.searchString.toLowerCase().trim()
  if (query === '') {
    return [...images]
  }

  return images.filter(filename =>
    filename.toLowerCase().includes(query)
  )
}

/**
 * Checks if a filter would result in at least one image.
 * This is used for "Theme" validation (Task 5).
 *
 * @param {string[]} images - Array of image filenames
 * @param {FilterDefinition} filterDef - The filter criteria
 * @returns {boolean} True if the filter results in 1 or more images
 */
export function isValidFilter (images, filterDef) {
  const filtered = filterImages(images, filterDef)
  return filtered.length > 0
}
