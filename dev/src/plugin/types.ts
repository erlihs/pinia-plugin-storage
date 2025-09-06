import 'pinia'

//import cookiesStorage from './adapters/cookies'
import type { CookieOptions } from './adapters/cookies'

type Adapters = 'cookies' | 'localStorage' | 'sessionStorage'

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
