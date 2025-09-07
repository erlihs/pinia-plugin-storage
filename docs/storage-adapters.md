# Storage Adapters

**pinia-plugin-storage** supports four different storage adapters, each with unique characteristics and use cases.

## 📋 Overview

| Adapter | Persistence | Capacity | Cross-Tab Sync | Use Case |
|---------|-------------|----------|----------------|----------|
| `localStorage` | Until cleared | ~5-10MB | ✅ | Long-term app state |
| `sessionStorage` | Until tab closed | ~5-10MB | ✅ | Session-specific data |
| `cookies` | Configurable expiry | ~4KB | ❌ | Small data, server access |
| `indexedDB` | Until cleared | ~50MB+ | ✅ | Large data, complex objects |

## 🗄️ localStorage

Perfect for application state that should persist across browser sessions.

### Basic Usage
```typescript
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('light')
  const language = ref('en')
  
  return { theme, language }
}, {
  storage: 'localStorage'
})
```

### Characteristics
- **Persistence**: Until manually cleared by user or code
- **Capacity**: ~5-10MB (varies by browser)
- **Cross-Tab Sync**: ✅ Real-time synchronization
- **SSR Safe**: ✅ Graceful degradation
- **Performance**: Fast read/write operations

### Best For
- User preferences (theme, language)
- Application settings
- Shopping cart contents
- User authentication state

---

## 📅 sessionStorage

Ideal for data that should only persist during the browser session.

### Basic Usage
```typescript
export const useTemporaryStore = defineStore('temporary', () => {
  const formData = ref({})
  const currentStep = ref(1)
  
  return { formData, currentStep }
}, {
  storage: 'sessionStorage'
})
```

### Characteristics
- **Persistence**: Until tab/window is closed
- **Capacity**: ~5-10MB (varies by browser)
- **Cross-Tab Sync**: ✅ Within same tab only
- **SSR Safe**: ✅ Graceful degradation
- **Performance**: Fast read/write operations

### Best For
- Multi-step form data
- Temporary filters and search state
- Session-specific UI state
- Wizard or onboarding progress

---

## 🍪 cookies

Useful when you need server-side access to the data or specific expiration control.

### Basic Usage
```typescript
export const useUserStore = defineStore('user', () => {
  const userId = ref('')
  const sessionToken = ref('')
  
  return { userId, sessionToken }
}, {
  storage: {
    adapter: 'cookies',
    options: {
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      secure: true,
      sameSite: 'Lax'
    }
  }
})
```

### Advanced Cookie Configuration
```typescript
storage: {
  adapter: 'cookies',
  options: {
    path: '/',                    // Cookie path
    domain: '.example.com',       // Cookie domain
    secure: true,                 // HTTPS only
    sameSite: 'Strict',          // CSRF protection
    maxAgeSeconds: 3600,         // 1 hour expiry
    httpOnly: false,             // Client-side access
    priority: 'High'             // Cookie priority
  }
}
```

### Cookie Options Reference
```typescript
interface CookieOptions {
  path?: string                 // Default: '/'
  domain?: string              // Default: current domain
  secure?: boolean             // Default: false
  sameSite?: 'Lax' | 'Strict' | 'None'  // Default: 'Lax'
  maxAgeSeconds?: number       // Session cookie if not set
  expires?: Date | string | number  // Alternative to maxAgeSeconds
  httpOnly?: boolean           // Default: false
  priority?: 'Low' | 'Medium' | 'High'  // Default: undefined
  partitioned?: boolean        // For third-party contexts
}
```

### Characteristics
- **Persistence**: Configurable (session to years)
- **Capacity**: ~4KB total per domain
- **Cross-Tab Sync**: ❌ No automatic sync
- **Server Access**: ✅ Available in HTTP headers
- **Performance**: Moderate (sent with every request)

### Best For
- Authentication tokens
- User identification
- A/B testing flags
- Small preference data
- Server-side personalization

### ⚠️ Cookie Limitations
- **Size Limit**: ~4KB total for all cookies per domain
- **Performance Impact**: Sent with every HTTP request
- **Privacy Concerns**: Subject to tracking restrictions
- **No Cross-Tab Sync**: Changes don't automatically sync between tabs

---

## 🗃️ indexedDB

Powerful for large datasets and complex object storage.

### Basic Usage
```typescript
export const useDataStore = defineStore('data', () => {
  const documents = ref([])
  const cache = ref(new Map())
  
  return { documents, cache }
}, {
  storage: {
    adapter: 'indexedDB',
    options: {
      dbName: 'MyApp',
      storeName: 'documents',
      dbVersion: 1
    }
  }
})
```

### Advanced IndexedDB Configuration
```typescript
storage: {
  adapter: 'indexedDB',
  options: {
    dbName: 'MyApplication',     // Database name
    storeName: 'userdata',       // Object store name
    dbVersion: 2                 // Schema version
  },
  beforeHydrate: (data, store) => {
    // Transform data before hydration
    if (data.version < 2) {
      return migrateDataV1ToV2(data)
    }
    return data
  }
}
```

### IndexedDB Options Reference
```typescript
interface IndexedDBOptions {
  dbName: string        // Database name
  storeName: string     // Object store name  
  dbVersion?: number    // Schema version (default: 1)
}
```

### Characteristics
- **Persistence**: Until manually cleared
- **Capacity**: ~50MB to several GB (browser dependent)
- **Cross-Tab Sync**: ✅ Real-time synchronization
- **Complex Data**: ✅ Supports complex objects, files, blobs
- **Performance**: Excellent for large datasets
- **Transactions**: ✅ ACID compliance

### Best For
- Large datasets (user content, offline data)
- Complex nested objects
- File and blob storage
- Offline-capable applications
- Data that needs transaction safety

### 🔄 Schema Versioning
IndexedDB supports schema versioning for data migration:

```typescript
// Version 1 store
export const useDataStore = defineStore('data', () => {
  const items = ref([])
  return { items }
}, {
  storage: {
    adapter: 'indexedDB',
    options: {
      dbName: 'MyApp',
      storeName: 'items',
      dbVersion: 1
    }
  }
})

// Version 2 store with migration
export const useDataStore = defineStore('data', () => {
  const items = ref([])
  const metadata = ref({})
  return { items, metadata }
}, {
  storage: {
    adapter: 'indexedDB',
    options: {
      dbName: 'MyApp', 
      storeName: 'items',
      dbVersion: 2  // Increment version
    },
    beforeHydrate: (data, store) => {
      // Migrate old data structure
      if (!data.metadata) {
        data.metadata = { version: 2, migrated: true }
      }
      return data
    }
  }
})
```

---

## 🔄 Cross-Tab Synchronization

Adapters with cross-tab sync automatically keep state synchronized across browser tabs:

### Supported Adapters
- ✅ **localStorage**: Uses `storage` events
- ✅ **sessionStorage**: Uses `storage` events  
- ✅ **indexedDB**: Uses `BroadcastChannel` API
- ❌ **cookies**: No built-in sync mechanism

### How It Works
```typescript
// Tab 1: User changes theme
const settings = useSettingsStore()
settings.theme = 'dark'

// Tab 2: Automatically receives the update
// settings.theme is now 'dark' without any additional code
```

### Sync Behavior
- **Real-time**: Changes propagate immediately
- **Bi-directional**: All tabs can make and receive changes
- **Atomic**: Complete state snapshots are synchronized
- **Debounced**: Rapid changes are batched for performance

---

## 🎯 Choosing the Right Adapter

### Decision Tree

```
Do you need server-side access?
├─ Yes → cookies (for small data) or localStorage + API sync
└─ No → Continue...

How much data do you need to store?
├─ < 4KB → cookies or localStorage
├─ 4KB - 5MB → localStorage or sessionStorage  
└─ > 5MB → indexedDB

How long should data persist?
├─ Until tab closes → sessionStorage
├─ Until manually cleared → localStorage or indexedDB
└─ Custom duration → cookies

Do you need cross-tab sync?
├─ Yes → localStorage, sessionStorage, or indexedDB
└─ No → Any adapter
```

### Performance Comparison

| Operation | localStorage | sessionStorage | cookies | indexedDB |
|-----------|-------------|----------------|---------|-----------|
| Read | Very Fast | Very Fast | Fast | Fast |
| Write | Fast | Fast | Moderate | Fast |
| Large Data | Moderate | Moderate | Poor | Excellent |
| Cross-Tab | Excellent | Excellent | None | Excellent |

---

## 🛡️ Error Handling

All adapters include comprehensive error handling:

```typescript
storage: {
  adapter: 'localStorage',
  onError: (error, context) => {
    console.warn(`Storage error in ${context.adapter}:`, error)
    
    // Handle specific adapter errors
    switch (context.adapter) {
      case 'localStorage':
        // Handle quota exceeded, disabled storage, etc.
        break
      case 'indexedDB':
        // Handle database corruption, access denied, etc.
        break
      case 'cookies':
        // Handle cookie size limits, disabled cookies, etc.
        break
    }
  }
}
```

See [Error Handling Guide](./error-handling.md) for comprehensive error management strategies.
