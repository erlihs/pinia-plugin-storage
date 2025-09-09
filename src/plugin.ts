/**
 * Main Pinia storage plugin implementation
 */

import type { PiniaPluginContext } from 'pinia'
import type { Bucket, ErrorContext } from './types'
import { isServerEnvironment, debounce, throttle } from './utils'
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
 * Global configuration options for the storage plugin
 */
export interface GlobalStorageOptions {
  /** Global namespace for all storage keys (prevents app collisions) */
  namespace?: string
  /** Schema version for data migration support */
  version?: string
  /**
   * Global debounce delay in milliseconds.
   * When set, waits for pause in activity before persisting.
   * @default 0 (immediate persistence)
   */
  debounceDelayMs?: number
  /**
   * Global throttle delay in milliseconds.
   * When set, persists at regular intervals regardless of activity.
   * @default 0 (no throttling)
   */
  throttleDelayMs?: number
  /** Error handler for storage operations */
  onError?: (error: unknown, ctx: ErrorContext) => void
}

/**
 * Internal plugin implementation
 * @param context - Pinia plugin context
 * @param globalOptions - Optional global configuration
 */
const piniaPluginStorageImpl = (
  { options, store }: PiniaPluginContext,
  globalOptions?: GlobalStorageOptions,
): void => {
  // Comprehensive SSR guard: skip all persistence logic in server environments
  if (isServerEnvironment()) {
    return
  }

  if (!options.storage) return

  const buckets = resolveBuckets(options.storage)
  const bucketPlans: BucketPlan[] = buckets.map((b) => ({
    bucket: b,
    adapter: resolveStorage(b, store.$id),
  }))
  const onError = resolveOnError(options.storage) || globalOptions?.onError

  // Extract namespacing configuration with global fallbacks
  const globalNamespace =
    typeof options.storage === 'object' && 'namespace' in options.storage
      ? options.storage.namespace
      : globalOptions?.namespace

  const globalVersion =
    typeof options.storage === 'object' && 'version' in options.storage
      ? options.storage.version
      : globalOptions?.version

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

  // Set up persistence logic synchronously with global fallbacks
  const globalDebounceDelayMs =
    typeof options.storage === 'object' && 'debounceDelayMs' in options.storage
      ? (options.storage.debounceDelayMs ?? 0)
      : (globalOptions?.debounceDelayMs ?? 0)

  const globalThrottleDelayMs =
    typeof options.storage === 'object' && 'throttleDelayMs' in options.storage
      ? (options.storage.throttleDelayMs ?? 0)
      : (globalOptions?.throttleDelayMs ?? 0)

  // Create a map to hold persistence functions for each bucket plan
  const persistors = new Map<BucketPlan, () => void>()

  for (const plan of bucketPlans) {
    const persistFn = () => {
      void persistPlan(plan, store, bucketLastStates, onError, globalNamespace, globalVersion)
    }

    // Determine delays for this bucket (bucket-level overrides global)
    const bucketDebounceDelay = plan.bucket.debounceDelayMs ?? globalDebounceDelayMs
    const bucketThrottleDelay = plan.bucket.throttleDelayMs ?? globalThrottleDelayMs

    // Priority: throttle > debounce > immediate
    if (bucketThrottleDelay > 0) {
      // Use throttling
      persistors.set(plan, throttle(persistFn, bucketThrottleDelay))
    } else if (bucketDebounceDelay > 0) {
      // Use debouncing
      persistors.set(plan, debounce(persistFn, bucketDebounceDelay))
    } else {
      // Immediate persistence
      persistors.set(plan, persistFn)
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
    bucketPlans.forEach((plan) => {
      persistors.get(plan)?.()
    })
  })

  // Set up unified external synchronization
  const cleanupSync = setupUnifiedSync(
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

  // Store cleanup function for proper disposal
  // Note: Pinia doesn't have a built-in disposal mechanism for plugins,
  // but we can attach the cleanup to the store instance for manual cleanup if needed
  if (store && typeof store === 'object') {
    // Use Object.defineProperty to add cleanup function without TypeScript errors
    Object.defineProperty(store, '_piniaStorageCleanup', {
      value: cleanupSync,
      enumerable: false,
      writable: true,
      configurable: true,
    })
  }
}

/**
 * Creates a Pinia plugin for storage persistence
 *
 * @overload
 * @returns Plugin function when called without arguments
 */
export function createPiniaPluginStorage(): (context: PiniaPluginContext) => void

/**
 * Creates a Pinia plugin for storage persistence with global configuration
 *
 * @overload
 * @param globalOptions Global configuration options
 * @returns Plugin function when called with global options
 */
export function createPiniaPluginStorage(
  globalOptions: GlobalStorageOptions,
): (context: PiniaPluginContext) => void

/**
 * Pinia plugin for storage persistence (direct usage for backwards compatibility)
 *
 * @overload
 * @param context Pinia plugin context
 * @returns void when used directly as plugin
 */
export function createPiniaPluginStorage(context: PiniaPluginContext): void

/**
 * Implementation of createPiniaPluginStorage with all overloads
 */
export function createPiniaPluginStorage(
  contextOrOptions?: PiniaPluginContext | GlobalStorageOptions,
): void | ((context: PiniaPluginContext) => void) {
  // If no arguments, return factory with no global options
  if (contextOrOptions === undefined) {
    return (context: PiniaPluginContext): void => {
      return piniaPluginStorageImpl(context)
    }
  }

  // Check if it's a PiniaPluginContext by checking for required properties
  if (
    contextOrOptions &&
    typeof contextOrOptions === 'object' &&
    'options' in contextOrOptions &&
    'store' in contextOrOptions &&
    contextOrOptions.store &&
    typeof contextOrOptions.store === 'object' &&
    '$id' in contextOrOptions.store
  ) {
    // Direct plugin usage: pinia.use(createPiniaPluginStorage)
    return piniaPluginStorageImpl(contextOrOptions as PiniaPluginContext)
  }

  // Otherwise, it's global options, return configured factory
  const globalOptions = contextOrOptions as GlobalStorageOptions
  return (context: PiniaPluginContext): void => {
    return piniaPluginStorageImpl(context, globalOptions)
  }
}
