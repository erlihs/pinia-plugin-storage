import type { StorageAdapter } from './index'

export const sessionStorageAdapter = (): StorageAdapter => {
  const hasWindow =
    typeof window !== 'undefined' && typeof document !== 'undefined' && !!window.sessionStorage
  return {
    async getItem(k) {
      if (!hasWindow) return undefined
      try {
        return window.sessionStorage.getItem(k) ?? undefined
      } catch {
        // sessionStorage might be disabled
        return undefined
      }
    },
    async setItem(k, v) {
      if (!hasWindow) return
      try {
        window.sessionStorage.setItem(k, v)
      } catch {
        // sessionStorage might be disabled - fail silently
      }
    },
    async removeItem(k) {
      if (!hasWindow) return
      try {
        window.sessionStorage.removeItem(k)
      } catch {
        // sessionStorage might be disabled - fail silently
      }
    },
    // Note: sessionStorage doesn't support cross-tab sync by nature
    // It's scoped to a single tab/window, so external sync is not applicable
  }
}
