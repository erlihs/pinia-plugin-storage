import { localStorageAdapter } from './localStorage'
import { sessionStorageAdapter } from './sessionStorage'
import { cookiesAdapter } from './cookies'
import { indexedDBAdapter } from './indexedDB'

export type StorageAdapter = {
  getItem(key: string): Promise<string | undefined>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  subscribe?(key: string, cb: () => void): () => void
}

export type { CookieOptions } from './cookies'
export type { IndexedDBOptions } from './indexedDB'

export const adapters = {
  localStorage: localStorageAdapter,
  sessionStorage: sessionStorageAdapter,
  cookies: cookiesAdapter,
  indexedDB: indexedDBAdapter,
}
