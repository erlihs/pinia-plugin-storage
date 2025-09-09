# Pinia Plugin Storage

A powerful Pinia plugin that automatically persists your store state to various storage adapters with advanced features like selective persistence, bucket system, and cross-tab synchronization.

## Features

- 🚀 **Multiple Storage Adapters**: localStorage, sessionStorage, cookies, IndexedDB
- 🎯 **Selective Persistence**: Include/exclude specific state properties
- 🪣 **Bucket System**: Multiple storage configurations per store
- 🔄 **Cross-tab Sync**: Real-time synchronization across browser tabs
- ⚡ **Performance Optimized**: Debouncing, throttling, and change detection
- 🛡️ **Error Handling**: Robust error recovery and custom error handlers
- 🌐 **SSR Compatible**: Safe server-side rendering support
- 📦 **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
npm install pinia-plugin-storage
```

## Basic Usage

```typescript
import { createPinia } from 'pinia'
import { createPiniaPluginStorage } from 'pinia-plugin-storage'

const pinia = createPinia()
pinia.use(createPiniaPluginStorage())

// Define a store with storage
export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    preferences: {},
    sessionData: {}
  }),
  storage: 'localStorage' // Simple adapter
})
```

## Configuration

### Simple Configuration

```typescript
// String adapter
storage: 'localStorage'

// Single bucket
storage: {
  adapter: 'localStorage',
  include: ['name', 'preferences'] // Only persist these
}
```

### Advanced Configuration

```typescript
storage: {
  namespace: 'myApp',           // Global namespace
  version: '1.0',              // Schema version
  debounceDelayMs: 300,        // Global debounce
  buckets: [
    {
      adapter: 'localStorage',
      include: ['user', 'settings'],
      key: 'core-data'
    },
    {
      adapter: 'sessionStorage', 
      include: ['sessionData'],
      throttleDelayMs: 1000
    },
    {
      adapter: 'indexedDB',
      include: ['largeData'],
      options: {
        dbName: 'MyApp',
        storeName: 'documents'
      }
    }
  ],
  onError: (error, ctx) => {
    console.error('Storage error:', error, ctx)
  }
}
```

## Storage Adapters

### localStorage / sessionStorage
Standard web storage APIs.

```typescript
storage: {
  adapter: 'localStorage' // or 'sessionStorage'
}
```

### Cookies
Server-compatible storage with HTTP cookie support.

```typescript
storage: {
  adapter: 'cookies',
  options: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: true,
    sameSite: 'strict'
  }
}
```

### IndexedDB
High-capacity client-side database.

```typescript
storage: {
  adapter: 'indexedDB',
  options: {
    dbName: 'MyAppDB',
    storeName: 'stores',
    version: 1
  }
}
```

## Selective Persistence

Control which parts of your state get persisted:

```typescript
storage: {
  adapter: 'localStorage',
  include: ['user', 'settings'],    // Only these
  // OR
  exclude: ['tempData', 'cache']    // Everything except these
}
```

## Data Transformation

Transform data during hydration:

```typescript
storage: {
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Migrate old data format
    if (slice.version === '1.0') {
      return {
        ...slice,
        newField: 'defaultValue',
        version: '2.0'
      }
    }
    return slice
  }
}
```

## Performance Controls

### Debouncing
Wait for pause in activity before persisting:

```typescript
storage: {
  adapter: 'localStorage',
  debounceDelayMs: 300 // Wait 300ms after last change
}
```

### Throttling
Persist at regular intervals:

```typescript
storage: {
  adapter: 'localStorage', 
  throttleDelayMs: 1000 // Persist max once per second
}
```

## Cross-tab Synchronization

Automatic synchronization across browser tabs using storage events (localStorage/sessionStorage) and BroadcastChannel API (IndexedDB).

## Error Handling

```typescript
storage: {
  adapter: 'localStorage',
  onError: (error, context) => {
    console.error(`Storage error in ${context.stage}:`, error)
    
    // Context provides:
    // - stage: 'hydrate' | 'persist' | 'sync'
    // - storeId: string
    // - adapter: string
    // - operation: 'read' | 'write' | 'parse' | 'transform' | 'channel'
    // - key?: string
  }
}
```

## Programmatic Updates

Update storage outside of store mutations:

```typescript
import { updateStorage } from 'pinia-plugin-storage'

const bucket = { adapter: 'localStorage' }
const store = useUserStore()

await updateStorage(bucket, store)
```

## Common Patterns

### Multi-environment Setup
```typescript
storage: {
  adapter: process.env.NODE_ENV === 'development' ? 'sessionStorage' : 'localStorage',
  namespace: `myApp-${process.env.NODE_ENV}`
}
```

### Large Data Optimization
```typescript
storage: {
  adapter: 'indexedDB',
  debounceDelayMs: 500,
  beforeHydrate: (slice) => {
    // Lazy load large datasets
    return lazyLoadData(slice)
  }
}
```

### Progressive Enhancement
```typescript
storage: {
  buckets: [
    { adapter: 'localStorage', include: ['essentialData'] },
    { adapter: 'indexedDB', include: ['largeData'], key: 'extended' }
  ]
}
```

## API Reference

### Types

```typescript
type Adapters = 'cookies' | 'localStorage' | 'sessionStorage' | 'indexedDB'

interface Bucket {
  adapter: Adapters
  key?: string
  include?: string[] | string
  exclude?: string[] | string
  beforeHydrate?: (slice: unknown, store: Store) => unknown | void
  debounceDelayMs?: number
  throttleDelayMs?: number
  options?: CookieOptions | IndexedDBOptions
}

interface StorageOptions {
  namespace?: string
  version?: string
  buckets: Bucket[] | Bucket
  debounceDelayMs?: number
  throttleDelayMs?: number
  onError?: (error: unknown, ctx: ErrorContext) => void
}
```

### Functions

```typescript
// Main plugin
createPiniaPluginStorage(): PiniaPlugin

// Programmatic update
updateStorage(bucket: Bucket, store: Store, onError?: OnErrorFn): Promise<void>
```

## Troubleshooting

### Common Issues

**State not persisting**
- Check adapter compatibility (cookies have size limits)
- Verify include/exclude configuration
- Check for serialization errors in onError handler

**Cross-tab sync not working**
- localStorage/sessionStorage: Only works in same origin
- IndexedDB: Requires BroadcastChannel API support
- Cookies: No automatic sync (server-side only)

**Performance issues**
- Use debouncing for frequent updates
- Use throttling for high-frequency apps
- Consider IndexedDB for large datasets
- Exclude computed/temporary data

**SSR hydration mismatches**
- Plugin automatically skips SSR environments
- Use beforeHydrate for data migration
- Consider version-based migration strategies

### Browser Support

- **localStorage/sessionStorage**: All modern browsers
- **cookies**: Universal (including SSR)
- **IndexedDB**: IE10+, all modern browsers
- **Cross-tab sync**: Modern browsers with BroadcastChannel/StorageEvent

## License

MIT License - see [LICENSE](../LICENCE) file for details.
