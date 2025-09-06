import type { PiniaPluginContext } from 'pinia'
import './types'
import type { Bucket, StorageOptions } from './types'
import cookiesStorage, { createCookiesStorage } from './adapters/cookies'
import type { CookieOptions } from './adapters/cookies'

export type { Bucket, StorageOptions }
export { createCookiesStorage } from './adapters/cookies'
export type { CookieOptions } from './adapters/cookies'

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

const resolveState = (
  state: Store['$state'],
  include?: string[] | string,
  exclude?: string[] | string,
) => {
  if (include && exclude) {
    throw new Error('Cannot use both include and exclude in the same bucket')
  }

  if (include) {
    const paths = Array.isArray(include) ? include : [include]
    return paths.reduce((finalObj, key) => {
      if (key in state) {
        finalObj[key] = state[key]
      }
      return finalObj
    }, {} as PartialState)
  } else if (exclude) {
    const paths = Array.isArray(exclude) ? exclude : [exclude]
    return Object.keys(state).reduce((finalObj, key) => {
      if (!paths.includes(key)) {
        finalObj[key] = state[key]
      }
      return finalObj
    }, {} as PartialState)
  } else {
    return state
  }
}

const resolveBuckets = (options: StorageOptions | undefined): Bucket[] => {
  const defaultBucket: Bucket[] = [{ adapter: 'sessionStorage' }]

  if (!options) return defaultBucket
  if (typeof options === 'string') return [{ adapter: options }]

  if (typeof options === 'object') {
    if ('buckets' in options && Array.isArray(options.buckets)) {
      return options.buckets
    } else return [options as Bucket]
  }

  return defaultBucket
}

const resolveStorage = (bucket: Bucket): Storage => {
  const storageMap: Record<string, Storage> = {
    cookies: cookiesStorage,
    localStorage: localStorage,
    sessionStorage: sessionStorage,
  }
  let storage = storageMap[bucket.adapter || 'sessionStorage']
  if (storage === cookiesStorage) {
    storage = createCookiesStorage((bucket as Bucket & { options: CookieOptions }).options)
  }
  return storage
}

export const updateStorage = (bucket: Bucket, store: Store) => {
  const storage = resolveStorage(bucket)
  const partialState = resolveState(store.$state, bucket.include, bucket.exclude)
  storage.setItem(store.$id, JSON.stringify(partialState))
}

export const createPiniaPluginStorage = ({ options, store }: PiniaPluginContext): void => {
  if (options.storage) {
    const buckets = resolveBuckets(options.storage)

    buckets.forEach((bucket) => {
      const storage = resolveStorage(bucket)

      const storageResult = storage.getItem(store.$id)

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
