import 'pinia'

import type { IndexedDBOptions, CookieOptions } from './adapters'

type Adapters = 'cookies' | 'localStorage' | 'sessionStorage' | 'indexedDB'

type BaseBucket = {
  include?: string[] | string
  exclude?: string[] | string
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
