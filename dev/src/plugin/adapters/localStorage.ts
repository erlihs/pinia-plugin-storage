import type { StorageAdapter } from './index'

export const localStorageAdapter = (): StorageAdapter => {
  const hasWindow = typeof window !== 'undefined' && !!window.localStorage
  return {
    async getItem(k) {
      if (!hasWindow) return undefined
      return window.localStorage.getItem(k) ?? undefined
    },
    async setItem(k, v) {
      if (!hasWindow) return
      window.localStorage.setItem(k, v)
    },
    async removeItem(k) {
      if (!hasWindow) return
      window.localStorage.removeItem(k)
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
