# Configuration Guide

Comprehensive guide to configuring **pinia-plugin-storage** for your specific needs.

## 📋 Configuration Levels

The plugin supports configuration at multiple levels:

1. **Simple String**: Quick adapter selection
2. **Single Bucket**: One adapter with options  
3. **Multiple Buckets**: Different adapters for different data
4. **Global Settings**: Shared configuration across buckets

## 🎯 Simple String Configuration

The easiest way to get started:

# Configuration

Complete guide to configuring **pinia-plugin-storage** for your needs.

## 🎯 Configuration Levels

```typescript
// 1. Simple string (quick setup)
storage: 'localStorage'

// 2. Single adapter with options
storage: {
  adapter: 'localStorage',
  debounceDelayMs: 300,
  exclude: ['temporaryData']
}

// 3. Multiple adapters (advanced)
storage: {
  buckets: [
    { adapter: 'localStorage', include: ['settings'] },
    { adapter: 'sessionStorage', include: ['tempData'] }
  ]
}
```

## 📦 Storage Adapters

Choose the right adapter for your data:

| Adapter | Persistence | Capacity | Cross-Tab Sync | Use Case |
|---------|-------------|----------|----------------|----------|
| `localStorage` | Until cleared | ~5-10MB | ✅ | User preferences, app state |
| `sessionStorage` | Until tab closed | ~5-10MB | ✅ | Session data, temp state |
| `cookies` | Configurable | ~4KB | ❌ | Auth tokens, small data |
| `indexedDB` | Until cleared | ~50MB+ | ✅ | Large datasets, complex objects |

### Quick Adapter Selection

```typescript
// Long-term app state
storage: 'localStorage'

// Session-only data  
storage: 'sessionStorage'

// Server-accessible data
storage: {
  adapter: 'cookies',
  options: {
    maxAgeSeconds: 3600,
    secure: true,
    sameSite: 'Strict'
  }
}

// Large datasets
storage: {
  adapter: 'indexedDB', 
  options: {
    dbName: 'MyApp',
    storeName: 'userData'
  }
}
```

## 🎛️ Selective Persistence

Control which state properties are persisted:

```typescript
export const useStore = defineStore('store', () => {
  const userProfile = ref({})    // ✅ Persist
  const userSettings = ref({})   // ✅ Persist  
  const temporaryData = ref({})  // ❌ Don't persist
  const computedCache = ref({})  // ❌ Don't persist
  
  return { userProfile, userSettings, temporaryData, computedCache }
}, {
  storage: {
    adapter: 'localStorage',
    // Option 1: Include only what you want
    include: ['userProfile', 'userSettings']
    
    // Option 2: Exclude what you don't want
    // exclude: ['temporaryData', 'computedCache']
  }
})
```

## ⚡ Performance Configuration

### Debouncing (Wait for pause)

Perfect for user input and settings:

```typescript
storage: {
  adapter: 'localStorage',
  debounceDelayMs: 300,  // Wait 300ms after last change
}

// Use cases:
// - Form inputs: 200-500ms
// - User settings: 300-1000ms
// - Search queries: 100-300ms
```

### Throttling (Regular intervals)

Ideal for high-frequency updates:

```typescript
storage: {
  adapter: 'sessionStorage',
  throttleDelayMs: 100,  // Save every 100ms maximum
}

// Use cases:
// - Game state (60fps): 50-100ms
// - Real-time data: 100-500ms
// - Animation state: 50-200ms
```

### Performance Tips

```typescript
// ✅ Good: Efficient configuration
storage: {
  adapter: 'localStorage',
  debounceDelayMs: 300,
  exclude: [
    'computedValues',    // Don't persist computed properties
    'temporaryFlags',    // Skip temporary state
    'largeArrays'       // Consider indexedDB for large data
  ]
}

// ❌ Avoid: Too frequent saves
storage: {
  debounceDelayMs: 0,  // Saves on every change (slow!)
}
```

## 📂 Multiple Storage Adapters

Use different storage for different data types:

```typescript
export const useAppStore = defineStore('app', () => {
  const authToken = ref('')      // → cookies (server access)
  const userSettings = ref({})   // → localStorage (persistent)
  const searchState = ref({})    // → sessionStorage (temporary)
  const documents = ref([])      // → indexedDB (large data)
  
  return { authToken, userSettings, searchState, documents }
}, {
  storage: {
    namespace: 'myApp',
    version: '1.0',
    buckets: [
      {
        adapter: 'cookies',
        include: ['authToken'],
        options: {
          maxAgeSeconds: 3600,
          secure: true,
          sameSite: 'Strict'
        }
      },
      {
        adapter: 'localStorage',
        include: ['userSettings'],
        debounceDelayMs: 500
      },
      {
        adapter: 'sessionStorage',
        include: ['searchState'],
        debounceDelayMs: 200
      },
      {
        adapter: 'indexedDB',
        include: ['documents'],
        debounceDelayMs: 1000,
        options: {
          dbName: 'MyApp',
          storeName: 'userDocs'
        }
      }
    ]
  }
})
```

## 🔄 Data Transformation

Transform data before it's loaded into your store:

```typescript
storage: {
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Validate data structure
    if (!slice || typeof slice !== 'object') {
      return null  // Use default state
    }
    
    // Migrate old data
    if (slice.version === '1.0') {
      return {
        ...slice,
        newField: 'defaultValue',
        version: '2.0'
      }
    }
    
    // Clean up data
    if (slice.user) {
      delete slice.user.password  // Remove sensitive data
    }
    
    return slice
  }
}
```

## 🏷️ Namespacing & Versioning

Prevent conflicts and enable migrations:

```typescript
storage: {
  namespace: 'myApp',     // Prevents conflicts between apps
  version: '2.1',         // Enables data migration
  adapter: 'localStorage'
}

// Storage key becomes: "myApp:v2.1:storeId"
```

## 🛡️ Error Handling

Handle storage errors gracefully:

```typescript
storage: {
  adapter: 'localStorage',
  onError: (error, context) => {
    console.warn('Storage error:', error.message)
    
    // Handle specific errors
    if (error.name === 'QuotaExceededError') {
      // Storage full - clear old data
      clearOldData()
      showNotification('Storage full, cleared old data')
    }
    
    // Send to error tracking
    errorTracker.captureException(error, {
      extra: context
    })
  }
}
```

## 🎨 Adapter-Specific Options

### Cookies

```typescript
storage: {
  adapter: 'cookies',
  options: {
    path: '/',
    domain: '.example.com',
    secure: true,
    sameSite: 'Strict',
    maxAgeSeconds: 7 * 24 * 3600,  // 7 days
    httpOnly: false,
    priority: 'High'
  }
}
```

### IndexedDB

```typescript
storage: {
  adapter: 'indexedDB',
  options: {
    dbName: 'MyApplication',
    storeName: 'userData',
    dbVersion: 1
  }
}
```

## 🔧 Advanced Patterns

### Environment-Based Configuration

```typescript
const createStorageConfig = (env: string) => ({
  namespace: env === 'production' ? 'myapp' : `myapp-${env}`,
  debounceDelayMs: env === 'development' ? 0 : 300,
  onError: (error, ctx) => {
    if (env === 'development') {
      console.warn('Storage error:', error, ctx)
    } else {
      errorTracker.captureException(error, { extra: ctx })
    }
  }
})

// Use in stores
storage: {
  ...createStorageConfig(process.env.NODE_ENV),
  adapter: 'localStorage'
}
```

### Conditional Storage

```typescript
storage: {
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Only hydrate if user is authenticated
    if (!isUserAuthenticated()) {
      return null
    }
    return slice
  }
}
```

### Custom Storage Keys

```typescript
storage: {
  adapter: 'localStorage',
  key: 'user-preferences',  // Custom key instead of store ID
}
// Results in: "namespace:version:storeId:user-preferences"
```

## 📋 Configuration Reference

### Complete Options

```typescript
interface StorageConfig {
  // Simple adapter
  adapter?: 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB'
  
  // Property selection (mutually exclusive)
  include?: string[] | string
  exclude?: string[] | string
  
  // Performance
  debounceDelayMs?: number
  throttleDelayMs?: number
  
  // Customization
  key?: string
  namespace?: string
  version?: string
  
  // Hooks
  beforeHydrate?: (slice: any, store: any) => any
  onError?: (error: any, context: any) => void
  
  // Adapter options
  options?: CookieOptions | IndexedDBOptions
  
  // Multiple adapters
  buckets?: Bucket[]
}
```

## 🚀 Next Steps

- **[Storage Adapters](./adapters.md)** - Deep dive into each adapter
- **[Examples](./examples.md)** - Real-world configuration patterns
- **[API Reference](./api.md)** - Complete API documentation
- **[Troubleshooting](./troubleshooting.md)** - Common configuration issues

## 🔧 Single Bucket Configuration

More control with a single storage adapter:

```typescript
export const useStore = defineStore('store', () => {
  const data = ref({})
  return { data }
}, {
  storage: {
    adapter: 'localStorage',
    include: ['data'],           // Only persist 'data' property
    debounceDelayMs: 300,       // Wait 300ms before saving
    key: 'custom-key',          // Custom storage key
    beforeHydrate: (slice, store) => {
      // Transform data before loading into store
      return slice
    }
  }
})
```

## 📦 Multiple Buckets Configuration

Use different storage adapters for different parts of your state:

```typescript
export const useAdvancedStore = defineStore('advanced', () => {
  const userPrefs = ref({})     // → localStorage
  const sessionData = ref({})   // → sessionStorage  
  const authToken = ref('')     // → cookies
  const largeData = ref([])     // → indexedDB
  
  return { userPrefs, sessionData, authToken, largeData }
}, {
  storage: {
    namespace: 'myApp',
    version: '1.0',
    debounceDelayMs: 200,      // Global default
    buckets: [
      {
        adapter: 'localStorage',
        include: ['userPrefs'],
        key: 'preferences',
        debounceDelayMs: 500   // Override global setting
      },
      {
        adapter: 'sessionStorage',
        include: ['sessionData'],
        key: 'session'
      },
      {
        adapter: 'cookies',
        include: ['authToken'],
        key: 'auth',
        options: {
          maxAgeSeconds: 3600,
          secure: true,
          sameSite: 'Strict'
        }
      },
      {
        adapter: 'indexedDB',
        include: ['largeData'],
        key: 'data',
        options: {
          dbName: 'MyApp',
          storeName: 'userData'
        }
      }
    ],
    onError: (error, ctx) => {
      console.warn(`Storage error:`, error, ctx)
    }
  }
})
```

## 🎚️ Configuration Options Reference

### Global Configuration

```typescript
interface GlobalStorageConfig {
  namespace?: string           // Global namespace for all keys
  version?: string            // Schema version for migration
  debounceDelayMs?: number    // Global debounce delay (ms, default: 0)
  throttleDelayMs?: number    // Global throttle delay (ms, default: 0)
  buckets: Bucket[]           // Array of bucket configurations
  onError?: OnErrorFn         // Global error handler
}
```

### Bucket Configuration

```typescript
interface BaseBucket {
  adapter: 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB'
  key?: string                // Custom storage key
  include?: string[] | string // Properties to include
  exclude?: string[] | string // Properties to exclude (mutually exclusive with include)
  debounceDelayMs?: number   // Debounce delay (ms, default: 0)
  throttleDelayMs?: number   // Throttle delay (ms, default: 0)
  beforeHydrate?: (slice: unknown, store: Store) => unknown | void
  options?: AdapterOptions   // Adapter-specific options
}
```

## 🎯 Selective Persistence

Control exactly which state properties are persisted.

### Include Specific Properties

```typescript
export const useStore = defineStore('store', () => {
  const persistThis = ref('save me')
  const dontPersistThis = ref('temporary')
  const alsoSaveThis = ref('important')
  
  return { persistThis, dontPersistThis, alsoSaveThis }
}, {
  storage: {
    adapter: 'localStorage',
    include: ['persistThis', 'alsoSaveThis']
  }
})
```

### Exclude Specific Properties

```typescript
export const useStore = defineStore('store', () => {
  const saveThis = ref('persistent')
  const dontSaveThis = ref('temporary')
  const alsoSaveThis = ref('important')
  
  return { saveThis, dontSaveThis, alsoSaveThis }
}, {
  storage: {
    adapter: 'localStorage',
    exclude: ['dontSaveThis']  // Everything else is saved
  }
})
```

### Nested Property Selection

For complex state structures:

```typescript
export const useStore = defineStore('store', () => {
  const user = ref({
    id: 1,
    name: 'John',
    email: 'john@example.com',
    temporaryFlag: false
  })
  
  const settings = ref({
    theme: 'dark',
    notifications: true
  })
  
  return { user, settings }
}, {
  storage: {
    adapter: 'localStorage',
    include: ['user', 'settings'],
    beforeHydrate: (slice, store) => {
      // Remove temporary properties during hydration
      if (slice.user) {
        delete slice.user.temporaryFlag
      }
      return slice
    }
  }
})
```

## ⏱️ Persistence Configuration

Control how frequently state changes are written to storage using debouncing or throttling.

### Configuration Overview

| Configuration | Behavior | Priority | Default |
|---------------|----------|----------|---------|
| `throttleDelayMs` | Persist at regular intervals | **High** | `0` (disabled) |
| `debounceDelayMs` | Wait for pause in activity | Medium | `0` (disabled) |
| *(none)* | Immediate persistence | Low | ✅ Active |

**Priority Rule**: When both delays are specified, throttling takes priority over debouncing.

### Immediate Persistence (Default)

```typescript
storage: {
  buckets: [
    { adapter: 'localStorage', include: ['data1'] },
    { adapter: 'sessionStorage', include: ['data2'] }
    // Both use immediate persistence (no delays specified)
  ]
}
```

### Global Configuration

```typescript
storage: {
  throttleDelayMs: 300,      // Apply to all buckets unless overridden
  buckets: [
    { adapter: 'localStorage', include: ['data1'] },
    { adapter: 'sessionStorage', include: ['data2'] }
    // Both inherit 300ms throttling
  ]
}
```

### Per-Bucket Configuration

```typescript
storage: {
  debounceDelayMs: 300,      // Global default
  buckets: [
    {
      adapter: 'localStorage',
      include: ['settings'],
      // Uses global debounce (300ms)
    },
    {
      adapter: 'sessionStorage',
      include: ['gameState'],
      throttleDelayMs: 100     // Override: use throttling instead
    }
  ]
}
```

## ⏱️ Debounce Configuration

Debouncing waits for a pause in activity before persisting state.

### When to Use Debouncing

- ✅ Form inputs and user settings
- ✅ Search queries
- ✅ Any input that has natural pauses

### Global Debouncing

```typescript
storage: {
  debounceDelayMs: 300,      // Wait 300ms after last change
  buckets: [
    { adapter: 'localStorage', include: ['settings'] },
    { adapter: 'sessionStorage', include: ['preferences'] }
  ]
}
```

### Per-Bucket Debouncing

```typescript
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['slowData'],
      debounceDelayMs: 1000    // Wait 1 second after changes
    },
    {
      adapter: 'sessionStorage', 
      include: ['fastData'],
      debounceDelayMs: 50      // Wait 50ms after changes
    }
  ]
}
```

## ⚡ Throttle Configuration

Throttling ensures persistence happens at regular intervals, perfect for high-frequency updates.

### When to Use Throttling

**Problem**: Continuous state changes (60fps animations, real-time data) will prevent debouncing from ever persisting because there's never a pause.

**Solution**: Throttling guarantees persistence at regular intervals regardless of update frequency.

### Use Cases for Throttling

#### Animation/Game State
```typescript
// Game running at 60fps - debouncing would never persist!
const useGameStore = defineStore('game', {
  state: () => ({ playerPosition: { x: 0, y: 0 } }),
  storage: {
    adapter: 'sessionStorage',
    throttleDelayMs: 100,     // Persist every 100ms during gameplay
  }
})
```

#### Real-time Data
```typescript
// WebSocket data updates
const useDataStore = defineStore('data', {
  state: () => ({ prices: {} }),
  storage: {
    adapter: 'indexedDB',
    throttleDelayMs: 1000,    // Persist every second
  }
})
```

### Global Throttling

```typescript
storage: {
  throttleDelayMs: 200,      // Persist every 200ms maximum
  buckets: [
    { adapter: 'sessionStorage', include: ['gameState'] },
    { adapter: 'localStorage', include: ['progress'] }
  ]
}
```

### Mixed Strategies

```typescript
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['userSettings'],
      debounceDelayMs: 500,    // Wait for user to stop changing settings
    },
    {
      adapter: 'sessionStorage',
      include: ['gameState'],
      throttleDelayMs: 100,    // Persist game state every 100ms
    },
    {
      adapter: 'localStorage',
      include: ['cache'],
      // No delays = immediate persistence
    }
  ]
}
```

## ⚙️ Advanced Configuration

### Priority When Both Delays Are Set

```typescript
storage: {
  adapter: 'localStorage',
  debounceDelayMs: 500,      // This will be ignored
  throttleDelayMs: 200,      // This takes priority
}
// Result: Uses throttling every 200ms
```

### Bucket Overrides Global

```typescript
storage: {
  throttleDelayMs: 300,      // Global default
  buckets: [
    {
      adapter: 'localStorage',
      include: ['data1'],
      // Inherits global throttling (300ms)
    },
    {
      adapter: 'sessionStorage', 
      include: ['data2'],
      debounceDelayMs: 100,    // Override: use debouncing instead
    }
  ]
}
```

- **localStorage**: 100ms
- **sessionStorage**: 0ms (immediate)
- **cookies**: 0ms (immediate)
- **indexedDB**: 250ms

### Disable Debouncing

```typescript
storage: {
  adapter: 'localStorage',
  debounceDelayMs: 0  // Write immediately on every change
}
```

## 🏷️ Namespacing & Versioning

Prevent storage key collisions and enable data migration.

### Namespacing

Prevent conflicts between multiple apps on the same domain:

```typescript
storage: {
  namespace: 'myApp',
  buckets: [
    {
      adapter: 'localStorage',
      key: 'userdata'
    }
  ]
}
// Results in storage key: "myApp:storeId:userdata"
```

### Versioning

Enable schema migration across app versions:

```typescript
storage: {
  namespace: 'myApp',
  version: '2.1',
  buckets: [
    {
      adapter: 'localStorage',
      key: 'userdata',
      beforeHydrate: (slice, store) => {
        // Migrate old data format
        if (!slice.version || slice.version < '2.0') {
          return migrateFromV1(slice)
        }
        return slice
      }
    }
  ]
}
// Results in storage key: "myApp:v2.1:storeId:userdata"
```

## 🔄 State Transformation

Transform data before it's loaded into your store.

### Data Migration

```typescript
storage: {
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Migrate old data structure
    if (slice.version === 1) {
      return {
        ...slice,
        newProperty: 'default',
        version: 2
      }
    }
    return slice
  }
}
```

### Data Sanitization

```typescript
storage: {
  adapter: 'localStorage', 
  beforeHydrate: (slice, store) => {
    // Clean up data before hydration
    if (slice.user) {
      // Remove sensitive data that shouldn't be persisted
      delete slice.user.password
      delete slice.user.sessionToken
      
      // Validate data structure
      if (!slice.user.id) {
        return null // Skip hydration if data is invalid
      }
    }
    return slice
  }
}
```

### Data Enrichment

```typescript
storage: {
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Add computed or derived properties
    if (slice.userData) {
      slice.userData.lastHydrated = new Date().toISOString()
    }
    return slice
  }
}
```

## 🔑 Custom Storage Keys

Customize how storage keys are generated.

### Simple Custom Key

```typescript
storage: {
  adapter: 'localStorage',
  key: 'myCustomKey'
}
// Storage key: "storeId:myCustomKey" (or with namespace/version)
```

### Multi-Bucket Keys

```typescript
storage: {
  namespace: 'app',
  version: '1.0',
  buckets: [
    {
      adapter: 'localStorage',
      key: 'user-preferences',
      include: ['theme', 'language']
    },
    {
      adapter: 'sessionStorage',
      key: 'session-data', 
      include: ['currentPage', 'formData']
    }
  ]
}
// Results in keys:
// - "app:v1.0:storeId:user-preferences"
// - "app:v1.0:storeId:session-data"
```

## 🎨 Adapter-Specific Options

### localStorage & sessionStorage

These adapters don't require additional options:

```typescript
storage: {
  adapter: 'localStorage'
  // No additional options needed
}
```

### Cookies Options

```typescript
storage: {
  adapter: 'cookies',
  options: {
    path: '/',                    // Cookie path
    domain: '.example.com',       // Cookie domain  
    secure: true,                 // HTTPS only
    sameSite: 'Strict',          // CSRF protection
    maxAgeSeconds: 7 * 24 * 3600, // 7 days
    expires: new Date('2024-12-31'), // Alternative to maxAgeSeconds
    httpOnly: false,             // Client-side access
    priority: 'High'             // Cookie priority
  }
}
```

### IndexedDB Options

```typescript
storage: {
  adapter: 'indexedDB',
  options: {
    dbName: 'MyApplication',     // Database name
    storeName: 'userdata',       // Object store name
    dbVersion: 1                 // Schema version
  }
}
```

## 🛡️ Error Handling Configuration

Configure how storage errors are handled.

### Global Error Handler

```typescript
storage: {
  buckets: [...],
  onError: (error, context) => {
    // Log to external service
    errorTracker.captureException(error, {
      extra: context
    })
    
    // Show user notification for critical errors
    if (context.stage === 'hydrate') {
      showNotification('Failed to load saved data')
    }
  }
}
```

### Context Information

The error handler receives detailed context:

```typescript
interface ErrorContext {
  stage: 'hydrate' | 'persist' | 'sync'
  operation: 'read' | 'write' | 'parse' | 'transform' | 'channel'
  storeId: string
  adapter: string
  key?: string
}
```

### Error Recovery Strategies

```typescript
onError: (error, ctx) => {
  switch (ctx.adapter) {
    case 'localStorage':
      if (ctx.operation === 'write') {
        // Storage full - clear old data
        clearOldStorageData()
        // Retry the operation
        retryOperation(ctx)
      }
      break
      
    case 'indexedDB':
      if (ctx.operation === 'read') {
        // Database corruption - reset
        resetDatabase(ctx)
      }
      break
      
    case 'cookies':
      if (ctx.operation === 'write') {
        // Cookie too large - compress data
        compressAndRetry(ctx)
      }
      break
  }
}
```

## 🚀 Performance Configuration

Optimize for your specific use case.

### High-Frequency Updates

For rapidly changing state:

```typescript
storage: {
  adapter: 'localStorage',
  debounceDelayMs: 1000,  // Batch rapid changes
  include: ['frequentlyChangingData']
}
```

### Large Data Sets

For complex or large data:

```typescript
storage: {
  adapter: 'indexedDB',
  options: {
    dbName: 'LargeDataApp',
    storeName: 'documents'
  },
  debounceDelayMs: 500,  // Less frequent writes
  beforeHydrate: (slice, store) => {
    // Lazy load or paginate large datasets
    return lazyLoadData(slice)
  }
}
```

### Memory-Sensitive Applications

Minimize memory usage:

```typescript
storage: {
  adapter: 'localStorage',
  exclude: ['largeTemporaryData', 'computedValues'],
  debounceDelayMs: 200
}
```

## 📊 Migration Strategies

Handle data migration across app versions.

### Version-Based Migration

```typescript
storage: {
  namespace: 'myApp',
  version: '3.0',
  buckets: [{
    adapter: 'localStorage',
    beforeHydrate: (slice, store) => {
      const dataVersion = slice.version || '1.0'
      
      if (dataVersion === '1.0') {
        slice = migrateV1ToV2(slice)
        slice = migrateV2ToV3(slice)
      } else if (dataVersion === '2.0') {
        slice = migrateV2ToV3(slice)
      }
      
      slice.version = '3.0'
      return slice
    }
  }]
}
```

### Progressive Migration

```typescript
storage: {
  beforeHydrate: async (slice, store) => {
    // Async migration for complex transformations
    if (needsMigration(slice)) {
      slice = await performAsyncMigration(slice)
    }
    return slice
  }
}
```

See [Migration Strategies](#migration-strategies) for detailed approaches.
