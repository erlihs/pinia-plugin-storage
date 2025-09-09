# Configuration Guide

Complete configuration reference for Pinia Plugin Storage.

## Configuration Types

### 1. Simple String Adapter
```typescript
storage: 'localStorage'
```

### 2. Single Bucket Object
```typescript
storage: {
  adapter: 'localStorage',
  include: ['user', 'settings']
}
```

### 3. Advanced Multi-Bucket Configuration
```typescript
storage: {
  namespace: 'myApp',
  version: '1.0',
  buckets: [/* multiple buckets */],
  debounceDelayMs: 300,
  onError: (error, ctx) => {}
}
```

## Core Options

### `namespace?: string`
Global namespace prefix for all storage keys. Prevents conflicts between different apps.

```typescript
storage: {
  namespace: 'myApp',
  buckets: [{ adapter: 'localStorage' }]
}
// Storage key becomes: "myApp:storeName"
```

### `version?: string` 
Schema version for data migration support.

```typescript
storage: {
  version: '2.1',
  buckets: [{ 
    adapter: 'localStorage',
    beforeHydrate: (slice) => {
      if (slice.version !== '2.1') {
        return migrateData(slice)
      }
      return slice
    }
  }]
}
```

### `buckets: Bucket[] | Bucket`
Array of storage bucket configurations or single bucket.

```typescript
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['userPreferences'],
      key: 'settings'
    },
    {
      adapter: 'sessionStorage',
      include: ['temporaryData']
    }
  ]
}
```

### Global Timing Controls

#### `debounceDelayMs?: number`
Global debounce delay. Waits for pause in activity before persisting.

```typescript
storage: {
  debounceDelayMs: 300, // Wait 300ms after last change
  buckets: [{ adapter: 'localStorage' }]
}
```

#### `throttleDelayMs?: number`
Global throttle delay. Persists at regular intervals.

```typescript
storage: {
  throttleDelayMs: 1000, // Persist max once per second
  buckets: [{ adapter: 'localStorage' }]
}
```

### `onError?: (error: unknown, ctx: ErrorContext) => void`
Global error handler for all storage operations.

```typescript
storage: {
  onError: (error, context) => {
    console.error(`Storage error in ${context.storeId}:`, error)
    
    if (context.stage === 'persist') {
      // Handle persistence failures
      fallbackPersistence(context.storeId, error)
    }
  },
  buckets: [{ adapter: 'localStorage' }]
}
```

## Bucket Configuration

### Core Bucket Properties

#### `adapter: Adapters`
Storage adapter to use for this bucket.

```typescript
{
  adapter: 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB'
}
```

#### `key?: string`
Custom storage key for this bucket. Enables multiple buckets per store.

```typescript
{
  adapter: 'localStorage',
  key: 'user-settings' // Custom key instead of store name
}
```

### State Selection

#### `include?: string[] | string`
Only persist specified state properties.

```typescript
{
  adapter: 'localStorage',
  include: ['user', 'preferences'] // Only these properties
}
```

#### `exclude?: string[] | string`
Persist all state except specified properties.

```typescript
{
  adapter: 'localStorage', 
  exclude: ['tempData', 'cache'] // Everything except these
}
```

**Note**: `include` and `exclude` are mutually exclusive.

### Data Transformation

#### `beforeHydrate?: (slice: unknown, store: Store) => unknown | void`
Transform persisted data before merging into store state.

```typescript
{
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Data migration
    if (slice.version === '1.0') {
      return {
        ...slice,
        newField: 'defaultValue',
        version: '2.0'
      }
    }
    
    // Validation
    if (!isValidData(slice)) {
      console.warn('Invalid data detected, using defaults')
      return getDefaultState()
    }
    
    return slice
  }
}
```

### Bucket-Level Timing Controls

#### `debounceDelayMs?: number`
Bucket-specific debounce delay (overrides global).

```typescript
{
  adapter: 'localStorage',
  debounceDelayMs: 500 // This bucket waits 500ms
}
```

#### `throttleDelayMs?: number`
Bucket-specific throttle delay (overrides global).

```typescript
{
  adapter: 'indexedDB',
  throttleDelayMs: 2000 // This bucket persists max every 2 seconds
}
```

**Priority**: Throttle > Debounce > Immediate

### Adapter-Specific Options

#### Cookies Options
```typescript
{
  adapter: 'cookies',
  options: {
    maxAge?: number        // Expiry in seconds
    expires?: Date         // Specific expiry date
    path?: string          // Cookie path
    domain?: string        // Cookie domain
    secure?: boolean       // HTTPS only
    httpOnly?: boolean     // Server-side only
    sameSite?: 'strict' | 'lax' | 'none'
  }
}
```

#### IndexedDB Options
```typescript
{
  adapter: 'indexedDB',
  options: {
    dbName?: string        // Database name
    storeName?: string     // Object store name
    version?: number       // Database version
  }
}
```

## Error Context

The `ErrorContext` object provides detailed error information:

```typescript
interface ErrorContext {
  stage: 'hydrate' | 'persist' | 'sync'
  storeId: string
  adapter: string
  operation: 'read' | 'write' | 'parse' | 'transform' | 'channel'
  key?: string
}
```

### Error Stages
- **hydrate**: Error during initial state loading
- **persist**: Error during state saving
- **sync**: Error during cross-tab synchronization

### Error Operations
- **read**: Reading from storage
- **write**: Writing to storage
- **parse**: JSON parsing/serialization
- **transform**: Data transformation in `beforeHydrate`
- **channel**: Cross-tab communication

## Configuration Examples

### Development vs Production
```typescript
const isDev = process.env.NODE_ENV === 'development'

storage: {
  namespace: `myApp-${process.env.NODE_ENV}`,
  adapter: isDev ? 'sessionStorage' : 'localStorage',
  debounceDelayMs: isDev ? 0 : 300 // Immediate in dev
}
```

### Multi-Tier Storage Strategy
```typescript
storage: {
  namespace: 'myApp',
  buckets: [
    {
      // Critical data - reliable storage
      adapter: 'localStorage',
      include: ['user', 'auth'],
      key: 'critical'
    },
    {
      // Session data - temporary storage
      adapter: 'sessionStorage',
      include: ['ui', 'filters'],
      key: 'session'
    },
    {
      // Large data - high capacity storage
      adapter: 'indexedDB',
      include: ['documents', 'cache'],
      key: 'bulk',
      debounceDelayMs: 1000
    }
  ]
}
```

### Progressive Enhancement
```typescript
storage: {
  buckets: [
    {
      // Baseline functionality
      adapter: 'localStorage',
      include: ['essentials']
    },
    {
      // Enhanced features if available
      adapter: 'indexedDB',
      include: ['advanced'],
      onError: (error) => {
        // Graceful degradation
        console.warn('IndexedDB unavailable, using baseline features')
      }
    }
  ]
}
```

### High-Performance Configuration
```typescript
storage: {
  throttleDelayMs: 1000, // Limit persistence frequency
  buckets: [
    {
      adapter: 'indexedDB',
      exclude: ['computed', 'derived'], // Skip unnecessary data
      beforeHydrate: (slice) => {
        // Lazy load expensive data
        return lazyHydrateData(slice)
      }
    }
  ]
}
```

## Migration Strategies

### Version-Based Migration
```typescript
storage: {
  version: '3.0',
  buckets: [{
    adapter: 'localStorage',
    beforeHydrate: (slice) => {
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

### Conditional Migration
```typescript
storage: {
  buckets: [{
    adapter: 'localStorage',
    beforeHydrate: (slice) => {
      // Check for migration needs
      if (needsMigration(slice)) {
        return performMigration(slice)
      }
      
      // Validate data integrity
      if (!isValidData(slice)) {
        return getDefaultState()
      }
      
      return slice
    }
  }]
}
```
