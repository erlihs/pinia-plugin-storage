/**
 * State hydration operations
 */

import type { PiniaPluginContext } from 'pinia'
import type { Bucket } from '../types'
import type { StorageAdapter } from '../adapters'
import { safeParse } from '../utils/parser'
import { generateStorageKey } from '../utils/storage-key'
import { resolveState } from '../core/state-resolver'
import { createErrorContext, type OnErrorFn } from '../core/error-handling'

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

export type BucketPlan = { bucket: Bucket; adapter: StorageAdapter }

/**
 * Performs hydration of store state from storage
 * @param store - Pinia store instance
 * @param bucketPlans - Array of bucket plans to hydrate from
 * @param onError - Error handler function
 * @param globalNamespace - Optional global namespace
 * @param globalVersion - Optional global version
 * @returns Promise that resolves when hydration is complete
 */
export const performHydration = async (
  store: Store,
  bucketPlans: BucketPlan[],
  onError?: OnErrorFn,
  globalNamespace?: string,
  globalVersion?: string,
): Promise<void> => {
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
              onError(
                e,
                createErrorContext('hydrate', 'parse', store.$id, plan.bucket.adapter, storageKey),
              )
          : undefined,
      )

      if (parsed && typeof parsed === 'object') {
        return { plan, slice: parsed }
      }
      return null
    } catch (e) {
      const storageKey = generateStorageKey(store.$id, plan.bucket, globalNamespace, globalVersion)
      onError?.(
        e,
        createErrorContext('hydrate', 'read', store.$id, plan.bucket.adapter, storageKey),
      )
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
          const storageKey = generateStorageKey(
            store.$id,
            plan.bucket,
            globalNamespace,
            globalVersion,
          )
          onError?.(
            e,
            createErrorContext('hydrate', 'transform', store.$id, plan.bucket.adapter, storageKey),
          )
        }
      }

      // Merge into final state (later buckets override earlier ones for same keys)
      Object.assign(mergedState, finalSlice)
    }
  }

  // Return merged state for atomic patching
  if (Object.keys(mergedState).length) {
    store.$patch(mergedState)
  }
}
