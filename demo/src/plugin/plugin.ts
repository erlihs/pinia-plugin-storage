/**
 * Main Pinia storage plugin implementation
 */

import type { PiniaPluginContext } from 'pinia'
import type { Bucket } from './types'
import { isServerEnvironment, debounce } from './utils'
import {
  resolveBuckets,
  resolveStorage,
  resolveOnError,
  resolveState,
  type OnErrorFn,
} from './core'
import {
  performHydration,
  persistPlan,
  initializeChangeDetection,
  setupUnifiedSync,
  type BucketPlan,
} from './operations'

type Store = PiniaPluginContext['store']

/**
 * Updates storage for a specific bucket (external API)
 * @param bucket - Bucket configuration
 * @param store - Pinia store instance
 * @param onError - Optional error handler
 */
export const updateStorage = async (bucket: Bucket, store: Store, onError?: OnErrorFn) => {
  // SSR guard for external updateStorage calls
  if (isServerEnvironment()) {
    return
  }

  const storage = resolveStorage(bucket, store.$id)
  const partialState = resolveState(store.$state, bucket.include, bucket.exclude)

  try {
    await storage.setItem(store.$id, JSON.stringify(partialState))
  } catch (error) {
    onError?.(error, {
      stage: 'persist',
      operation: 'write',
      storeId: store.$id,
      adapter: bucket.adapter,
      key: store.$id,
    })
  }
}

/**
 * Main Pinia plugin for storage persistence
 * @param context - Pinia plugin context
 */
export const createPiniaPluginStorage = ({ options, store }: PiniaPluginContext): void => {
  // Comprehensive SSR guard: skip all persistence logic in server environments
  if (isServerEnvironment()) {
    return
  }

  if (!options.storage) return

  const buckets = resolveBuckets(options.storage)
  const bucketPlans: BucketPlan[] = buckets.map((b) => ({ bucket: b, adapter: resolveStorage(b, store.$id) }))
  const onError = resolveOnError(options.storage)

  // Extract namespacing configuration
  const globalNamespace =
    typeof options.storage === 'object' && 'namespace' in options.storage
      ? options.storage.namespace
      : undefined
  const globalVersion =
    typeof options.storage === 'object' && 'version' in options.storage
      ? options.storage.version
      : undefined

  let skipNextPersist = false
  let isHydrating = false

  // Change detection: Track last serialized state per bucket to avoid unnecessary writes
  const bucketLastStates = new Map<BucketPlan, string>()

  // Handle async hydration without blocking plugin registration
  const performHydrationAsync = async () => {
    isHydrating = true

    try {
      // Single atomic patch operation with persistence suppression
      skipNextPersist = true
      await performHydration(store, bucketPlans, onError, globalNamespace, globalVersion)

      // Initialize change detection state after hydration
      initializeChangeDetection(bucketPlans, store, bucketLastStates)
    } finally {
      isHydrating = false
    }
  }

  // Start hydration asynchronously
  void performHydrationAsync()

  // Set up persistence logic synchronously
  const debounceDelayMs =
    typeof options.storage === 'object' && 'debounceDelayMs' in options.storage
      ? options.storage.debounceDelayMs || 0
      : 0

  // Build per-bucket debounced functions
  const bucketExecutors = new Map<BucketPlan, (p: BucketPlan) => void>()
  for (const plan of bucketPlans) {
    // Get adapter-specific default delay if no bucket-specific or global delay is set
    const getAdapterDefaultDelay = (adapter: string): number => {
      switch (adapter) {
        case 'cookies':
        case 'sessionStorage':
          return 0
        case 'localStorage':
          return 100
        case 'indexedDB':
          return 250
        default:
          return 0
      }
    }
    
    const delay = plan.bucket.debounceDelayMs ?? debounceDelayMs ?? getAdapterDefaultDelay(plan.bucket.adapter)
    const immediate = !delay || delay <= 0
    if (immediate) {
      // no debounce: call persist directly
      bucketExecutors.set(plan, () => {
        void persistPlan(plan, store, bucketLastStates, onError, globalNamespace, globalVersion)
      })
    } else {
      const debounced = debounce((p: BucketPlan) => {
        void persistPlan(p, store, bucketLastStates, onError, globalNamespace, globalVersion)
      }, delay)
      bucketExecutors.set(plan, debounced)
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

  // Set up unified external synchronization
  setupUnifiedSync(
    store,
    bucketPlans,
    onError,
    globalNamespace,
    globalVersion,
    () => {
      skipNextPersist = true
    },
    () => isHydrating,
  )
}
