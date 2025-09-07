/**
 * Storage adapter resolution utilities
 */

import type { Bucket } from '../types'
import type { StorageAdapter } from '../adapters'
import { adapters } from '../adapters'

/**
 * Resolves a bucket configuration to its storage adapter
 * @param bucket - Bucket configuration
 * @returns Storage adapter instance
 */
export const resolveStorage = (bucket: Bucket): StorageAdapter => {
  if (bucket.adapter === 'cookies') return adapters[bucket.adapter](bucket.options)
  if (bucket.adapter === 'indexedDB')
    return adapters[bucket.adapter](bucket.options || { dbName: 'pinia', storeName: 'keyval' })
  if (bucket.adapter === 'localStorage' || bucket.adapter === 'sessionStorage')
    return adapters[bucket.adapter]()
  return adapters['sessionStorage']()
}
