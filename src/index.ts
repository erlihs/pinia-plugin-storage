import './types'
import type { Bucket, StorageOptions } from './types'

export type { Bucket, StorageOptions }

// Re-export main plugin functions
export { createPiniaPluginStorage, updateStorage } from './plugin'

// Plugin version for development tracking
export const PLUGIN_VERSION = '0.1.0-dev'
