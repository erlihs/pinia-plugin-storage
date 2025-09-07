/**
 * Bucket resolution utilities
 */

import type { StorageOptions, Bucket, Adapters } from '../types'

/**
 * Resolves storage options into an array of buckets
 * @param options - Storage configuration options
 * @returns Array of bucket configurations
 */
export const resolveBuckets = (options: StorageOptions | undefined): Bucket[] => {
  const configuredDefault: Adapters | undefined =
    typeof options === 'object' && options && 'defaultAdapter' in options
      ? options.defaultAdapter
      : undefined
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
