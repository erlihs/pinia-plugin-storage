import 'pinia'

import cookiesStorage from './adapters/cookies'
import type { CookieOptions } from './adapters/cookies'

export interface StorageBucket {
  key?: string
  storage?: Storage | typeof cookiesStorage
  paths?: string[]
  cookieOptions?: CookieOptions // Add cookie options support
}

export interface StorageOptions {
  buckets?: StorageBucket[]
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

export { cookiesStorage }