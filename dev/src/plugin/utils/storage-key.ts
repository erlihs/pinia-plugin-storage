/**
 * Storage key generation utilities
 */

import type { Bucket } from '../types'

/**
 * Generates a namespaced storage key
 * @param storeId - The store identifier
 * @param bucket - The bucket configuration
 * @param globalNamespace - Optional global namespace
 * @param globalVersion - Optional global version
 * @returns Generated storage key
 */
export const generateStorageKey = (
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
