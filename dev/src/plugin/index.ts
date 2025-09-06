import type { PiniaPluginContext } from 'pinia'
import './types'
import type { Bucket, StorageOptions } from './types'
import type { StorageAdapter } from './adapters'
import { adapters } from './adapters'

export type { Bucket, StorageOptions }

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

const debounce = <T extends unknown[]>(fn: (...args: T) => void | Promise<void>, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: T) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

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

const resolveStorage = (bucket: Bucket): StorageAdapter => {
  if (bucket.adapter === 'cookies') return adapters[bucket.adapter](bucket.options)
  if (bucket.adapter === 'indexedDB')
    return adapters[bucket.adapter](bucket.options || { dbName: 'pinia', storeName: 'keyval' })
  if (bucket.adapter === 'localStorage' || bucket.adapter === 'sessionStorage')
    return adapters[bucket.adapter]()
  return adapters['sessionStorage']()
}

type BucketPlan = { bucket: Bucket; adapter: StorageAdapter }

export const updateStorage = async (bucket: Bucket, store: Store) => {
  const storage = resolveStorage(bucket)
  const partialState = resolveState(store.$state, bucket.include, bucket.exclude)
  await storage.setItem(store.$id, JSON.stringify(partialState))
}

export const createPiniaPluginStorage = async ({
  options,
  store,
}: PiniaPluginContext): Promise<void> => {
  if (options.storage) {
    const buckets = resolveBuckets(options.storage)
    const bucketPlans: BucketPlan[] = buckets.map((b) => ({ bucket: b, adapter: resolveStorage(b) }))
  const mergedState: PartialState = {}
    for (const plan of bucketPlans) {
      try {
        const storageResult = await plan.adapter.getItem(store.$id)
        if (!storageResult) continue
        const parsed = JSON.parse(storageResult)
        if (parsed && typeof parsed === 'object') Object.assign(mergedState, parsed)
      } catch {
      }
    }
    if (Object.keys(mergedState).length) {
      if (
        typeof options.storage === 'object' &&
        'beforeHydrate' in options.storage &&
        typeof options.storage.beforeHydrate === 'function'
      ) {
        options.storage.beforeHydrate(store)
      }
      store.$patch(mergedState)
    }

    const debounceDelayMs =
      typeof options.storage === 'object' && 'debounceDelayMs' in options.storage
        ? options.storage.debounceDelayMs || 0
        : 0

  const persistPlan = async (plan: BucketPlan) => {
      const partialState = resolveState(store.$state, plan.bucket.include, plan.bucket.exclude)
      await plan.adapter.setItem(store.$id, JSON.stringify(partialState))
    }

    const debouncedUpdateStorage =
      debounceDelayMs > 0
        ? debounce(persistPlan, debounceDelayMs)
        : persistPlan

    store.$subscribe(() => {
      bucketPlans.forEach(debouncedUpdateStorage)
    })
  }
}
