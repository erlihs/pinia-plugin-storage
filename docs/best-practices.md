# Best Practices

Production-ready patterns and recommendations for **pinia-plugin-storage**.

## 🏗️ Architecture Patterns

### Store Organization

Structure your stores with persistence in mind:

```typescript
// ✅ Good: Logical separation of concerns
export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const user = ref(null)
  const isAuthenticated = computed(() => !!token.value)
  
  return { token, user, isAuthenticated }
}, {
  storage: {
    adapter: 'cookies',
    include: ['token'],  // Only persist auth token
    options: { 
      secure: true,
      maxAgeSeconds: 24 * 60 * 60  // 24 hours
    }
  }
})

export const usePreferencesStore = defineStore('preferences', () => {
  const theme = ref('light')
  const language = ref('en')
  const notifications = ref(true)
  
  return { theme, language, notifications }
}, {
  storage: 'localStorage'  // Persist all preferences
})

// ❌ Avoid: Mixed concerns in one store
export const useMegaStore = defineStore('mega', () => {
  const authToken = ref('')     // Should be cookies
  const theme = ref('light')    // Should be localStorage
  const searchQuery = ref('')   // Should be sessionStorage
  const largeData = ref([])     // Should be indexedDB
  
  return { authToken, theme, searchQuery, largeData }
}, {
  storage: 'localStorage'  // One-size-fits-all approach
})
```

### Layered Persistence Strategy

Implement a layered approach based on data characteristics:

```typescript
// Layer 1: Critical authentication data (cookies)
export const useAuthStore = defineStore('auth', () => {
  // Auth logic
}, {
  storage: {
    adapter: 'cookies',
    include: ['token', 'refreshToken'],
    options: { secure: true, maxAgeSeconds: 3600 }
  }
})

// Layer 2: User preferences (localStorage)
export const useSettingsStore = defineStore('settings', () => {
  // Settings logic
}, {
  storage: {
    adapter: 'localStorage',
    exclude: ['temporarySettings']
  }
})

// Layer 3: Session state (sessionStorage)
export const useUIStore = defineStore('ui', () => {
  // UI state logic
}, {
  storage: {
    adapter: 'sessionStorage',
    include: ['currentView', 'sidebarOpen', 'activeTab']
  }
})

// Layer 4: Large datasets (indexedDB)
export const useDataStore = defineStore('data', () => {
  // Data management logic
}, {
  storage: {
    adapter: 'indexedDB',
    options: { dbName: 'AppData', storeName: 'cache' },
    debounceDelayMs: 1000
  }
})
```

## 🎯 Configuration Best Practices

### Environment-Specific Configuration

Adapt storage configuration to different environments:

```typescript
// utils/storage-config.ts
export function createStorageConfig(env: 'development' | 'production' | 'test') {
  const baseConfig = {
    namespace: 'myapp',
    version: '1.0'
  }
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        namespace: 'myapp-dev',
        debounceDelayMs: 0,  // Immediate for debugging
        onError: (error, ctx) => {
          console.warn('🔧 Dev Storage Error:', error, ctx)
          // More verbose logging in development
        }
      }
      
    case 'production':
      return {
        ...baseConfig,
        debounceDelayMs: 300,  // Optimized for production
        onError: (error, ctx) => {
          // Send to error tracking service
          errorTracker.captureException(error, { extra: ctx })
        }
      }
      
    case 'test':
      return {
        ...baseConfig,
        namespace: 'myapp-test',
        adapter: 'sessionStorage',  // Isolated test storage
        onError: () => {
          // Silent in tests unless explicitly testing errors
        }
      }
  }
}

// In your stores
export const useStore = defineStore('store', () => {
  // ... store logic
}, {
  storage: {
    ...createStorageConfig(process.env.NODE_ENV),
    buckets: [
      // ... your buckets
    ]
  }
})
```

### Progressive Enhancement

Start simple and add complexity as needed:

```typescript
// Phase 1: Basic persistence
storage: 'localStorage'

// Phase 2: Add selective persistence
storage: {
  adapter: 'localStorage',
  exclude: ['temporaryData', 'computedValues']
}

// Phase 3: Add performance optimization
storage: {
  adapter: 'localStorage',
  exclude: ['temporaryData'],
  debounceDelayMs: 300,
  beforeHydrate: (slice) => validateAndCleanData(slice)
}

// Phase 4: Multi-adapter optimization
storage: {
  namespace: 'myapp',
  version: '1.0',
  buckets: [
    {
      adapter: 'localStorage',
      include: ['userPrefs'],
      debounceDelayMs: 500
    },
    {
      adapter: 'sessionStorage',
      include: ['sessionData'],
      debounceDelayMs: 100
    }
  ]
}
```

## 🚀 Performance Best Practices

### Debounce Optimization

Set appropriate debounce delays based on data usage patterns:

```typescript
storage: {
  buckets: [
    // Real-time UI state - minimal debounce
    {
      adapter: 'sessionStorage',
      include: ['activeTab', 'sidebarOpen'],
      debounceDelayMs: 50
    },
    
    // User preferences - moderate debounce
    {
      adapter: 'localStorage',
      include: ['theme', 'language'],
      debounceDelayMs: 300
    },
    
    // Large datasets - longer debounce
    {
      adapter: 'indexedDB',
      include: ['cache', 'documents'],
      debounceDelayMs: 1000
    },
    
    // Critical auth data - immediate
    {
      adapter: 'cookies',
      include: ['authToken'],
      debounceDelayMs: 0
    }
  ]
}
```

### Data Size Management

Optimize for storage size and performance:

```typescript
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['userProfile'],
      beforeHydrate: (slice) => {
        // Clean up large unnecessary data
        if (slice.userProfile) {
          delete slice.userProfile.largeImageData  // Store separately
          delete slice.userProfile.temporaryFlags  // Don't persist
        }
        return slice
      }
    }
  ]
}

// Better: Separate large data into its own bucket
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['userProfile'],
      exclude: ['largeImageData']  // Exclude large data
    },
    {
      adapter: 'indexedDB',
      include: ['largeImageData'],  // Store large data separately
      options: { dbName: 'AppMedia', storeName: 'images' }
    }
  ]
}
```

### Memory Usage Optimization

Minimize runtime memory overhead:

```typescript
// ✅ Good: Logical grouping reduces overhead
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['user', 'preferences', 'settings']  // Group related data
    },
    {
      adapter: 'sessionStorage',
      include: ['ui', 'navigation', 'search']  // Group UI state
    }
  ]
}

// ❌ Avoid: Too many small buckets
storage: {
  buckets: [
    { adapter: 'localStorage', include: ['theme'] },
    { adapter: 'localStorage', include: ['language'] },
    { adapter: 'localStorage', include: ['fontSize'] },
    // Each bucket has overhead...
  ]
}
```

## 🔒 Security Best Practices

### Sensitive Data Handling

Never store sensitive data inappropriately:

```typescript
// ✅ Good: Secure token storage
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref('')
  const refreshToken = ref('')
  const userProfile = ref({})
  
  return { accessToken, refreshToken, userProfile }
}, {
  storage: {
    buckets: [
      {
        adapter: 'cookies',
        include: ['accessToken'],  // Short-lived token in secure cookie
        options: {
          secure: true,
          sameSite: 'Strict',
          maxAgeSeconds: 900  // 15 minutes
        }
      },
      {
        adapter: 'localStorage',
        include: ['userProfile'],  // Non-sensitive profile data
        beforeHydrate: (slice) => {
          // Remove any accidentally stored sensitive data
          if (slice.userProfile) {
            delete slice.userProfile.password
            delete slice.userProfile.socialSecurityNumber
          }
          return slice
        }
      }
    ],
    // Never persist refresh tokens in browser storage!
    exclude: ['refreshToken']
  }
})

// ❌ Never do this:
storage: {
  adapter: 'localStorage',
  include: ['password', 'creditCardNumber', 'refreshToken']  // ❌ Security risk!
}
```

### Data Validation

Always validate data from storage:

```typescript
storage: {
  adapter: 'localStorage',
  beforeHydrate: (slice, store) => {
    // Validate data structure
    if (!slice || typeof slice !== 'object') {
      console.warn('Invalid storage data, using defaults')
      return getDefaultState()
    }
    
    // Validate specific fields
    if (slice.user) {
      if (!isValidUserId(slice.user.id)) {
        slice.user.id = null
      }
      if (!isValidEmail(slice.user.email)) {
        slice.user.email = ''
      }
    }
    
    // Sanitize data
    if (slice.preferences) {
      slice.preferences.theme = sanitizeThemeValue(slice.preferences.theme)
    }
    
    return slice
  }
}

function isValidUserId(id: any): boolean {
  return typeof id === 'string' && /^[a-zA-Z0-9-_]+$/.test(id)
}

function isValidEmail(email: any): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitizeThemeValue(theme: any): string {
  const validThemes = ['light', 'dark', 'auto']
  return validThemes.includes(theme) ? theme : 'light'
}
```

## 🧪 Testing Best Practices

### Test Environment Isolation

Isolate tests with separate storage:

```typescript
// tests/setup.ts
import { beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  // Clear all storage before each test
  localStorage.clear()
  sessionStorage.clear()
  // Clear IndexedDB databases
  clearIndexedDBDatabases()
})

// Create test-specific storage configuration
export function createTestStorageConfig() {
  return {
    namespace: 'test',
    version: 'test',
    onError: (error, ctx) => {
      // Make tests fail on storage errors unless explicitly testing them
      if (!ctx.expectedError) {
        throw error
      }
    }
  }
}
```

### Mock Storage for Unit Tests

```typescript
// tests/mocks/storage.ts
export class MockStorage implements Storage {
  private data: Record<string, string> = {}
  
  get length() {
    return Object.keys(this.data).length
  }
  
  getItem(key: string): string | null {
    return this.data[key] || null
  }
  
  setItem(key: string, value: string): void {
    this.data[key] = value
  }
  
  removeItem(key: string): void {
    delete this.data[key]
  }
  
  clear(): void {
    this.data = {}
  }
  
  key(index: number): string | null {
    const keys = Object.keys(this.data)
    return keys[index] || null
  }
}

// In your test setup
Object.defineProperty(window, 'localStorage', {
  value: new MockStorage()
})
```

### Test Storage Behavior

```typescript
// tests/stores/user.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('User Store Persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  
  it('persists user preferences to localStorage', async () => {
    const store = useUserStore()
    
    // Set preferences
    store.theme = 'dark'
    store.language = 'es'
    
    // Wait for debounced save
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Check localStorage
    const stored = localStorage.getItem('user')
    const parsed = JSON.parse(stored!)
    
    expect(parsed.theme).toBe('dark')
    expect(parsed.language).toBe('es')
  })
  
  it('hydrates from localStorage on store creation', () => {
    // Pre-populate localStorage
    localStorage.setItem('user', JSON.stringify({
      theme: 'dark',
      language: 'fr'
    }))
    
    // Create new store
    const store = useUserStore()
    
    expect(store.theme).toBe('dark')
    expect(store.language).toBe('fr')
  })
})
```

## 🔄 Migration Strategies

### Version-Based Migrations

Handle schema changes gracefully:

```typescript
storage: {
  namespace: 'myapp',
  version: '3.0',
  buckets: [{
    adapter: 'localStorage',
    beforeHydrate: (slice, store) => {
      const dataVersion = slice.version || '1.0'
      
      // Chain migrations
      let migrated = slice
      
      if (dataVersion === '1.0') {
        migrated = migrateV1ToV2(migrated)
      }
      
      if (dataVersion === '1.0' || dataVersion === '2.0') {
        migrated = migrateV2ToV3(migrated)
      }
      
      migrated.version = '3.0'
      return migrated
    }
  }]
}

function migrateV1ToV2(data: any) {
  return {
    ...data,
    // Add new field with default
    notifications: {
      email: true,
      push: false,
      sound: true
    },
    // Rename field
    userPreferences: data.settings,
    version: '2.0'
  }
}

function migrateV2ToV3(data: any) {
  return {
    ...data,
    // Restructure nested data
    theme: {
      mode: data.darkMode ? 'dark' : 'light',
      customColors: data.customTheme || {}
    },
    version: '3.0'
  }
}
```

### Gradual Migration

Migrate data gradually to avoid blocking:

```typescript
storage: {
  beforeHydrate: async (slice, store) => {
    if (needsMigration(slice)) {
      // Start migration in background
      queueMigration(slice)
      
      // Return current data for immediate use
      return slice
    }
    return slice
  }
}

async function queueMigration(data: any) {
  // Use requestIdleCallback for non-blocking migration
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      performMigration(data)
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => performMigration(data), 0)
  }
}
```

## 📊 Monitoring & Analytics

### Storage Health Monitoring

Monitor storage performance and reliability:

```typescript
class StorageHealthMonitor {
  private metrics = {
    operations: 0,
    errors: 0,
    avgWriteTime: 0,
    quotaWarnings: 0
  }
  
  trackOperation(operation: string, duration: number, success: boolean) {
    this.metrics.operations++
    
    if (!success) {
      this.metrics.errors++
    }
    
    if (operation === 'write') {
      this.metrics.avgWriteTime = 
        (this.metrics.avgWriteTime + duration) / 2
    }
    
    // Report to analytics periodically
    if (this.metrics.operations % 100 === 0) {
      this.reportMetrics()
    }
  }
  
  private reportMetrics() {
    analytics.track('storage_health', {
      operations: this.metrics.operations,
      error_rate: this.metrics.errors / this.metrics.operations,
      avg_write_time: this.metrics.avgWriteTime,
      quota_warnings: this.metrics.quotaWarnings
    })
  }
}

const healthMonitor = new StorageHealthMonitor()

// Use in storage configuration
storage: {
  onError: (error, ctx) => {
    healthMonitor.trackOperation(ctx.operation, 0, false)
    
    if (error.name === 'QuotaExceededError') {
      healthMonitor.trackQuotaWarning()
    }
  }
}
```

### Performance Tracking

Track storage performance impact:

```typescript
// utils/performance-tracker.ts
export function wrapStorageWithPerformanceTracking(storageConfig: any) {
  return {
    ...storageConfig,
    beforeHydrate: (slice: any, store: any) => {
      const start = performance.now()
      
      const result = storageConfig.beforeHydrate?.(slice, store) || slice
      
      const duration = performance.now() - start
      
      // Track hydration performance
      analytics.track('storage_hydration', {
        store_id: store.$id,
        duration,
        data_size: JSON.stringify(slice).length
      })
      
      return result
    }
  }
}
```

## 🎯 Production Deployment

### Performance Optimization Checklist

- [ ] Set appropriate debounce delays for each adapter
- [ ] Use `include`/`exclude` to minimize stored data
- [ ] Implement data validation in `beforeHydrate`
- [ ] Monitor storage quota usage
- [ ] Set up error tracking and alerts
- [ ] Test cross-tab synchronization behavior
- [ ] Verify SSR compatibility
- [ ] Configure secure cookie settings for production

### Error Handling Checklist

- [ ] Global error handler configured
- [ ] Fallback strategies for critical data
- [ ] User-friendly error messages
- [ ] Error tracking integration
- [ ] Storage health monitoring
- [ ] Quota exceeded handling
- [ ] Private browsing mode support
- [ ] Database corruption recovery

### Security Checklist

- [ ] No sensitive data in local storage
- [ ] Secure cookie settings in production
- [ ] Data validation and sanitization
- [ ] XSS protection considerations
- [ ] CSRF protection for cookies
- [ ] Regular security audits of stored data
- [ ] Compliance with privacy regulations

By following these best practices, you'll build robust, secure, and performant applications with reliable state persistence.
