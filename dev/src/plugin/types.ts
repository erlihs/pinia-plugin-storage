import 'pinia'
import type { UnwrapRef } from 'vue'

import type { IndexedDBOptions, CookieOptions } from './adapters'
import type { Store } from 'pinia'

type Adapters = 'cookies' | 'localStorage' | 'sessionStorage' | 'indexedDB'

type BaseBucket = {
  include?: string[] | string
  exclude?: string[] | string
  beforeHydrate?: (oldState: UnwrapRef<Store>) => void
}

export type Bucket =
  | (BaseBucket & {
      adapter?: 'cookies'
      options?: CookieOptions
      //  beforeHydrate?: (oldState: UnwrapRef<Store>) => void
    })
  | (BaseBucket & {
      adapter?: 'indexedDB'
      options?: IndexedDBOptions
      //  beforeHydrate?: (oldState: UnwrapRef<Store>) => void
    })
  | (BaseBucket & {
      adapter?: 'localStorage' | 'sessionStorage'
      // beforeHydrate?: (oldState: UnwrapRef<Store>) => void
    })

export type StorageOptions =
  | Adapters
  | Bucket
  | {
      buckets?: Bucket[]
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
