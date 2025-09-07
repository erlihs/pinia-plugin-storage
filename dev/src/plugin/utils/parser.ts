/**
 * Safe JSON parsing utilities
 */

/**
 * Safely parse JSON string with error handling
 * @param raw - Raw JSON string to parse
 * @param onError - Optional error handler
 * @returns Parsed object or undefined if parsing fails
 */
export const safeParse = <T = unknown>(
  raw: string,
  onError?: (err: unknown) => void,
): T | undefined => {
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    onError?.(err)
    return undefined
  }
}
