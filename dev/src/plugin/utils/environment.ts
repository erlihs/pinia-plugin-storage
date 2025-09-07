/**
 * SSR environment detection utilities
 * Ensures the plugin is safe to use in SSR frameworks like Nuxt, Next.js, SvelteKit, etc.
 */

/**
 * Comprehensive SSR environment detection
 * @returns true if running in a server environment, false if in browser
 */
export const isServerEnvironment = (): boolean => {
  return (
    typeof window === 'undefined' || // No window object (Node.js/SSR)
    typeof document === 'undefined' || // No document object (workers/SSR)
    typeof navigator === 'undefined' || // No navigator object (SSR)
    !window.localStorage || // localStorage not available
    !window.sessionStorage // sessionStorage not available
  )
}
