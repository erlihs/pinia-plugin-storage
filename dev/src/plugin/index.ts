import type { PiniaPluginContext } from 'pinia'
import './types'
import type { Bucket, StorageOptions, Adapters } from './types'
import type { StorageAdapter } from './adapters'
import { adapters } from './adapters'

export type { Bucket, StorageOptions }

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

// Comprehensive SSR environment detection
// Ensures the plugin is safe to use in SSR frameworks like Nuxt, Next.js, SvelteKit, etc.
const isServerEnvironment = (): boolean => {
  return (
    typeof window === 'undefined' ||          // No window object (Node.js/SSR)
    typeof document === 'undefined' ||        // No document object (workers/SSR)
    typeof navigator === 'undefined' ||       // No navigator object (SSR)
    !window.localStorage ||                   // localStorage not available
    !window.sessionStorage                    // sessionStorage not available
  )
}

const debounce = <T extends unknown[]>(fn: (...args: T) => void | Promise<void>, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: T) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Simple deep equality check for primitive values and objects
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  
  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)
  
  if (aKeys.length !== bKeys.length) return false
  
  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false
    if (!deepEqual(aObj[key], bObj[key])) return false
  }
  
  return true
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

const generateStorageKey = (
  storeId: string,
  bucket: Bucket,
  globalNamespace?: string,
  globalVersion?: string,
): string => {
  // Build key components: [namespace]:[version]:[storeId]:[bucketKey]
  const parts: string[] = []
  
  // Add namespace (prevents app collisions)
  if (globalNamespace) {
    parts.push(globalNamespace)
  }
  
  // Add version (enables schema migration)
  if (globalVersion) {
    parts.push(`v${globalVersion}`)
  }
  
  // Always include store ID
  parts.push(storeId)
  
  // Add bucket key if specified (enables multi-bucket distinction)
  if (bucket.key) {
    parts.push(bucket.key)
  }
  
  // Join with colon separator, fallback to storeId for backwards compatibility
  return parts.length > 1 ? parts.join(':') : storeId
}

const resolveBuckets = (options: StorageOptions | undefined): Bucket[] => {
  const configuredDefault: Adapters | undefined =
    typeof options === 'object' && options && 'defaultAdapter' in options ? options.defaultAdapter : undefined
  const fallback: Adapters = configuredDefault || 'sessionStorage'

  if (!options) return [{ adapter: fallback } as Bucket]

  if (typeof options === 'string') {
    if (options === 'indexedDB')
      return [{ adapter: 'indexedDB', options: { dbName: 'pinia', storeName: 'keyval' } }]
    return [{ adapter: options } as Bucket]
  }

  if ('buckets' in options && Array.isArray(options.buckets)) {
    if (!options.buckets.length) return [{ adapter: fallback } as Bucket]
    return options.buckets.map((b) => {
      if (b.adapter) return b
      // If adapter missing, assign fallback assuming it is local/session/cookies/indexedDB; treat absence of options generically.
      return { adapter: fallback } as Bucket
    }) as Bucket[]
  }

  // Single bucket object form (already a Bucket due to union); just return as array
  return [options as Bucket]
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

type OnErrorFn = (error: unknown, ctx: { 
  stage: 'hydrate' | 'persist' | 'sync'; 
  storeId: string; 
  adapter: string;
  operation: 'read' | 'write' | 'parse' | 'transform' | 'channel';
  key?: string;
}) => void

interface MaybeOnError {
  onError?: OnErrorFn
}

const hasOnError = (val: unknown): val is MaybeOnError =>
  !!val && typeof val === 'object' && 'onError' in val

const resolveOnError = (storageOption: StorageOptions | undefined): OnErrorFn | undefined => {
  if (hasOnError(storageOption)) return storageOption.onError
  return undefined
}

// Simple error context builder
const createErrorContext = (
  stage: 'hydrate' | 'persist' | 'sync',
  operation: 'read' | 'write' | 'parse' | 'transform' | 'channel',
  storeId: string,
  adapter: string,
  key?: string
) => ({ stage, operation, storeId, adapter, key })

export const updateStorage = async (bucket: Bucket, store: Store, onError?: OnErrorFn) => {
  // SSR guard for external updateStorage calls
  if (isServerEnvironment()) {
    return
  }

  const storage = resolveStorage(bucket)
  const partialState = resolveState(store.$state, bucket.include, bucket.exclude)
  
  try {
    await storage.setItem(store.$id, JSON.stringify(partialState))
  } catch (error) {
    onError?.(error, createErrorContext('persist', 'write', store.$id, bucket.adapter, store.$id))
  }
}

export const createPiniaPluginStorage = ({
  options,
  store,
}: PiniaPluginContext): void => {
  // Comprehensive SSR guard: skip all persistence logic in server environments
  if (isServerEnvironment()) {
    return
  }

  if (!options.storage) return

  const buckets = resolveBuckets(options.storage)
  const bucketPlans: BucketPlan[] = buckets.map((b) => ({ bucket: b, adapter: resolveStorage(b) }))
  const onError = resolveOnError(options.storage)
  
  // Extract namespacing configuration
  const globalNamespace = typeof options.storage === 'object' && 'namespace' in options.storage ? options.storage.namespace : undefined
  const globalVersion = typeof options.storage === 'object' && 'version' in options.storage ? options.storage.version : undefined

  let skipNextPersist = false
  let isHydrating = false

  // Change detection: Track last serialized state per bucket to avoid unnecessary writes
  const bucketLastStates = new Map<BucketPlan, string>()

  // Handle async hydration without blocking plugin registration
  const performHydration = async () => {
    isHydrating = true
    const mergedState: PartialState = {}
    
    // Collect all storage operations in parallel to avoid sequential race conditions
    const storageOperations = bucketPlans.map(async (plan) => {
      try {
        // Generate namespaced storage key
        const storageKey = generateStorageKey(store.$id, plan.bucket, globalNamespace, globalVersion)
        const storageResult = await plan.adapter.getItem(storageKey)
        if (!storageResult) return null
        
        const parsed = safeParse<PartialState>(
          storageResult,
          onError
            ? (e) =>
                onError(e, createErrorContext('hydrate', 'parse', store.$id, plan.bucket.adapter, storageKey))
            : undefined,
        )
        
        if (parsed && typeof parsed === 'object') {
          return { plan, slice: parsed }
        }
        return null
      } catch (e) {
        const storageKey = generateStorageKey(store.$id, plan.bucket, globalNamespace, globalVersion)
        onError?.(e, createErrorContext('hydrate', 'read', store.$id, plan.bucket.adapter, storageKey))
        return null
      }
    })

    // Wait for all storage operations to complete
    const results = await Promise.allSettled(storageOperations)
    
    // Merge all successful results in bucket order (deterministic)
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'fulfilled' && result.value) {
        const { plan, slice } = result.value
        
        // Apply bucket-level include/exclude filtering to the slice
        const filteredSlice = resolveState(slice, plan.bucket.include, plan.bucket.exclude)
        
        // Apply beforeHydrate hook if present (per bucket for now, but on filtered slice)
        let finalSlice = filteredSlice
        if (typeof plan.bucket.beforeHydrate === 'function') {
          try {
            const transformed = plan.bucket.beforeHydrate(filteredSlice, store)
            if (transformed && typeof transformed === 'object') {
              finalSlice = transformed as PartialState
            }
          } catch (e) {
            const storageKey = generateStorageKey(store.$id, plan.bucket, globalNamespace, globalVersion)
            onError?.(e, createErrorContext('hydrate', 'transform', store.$id, plan.bucket.adapter, storageKey))
          }
        }
        
        // Merge into final state (later buckets override earlier ones for same keys)
        Object.assign(mergedState, finalSlice)
      }
    }
    
    // Single atomic patch operation with persistence suppression
    if (Object.keys(mergedState).length) {
      skipNextPersist = true
      store.$patch(mergedState)
    }
    
    // Initialize change detection state after hydration
    bucketPlans.forEach(plan => {
      const currentSlice = resolveState(store.$state, plan.bucket.include, plan.bucket.exclude)
      const serialized = JSON.stringify(currentSlice)
      bucketLastStates.set(plan, serialized)
    })
    
    isHydrating = false
  }

  // Start hydration asynchronously
  void performHydration()

  // Set up persistence logic synchronously
  const debounceDelayMs =
    typeof options.storage === 'object' && 'debounceDelayMs' in options.storage
      ? options.storage.debounceDelayMs || 0
      : 0

  const persistPlan = async (plan: BucketPlan) => {
    const partialState = resolveState(store.$state, plan.bucket.include, plan.bucket.exclude)
    const currentSerialized = JSON.stringify(partialState)
    
    // Change detection: skip persistence if state hasn't changed
    const lastSerialized = bucketLastStates.get(plan)
    if (lastSerialized === currentSerialized) {
      return // No changes detected, skip write
    }
    
    // Update tracking state before persistence attempt
    bucketLastStates.set(plan, currentSerialized)
    
    // Generate namespaced storage key
    const storageKey = generateStorageKey(store.$id, plan.bucket, globalNamespace, globalVersion)
    
    try {
      await plan.adapter.setItem(storageKey, currentSerialized)
    } catch (e) {
      // Rollback tracking state on persistence failure
      if (lastSerialized !== undefined) {
        bucketLastStates.set(plan, lastSerialized)
      } else {
        bucketLastStates.delete(plan)
      }
      onError?.(e, createErrorContext('persist', 'write', store.$id, plan.bucket.adapter, storageKey))
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

  store.$subscribe(() => {
    if (skipNextPersist) {
      skipNextPersist = false
      return
    }
    // Don't persist during hydration to avoid race conditions
    if (isHydrating) {
      return
    }
    bucketPlans.forEach((plan) => bucketExecutors.get(plan)?.(plan))
  })

  // Unified External Synchronization
  // Collect all subscription-enabled adapters and manage them centrally
  const subscribablePlans = bucketPlans.filter(plan => typeof plan.adapter.subscribe === 'function')
  
  if (subscribablePlans.length > 0) {
    // Debounce external sync to handle rapid changes from multiple sources
    const syncDebounceMs = 50 // Short delay to collect multiple rapid changes
    let syncTimeoutId: ReturnType<typeof setTimeout> | null = null
    const pendingSyncSources = new Set<string>()

    const performUnifiedSync = async () => {
      if (isHydrating) return // Don't sync during hydration
      
      const syncSources = Array.from(pendingSyncSources)
      pendingSyncSources.clear()
      
      try {
        // Collect external changes from all sources in parallel
        const externalChanges = await Promise.allSettled(
          syncSources.map(async (adapter) => {
            const plan = subscribablePlans.find(p => p.bucket.adapter === adapter)
            if (!plan) return null
            
            // Generate namespaced storage key
            const storageKey = generateStorageKey(store.$id, plan.bucket, globalNamespace, globalVersion)
            const latest = await plan.adapter.getItem(storageKey)
            if (!latest) return null
            
            const parsed = safeParse<PartialState>(latest, (e) =>
              onError?.(e, createErrorContext('sync', 'parse', store.$id, plan.bucket.adapter, storageKey))
            )
            
            if (parsed && typeof parsed === 'object') {
              // Apply bucket-level filtering to external data
              const filteredExternal = resolveState(parsed, plan.bucket.include, plan.bucket.exclude)
              return { plan, external: filteredExternal }
            }
            return null
          })
        )

        // Merge external changes with current state intelligently
        const currentState = store.$state
        const mergedChanges: PartialState = {}
        let hasChanges = false

        for (const result of externalChanges) {
          if (result.status === 'fulfilled' && result.value) {
            const { external } = result.value
            
            // Smart merge: only update keys that actually changed
            for (const [key, externalValue] of Object.entries(external)) {
              const currentValue = currentState[key]
              
              // Simple deep equality check for primitive values and objects
              if (!deepEqual(currentValue, externalValue)) {
                mergedChanges[key] = externalValue
                hasChanges = true
              }
            }
          }
        }

        // Apply unified patch if there are actual changes
        if (hasChanges) {
          skipNextPersist = true
          store.$patch(mergedChanges)
        }
      } catch (e) {
        onError?.(e, createErrorContext('sync', 'channel', store.$id, 'unified', store.$id))
      }
    }

    // Set up subscriptions for each subscribable adapter
    for (const plan of subscribablePlans) {
      // Generate namespaced storage key for subscription
      const storageKey = generateStorageKey(store.$id, plan.bucket, globalNamespace, globalVersion)
      plan.adapter.subscribe!(storageKey, () => {
        // Mark this adapter as having pending changes
        pendingSyncSources.add(plan.bucket.adapter)
        
        // Debounce to collect multiple rapid changes
        if (syncTimeoutId) {
          clearTimeout(syncTimeoutId)
        }
        syncTimeoutId = setTimeout(() => {
          void performUnifiedSync()
          syncTimeoutId = null
        }, syncDebounceMs)
      })
    }
  }
}
