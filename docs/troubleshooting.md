# Troubleshooting

Solutions to common issues and problems you might encounter with **pinia-plugin-storage**.

## 🚨 Common Issues

### Data Not Persisting

**Symptoms:**
- State doesn't restore after page reload
- Changes aren't saved to storage
- Storage appears empty in browser dev tools

**Diagnosis Steps:**

1. **Check Plugin Registration**
   ```typescript
   // ✅ Correct
   const pinia = createPinia()
   pinia.use(createPiniaPluginStorage)  // Register plugin
   app.use(pinia)
   
   // ❌ Missing plugin registration
   const pinia = createPinia()
   app.use(pinia)  // Plugin not registered!
   ```

2. **Verify Store Configuration**
   ```typescript
   // ✅ Correct placement (3rd parameter)
   export const useStore = defineStore('store', () => {
     return { data: ref('') }
   }, {
     storage: 'localStorage'  // ✅ Here
   })
   
   // ❌ Wrong placement
   export const useStore = defineStore('store', () => {
     return { data: ref('') }
   })
   // storage: 'localStorage'  // ❌ Not here!
   ```

3. **Check Browser Storage Availability**
   ```typescript
   // Test storage availability
   function testStorage(type: 'localStorage' | 'sessionStorage') {
     try {
       const storage = window[type]
       const test = '__storage_test__'
       storage.setItem(test, 'test')
       storage.removeItem(test)
       return true
     } catch {
       return false
     }
   }
   
   console.log('localStorage available:', testStorage('localStorage'))
   console.log('sessionStorage available:', testStorage('sessionStorage'))
   ```

4. **Inspect Storage in Browser DevTools**
   - **Chrome/Edge**: F12 → Application → Storage
   - **Firefox**: F12 → Storage
   - **Safari**: Develop → Web Inspector → Storage

**Common Solutions:**

- **Private/Incognito Mode**: Some storage may be disabled
- **Storage Quota Exceeded**: Clear browser data or implement cleanup
- **Browser Extensions**: Disable extensions that might block storage
- **CORS Issues**: Ensure proper origin configuration

---

### State Not Hydrating on App Start

**Symptoms:**
- Storage contains data but store starts with default values
- Only some properties are restored
- Inconsistent hydration behavior

**Diagnosis:**

1. **Check Data Format in Storage**
   ```typescript
   // Inspect stored data
   const stored = localStorage.getItem('your-store-id')
   console.log('Stored data:', stored)
   console.log('Parsed data:', JSON.parse(stored))
   ```

2. **Verify Include/Exclude Configuration**
   ```typescript
   storage: {
     adapter: 'localStorage',
     include: ['user', 'settings'],  // Only these will be restored
     // exclude: ['temporary']       // These will be ignored
   }
   ```

3. **Test beforeHydrate Hook**
   ```typescript
   storage: {
     adapter: 'localStorage',
     beforeHydrate: (slice, store) => {
       console.log('Hydrating data:', slice)
       console.log('Store before hydration:', store.$state)
       return slice
     }
   }
   ```

**Solutions:**

```typescript
// Ensure data structure matches expectations
storage: {
  beforeHydrate: (slice, store) => {
    // Validate and fix data structure
    if (!slice || typeof slice !== 'object') {
      console.warn('Invalid stored data, using defaults')
      return null  // Use default state
    }
    
    // Ensure required properties exist
    if (!slice.user) {
      slice.user = { id: null, name: '' }
    }
    
    return slice
  }
}
```

---

### Cross-Tab Synchronization Not Working

**Symptoms:**
- Changes in one tab don't appear in other tabs
- Synchronization is delayed or inconsistent
- Some adapters sync but others don't

**Check Adapter Support:**

| Adapter | Cross-Tab Sync | Method |
|---------|----------------|---------|
| localStorage | ✅ | `storage` event |
| sessionStorage | ✅ | `storage` event |
| indexedDB | ✅ | `BroadcastChannel` |
| cookies | ❌ | Not supported |

**Debugging Steps:**

1. **Test Storage Events**
   ```typescript
   // In browser console (different tabs)
   window.addEventListener('storage', (e) => {
     console.log('Storage event:', e.key, e.newValue)
   })
   
   // Make changes and see if events fire
   localStorage.setItem('test', Date.now().toString())
   ```

2. **Check BroadcastChannel Support**
   ```typescript
   // For IndexedDB sync
   if (typeof BroadcastChannel !== 'undefined') {
     const channel = new BroadcastChannel('test')
     channel.postMessage('hello')
     channel.onmessage = (e) => console.log('Received:', e.data)
   } else {
     console.warn('BroadcastChannel not supported')
   }
   ```

**Solutions:**

```typescript
// Force sync for testing
import { updateStorage } from 'pinia-plugin-storage'

// Manually trigger storage update
await updateStorage(
  { adapter: 'localStorage', include: ['data'] },
  store
)
```

---

### Performance Issues

**Symptoms:**
- App feels slow when state changes frequently
- High CPU usage during rapid updates
- Storage operations blocking UI

**Diagnosis:**

1. **Check Debounce Settings**
   ```typescript
   // Monitor write frequency
   let writeCount = 0
   storage: {
     adapter: 'localStorage',
     debounceDelayMs: 100,  // Adjust based on needs
     beforeHydrate: (slice) => {
       console.log(`Write #${++writeCount}`)
       return slice
     }
   }
   ```

2. **Measure Storage Operation Time**
   ```typescript
   storage: {
     onError: (error, ctx) => {
       console.time(`storage-${ctx.operation}`)
       // ... storage operation
       console.timeEnd(`storage-${ctx.operation}`)
     }
   }
   ```

**Optimization Solutions:**

```typescript
// 1. Increase debounce delays
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['userPrefs'],
      debounceDelayMs: 1000  // Wait 1 second before saving
    },
    {
      adapter: 'sessionStorage',
      include: ['uiState'],
      debounceDelayMs: 300   // Faster for UI state
    }
  ]
}

// 2. Use selective persistence
storage: {
  adapter: 'localStorage',
  exclude: [
    'computedValues',    // Don't persist computed properties
    'temporaryFlags',    // Skip temporary data
    'largeArrays'       // Move large data to indexedDB
  ]
}

// 3. Optimize data size
storage: {
  beforeHydrate: (slice) => {
    // Remove unnecessary data before storage
    if (slice.cache) {
      // Keep only recent cache entries
      slice.cache = slice.cache.slice(-100)
    }
    return slice
  }
}
```

---

### IndexedDB Issues

**Symptoms:**
- "Database is locked" errors
- Transactions timing out
- Data corruption or loss

**Common Causes & Solutions:**

1. **Database Version Conflicts**
   ```typescript
   // Always increment version when changing schema
   options: {
     dbName: 'MyApp',
     storeName: 'data',
     dbVersion: 2  // Increment when structure changes
   }
   ```

2. **Multiple Connections**
   ```typescript
   // Ensure only one store uses the same database
   // ❌ Problem: Multiple stores with same dbName
   store1: { options: { dbName: 'MyApp', storeName: 'data1' } }
   store2: { options: { dbName: 'MyApp', storeName: 'data2' } }
   
   // ✅ Solution: Different databases or single store
   store1: { options: { dbName: 'MyApp1', storeName: 'data' } }
   store2: { options: { dbName: 'MyApp2', storeName: 'data' } }
   ```

3. **Transaction Errors**
   ```typescript
   storage: {
     adapter: 'indexedDB',
     options: { dbName: 'MyApp', storeName: 'data' },
     onError: (error, ctx) => {
       if (error.name === 'TransactionInactiveError') {
         console.warn('Transaction timeout, retrying...')
         // Implement retry logic
       }
     }
   }
   ```

---

### Cookie Storage Issues

**Symptoms:**
- Cookies not being set
- Data truncated or lost
- Cookies not persisting across sessions

**Common Problems:**

1. **Size Limitations**
   ```typescript
   // Check cookie size (4KB limit per cookie)
   function checkCookieSize(data: any) {
     const serialized = JSON.stringify(data)
     const sizeInBytes = new Blob([serialized]).size
     
     if (sizeInBytes > 4000) {  // Leave margin for cookie metadata
       console.warn(`Cookie data too large: ${sizeInBytes} bytes`)
       return false
     }
     return true
   }
   
   storage: {
     adapter: 'cookies',
     beforeHydrate: (slice) => {
       if (!checkCookieSize(slice)) {
         // Compress or split data
         return compressData(slice)
       }
       return slice
     }
   }
   ```

2. **Security Settings**
   ```typescript
   storage: {
     adapter: 'cookies',
     options: {
       secure: true,      // Requires HTTPS
       sameSite: 'Strict' // May block cross-site requests
     }
   }
   ```

3. **Domain Issues**
   ```typescript
   // Check cookie domain settings
   storage: {
     adapter: 'cookies',
     options: {
       domain: '.example.com',  // Shared across subdomains
       path: '/'               // Available site-wide
     }
   }
   ```

---

### SSR (Server-Side Rendering) Issues

**Symptoms:**
- Hydration mismatches
- "localStorage is not defined" errors
- Different state on server vs client

**Solutions:**

1. **Environment Detection**
   ```typescript
   // Plugin automatically handles SSR, but for custom logic:
   function isServerSide() {
     return typeof window === 'undefined'
   }
   
   // In your store
   const initialValue = isServerSide() ? '' : localStorage.getItem('key') || ''
   ```

2. **Prevent Hydration Mismatches**
   ```typescript
   // Use onMounted for client-only logic
   import { onMounted } from 'vue'
   
   export const useStore = defineStore('store', () => {
     const clientOnlyData = ref('')
     
     onMounted(() => {
       // This runs only on client
       clientOnlyData.value = getClientSpecificData()
     })
     
     return { clientOnlyData }
   }, {
     storage: {
       adapter: 'localStorage',
       exclude: ['clientOnlyData']  // Don't persist client-only data
     }
   })
   ```

---

### Error Tracking & Debugging

**Enable Debug Mode:**

```typescript
// Enhanced error tracking for debugging
storage: {
  onError: (error, ctx) => {
    // Detailed logging
    console.group(`🐛 Storage Error: ${ctx.adapter}`)
    console.log('Error:', error)
    console.log('Context:', ctx)
    console.log('Stack:', error.stack)
    console.log('User Agent:', navigator.userAgent)
    console.log('Storage Available:', {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      cookies: document.cookie !== undefined
    })
    console.groupEnd()
    
    // Check storage health
    checkStorageHealth()
  }
}

function checkStorageHealth() {
  try {
    // Test each storage type
    const tests = {
      localStorage: testLocalStorage(),
      sessionStorage: testSessionStorage(),
      indexedDB: testIndexedDB(),
      cookies: testCookies()
    }
    
    console.table(tests)
  } catch (error) {
    console.error('Storage health check failed:', error)
  }
}

function testLocalStorage() {
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
    return { available: true, quota: getStorageQuota('localStorage') }
  } catch (error) {
    return { available: false, error: error.message }
  }
}
```

**Storage Inspector Tool:**

```typescript
// Development tool to inspect storage state
if (process.env.NODE_ENV === 'development') {
  window.inspectStorage = function() {
    console.group('📊 Storage Inspector')
    
    // localStorage
    console.log('localStorage:', Object.fromEntries(
      Object.entries(localStorage).map(([k, v]) => [k, JSON.parse(v)])
    ))
    
    // sessionStorage
    console.log('sessionStorage:', Object.fromEntries(
      Object.entries(sessionStorage).map(([k, v]) => [k, JSON.parse(v)])
    ))
    
    // Cookies
    console.log('cookies:', document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = decodeURIComponent(value)
      return acc
    }, {}))
    
    console.groupEnd()
  }
  
  console.log('💡 Use window.inspectStorage() to inspect all storage')
}
```

## 🔧 Quick Fixes

### Reset All Storage

```typescript
// Clear all plugin storage (development only)
function clearAllPluginStorage(namespace = 'your-app') {
  // Clear localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes(namespace)) {
      localStorage.removeItem(key)
    }
  })
  
  // Clear sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes(namespace)) {
      sessionStorage.removeItem(key)
    }
  })
  
  // Clear cookies
  document.cookie.split(';').forEach(cookie => {
    const [key] = cookie.trim().split('=')
    if (key.includes(namespace)) {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  })
  
  console.log('🧹 All plugin storage cleared')
}
```

### Force Re-hydration

```typescript
// Force store to re-hydrate from storage
function forceRehydration(store: any) {
  const storageKey = store.$id
  const storedData = localStorage.getItem(storageKey)
  
  if (storedData) {
    const parsed = JSON.parse(storedData)
    store.$patch(parsed)
    console.log('🔄 Force re-hydrated store:', store.$id)
  }
}
```

### Storage Health Check

```typescript
// Quick storage health check
function quickHealthCheck() {
  const results = {
    localStorage: 'unknown',
    sessionStorage: 'unknown',
    indexedDB: 'unknown',
    cookies: 'unknown'
  }
  
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
    results.localStorage = '✅ working'
  } catch {
    results.localStorage = '❌ failed'
  }
  
  try {
    sessionStorage.setItem('test', 'test')
    sessionStorage.removeItem('test')
    results.sessionStorage = '✅ working'
  } catch {
    results.sessionStorage = '❌ failed'
  }
  
  try {
    document.cookie = 'test=test'
    results.cookies = document.cookie.includes('test=test') ? '✅ working' : '❌ failed'
  } catch {
    results.cookies = '❌ failed'
  }
  
  results.indexedDB = typeof indexedDB !== 'undefined' ? '✅ available' : '❌ unavailable'
  
  console.table(results)
  return results
}
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the GitHub Issues**: Search for similar problems
2. **Create a Minimal Reproduction**: Use CodeSandbox or similar
3. **Include Environment Details**: Browser, version, OS
4. **Provide Error Messages**: Full error traces and context
5. **Share Configuration**: Your storage configuration (sanitized)

**Useful Information to Include:**
- Plugin version
- Pinia version
- Vue version
- Browser and version
- Storage adapter being used
- Error messages and stack traces
- Steps to reproduce
