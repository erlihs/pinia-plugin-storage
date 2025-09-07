import type { StorageAdapter } from './index'

export type IndexedDBOptions = { dbName: string; storeName: string; dbVersion?: number }

function openIDB({ dbName, storeName, dbVersion = 1 }: IndexedDBOptions): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // SSR/environment guards
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined' || !indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'))
      return
    }

    const req = indexedDB.open(dbName, dbVersion)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbTx<T>(
  dbp: Promise<IDBDatabase>,
  storeName: string,
  mode: IDBTransactionMode,
  work: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await dbp
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(storeName, mode)
    const s = t.objectStore(storeName)
    const r = work(s)
    r.onsuccess = () => resolve(r.result as T)
    r.onerror = () => reject(r.error)
  })
}

export const indexedDBAdapter = (options: IndexedDBOptions): StorageAdapter => {
  // Early SSR guard - return no-op adapter if not in browser
  if (
    typeof window === 'undefined' ||
    typeof indexedDB === 'undefined' ||
    typeof BroadcastChannel === 'undefined'
  ) {
    return {
      async getItem() {
        return undefined
      },
      async setItem() {
        /* no-op */
      },
      async removeItem() {
        /* no-op */
      },
      subscribe() {
        return () => {}
      },
    }
  }

  const dbp = openIDB(options)
  const channel =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(`pinia-persist:${options.dbName}:${options.storeName}`)
      : null

  return {
    async getItem(k) {
      try {
        return (
          (await idbTx<string | undefined>(dbp, options.storeName, 'readonly', (s) => s.get(k))) ??
          undefined
        )
      } catch (error) {
        // Log error for debugging but return undefined to allow graceful degradation
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(`IndexedDB getItem failed for key "${k}":`, error)
        }
        return undefined
      }
    },
    async setItem(k, v) {
      try {
        await idbTx<void>(dbp, options.storeName, 'readwrite', (s) => s.put(v, k))
        channel?.postMessage({ key: k })
      } catch (error) {
        // Log error for debugging but don't throw to allow graceful degradation
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(`IndexedDB setItem failed for key "${k}":`, error)
        }
        // Re-throw to allow upper layers to handle with onError callback
        throw error
      }
    },
    async removeItem(k) {
      try {
        await idbTx<void>(dbp, options.storeName, 'readwrite', (s) => s.delete(k))
        channel?.postMessage({ key: k })
      } catch (error) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(`IndexedDB removeItem failed for key "${k}":`, error)
        }
        throw error
      }
    },
    subscribe(key, cb) {
      if (!channel) return () => {}
      const on = (e: MessageEvent) => {
        if ((e.data as { key: string })?.key === key) cb()
      }
      channel.addEventListener('message', on)
      return () => channel.removeEventListener('message', on)
    },
  }
}
