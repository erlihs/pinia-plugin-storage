import 'pinia'
import type { IndexedDBOptions, CookieOptions } from './adapters'
import type { Store } from 'pinia'

/**
 * Available storage adapters for the plugin
 */
export type Adapters = 'cookies' | 'localStorage' | 'sessionStorage' | 'indexedDB'

/**
 * Error context information provided to error handlers
 */
export interface ErrorContext {
  /** The stage where the error occurred */
  stage: 'hydrate' | 'persist' | 'sync'
  /** ID of the store where the error occurred */
  storeId: string
  /** The adapter being used */
  adapter: string
  /** The operation that failed */
  operation: 'read' | 'write' | 'parse' | 'transform' | 'channel'
  /** Storage key (if applicable) */
  key?: string
}

// Enforce mutual exclusivity between include and exclude
type IncludeOnly = { 
  include: string[] | string
  exclude?: never 
}
type ExcludeOnly = { 
  exclude: string[] | string
  include?: never 
}
type Neither = { 
  include?: undefined
  exclude?: undefined 
}
type ExclusiveIncludeExclude = IncludeOnly | ExcludeOnly | Neither

/**
 * Base configuration for storage buckets
 */
type BaseBucket = ExclusiveIncludeExclude & {
  /** Storage key for this bucket (enables namespacing and prevents collisions) */
  key?: string
  /** 
   * Allows transforming the persisted slice before it's merged into the store.
   * Return value (if object) replaces the slice; otherwise in-place mutation is honored.
   */
  beforeHydrate?: (slice: unknown, store: Store) => unknown | void
  /** Debounce delay in milliseconds for persistence operations */
  debounceDelayMs?: number
}

/**
 * Storage bucket configuration with adapter-specific options
 */
export type Bucket =
  | (BaseBucket & {
      adapter: 'cookies'
      options?: CookieOptions
    })
  | (BaseBucket & {
      adapter: 'indexedDB'
      options?: IndexedDBOptions
    })
  | (BaseBucket & {
      adapter: 'localStorage' | 'sessionStorage'
      options?: never
    })

/**
 * Configuration options for the storage plugin
 */
export type StorageOptions =
  | Adapters
  | Bucket
  | {
      /** Global namespace for all storage keys (prevents app collisions) */
      namespace?: string
      /** Schema version for data migration support */
      version?: string
      /** Array of storage buckets with different configurations */
      buckets: Bucket[] | Bucket
      /** Global debounce delay in milliseconds */
      debounceDelayMs?: number
      /** Error handler for storage operations */
      onError?: (error: unknown, ctx: ErrorContext) => void
    }

// Module augmentation for Pinia store options
declare module 'pinia' {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export interface DefineStoreOptionsBase<S, Store> {
    storage?: StorageOptions
  }
  export interface DefineSetupStoreOptions<Id, S, G, A> {
    storage?: StorageOptions
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
