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

```typescript
export const useStore = defineStore('store', () => {
  // ... your state
}, {
  storage: 'localStorage'  // or 'sessionStorage', 'cookies', 'indexedDB'
})
```

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
  debounceDelayMs?: number    // Global debounce delay (ms)
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
  debounceDelayMs?: number   // Override global debounce
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

## ⏱️ Debounce Configuration

Control how frequently state changes are written to storage.

### Global Debounce

```typescript
storage: {
  debounceDelayMs: 300,  // Wait 300ms after last change
  buckets: [
    { adapter: 'localStorage', include: ['data1'] },
    { adapter: 'sessionStorage', include: ['data2'] }
    // Both inherit 300ms debounce
  ]
}
```

### Per-Bucket Debounce

```typescript
storage: {
  debounceDelayMs: 300,  // Global default
  buckets: [
    {
      adapter: 'localStorage',
      include: ['slowData'],
      debounceDelayMs: 1000  // Override: wait 1 second
    },
    {
      adapter: 'sessionStorage', 
      include: ['fastData'],
      debounceDelayMs: 50    // Override: wait 50ms
    }
  ]
}
```

### Adapter-Specific Defaults

If no debounce is specified, the plugin uses sensible defaults:

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

See [Migration Guide](./migration.md) for detailed migration strategies.
