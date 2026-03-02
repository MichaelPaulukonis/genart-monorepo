/**
 * @typedef {Object} FilterDefinition
 * @property {string}   [searchString]   - Text to search for in filenames
 * @property {string[]} [selectedImages] - Explicit list of selected filenames (overrides search when non-empty)
 * @property {string}   [name]           - Optional name for the filter (Themes)
 */

/**
 * Filters a list of image filenames based on a filter definition.
 *
 * Priority:
 *   1. If selectedImages is non-empty → return only those images (in original order)
 *   2. If searchString is non-empty   → return images matching the substring
 *   3. Otherwise                      → return all images
 *
 * @param {string[]} images    - Array of image filenames
 * @param {FilterDefinition} filterDef - The filter criteria
 * @returns {string[]} Filtered array of images
 */
export function filterImages (images, filterDef) {
  if (!filterDef) return [...images]

  const { searchString, selectedImages } = filterDef

  // Explicit selection overrides text search
  if (selectedImages && selectedImages.length > 0) {
    const set = new Set(selectedImages)
    return images.filter(f => set.has(f))
  }

  if (!searchString) return [...images]

  const query = searchString.toLowerCase().trim()
  if (query === '') return [...images]

  return images.filter(filename => filename.toLowerCase().includes(query))
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
