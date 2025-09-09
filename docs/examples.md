# Examples & Best Practices

Practical examples and recommended patterns for using Pinia Plugin Storage effectively.

## Basic Examples

### Simple Persistence
```typescript
// Persist entire store to localStorage
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light',
    language: 'en',
    notifications: true
  }),
  storage: 'localStorage'
})
```

### Selective Persistence
```typescript
// Only persist user preferences, exclude temporary data
export const useAppStore = defineStore('app', {
  state: () => ({
    user: { name: '', email: '' },
    preferences: { theme: 'light' },
    cache: {}, // Excluded from persistence
    tempData: [] // Excluded from persistence
  }),
  storage: {
    adapter: 'localStorage',
    include: ['user', 'preferences']
  }
})
```

### Session vs Persistent Data
```typescript
export const useUserStore = defineStore('user', {
  state: () => ({
    profile: {},      // Persistent
    preferences: {},  // Persistent
    sessionData: {},  // Session only
    uiState: {}      // Session only
  }),
  storage: {
    buckets: [
      {
        adapter: 'localStorage',
        include: ['profile', 'preferences']
      },
      {
        adapter: 'sessionStorage',
        include: ['sessionData', 'uiState']
      }
    ]
  }
})
```

## Advanced Examples

### Multi-Adapter Strategy
```typescript
export const useDataStore = defineStore('data', {
  state: () => ({
    userSettings: {},
    documents: [],
    analytics: {},
    temp: {}
  }),
  storage: {
    namespace: 'myApp',
    buckets: [
      {
        // Fast access for settings
        adapter: 'localStorage',
        include: ['userSettings'],
        key: 'settings'
      },
      {
        // Large documents in IndexedDB
        adapter: 'indexedDB',
        include: ['documents'],
        key: 'docs',
        options: {
          dbName: 'MyAppData',
          storeName: 'documents'
        }
      },
      {
        // Server-shareable data in cookies
        adapter: 'cookies',
        include: ['analytics'],
        key: 'tracking',
        options: {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          secure: true
        }
      }
    ]
  }
})
```

### Performance-Optimized Store
```typescript
export const useHighFrequencyStore = defineStore('tracking', {
  state: () => ({
    mousePosition: { x: 0, y: 0 },
    userActions: [],
    settings: {}
  }),
  storage: {
    buckets: [
      {
        // Throttled persistence for high-frequency data
        adapter: 'sessionStorage',
        include: ['mousePosition'],
        throttleDelayMs: 1000 // Max once per second
      },
      {
        // Debounced persistence for user actions
        adapter: 'localStorage',
        include: ['userActions'],
        debounceDelayMs: 500 // After 500ms of inactivity
      },
      {
        // Immediate persistence for important settings
        adapter: 'localStorage',
        include: ['settings'],
        key: 'user-settings'
      }
    ]
  }
})
```

### Data Migration Example
```typescript
export const useVersionedStore = defineStore('app', {
  state: () => ({
    version: '2.0',
    userData: {},
    newField: 'default'
  }),
  storage: {
    version: '2.0',
    adapter: 'localStorage',
    beforeHydrate: (slice, store) => {
      // Handle data migration
      if (!slice.version || slice.version === '1.0') {
        return {
          ...slice,
          version: '2.0',
          newField: 'migrated from v1',
          userData: migrateUserDataV1toV2(slice.userData)
        }
      }
      return slice
    }
  }
})

function migrateUserDataV1toV2(oldData) {
  return {
    ...oldData,
    // Transform old format to new format
    preferences: oldData.settings || {},
    profile: {
      name: oldData.username || '',
      email: oldData.email || ''
    }
  }
}
```

## Best Practices

### 1. Storage Adapter Selection

#### Use localStorage for:
- User preferences and settings
- Authentication tokens (if secure)
- App configuration
- Data that should persist across sessions

#### Use sessionStorage for:
- Temporary UI state
- Form data during navigation
- Session-specific cache
- Data that should reset on browser restart

#### Use cookies for:
- Server-side accessible data
- Authentication tokens for SSR
- Small amounts of data
- Cross-domain scenarios

#### Use IndexedDB for:
- Large datasets
- Offline-first applications
- Binary data or files
- Complex data structures

### 2. Performance Optimization

#### Selective Persistence
```typescript
// ✅ Good - Only persist necessary data
storage: {
  adapter: 'localStorage',
  exclude: ['cache', 'computed', 'temp']
}

// ❌ Avoid - Persisting everything including cache
storage: 'localStorage'
```

#### Timing Controls
```typescript
// ✅ Good - Use debouncing for user input
storage: {
  adapter: 'localStorage',
  include: ['searchQuery', 'filters'],
  debounceDelayMs: 300
}

// ✅ Good - Use throttling for high-frequency updates
storage: {
  adapter: 'sessionStorage', 
  include: ['scrollPosition'],
  throttleDelayMs: 1000
}
```

#### Change Detection
```typescript
// ✅ Good - Exclude derived/computed data
export const useStore = defineStore('app', {
  state: () => ({
    items: [],
    searchTerm: '',
    // These computed values shouldn't be persisted
    filteredItems: computed(() => /* ... */),
    itemCount: computed(() => /* ... */)
  }),
  storage: {
    adapter: 'localStorage',
    exclude: ['filteredItems', 'itemCount']
  }
})
```

### 3. Error Handling

#### Graceful Degradation
```typescript
storage: {
  adapter: 'indexedDB',
  onError: (error, context) => {
    console.warn('IndexedDB failed, falling back to localStorage')
    
    // Implement fallback strategy
    if (context.stage === 'persist') {
      fallbackToLocalStorage(context.storeId, store.$state)
    }
  }
}
```

#### Development vs Production
```typescript
const isProduction = process.env.NODE_ENV === 'production'

storage: {
  adapter: 'localStorage',
  onError: (error, context) => {
    if (isProduction) {
      // Silent logging in production
      logErrorToService(error, context)
    } else {
      // Verbose debugging in development
      console.error('Storage Error:', error, context)
      debugger // Break in development
    }
  }
}
```

### 4. Data Validation

#### Input Validation
```typescript
storage: {
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Validate data structure
    if (!isValidData(slice)) {
      console.warn('Invalid stored data, using defaults')
      return getDefaultState()
    }
    
    // Sanitize data
    return sanitizeData(slice)
  }
}

function isValidData(data) {
  return data && typeof data === 'object' && data.version
}

function sanitizeData(data) {
  return {
    ...data,
    // Remove any potentially harmful properties
    __proto__: undefined,
    constructor: undefined
  }
}
```

### 5. Namespace Strategy

#### Environment-Based Namespacing
```typescript
storage: {
  namespace: `myApp-${process.env.NODE_ENV}`,
  adapter: 'localStorage'
}
// Results in keys like: "myApp-development:storeName"
```

#### Version-Based Namespacing
```typescript
storage: {
  namespace: `myApp-v${APP_VERSION}`,
  adapter: 'localStorage'
}
// Enables clean migration between app versions
```

### 6. Security Considerations

#### Sensitive Data Handling
```typescript
// ✅ Good - Exclude sensitive data
storage: {
  adapter: 'localStorage',
  exclude: ['password', 'privateKey', 'sessionToken']
}

// ✅ Good - Use secure cookies for auth tokens
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['preferences', 'settings']
    },
    {
      adapter: 'cookies',
      include: ['authToken'],
      options: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
      }
    }
  ]
}
```

### 7. Testing Strategies

#### Mock Storage in Tests
```typescript
// test-utils.ts
export function createMockStorage() {
  const storage = new Map()
  
  return {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  }
}

// In tests
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: createMockStorage()
  })
})
```

#### Test Data Migration
```typescript
it('should migrate data from v1 to v2', () => {
  const v1Data = { version: '1.0', username: 'john' }
  const store = useVersionedStore()
  
  // Test migration function directly
  const migrated = store.$storage.beforeHydrate(v1Data, store)
  
  expect(migrated.version).toBe('2.0')
  expect(migrated.profile.name).toBe('john')
})
```

## Common Patterns

### Loading States
```typescript
export const useAsyncStore = defineStore('async', {
  state: () => ({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  }),
  actions: {
    async fetchData() {
      this.loading = true
      try {
        this.data = await api.getData()
        this.lastFetch = Date.now()
        this.error = null
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  },
  storage: {
    adapter: 'localStorage',
    include: ['data', 'lastFetch'], // Persist data and timestamp
    exclude: ['loading', 'error']   // Don't persist transient state
  }
})
```

### Cache Invalidation
```typescript
export const useCacheStore = defineStore('cache', {
  state: () => ({
    data: {},
    timestamps: {},
    ttl: 60 * 60 * 1000 // 1 hour
  }),
  storage: {
    adapter: 'localStorage',
    beforeHydrate: (slice, store) => {
      const now = Date.now()
      const validData = {}
      const validTimestamps = {}
      
      // Remove expired cache entries
      for (const [key, timestamp] of Object.entries(slice.timestamps || {})) {
        if (now - timestamp < slice.ttl) {
          validData[key] = slice.data[key]
          validTimestamps[key] = timestamp
        }
      }
      
      return {
        ...slice,
        data: validData,
        timestamps: validTimestamps
      }
    }
  }
})
```

### Form State Persistence
```typescript
export const useFormStore = defineStore('form', {
  state: () => ({
    formData: {},
    isDirty: false,
    step: 1
  }),
  actions: {
    updateField(field, value) {
      this.formData[field] = value
      this.isDirty = true
    },
    resetForm() {
      this.formData = {}
      this.isDirty = false
      this.step = 1
    }
  },
  storage: {
    adapter: 'sessionStorage', // Form data only for current session
    include: ['formData', 'step'],
    debounceDelayMs: 500 // Don't save on every keystroke
  }
})
```
