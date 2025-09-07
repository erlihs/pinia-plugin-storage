import './types'
import type { Bucket, StorageOptions } from './types'

export type { Bucket, StorageOptions }

// Re-export main plugin functions
export { createPiniaPluginStorage, updateStorage } from './plugin'
