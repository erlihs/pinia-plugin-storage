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
  const fallback: Adapters = 'sessionStorage'

  if (!options) return [{ adapter: fallback } as Bucket]

  if (typeof options === 'string') {
    if (options === 'indexedDB')
      return [{ adapter: 'indexedDB', options: { dbName: 'pinia', storeName: 'keyval' } }]
    return [{ adapter: options } as Bucket]
  }

  if ('buckets' in options) {
    const buckets = Array.isArray(options.buckets) ? options.buckets : [options.buckets]
    if (!buckets.length) return [{ adapter: fallback } as Bucket]
    return buckets.map((b) => {
      if (b.adapter) return b
      // If adapter missing, assign fallback (sessionStorage)
      return { adapter: fallback } as Bucket
    }) as Bucket[]
  }

  // Single bucket object form (already a Bucket due to union); just return as array
  return [options as Bucket]
}
