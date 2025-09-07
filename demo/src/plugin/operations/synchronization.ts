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

  // Pre-compute storage keys and group plans by key (normally 1:1 but defensive)
  const plansByStorageKey = new Map<string, BucketPlan[]>()
  const storageKeyOfPlan = new Map<BucketPlan, string>()
  for (const plan of subscribablePlans) {
    const key = generateStorageKey(store.$id, plan.bucket, globalNamespace, globalVersion)
    storageKeyOfPlan.set(plan, key)
    const arr = plansByStorageKey.get(key)
    if (arr) arr.push(plan)
    else plansByStorageKey.set(key, [plan])
  }

  // Track cleanup functions for proper disposal
  const unsubscribeFunctions: (() => void)[] = []

  // Debounce external sync to handle rapid changes from multiple sources
  const syncDebounceMs = 50 // Short delay to collect multiple rapid changes
  let syncTimeoutId: ReturnType<typeof setTimeout> | null = null
  const pendingStorageKeys = new Set<string>()

  const performUnifiedSync = async () => {
    if (getIsHydrating?.()) return // Don't sync during hydration

    const keysToSync = Array.from(pendingStorageKeys)
    pendingStorageKeys.clear()

    try {
      // Fetch and parse external data for each changed storage key concurrently
      const externalResults = await Promise.allSettled(
        keysToSync.map(async (storageKey) => {
          const plans = plansByStorageKey.get(storageKey)
          if (!plans || plans.length === 0) return []
          const primaryPlan = plans[0]
          const latest = await primaryPlan.adapter.getItem(storageKey)
          if (!latest) return []

          const parsed = safeParse<PartialState>(latest, (e) => {
            // Emit parse error for each plan sharing the key
            plans.forEach((p) =>
              onError?.(
                e,
                createErrorContext('sync', 'parse', store.$id, p.bucket.adapter, storageKey),
              ),
            )
          })

          if (!parsed || typeof parsed !== 'object') return []

          // Produce filtered slices per plan
            return plans.map((p) => ({
              plan: p,
              external: resolveState(parsed, p.bucket.include, p.bucket.exclude),
            }))
        }),
      )

      // Flatten successful results
      const flattened: { plan: BucketPlan; external: PartialState }[] = []
      for (const res of externalResults) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          for (const item of res.value) flattened.push(item)
        }
      }

      // Merge external changes intelligently
      const currentState = store.$state
      const mergedChanges: PartialState = {}
      let hasChanges = false
      for (const { external } of flattened) {
        for (const [k, v] of Object.entries(external)) {
          if (!deepEqual(currentState[k], v)) {
            mergedChanges[k] = v
            hasChanges = true
          }
        }
      }

      if (hasChanges) {
        setSkipNextPersist?.()
        store.$patch(mergedChanges)
      }
    } catch (e) {
      onError?.(e, createErrorContext('sync', 'channel', store.$id, 'unified', store.$id))
    }
  }

  // Set up subscriptions for each subscribable plan
  for (const plan of subscribablePlans) {
    const storageKey = storageKeyOfPlan.get(plan)!
    const unsubscribe = plan.adapter.subscribe!(storageKey, () => {
      pendingStorageKeys.add(storageKey)
      if (syncTimeoutId) clearTimeout(syncTimeoutId)
      syncTimeoutId = setTimeout(() => {
        void performUnifiedSync()
        syncTimeoutId = null
      }, syncDebounceMs)
    })
    unsubscribeFunctions.push(unsubscribe)
  }

  return () => {
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId)
      syncTimeoutId = null
    }
    unsubscribeFunctions.forEach((u) => u())
    unsubscribeFunctions.length = 0
    pendingStorageKeys.clear()
  }
}
