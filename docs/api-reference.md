# API Reference

Complete API documentation for **pinia-plugin-storage**.

## 📦 Main Exports

### createPiniaPluginStorage

The main plugin factory function.

```typescript
function createPiniaPluginStorage(): PiniaPlugin
```

**Usage:**
```typescript
import { createPiniaPluginStorage } from 'pinia-plugin-storage'

const pinia = createPinia()
pinia.use(createPiniaPluginStorage)
```

**Returns:** A Pinia plugin that can be registered with `pinia.use()`

---

### updateStorage

Manually trigger storage update for a specific bucket.

```typescript
function updateStorage(
  bucket: Bucket, 
  store: Store, 
  onError?: OnErrorFn
): Promise<void>
```

**Parameters:**
- `bucket`: Bucket configuration to update
- `store`: Pinia store instance
- `onError`: Optional error handler

**Usage:**
```typescript
import { updateStorage } from 'pinia-plugin-storage'

// Manually save specific bucket
await updateStorage(
  { adapter: 'localStorage', include: ['importantData'] },
  myStore,
  (error, ctx) => console.warn('Save failed:', error)
)
```

---

## 🏪 Store Configuration

### storage

The storage configuration option for Pinia stores.

```typescript
interface DefineStoreOptions {
  storage?: StorageOptions
}
```

**Usage:**
```typescript
export const useStore = defineStore('store', () => {
  // ... store implementation
}, {
  storage: 'localStorage' // or more complex configuration
})
```

---

## 📋 Types & Interfaces

### StorageOptions

The main configuration type for storage.

```typescript
type StorageOptions = 
  | Adapters                    // Simple string
  | Bucket                      // Single bucket
  | GlobalStorageConfig         // Multiple buckets with global settings
```

**Examples:**
```typescript
// Simple string
storage: 'localStorage'

// Single bucket
storage: {
  adapter: 'localStorage',
  include: ['data']
}

// Global configuration
storage: {
  namespace: 'app',
  buckets: [...]
}
```

---

### Adapters

Available storage adapter types.

```typescript
type Adapters = 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB'
```

---

### Bucket

Configuration for a single storage bucket.

```typescript
interface BaseBucket {
  adapter: Adapters
  key?: string
  include?: string[] | string
  exclude?: string[] | string
  debounceDelayMs?: number
  beforeHydrate?: (slice: unknown, store: Store) => unknown | void
}

type Bucket = 
  | BaseBucket & { adapter: 'localStorage' | 'sessionStorage'; options?: never }
  | BaseBucket & { adapter: 'cookies'; options?: CookieOptions }
  | BaseBucket & { adapter: 'indexedDB'; options?: IndexedDBOptions }
```

**Properties:**
- `adapter`: Storage adapter to use
- `key`: Custom storage key (optional)
- `include`: Properties to include (mutually exclusive with exclude)
- `exclude`: Properties to exclude (mutually exclusive with include)
- `debounceDelayMs`: Debounce delay in milliseconds
- `beforeHydrate`: Transformation hook before hydration
- `options`: Adapter-specific options

---

### GlobalStorageConfig

Configuration for multiple buckets with global settings.

```typescript
interface GlobalStorageConfig {
  namespace?: string
  version?: string
  debounceDelayMs?: number
  buckets: Bucket[] | Bucket
  onError?: OnErrorFn
}
```

**Properties:**
- `namespace`: Global namespace for storage keys
- `version`: Schema version for migration
- `debounceDelayMs`: Global debounce delay
- `buckets`: Array of bucket configurations
- `onError`: Global error handler

---

### CookieOptions

Configuration options for cookie storage.

```typescript
interface CookieOptions {
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
  maxAgeSeconds?: number
  expires?: Date | string | number
  httpOnly?: boolean
  priority?: 'Low' | 'Medium' | 'High'
  partitioned?: boolean
}
```

**Properties:**
- `path`: Cookie path (default: '/')
- `domain`: Cookie domain
- `secure`: HTTPS only flag
- `sameSite`: SameSite policy
- `maxAgeSeconds`: Expiry in seconds
- `expires`: Alternative expiry as Date/string/number
- `httpOnly`: Server-only access flag
- `priority`: Cookie priority
- `partitioned`: Third-party context flag

---

### IndexedDBOptions

Configuration options for IndexedDB storage.

```typescript
interface IndexedDBOptions {
  dbName: string
  storeName: string
  dbVersion?: number
}
```

**Properties:**
- `dbName`: Database name (required)
- `storeName`: Object store name (required)
- `dbVersion`: Schema version (default: 1)

---

### ErrorContext

Context information provided to error handlers.

```typescript
interface ErrorContext {
  stage: 'hydrate' | 'persist' | 'sync'
  operation: 'read' | 'write' | 'parse' | 'transform' | 'channel'
  storeId: string
  adapter: string
  key?: string
}
```

**Properties:**
- `stage`: Operation stage where error occurred
- `operation`: Specific operation that failed
- `storeId`: ID of the store
- `adapter`: Storage adapter being used
- `key`: Storage key (if applicable)

---

### OnErrorFn

Error handler function type.

```typescript
type OnErrorFn = (error: unknown, context: ErrorContext) => void
```

**Parameters:**
- `error`: The caught error object
- `context`: Detailed context about where the error occurred

**Usage:**
```typescript
const handleError: OnErrorFn = (error, ctx) => {
  console.warn(`Storage error in ${ctx.stage}:`, error)
  
  // Send to error tracking
  errorTracker.captureException(error, { extra: ctx })
  
  // Handle specific cases
  if (ctx.adapter === 'localStorage' && ctx.operation === 'write') {
    // Handle storage quota exceeded
    clearOldData()
  }
}
```

---

## 🔧 Storage Adapters API

### StorageAdapter

Interface that all storage adapters implement.

```typescript
interface StorageAdapter {
  getItem(key: string): Promise<string | undefined>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  subscribe?(key: string, callback: () => void): () => void
}
```

**Methods:**
- `getItem`: Retrieve value by key
- `setItem`: Store value by key
- `removeItem`: Delete value by key
- `subscribe`: Subscribe to changes (optional, for cross-tab sync)

---

### Creating Custom Adapters

You can create custom storage adapters by implementing the `StorageAdapter` interface:

```typescript
import type { StorageAdapter } from 'pinia-plugin-storage'

const customAdapter = (): StorageAdapter => ({
  async getItem(key: string) {
    // Custom retrieval logic
    return customStorage.get(key)
  },
  
  async setItem(key: string, value: string) {
    // Custom storage logic
    await customStorage.set(key, value)
  },
  
  async removeItem(key: string) {
    // Custom deletion logic
    await customStorage.delete(key)
  },
  
  // Optional: for cross-tab sync
  subscribe(key: string, callback: () => void) {
    // Subscribe to changes
    const unsubscribe = customStorage.onChange(key, callback)
    return unsubscribe
  }
})

// Use custom adapter
storage: {
  adapter: customAdapter(),
  // ... other options
}
```

---

## 🛠️ Utility Functions

### safeParse

Safely parse JSON with error handling.

```typescript
function safeParse<T>(
  value: string, 
  onError?: (error: unknown) => void
): T | undefined
```

**Parameters:**
- `value`: JSON string to parse
- `onError`: Optional error handler

**Returns:** Parsed object or undefined if parsing fails

---

### generateStorageKey

Generate namespaced storage keys.

```typescript
function generateStorageKey(
  storeId: string,
  bucket: Bucket,
  globalNamespace?: string,
  globalVersion?: string
): string
```

**Parameters:**
- `storeId`: Store identifier
- `bucket`: Bucket configuration
- `globalNamespace`: Optional namespace
- `globalVersion`: Optional version

**Returns:** Generated storage key

**Examples:**
```typescript
// Basic key
generateStorageKey('userStore', { adapter: 'localStorage' })
// Result: "userStore"

// With namespace and version
generateStorageKey(
  'userStore', 
  { adapter: 'localStorage', key: 'preferences' },
  'myApp',
  '1.0'
)
// Result: "myApp:v1.0:userStore:preferences"
```

---

### isServerEnvironment

Check if running in server environment.

```typescript
function isServerEnvironment(): boolean
```

**Returns:** `true` if running on server (SSR), `false` if in browser

---

### debounce

Create a debounced function.

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

**Parameters:**
- `func`: Function to debounce
- `wait`: Delay in milliseconds

**Returns:** Debounced function

---

## 🔄 Plugin Lifecycle

Understanding the plugin's internal lifecycle:

### 1. Registration
```typescript
pinia.use(createPiniaPluginStorage)
```
- Plugin is registered with Pinia
- No storage operations occur yet

### 2. Store Creation
```typescript
const store = useMyStore()
```
- Plugin checks for `storage` configuration
- Resolves buckets and adapters
- Sets up change detection

### 3. Hydration
```typescript
// Automatic on store creation
```
- Reads data from storage adapters
- Applies `beforeHydrate` transformations
- Patches store state atomically

### 4. Persistence
```typescript
// Automatic on state changes
store.someProperty = newValue
```
- Detects state changes via `store.$subscribe`
- Applies debouncing if configured
- Writes changed data to storage

### 5. Synchronization
```typescript
// Automatic cross-tab sync
```
- Listens for storage events (localStorage, sessionStorage)
- Uses BroadcastChannel for IndexedDB
- Updates store state when external changes detected

### 6. Error Handling
```typescript
// Throughout all operations
```
- Catches and contextualizes errors
- Calls configured error handlers
- Provides graceful degradation

---

## 🎯 Advanced Usage

### Manual Storage Control

Force immediate storage update:

```typescript
import { updateStorage } from 'pinia-plugin-storage'

// Save immediately, bypassing debounce
await updateStorage(
  { adapter: 'localStorage', include: ['criticalData'] },
  store
)
```

### Dynamic Configuration

Change storage configuration at runtime:

```typescript
// Note: This requires re-creating the store
const createDynamicStore = (storageConfig: StorageOptions) => 
  defineStore('dynamic', () => {
    // ... store logic
  }, {
    storage: storageConfig
  })

// Use different storage based on user preference
const storage = userPrefs.offline ? 'indexedDB' : 'sessionStorage'
const store = createDynamicStore(storage)
```

### Conditional Persistence

Persist based on runtime conditions:

```typescript
storage: {
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Only hydrate if user is authenticated
    if (!isAuthenticated()) {
      return null // Skip hydration
    }
    return slice
  }
}
```

### Storage Cleanup

Clean up plugin resources:

```typescript
// Access cleanup function (if needed)
const cleanup = (store as any)._piniaStorageCleanup
if (cleanup) {
  cleanup() // Stop sync listeners, etc.
}
```

---

## 🐛 Debugging

### Enable Debug Logging

```typescript
storage: {
  adapter: 'localStorage',
  onError: (error, ctx) => {
    // Log all operations for debugging
    console.debug('Storage operation:', ctx, error)
  }
}
```

### Inspect Storage Data

```typescript
// Check what's actually stored
const key = 'myApp:v1.0:userStore:preferences'
const data = localStorage.getItem(key)
console.log('Stored data:', JSON.parse(data))
```

### Monitor Performance

```typescript
let writeCount = 0
storage: {
  adapter: 'localStorage',
  debounceDelayMs: 100,
  beforeHydrate: (slice, store) => {
    console.time('hydration')
    const result = slice
    console.timeEnd('hydration')
    return result
  }
}

// Track writes
store.$subscribe(() => {
  writeCount++
  console.log(`Write #${writeCount}`)
})
```
