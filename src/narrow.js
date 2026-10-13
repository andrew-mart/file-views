// @ts-check
// Narrowing of values of unknown shape: what a library or a server gives back.

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
