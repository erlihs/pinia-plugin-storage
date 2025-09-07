/**
 * External synchronization operations
 */

import type { PiniaPluginContext } from 'pinia'
import { safeParse } from '../utils/parser'
import { deepEqual } from '../utils/equality'
import { generateStorageKey } from '../utils/storage-key'
import { resolveState } from '../core/state-resolver'
import { createErrorContext, type OnErrorFn } from '../core/error-handling'
import type { BucketPlan } from './hydration'

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

/**
 * Sets up unified external synchronization for subscribable adapters
 * @param store - Pinia store instance
 * @param bucketPlans - Array of bucket plans
 * @param onError - Error handler function
 * @param globalNamespace - Optional global namespace
 * @param globalVersion - Optional global version
 * @param setSkipNextPersist - Function to set skipNextPersist flag
 * @param getIsHydrating - Function to get hydration state
 * @returns Cleanup function to remove all subscriptions and clear timers
 */
export const setupUnifiedSync = (
  store: Store,
  bucketPlans: BucketPlan[],
  onError?: OnErrorFn,
  globalNamespace?: string,
  globalVersion?: string,
  setSkipNextPersist?: () => void,
  getIsHydrating?: () => boolean,
): (() => void) => {
  // Collect all subscription-enabled adapters and manage them centrally
  const subscribablePlans = bucketPlans.filter(
    (plan) => typeof plan.adapter.subscribe === 'function',
  )

  if (subscribablePlans.length === 0) return () => {} // Return no-op cleanup function

  // Track cleanup functions for proper disposal
  const unsubscribeFunctions: (() => void)[] = []

  // Debounce external sync to handle rapid changes from multiple sources
  const syncDebounceMs = 50 // Short delay to collect multiple rapid changes
  let syncTimeoutId: ReturnType<typeof setTimeout> | null = null
  const pendingSyncSources = new Set<string>()

  const performUnifiedSync = async () => {
    if (getIsHydrating?.()) return // Don't sync during hydration

    const syncSources = Array.from(pendingSyncSources)
    pendingSyncSources.clear()

    try {
      // Collect external changes from all sources in parallel
      const externalChanges = await Promise.allSettled(
        syncSources.map(async (adapter) => {
          const plan = subscribablePlans.find((p) => p.bucket.adapter === adapter)
          if (!plan) return null

          // Generate namespaced storage key
          const storageKey = generateStorageKey(
            store.$id,
            plan.bucket,
            globalNamespace,
            globalVersion,
          )
          const latest = await plan.adapter.getItem(storageKey)
          if (!latest) return null

          const parsed = safeParse<PartialState>(latest, (e) =>
            onError?.(
              e,
              createErrorContext('sync', 'parse', store.$id, plan.bucket.adapter, storageKey),
            ),
          )

          if (parsed && typeof parsed === 'object') {
            // Apply bucket-level filtering to external data
            const filteredExternal = resolveState(parsed, plan.bucket.include, plan.bucket.exclude)
            return { plan, external: filteredExternal }
          }
          return null
        }),
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
        setSkipNextPersist?.()
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
    const unsubscribe = plan.adapter.subscribe!(storageKey, () => {
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
    
    // Track unsubscribe function for cleanup
    unsubscribeFunctions.push(unsubscribe)
  }

  // Return cleanup function
  return () => {
    // Clear any pending timeout
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId)
      syncTimeoutId = null
    }
    
    // Unsubscribe from all adapters
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    unsubscribeFunctions.length = 0
    
    // Clear pending sources
    pendingSyncSources.clear()
  }
}
