# Error Handling

Comprehensive guide to handling storage errors gracefully in **pinia-plugin-storage**.

## 🛡️ Error Handling Philosophy

The plugin is designed with error resilience as a core principle:

- **Graceful Degradation**: Errors don't break your application
- **Contextual Information**: Detailed error context for debugging
- **Flexible Recovery**: Multiple strategies for error recovery
- **Silent Failures**: Optional silent handling for non-critical errors

## 📋 Error Types

### Storage Adapter Errors

Different adapters can fail in different ways:

| Adapter | Common Errors | Causes |
|---------|---------------|---------|
| `localStorage` | QuotaExceeded, SecurityError | Storage full, private browsing |
| `sessionStorage` | QuotaExceeded, SecurityError | Storage full, private browsing |
| `cookies` | SecurityError, Size limit | Cookies disabled, 4KB limit |
| `indexedDB` | DatabaseError, Transaction failed | DB corruption, browser limits |

### Operation Errors

Errors can occur during different operations:

- **Hydration**: Loading data from storage
- **Persistence**: Saving data to storage  
- **Parsing**: Converting JSON data
- **Transformation**: Running `beforeHydrate` hooks
- **Synchronization**: Cross-tab communication

## 🎯 Basic Error Handling

### Global Error Handler

Set up a global error handler for all storage operations:

```typescript
export const useStore = defineStore('store', () => {
  // ... your store logic
}, {
  storage: {
    adapter: 'localStorage',
    onError: (error, context) => {
      console.warn('Storage error:', error.message, context)
      
      // Send to error tracking service
      errorTracker.captureException(error, {
        extra: context,
        tags: {
          adapter: context.adapter,
          stage: context.stage
        }
      })
    }
  }
})
```

### Error Context Information

The error handler receives detailed context:

```typescript
interface ErrorContext {
  stage: 'hydrate' | 'persist' | 'sync'     // When the error occurred
  operation: 'read' | 'write' | 'parse' | 'transform' | 'channel'  // What failed
  storeId: string                           // Which store
  adapter: string                          // Which storage adapter
  key?: string                            // Storage key (if applicable)
}
```

## 🔧 Advanced Error Handling

### Adapter-Specific Error Handling

Handle different adapters with specific strategies:

```typescript
storage: {
  buckets: [
    {
      adapter: 'localStorage',
      include: ['criticalData']
    },
    {
      adapter: 'indexedDB', 
      include: ['largeData'],
      options: { dbName: 'MyApp', storeName: 'data' }
    }
  ],
  onError: (error, ctx) => {
    switch (ctx.adapter) {
      case 'localStorage':
        handleLocalStorageError(error, ctx)
        break
      case 'indexedDB':
        handleIndexedDBError(error, ctx)
        break
      case 'cookies':
        handleCookieError(error, ctx)
        break
      case 'sessionStorage':
        handleSessionStorageError(error, ctx)
        break
    }
  }
}

function handleLocalStorageError(error: Error, ctx: ErrorContext) {
  if (error.name === 'QuotaExceededError') {
    // Storage quota exceeded
    console.warn('localStorage quota exceeded')
    
    // Strategy 1: Clear old data
    clearOldStorageData()
    
    // Strategy 2: Notify user
    showNotification('Storage full. Some data may not be saved.', 'warning')
    
    // Strategy 3: Fallback to sessionStorage
    fallbackToSessionStorage(ctx.storeId)
  } else if (error.name === 'SecurityError') {
    // Private browsing or disabled storage
    console.warn('localStorage not available')
    showNotification('Private browsing detected. Data will not persist.', 'info')
  }
}

function handleIndexedDBError(error: Error, ctx: ErrorContext) {
  if (ctx.operation === 'read') {
    // Database might be corrupted
    console.warn('IndexedDB read failed, attempting reset')
    resetIndexedDB(ctx)
  } else if (ctx.operation === 'write') {
    // Transaction failed
    console.warn('IndexedDB write failed, retrying with smaller chunks')
    retryWithChunkedData(ctx)
  }
}
```

### Recovery Strategies

Implement automatic recovery for common issues:

```typescript
onError: async (error, ctx) => {
  const recoveryStrategy = getRecoveryStrategy(error, ctx)
  
  switch (recoveryStrategy) {
    case 'retry':
      await retryOperation(ctx, 3) // Retry up to 3 times
      break
      
    case 'fallback':
      await fallbackToAlternativeStorage(ctx)
      break
      
    case 'clear-and-retry':
      await clearCorruptedData(ctx)
      await retryOperation(ctx, 1)
      break
      
    case 'ignore':
      // Silent failure for non-critical data
      break
      
    default:
      // Last resort: disable storage for this session
      disableStorageForSession(ctx.adapter)
  }
}

function getRecoveryStrategy(error: Error, ctx: ErrorContext): string {
  // Quota exceeded - try to clear space
  if (error.name === 'QuotaExceededError') {
    return 'clear-and-retry'
  }
  
  // Network/transaction errors - retry
  if (error.name === 'NetworkError' || error.name === 'TransactionError') {
    return 'retry'
  }
  
  // Security errors - fallback
  if (error.name === 'SecurityError') {
    return 'fallback'
  }
  
  // Critical data - always try to recover
  if (ctx.key?.includes('user') || ctx.key?.includes('auth')) {
    return 'fallback'
  }
  
  // Non-critical data - ignore
  return 'ignore'
}
```

## 🔄 Fallback Strategies

### Adapter Fallback Chain

Create a fallback chain when storage adapters fail:

```typescript
// stores/resilient.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

let fallbackAdapter: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage'

export const useResilientStore = defineStore('resilient', () => {
  const data = ref({})
  
  return { data }
}, {
  storage: {
    adapter: fallbackAdapter,
    onError: (error, ctx) => {
      if (ctx.adapter === 'localStorage') {
        console.warn('localStorage failed, falling back to sessionStorage')
        fallbackAdapter = 'sessionStorage'
        // Recreate store with new adapter - would need custom implementation
      } else if (ctx.adapter === 'sessionStorage') {
        console.warn('sessionStorage failed, falling back to memory-only')
        fallbackAdapter = 'memory'
        // Disable persistence entirely
      }
    }
  }
})
```

### Cross-Adapter Backup

Maintain backups across multiple adapters:

```typescript
storage: {
  buckets: [
    // Primary storage
    {
      adapter: 'indexedDB',
      include: ['importantData'],
      options: { dbName: 'Primary', storeName: 'data' }
    },
    // Backup storage
    {
      adapter: 'localStorage',
      key: 'backup',
      include: ['importantData'],
      beforeHydrate: (slice) => {
        // Only use backup if primary failed
        if (!primaryDataLoaded) {
          console.log('Using backup data from localStorage')
          return slice
        }
        return null // Skip if primary loaded successfully
      }
    }
  ],
  onError: (error, ctx) => {
    if (ctx.adapter === 'indexedDB' && ctx.operation === 'write') {
      // Primary storage failed, ensure backup is updated
      console.log('Primary storage failed, updating backup')
      updateBackupStorage(ctx.storeId)
    }
  }
}
```

## 🧪 Error Simulation & Testing

### Development Error Testing

Test error handling during development:

```typescript
// utils/storage-testing.ts
export function simulateStorageFailure(adapter: string, operation: string) {
  if (process.env.NODE_ENV !== 'development') return
  
  const originalMethod = window[adapter]?.[operation]
  if (originalMethod) {
    window[adapter][operation] = () => {
      throw new Error(`Simulated ${adapter} ${operation} failure`)
    }
    
    // Restore after 5 seconds
    setTimeout(() => {
      window[adapter][operation] = originalMethod
    }, 5000)
  }
}

// In your app during development:
if (process.env.NODE_ENV === 'development') {
  // Test localStorage failure
  simulateStorageFailure('localStorage', 'setItem')
  
  // Test quota exceeded
  const quota = () => {
    throw Object.assign(new Error('QuotaExceededError'), { name: 'QuotaExceededError' })
  }
  window.localStorage.setItem = quota
}
```

### Error Monitoring

Set up comprehensive error monitoring:

```typescript
class StorageErrorTracker {
  private errors: Array<{ error: Error; context: ErrorContext; timestamp: number }> = []
  
  track(error: Error, context: ErrorContext) {
    this.errors.push({
      error,
      context,
      timestamp: Date.now()
    })
    
    // Send to external service
    this.sendToService(error, context)
    
    // Clean old errors (keep last 100)
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100)
    }
  }
  
  getErrorStats() {
    const now = Date.now()
    const lastHour = this.errors.filter(e => now - e.timestamp < 3600000)
    
    return {
      totalErrors: this.errors.length,
      errorsLastHour: lastHour.length,
      byAdapter: this.groupBy(lastHour, e => e.context.adapter),
      byStage: this.groupBy(lastHour, e => e.context.stage)
    }
  }
  
  private groupBy<T>(array: T[], keyFn: (item: T) => string) {
    return array.reduce((groups, item) => {
      const key = keyFn(item)
      groups[key] = (groups[key] || 0) + 1
      return groups
    }, {} as Record<string, number>)
  }
  
  private sendToService(error: Error, context: ErrorContext) {
    // Send to your error tracking service
    if (window.analytics) {
      window.analytics.track('storage_error', {
        error_name: error.name,
        error_message: error.message,
        ...context,
        user_agent: navigator.userAgent,
        timestamp: Date.now()
      })
    }
  }
}

const errorTracker = new StorageErrorTracker()

// Use in your storage configuration
storage: {
  onError: (error, context) => {
    errorTracker.track(error, context)
  }
}
```

## 🎯 Common Error Scenarios

### Quota Exceeded

Handle storage quota limits:

```typescript
onError: (error, ctx) => {
  if (error.name === 'QuotaExceededError') {
    // Strategy 1: Clear old data
    clearOldData(ctx.adapter)
    
    // Strategy 2: Compress data
    if (ctx.operation === 'write') {
      compressAndRetry(ctx)
    }
    
    // Strategy 3: User notification with options
    showQuotaExceededDialog({
      onClearData: () => clearAllData(ctx.adapter),
      onUpgrade: () => suggestAlternativeStorage(),
      onIgnore: () => disableNonCriticalPersistence()
    })
  }
}

function clearOldData(adapter: string) {
  if (adapter === 'localStorage') {
    const keys = Object.keys(localStorage)
    const timestampedKeys = keys
      .filter(key => key.includes(':timestamp:'))
      .sort((a, b) => {
        const aTime = parseInt(a.split(':timestamp:')[1])
        const bTime = parseInt(b.split(':timestamp:')[1])
        return aTime - bTime
      })
    
    // Remove oldest 25% of data
    const toRemove = timestampedKeys.slice(0, Math.ceil(timestampedKeys.length * 0.25))
    toRemove.forEach(key => localStorage.removeItem(key))
  }
}
```

### Private Browsing Mode

Handle private browsing limitations:

```typescript
function detectPrivateBrowsing(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const test = 'private-browsing-test'
      localStorage.setItem(test, 'test')
      localStorage.removeItem(test)
      resolve(false) // Not private browsing
    } catch {
      resolve(true) // Private browsing detected
    }
  })
}

// In your store setup
const isPrivate = await detectPrivateBrowsing()
const storageConfig = isPrivate 
  ? { adapter: 'sessionStorage' } // Fallback for private browsing
  : { adapter: 'localStorage' }   // Normal persistence

export const useStore = defineStore('store', () => {
  // ... store logic
}, {
  storage: storageConfig
})
```

### Database Corruption

Handle IndexedDB corruption:

```typescript
onError: async (error, ctx) => {
  if (ctx.adapter === 'indexedDB' && 
      (error.name === 'CorruptionError' || error.name === 'DataError')) {
    
    console.warn('IndexedDB corruption detected, attempting recovery')
    
    try {
      // Close all connections
      if (ctx.options?.dbName) {
        // Custom recovery logic
        await resetIndexedDB(ctx.options.dbName)
        
        // Notify user
        showNotification('Database recovered. Some data may be lost.', 'warning')
        
        // Reload the page to start fresh
        window.location.reload()
      }
    } catch (recoveryError) {
      console.error('Database recovery failed:', recoveryError)
      
      // Fallback to localStorage
      fallbackToLocalStorage(ctx.storeId)
    }
  }
}

async function resetIndexedDB(dbName: string) {
  return new Promise((resolve, reject) => {
    const deleteReq = indexedDB.deleteDatabase(dbName)
    deleteReq.onsuccess = () => resolve(void 0)
    deleteReq.onerror = () => reject(deleteReq.error)
  })
}
```

## 📊 Error Reporting & Analytics

### Error Dashboard

Create an error monitoring dashboard:

```typescript
// stores/error-monitoring.ts
export const useErrorMonitoringStore = defineStore('errorMonitoring', () => {
  const errors = ref([])
  const errorStats = ref({})
  
  const addError = (error: Error, context: ErrorContext) => {
    errors.value.push({
      id: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString(),
      resolved: false
    })
    
    updateStats()
  }
  
  const updateStats = () => {
    const last24h = errors.value.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
    )
    
    errorStats.value = {
      total: errors.value.length,
      last24h: last24h.length,
      byAdapter: groupBy(last24h, 'context.adapter'),
      byStage: groupBy(last24h, 'context.stage'),
      criticalErrors: last24h.filter(e => 
        e.context.key?.includes('user') || 
        e.context.key?.includes('auth')
      ).length
    }
  }
  
  return { errors, errorStats, addError }
}, {
  storage: {
    adapter: 'localStorage',
    key: 'error-monitoring',
    debounceDelayMs: 1000
  }
})
```

### User-Friendly Error Messages

Provide helpful error messages to users:

```typescript
function getUserFriendlyErrorMessage(error: Error, context: ErrorContext): string {
  const { adapter, stage, operation } = context
  
  if (error.name === 'QuotaExceededError') {
    return 'Storage space is full. Please clear some browser data or contact support.'
  }
  
  if (error.name === 'SecurityError') {
    return 'Storage is disabled in private browsing mode. Data will not be saved.'
  }
  
  if (adapter === 'indexedDB' && stage === 'hydrate') {
    return 'Unable to load saved data. The app will work but previous data may be lost.'
  }
  
  if (adapter === 'cookies' && operation === 'write') {
    return 'Unable to save login state. You may need to log in again.'
  }
  
  // Generic fallback
  return 'A storage error occurred. Some data may not be saved properly.'
}

// Use in error handler
onError: (error, ctx) => {
  const userMessage = getUserFriendlyErrorMessage(error, ctx)
  
  // Show user-friendly notification
  showNotification(userMessage, 'warning')
  
  // Log technical details separately
  console.error('Technical details:', error, ctx)
}
```

## 🛠️ Error Prevention

### Proactive Error Prevention

Prevent errors before they occur:

```typescript
// utils/storage-health.ts
export class StorageHealthCheck {
  static async checkLocalStorage(): Promise<boolean> {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, 'test')
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
  
  static async checkIndexedDB(): Promise<boolean> {
    try {
      const request = indexedDB.open('__health_check__', 1)
      return new Promise((resolve) => {
        request.onsuccess = () => {
          request.result.close()
          indexedDB.deleteDatabase('__health_check__')
          resolve(true)
        }
        request.onerror = () => resolve(false)
      })
    } catch {
      return false
    }
  }
  
  static getStorageInfo() {
    return {
      localStorage: {
        available: this.checkLocalStorage(),
        usage: this.getLocalStorageUsage()
      },
      sessionStorage: {
        available: this.checkSessionStorage(),
        usage: this.getSessionStorageUsage()
      },
      indexedDB: {
        available: this.checkIndexedDB()
      }
    }
  }
  
  private static getLocalStorageUsage(): number {
    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total
  }
}

// Use before setting up storage
const healthCheck = await StorageHealthCheck.getStorageInfo()
const recommendedAdapter = healthCheck.indexedDB.available 
  ? 'indexedDB' 
  : healthCheck.localStorage.available 
    ? 'localStorage' 
    : 'sessionStorage'
```

By implementing comprehensive error handling, you ensure your application remains stable and user-friendly even when storage operations fail.
