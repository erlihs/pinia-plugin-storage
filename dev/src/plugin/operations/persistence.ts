/**
 * State persistence operations
 */

import type { PiniaPluginContext } from 'pinia'
import { generateStorageKey } from '../utils/storage-key'
import { resolveState } from '../core/state-resolver'
import { createErrorContext, type OnErrorFn } from '../core/error-handling'
import type { BucketPlan } from './hydration'

type Store = PiniaPluginContext['store']

/**
 * Persists a bucket plan to storage
 * @param plan - Bucket plan to persist
 * @param store - Pinia store instance
 * @param bucketLastStates - Map to track last serialized states
 * @param onError - Error handler function
 * @param globalNamespace - Optional global namespace
 * @param globalVersion - Optional global version
 */
export const persistPlan = async (
  plan: BucketPlan,
  store: Store,
  bucketLastStates: Map<BucketPlan, string>,
  onError?: OnErrorFn,
  globalNamespace?: string,
  globalVersion?: string,
): Promise<void> => {
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

/**
 * Initialize change detection state after hydration
 * @param bucketPlans - Array of bucket plans
 * @param store - Pinia store instance
 * @param bucketLastStates - Map to track last serialized states
 */
export const initializeChangeDetection = (
  bucketPlans: BucketPlan[],
  store: Store,
  bucketLastStates: Map<BucketPlan, string>,
): void => {
  bucketPlans.forEach((plan) => {
    const currentSlice = resolveState(store.$state, plan.bucket.include, plan.bucket.exclude)
    const serialized = JSON.stringify(currentSlice)
    bucketLastStates.set(plan, serialized)
  })
}
