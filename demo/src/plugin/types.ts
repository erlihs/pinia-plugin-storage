import 'pinia'
import type { IndexedDBOptions, CookieOptions } from './adapters'
import type { Store } from 'pinia'

export type Adapters = 'cookies' | 'localStorage' | 'sessionStorage' | 'indexedDB'

// Enforce mutual exclusivity between include and exclude
type IncludeOnly = { include: string[] | string; exclude?: never }
type ExcludeOnly = { exclude: string[] | string; include?: never }
type Neither = { include?: undefined; exclude?: undefined }
type ExclusiveIncludeExclude = IncludeOnly | ExcludeOnly | Neither

type BaseBucket = ExclusiveIncludeExclude & {
  // Storage key for this bucket (enables namespacing and prevents collisions)
  key?: string
  // Allows transforming the persisted slice before it's merged into the store.
  // Return value (if object) replaces the slice; otherwise in-place mutation is honored.
  beforeHydrate?: (slice: unknown, store: Store) => unknown | void
  debounceDelayMs?: number
}

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

export type StorageOptions =
  | Adapters
  | Bucket
  | {
      // Global namespace for all storage keys (prevents app collisions)
      namespace?: string
      // Schema version for data migration support
      version?: string
      buckets?: Bucket[]
      defaultAdapter?: Adapters
      debounceDelayMs?: number
      onError?: (
        error: unknown,
        ctx: {
          stage: 'hydrate' | 'persist' | 'sync'
          storeId: string
          adapter: string
          operation: 'read' | 'write' | 'parse' | 'transform' | 'channel'
          key?: string
        },
      ) => void
    }

/* eslint-disable @typescript-eslint/no-unused-vars */
declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    storage?: StorageOptions
  }
  export interface DefineSetupStoreOptions<Id, S, G, A> {
    storage?: StorageOptions
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
