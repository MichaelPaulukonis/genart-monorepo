/**
 * Theme Management Utility
 * Handles persistence and management of filter themes and A/B assignments.
 */

const THEMES_KEY = 'duochrome-themes'
const ASSIGNMENTS_KEY = 'duochrome-assignments'

/**
 * @typedef {Object} Theme
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {Object} filter - Filter definition
 * @property {number} createdAt - Timestamp
 */

/**
 * @typedef {Object} ThemeAssignments
 * @property {string|null} 0 - Theme ID for Image A
 * @property {string|null} 1 - Theme ID for Image B
 */

/**
 * Generates a simple unique ID
 * @returns {string}
 */
function generateId () {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Get all saved themes
 * @returns {Theme[]}
 */
export function getThemes () {
  try {
    const saved = localStorage.getItem(THEMES_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    console.warn('Failed to load themes:', e)
    return []
  }
}

/**
 * Save a new theme
 * @param {string} name - Theme name
 * @param {Object} filter - Filter definition
 * @returns {Theme} The created theme
 */
export function saveTheme (name, filter) {
  const themes = getThemes()
  const newTheme = {
    id: generateId(),
    name,
    filter,
    createdAt: Date.now()
  }
  
  themes.push(newTheme)
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes))
  return newTheme
}

/**
 * Delete a theme by ID
 * @param {string} id 
 * @returns {Theme[]} Updated list of themes
 */
export function deleteTheme (id) {
  const themes = getThemes().filter(t => t.id !== id)
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes))
  
  // Also remove from assignments if present
  const assignments = getAssignments()
  let changed = false
  if (assignments[0] === id) {
    assignments[0] = null
    changed = true
  }
  if (assignments[1] === id) {
    assignments[1] = null
    changed = true
  }
  if (changed) {
    saveAssignments(assignments)
  }
  
  return themes
}

/**
 * Get theme by ID
 * @param {string} id 
 * @returns {Theme|undefined}
 */
export function getThemeById (id) {
  return getThemes().find(t => t.id === id)
}

/**
 * Get current A/B assignments
 * @returns {ThemeAssignments}
 */
export function getAssignments () {
  try {
    const saved = localStorage.getItem(ASSIGNMENTS_KEY)
    return saved ? JSON.parse(saved) : { 0: null, 1: null }
  } catch (e) {
    console.warn('Failed to load assignments:', e)
    return { 0: null, 1: null }
  }
}

/**
 * Save A/B assignments
 * @param {ThemeAssignments} assignments 
 */
export function saveAssignments (assignments) {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
}

/**
 * Assign a theme to a position
 * @param {number} position - 0 (A) or 1 (B)
 * @param {string|null} themeId - Theme ID or null to clear
 * @returns {ThemeAssignments} Updated assignments
 */
export function assignTheme (position, themeId) {
  const assignments = getAssignments()
  assignments[position] = themeId
  saveAssignments(assignments)
  return assignments
}
