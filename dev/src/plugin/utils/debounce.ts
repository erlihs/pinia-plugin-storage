/**
 * Debouncing utility for function calls
 */

/**
 * Creates a debounced version of a function
 * @param fn - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends unknown[]>(
  fn: (...args: T) => void | Promise<void>,
  delay: number,
) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: T) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
