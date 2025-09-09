/**
 * Throttling utility for function calls
 */

/**
 * Creates a throttled version of a function
 * @param fn - The function to throttle
 * @param delay - The delay in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends unknown[]>(
  fn: (...args: T) => void | Promise<void>,
  delay: number,
) => {
  let lastExecution = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: T) => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecution

    // Clear any pending timeout first
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    // If enough time has passed, execute immediately
    if (timeSinceLastExecution >= delay) {
      lastExecution = now
      fn(...args)
    } else {
      // Schedule execution for the remaining time
      const remainingTime = delay - timeSinceLastExecution
      timeoutId = setTimeout(() => {
        lastExecution = Date.now()
        fn(...args)
        timeoutId = null
      }, remainingTime)
    }
  }
}
