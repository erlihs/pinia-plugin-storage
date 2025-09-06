import type { StorageAdapter } from './index'

export const sessionStorageAdapter = (): StorageAdapter => {
  const hasWindow = typeof window !== 'undefined' && !!window.sessionStorage
  return {
    async getItem(k) {
      return hasWindow ? (window.sessionStorage.getItem(k) ?? undefined) : undefined
    },
    async setItem(k, v) {
      if (hasWindow) window.sessionStorage.setItem(k, v)
    },
    async removeItem(k) {
      if (hasWindow) window.sessionStorage.removeItem(k)
    },
  }
}
