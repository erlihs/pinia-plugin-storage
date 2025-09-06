import 'pinia'
import type { UnwrapRef } from 'vue'
import type { IndexedDBOptions, CookieOptions } from './adapters'
import type { Store } from 'pinia'

type Adapters = 'cookies' | 'localStorage' | 'sessionStorage' | 'indexedDB'

// Enforce mutual exclusivity between include and exclude
type IncludeOnly = { include: string[] | string; exclude?: never }
type ExcludeOnly = { exclude: string[] | string; include?: never }
type Neither = { include?: undefined; exclude?: undefined }
type ExclusiveIncludeExclude = IncludeOnly | ExcludeOnly | Neither

type BaseBucket = ExclusiveIncludeExclude & {
  beforeHydrate?: (oldState: UnwrapRef<Store>) => void
  debounceDelayMs?: number
}

export type Bucket =
  | (BaseBucket & {
      adapter?: 'cookies'
      options?: CookieOptions
    })
  | (BaseBucket & {
      adapter?: 'indexedDB'
      options?: IndexedDBOptions
    })
  | (BaseBucket & {
      adapter?: 'localStorage' | 'sessionStorage'
      options?: never
    })

export type StorageOptions =
  | Adapters
  | Bucket
  | {
      buckets?: Bucket[]
      debounceDelayMs?: number
      onError?: (error: unknown, ctx: { stage: 'hydrate' | 'persist'; storeId: string; adapter: string }) => void
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
