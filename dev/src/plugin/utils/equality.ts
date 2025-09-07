/**
 * Deep equality comparison utilities
 */

/**
 * Simple deep equality check for primitive values and objects
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal, false otherwise
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false
    if (!deepEqual(aObj[key], bObj[key])) return false
  }

  return true
}
