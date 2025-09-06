import type { PiniaPluginContext } from 'pinia'
import './types'
import type { StorageBucket, StorageOptions } from './types'
import { createCookiesStorage } from './adapters/cookies'

export type { StorageBucket, StorageOptions }
export { createCookiesStorage } from './adapters/cookies'
export type { CookieOptions } from './adapters/cookies'

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

export const updateStorage = (strategy: StorageBucket, store: Store) => {
  // Handle cookie storage with options
  let storage = strategy.storage || sessionStorage
  
  // If using cookies and cookieOptions are provided, create a configured storage
  if (strategy.cookieOptions && 
      (storage === window.sessionStorage || storage === window.localStorage || 
       typeof storage === 'object' && 'setItem' in storage)) {
    // Only apply cookie options if we're likely dealing with cookies
    // You might want to add a more specific check here
    storage = createCookiesStorage(strategy.cookieOptions)
  }
  
  const storeKey = strategy.key || store.$id

  if (strategy.paths) {
    const partialState = strategy.paths.reduce((finalObj, key) => {
      finalObj[key] = store.$state[key]
      return finalObj
    }, {} as PartialState)

    storage.setItem(storeKey, JSON.stringify(partialState))
  } else {
    storage.setItem(storeKey, JSON.stringify(store.$state))
  }
}

export const createPiniaPluginStorage = ({ options, store }: PiniaPluginContext): void => {
  if (options.storage) {
    const defaultStrat: StorageBucket[] = [
      {
        key: store.$id,
        storage: sessionStorage,
      },
    ]

    const buckets = options.storage?.buckets?.length
      ? options.storage?.buckets
      : defaultStrat

    buckets.forEach((bucket) => {
      // Handle cookie storage with options
      let storage = bucket.storage || sessionStorage

      // If using cookies and cookieOptions are provided, create a configured storage
      if (bucket.cookieOptions &&
          (storage === window.sessionStorage || storage === window.localStorage || 
           typeof storage === 'object' && 'setItem' in storage)) {
        storage = createCookiesStorage(bucket.cookieOptions)
      }

      const storeKey = bucket.key || store.$id
      const storageResult = storage.getItem(storeKey)

      if (storageResult) {
        store.$patch(JSON.parse(storageResult))
        updateStorage(bucket, store)
      }
    })

    store.$subscribe(() => {
      buckets.forEach((bucket) => {
        updateStorage(bucket, store)
      })
    })
  }
}
