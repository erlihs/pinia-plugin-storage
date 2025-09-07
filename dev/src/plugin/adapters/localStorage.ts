import type { StorageAdapter } from './index'

export const localStorageAdapter = (): StorageAdapter => {
  const hasWindow =
    typeof window !== 'undefined' && typeof document !== 'undefined' && !!window.localStorage
  return {
    async getItem(k) {
      if (!hasWindow) return undefined
      try {
        return window.localStorage.getItem(k) ?? undefined
      } catch {
        // localStorage might be disabled or quota exceeded
        return undefined
      }
    },
    async setItem(k, v) {
      if (!hasWindow) return
      try {
        window.localStorage.setItem(k, v)
      } catch {
        // localStorage might be disabled or quota exceeded - fail silently
      }
    },
    async removeItem(k) {
      if (!hasWindow) return
      try {
        window.localStorage.removeItem(k)
      } catch {
        // localStorage might be disabled - fail silently
      }
    },
    subscribe(key, cb) {
      if (!hasWindow) return () => {}
      const on = (e: StorageEvent) => {
        if (e.key === key) cb()
      }
      window.addEventListener('storage', on)
      return () => window.removeEventListener('storage', on)
    },
  }
}
