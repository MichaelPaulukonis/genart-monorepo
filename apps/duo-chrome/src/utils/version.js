/**
 * Simple version display utilities for duo-chrome
 */

/**
 * Gets the formatted application version with "v" prefix
 * @returns {Promise<string>} Formatted version (e.g., "v0.1.0")
 */
export async function getFormattedVersion () {
  try {
    const constants = await import('./version-constants.js')
    const version = constants.APP_VERSION?.trim()
    if (version) {
      return version.startsWith('v') ? version : `v${version}`
    }
  } catch (error) {
    console.warn('Could not load version constants:', error.message)
  }

  return 'v1.0.0'
}
