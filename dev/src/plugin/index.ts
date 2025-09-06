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
  if (typeof options === 'string') {
    if (options === 'cookies') return [{ adapter: 'cookies' }]
    if (options === 'indexedDB') return [{ adapter: 'indexedDB', options: { dbName: 'pinia', storeName: 'keyval' } }]
    if (options === 'localStorage') return [{ adapter: 'localStorage' }]
    if (options === 'sessionStorage') return [{ adapter: 'sessionStorage' }]
  }

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

const safeParse = <T = unknown>(raw: string, onError?: (err: unknown) => void): T | undefined => {
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    onError?.(err)
    return undefined
  }
}

type OnErrorFn = (error: unknown, ctx: { stage: 'hydrate' | 'persist'; storeId: string; adapter: string }) => void

interface MaybeOnError {
  onError?: OnErrorFn
}

const hasOnError = (val: unknown): val is MaybeOnError =>
  !!val && typeof val === 'object' && 'onError' in val

const resolveOnError = (storageOption: StorageOptions | undefined): OnErrorFn | undefined => {
  if (hasOnError(storageOption)) return storageOption.onError
  return undefined
}

export const updateStorage = async (bucket: Bucket, store: Store) => {
  const storage = resolveStorage(bucket)
  const partialState = resolveState(store.$state, bucket.include, bucket.exclude)
  await storage.setItem(store.$id, JSON.stringify(partialState))
}

export const createPiniaPluginStorage = async ({
  options,
  store,
}: PiniaPluginContext): Promise<void> => {
  // SSR guard: skip all persistence logic when window is not available
  if (typeof window === 'undefined') return
  if (options.storage) {
    const buckets = resolveBuckets(options.storage)
    const bucketPlans: BucketPlan[] = buckets.map((b) => ({ bucket: b, adapter: resolveStorage(b) }))
  const mergedState: PartialState = {}
    const onError = resolveOnError(options.storage)
    for (const plan of bucketPlans) {
      const storageResult = await plan.adapter.getItem(store.$id)
      if (!storageResult) continue
      const parsed = safeParse<PartialState>(
        storageResult,
        onError
          ? (e) =>
              onError(e, {
                stage: 'hydrate',
                storeId: store.$id,
                adapter: plan.bucket.adapter || 'sessionStorage',
              })
          : undefined,
      )
      if (parsed && typeof parsed === 'object') Object.assign(mergedState, parsed)
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
      try {
        await plan.adapter.setItem(store.$id, JSON.stringify(partialState))
      } catch (e) {
        onError?.(e, {
          stage: 'persist',
          storeId: store.$id,
          adapter: plan.bucket.adapter || 'sessionStorage',
        })
      }
    }

    // Build per-bucket debounced functions
    const bucketExecutors = new Map<BucketPlan, (p: BucketPlan) => void>()
    for (const plan of bucketPlans) {
      const delay = plan.bucket.debounceDelayMs ?? debounceDelayMs
      const immediate = !delay || delay <= 0
      if (immediate) {
        // no debounce: call persist directly
        bucketExecutors.set(plan, () => { void persistPlan(plan) })
      } else {
        const debounced = debounce((p: BucketPlan) => { void persistPlan(p) }, delay)
        if (immediate) {
          bucketExecutors.set(plan, (() => {
            let first = true
            return (p: BucketPlan) => {
              if (first) {
                first = false
                void persistPlan(p)
              }
              debounced(p)
            }
          })())
        } else {
          bucketExecutors.set(plan, debounced)
        }
      }
    }

    let skipNextPersist = false

    store.$subscribe(() => {
      if (skipNextPersist) {
        skipNextPersist = false
        return
      }
  bucketPlans.forEach((plan) => bucketExecutors.get(plan)?.(plan))
    })

  // External subscription (cross-tab / channel updates)
    for (const plan of bucketPlans) {
  if (typeof plan.adapter.subscribe === 'function') {
        plan.adapter.subscribe(store.$id, async () => {
          try {
            const latest = await plan.adapter.getItem(store.$id)
            if (!latest) return
            const parsed = safeParse<PartialState>(latest, (e) =>
              onError?.(e, {
                stage: 'hydrate',
                storeId: store.$id,
                adapter: plan.bucket.adapter || 'sessionStorage',
              }),
            )
            if (parsed && typeof parsed === 'object') {
              skipNextPersist = true
              store.$patch(parsed)
            }
          } catch (e) {
            onError?.(e, {
              stage: 'hydrate',
              storeId: store.$id,
              adapter: plan.bucket.adapter || 'sessionStorage',
            })
          }
        })
      }
    }
  }
}
