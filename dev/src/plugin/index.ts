import type { PiniaPluginContext } from 'pinia'
import './types'
import type { StorageStrategy, StorageOptions } from './types'

export type { StorageStrategy, StorageOptions }

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

export const updateStorage = (strategy: StorageStrategy, store: Store) => {
  const storage = strategy.storage || sessionStorage
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
  if (options.storage?.enabled) {
    const defaultStrat: StorageStrategy[] = [
      {
        key: store.$id,
        storage: sessionStorage,
      },
    ]

    const strategies = options.storage?.strategies?.length
      ? options.storage?.strategies
      : defaultStrat

    strategies.forEach((strategy) => {
      const storage = strategy.storage || sessionStorage
      const storeKey = strategy.key || store.$id
      const storageResult = storage.getItem(storeKey)

      if (storageResult) {
        store.$patch(JSON.parse(storageResult))
        updateStorage(strategy, store)
      }
    })

    store.$subscribe(() => {
      strategies.forEach((strategy) => {
        updateStorage(strategy, store)
      })
    })
  }
}
