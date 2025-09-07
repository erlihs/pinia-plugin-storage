/**
 * Error handling utilities
 */

import type { StorageOptions } from '../types'

/**
 * Error handler function type
 */
export type OnErrorFn = (
  error: unknown,
  ctx: {
    stage: 'hydrate' | 'persist' | 'sync'
    storeId: string
    adapter: string
    operation: 'read' | 'write' | 'parse' | 'transform' | 'channel'
    key?: string
  },
) => void

interface MaybeOnError {
  onError?: OnErrorFn
}

const hasOnError = (val: unknown): val is MaybeOnError =>
  !!val && typeof val === 'object' && 'onError' in val

/**
 * Resolves error handler from storage options
 * @param storageOption - Storage configuration
 * @returns Error handler function or undefined
 */
export const resolveOnError = (
  storageOption: StorageOptions | undefined,
): OnErrorFn | undefined => {
  if (hasOnError(storageOption)) return storageOption.onError
  return undefined
}

/**
 * Creates an error context object
 * @param stage - The stage where error occurred
 * @param operation - The operation that failed
 * @param storeId - Store identifier
 * @param adapter - Adapter name
 * @param key - Optional storage key
 * @returns Error context object
 */
export const createErrorContext = (
  stage: 'hydrate' | 'persist' | 'sync',
  operation: 'read' | 'write' | 'parse' | 'transform' | 'channel',
  storeId: string,
  adapter: string,
  key?: string,
) => ({ stage, operation, storeId, adapter, key })
