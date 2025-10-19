/**
 * Version utility functions for dragline
 * Provides version information with fallback handling
 */

let versionConstants = null;

try {
  // Try to import the generated version constants
  versionConstants = await import('./version-constants.js');
} catch (error) {
  console.warn('Version constants not available, using fallback');
}

/**
 * Get the current app version
 * @returns {string} The app version or fallback
 */
export function getAppVersion() {
  return versionConstants?.APP_VERSION || '0.1.0';
}

/**
 * Format version string with consistent prefix
 * @param {string} version - The version string to format
 * @returns {string} Formatted version string
 */
export function formatVersion(version = getAppVersion()) {
  return `v${version}`;
}