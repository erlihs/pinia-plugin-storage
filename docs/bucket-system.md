# Bucket System

The **bucket system** is the core architecture of pinia-plugin-storage that allows you to use multiple storage adapters for different parts of your state, each with its own configuration.

## 🎯 What are Buckets?

A bucket is a configuration unit that defines:
- **Which storage adapter** to use (localStorage, sessionStorage, cookies, indexedDB)
- **Which state properties** to include or exclude
- **How to transform data** before hydration
- **Adapter-specific options** (like cookie settings or IndexedDB configuration)
- **Performance settings** (debounce delays)

Think of buckets as different "containers" for your data, each optimized for a specific purpose.

## 📦 Single vs Multiple Buckets

### Single Bucket (Simple)

When you specify a single adapter, the plugin creates one bucket internally:

```typescript
export const useStore = defineStore('store', () => {
  const user = ref({})
  const settings = ref({})
  return { user, settings }
}, {
  storage: 'localStorage'  // Single bucket for all state
})
```

This creates one bucket that:
- Uses localStorage adapter
- Includes all state properties
- Uses default settings

### Multiple Buckets (Advanced)

Multiple buckets let you optimize different data types:

```typescript
export const useStore = defineStore('store', () => {
  const authToken = ref('')        // → cookies (server access)
  const userPrefs = ref({})        // → localStorage (persistent)
  const sessionData = ref({})      // → sessionStorage (temporary)
  const largeDataset = ref([])     // → indexedDB (capacity)
  
  return { authToken, userPrefs, sessionData, largeDataset }
}, {
  storage: {
    buckets: [
      {
        adapter: 'cookies',
        include: ['authToken'],
        options: { maxAgeSeconds: 3600 }
      },
      {
        adapter: 'localStorage',
        include: ['userPrefs']
      },
      {
        adapter: 'sessionStorage',
        include: ['sessionData']
      },
      {
        adapter: 'indexedDB',
        include: ['largeDataset'],
        options: { dbName: 'MyApp', storeName: 'data' }
      }
    ]
  }
})
```

## 🎛️ Bucket Configuration

### Basic Bucket Properties

```typescript
interface Bucket {
  adapter: 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB'
  key?: string                    // Custom storage key
  include?: string[] | string     // Properties to include
  exclude?: string[] | string     // Properties to exclude
  debounceDelayMs?: number       // Debounce delay
  beforeHydrate?: Function       // Transformation hook
  options?: AdapterOptions       // Adapter-specific options
}
```

### Property Selection

Control exactly which state properties each bucket handles:

```typescript
// Include specific properties
{
  adapter: 'localStorage',
  include: ['user', 'settings', 'preferences']
}

// Exclude specific properties  
{
  adapter: 'sessionStorage',
  exclude: ['temporaryFlag', 'computed']
}

// Include single property (string form)
{
  adapter: 'cookies',
  include: 'authToken'
}

// All properties (default when neither include nor exclude specified)
{
  adapter: 'localStorage'
  // Includes everything
}
```

**Important**: `include` and `exclude` are mutually exclusive - you can use one or the other, but not both in the same bucket.

### Custom Storage Keys

Customize how data is stored with custom keys:

```typescript
{
  adapter: 'localStorage',
  key: 'user-preferences',      // Custom key
  include: ['theme', 'language']
}
// Results in storage key: "storeId:user-preferences"

// With global namespace/version:
// "myApp:v1.0:storeId:user-preferences"
```

## 🔄 Data Flow in Bucket System

### Hydration (Loading Data)

When your store initializes, the plugin:

1. **Processes buckets in order** you defined them
2. **Loads data** from each bucket's storage adapter
3. **Applies filtering** based on include/exclude rules
4. **Runs transformation hooks** (beforeHydrate)
5. **Merges all data** into a single state object
6. **Patches the store** atomically

```typescript
// Bucket processing order matters!
buckets: [
  {
    adapter: 'localStorage',
    include: ['user'],
    beforeHydrate: (slice) => {
      return { user: { ...slice.user, source: 'localStorage' } }
    }
  },
  {
    adapter: 'sessionStorage', 
    include: ['user'],  // This will override the localStorage user data!
    beforeHydrate: (slice) => {
      return { user: { ...slice.user, source: 'sessionStorage' } }
    }
  }
]
```

### Persistence (Saving Data)

When your state changes, the plugin:

1. **Detects which buckets** are affected by the change
2. **Applies filtering** to get the relevant state slice for each bucket
3. **Applies debouncing** per bucket configuration
4. **Saves to storage** for each affected bucket in parallel

```typescript
// When user.name changes:
store.user.name = 'John'

// Plugin processes all buckets that include 'user':
// - localStorage bucket saves filtered user data
// - sessionStorage bucket saves filtered user data  
// - Other buckets are unaffected
```

## 🎯 Bucket Strategies

### Data Type Strategy

Organize buckets by data characteristics:

```typescript
storage: {
  buckets: [
    // Authentication data - cookies for server access
    {
      adapter: 'cookies',
      include: ['authToken', 'refreshToken'],
      key: 'auth',
      options: {
        secure: true,
        sameSite: 'Strict',
        maxAgeSeconds: 3600
      }
    },
    
    // User preferences - localStorage for persistence
    {
      adapter: 'localStorage', 
      include: ['theme', 'language', 'notifications'],
      key: 'preferences'
    },
    
    // Session state - sessionStorage for temporary data
    {
      adapter: 'sessionStorage',
      include: ['currentPage', 'searchQuery', 'filters'],
      key: 'session'
    },
    
    // Large datasets - indexedDB for capacity
    {
      adapter: 'indexedDB',
      include: ['documents', 'cache', 'history'],
      key: 'data',
      options: {
        dbName: 'MyApp',
        storeName: 'documents'
      }
    }
  ]
}
```

### Performance Strategy

Organize buckets by update frequency:

```typescript
storage: {
  buckets: [
    // Frequently changing data - short debounce
    {
      adapter: 'sessionStorage',
      include: ['currentInput', 'liveSearchResults'],
      debounceDelayMs: 50
    },
    
    // Moderately changing data - medium debounce
    {
      adapter: 'localStorage',
      include: ['userPreferences', 'appSettings'],
      debounceDelayMs: 300
    },
    
    // Rarely changing data - long debounce
    {
      adapter: 'indexedDB',
      include: ['userProfile', 'savedDocuments'],
      debounceDelayMs: 2000,
      options: { dbName: 'MyApp', storeName: 'profile' }
    }
  ]
}
```

### Security Strategy

Organize buckets by data sensitivity:

```typescript
storage: {
  buckets: [
    // Sensitive data - secure cookies only
    {
      adapter: 'cookies',
      include: ['authToken'],
      key: 'secure',
      options: {
        secure: true,
        httpOnly: false,  // Need client access
        sameSite: 'Strict',
        maxAgeSeconds: 1800  // 30 minutes
      }
    },
    
    // Personal but non-sensitive - localStorage
    {
      adapter: 'localStorage',
      include: ['userPreferences', 'appSettings'],
      key: 'personal'
    },
    
    // Public/cached data - any storage
    {
      adapter: 'indexedDB',
      include: ['publicContent', 'cache'],
      key: 'public',
      options: { dbName: 'Cache', storeName: 'public' }
    }
  ]
}
```

## 🔧 Advanced Bucket Patterns

### Fallback Chain

Create a fallback chain across buckets:

```typescript
let primaryFailed = false

storage: {
  buckets: [
    // Primary storage
    {
      adapter: 'indexedDB',
      include: ['importantData'],
      key: 'primary',
      options: { dbName: 'Primary', storeName: 'data' },
      beforeHydrate: (slice) => {
        if (slice && Object.keys(slice).length > 0) {
          primaryFailed = false
          return slice
        }
        primaryFailed = true
        return null  // Skip if no data
      }
    },
    
    // Fallback storage
    {
      adapter: 'localStorage',
      include: ['importantData'],
      key: 'fallback',
      beforeHydrate: (slice) => {
        // Only use fallback if primary failed
        if (primaryFailed && slice) {
          console.log('Using fallback storage')
          return slice
        }
        return null
      }
    }
  ],
  
  onError: (error, ctx) => {
    if (ctx.key === 'primary') {
      // Primary failed, ensure fallback is updated
      updateFallbackStorage()
    }
  }
}
```

### Versioned Data Migration

Handle data migration across buckets:

```typescript
storage: {
  version: '2.0',
  buckets: [
    {
      adapter: 'localStorage',
      include: ['userData'],
      beforeHydrate: (slice, store) => {
        // Check data version
        const dataVersion = slice.version || '1.0'
        
        if (dataVersion === '1.0') {
          // Migrate from v1.0 to v2.0
          return {
            userData: {
              ...slice.userData,
              newField: 'defaultValue',
              renamedField: slice.userData.oldField,
              version: '2.0'
            }
          }
        }
        
        return slice
      }
    }
  ]
}
```

### Conditional Buckets

Enable/disable buckets based on runtime conditions:

```typescript
// Function to create dynamic bucket configuration
function createStorageConfig(userRole: string, hasFeatureFlag: boolean) {
  const buckets = [
    // Base bucket for all users
    {
      adapter: 'localStorage',
      include: ['basicData'],
      key: 'basic'
    }
  ]
  
  // Admin-only bucket
  if (userRole === 'admin') {
    buckets.push({
      adapter: 'indexedDB',
      include: ['adminData'],
      key: 'admin',
      options: { dbName: 'AdminApp', storeName: 'admin' }
    })
  }
  
  // Feature flag bucket
  if (hasFeatureFlag) {
    buckets.push({
      adapter: 'sessionStorage',
      include: ['experimentalData'],
      key: 'experiment'
    })
  }
  
  return { buckets }
}

export const useStore = defineStore('store', () => {
  // ... store logic
}, {
  storage: createStorageConfig(getCurrentUserRole(), getFeatureFlag('newFeature'))
})
```

## 📊 Bucket Performance Considerations

### Memory Usage

Each bucket maintains its own change detection state:

```typescript
// Efficient: Few buckets with logical grouping
buckets: [
  { adapter: 'localStorage', include: ['group1', 'group2', 'group3'] },
  { adapter: 'sessionStorage', include: ['temp1', 'temp2'] }
]

// Less efficient: Many small buckets
buckets: [
  { adapter: 'localStorage', include: ['item1'] },
  { adapter: 'localStorage', include: ['item2'] },
  { adapter: 'localStorage', include: ['item3'] },
  // ... many more single-property buckets
]
```

### Storage Operations

Consider adapter performance characteristics:

| Adapter | Read Speed | Write Speed | Capacity | Cross-Tab Sync |
|---------|------------|-------------|----------|----------------|
| localStorage | Very Fast | Fast | Medium | Yes |
| sessionStorage | Very Fast | Fast | Medium | Limited |
| cookies | Fast | Moderate | Very Small | No |
| indexedDB | Fast | Fast | Very Large | Yes |

### Debounce Optimization

Set appropriate debounce delays per bucket:

```typescript
buckets: [
  {
    adapter: 'cookies',
    include: ['authToken'],
    debounceDelayMs: 0        // Immediate for auth
  },
  {
    adapter: 'sessionStorage',
    include: ['searchQuery'],
    debounceDelayMs: 100      // Fast for UI state
  },
  {
    adapter: 'localStorage',
    include: ['userPrefs'],
    debounceDelayMs: 500      // Moderate for settings
  },
  {
    adapter: 'indexedDB',
    include: ['largeData'],
    debounceDelayMs: 2000     // Slow for large data
  }
]
```

## 🛠️ Debugging Buckets

### Bucket Inspection

Debug bucket behavior in development:

```typescript
storage: {
  buckets: [...],
  onError: (error, ctx) => {
    console.group(`🪣 Bucket Error: ${ctx.key || ctx.adapter}`)
    console.log('Error:', error.message)
    console.log('Context:', ctx)
    console.log('Store State:', store.$state)
    console.groupEnd()
  }
}

// Add debug logging to beforeHydrate
beforeHydrate: (slice, store) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 Hydrating bucket ${ctx.key}:`, slice)
  }
  return slice
}
```

### Bucket Performance Monitoring

Monitor bucket performance:

```typescript
const bucketMetrics = new Map()

storage: {
  buckets: buckets.map(bucket => ({
    ...bucket,
    beforeHydrate: (slice, store) => {
      const start = performance.now()
      const result = bucket.beforeHydrate?.(slice, store) || slice
      const duration = performance.now() - start
      
      bucketMetrics.set(bucket.key || bucket.adapter, {
        lastHydrationTime: duration,
        dataSize: JSON.stringify(slice).length
      })
      
      return result
    }
  }))
}

// Check metrics
console.table(Object.fromEntries(bucketMetrics))
```

The bucket system provides powerful flexibility while maintaining simplicity for basic use cases. Start with single buckets and evolve to multiple buckets as your needs become more complex.
