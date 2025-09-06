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

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    storage?: StorageOptions & {
      paths?: Array<keyof S>
      serialize?: (store: Store) => string
      deserialize?: (data: string) => Partial<S>
    }
  }

  export interface DefineSetupStoreOptions<Id, S, G, A> {
    storage?: StorageOptions & {
      paths?: Array<keyof S>
      key?: Id extends string ? Id : string
      getters?: Array<keyof G>
      actions?: Array<keyof A>
    }
  }
}

//export { cookiesStorage }
