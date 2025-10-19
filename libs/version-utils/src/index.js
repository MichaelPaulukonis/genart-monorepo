/**
 * Shared version display utilities for genart monorepo
 */

/**
 * Gets the formatted application version with "v" prefix
 * @param {string} versionConstantsPath - Path to version-constants.js relative to caller
 * @returns {Promise<string>} Formatted version (e.g., "v0.1.0")
 */
export async function getFormattedVersion (versionConstantsPath = './version-constants.js') {
  try {
    const constants = await import(versionConstantsPath)
    const version = constants.APP_VERSION?.trim()
    if (version) {
      return version.startsWith('v') ? version : `v${version}`
    }
  } catch (error) {
    console.warn('Could not load version constants:', error.message)
  }

  return 'v1.0.0'
}