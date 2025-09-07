import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStoreAdvanced = defineStore(
  'counter-advanced',
  () => {
    // Session Storage counter
    const countS = ref(0)
    const extCountS = ref({
      decimal: 0,
      hex: '0x0',
    })

    function incrementS(incrementBy?: number) {
      countS.value += incrementBy ?? 1
      extCountS.value.decimal = countS.value
      extCountS.value.hex = '0x' + countS.value.toString(16)
    }

    // Local Storage counter
    const countL = ref(0)
    const extCountL = ref({
      decimal: 0,
      hex: '0x0',
    })

    function incrementL(incrementBy?: number) {
      countL.value += incrementBy ?? 1
      extCountL.value.decimal = countL.value
      extCountL.value.hex = '0x' + countL.value.toString(16)
    }

    // Cookie counter
    const countC = ref(0)
    const extCountC = ref({
      decimal: 0,
      hex: '0x0',
    })

    function incrementC(incrementBy?: number) {
      countC.value += incrementBy ?? 1
      extCountC.value.decimal = countC.value
      extCountC.value.hex = '0x' + countC.value.toString(16)
    }

    // IndexedDB counter
    const countI = ref(0)
    const extCountI = ref({
      decimal: 0,
      hex: '0x0',
    })

    function incrementI(incrementBy?: number) {
      countI.value += incrementBy ?? 1
      extCountI.value.decimal = countI.value
      extCountI.value.hex = '0x' + countI.value.toString(16)
    }

    return {
      countS,
      extCountS,
      incrementS,
      countL,
      extCountL,
      incrementL,
      countC,
      extCountC,
      incrementC,
      countI,
      extCountI,
      incrementI,
    }
  },
  {
    storage: {
      namespace: 'app', // Global namespace for all keys
      version: '2', // Versioning for schema migrations
      debounceDelayMs: 100, // Global debounce delay
      buckets: [
        // Session Storage bucket - stores session-only data
        {
          adapter: 'sessionStorage',
          key: 'session-counters', // Custom storage key
          include: ['countS', 'extCountS'],
          debounceDelayMs: 50, // Override global debounce for faster session updates
          beforeHydrate: (slice, store) => {
            console.log('🔄 Session Storage: Before hydrate for store', store.$id, slice)
            // Transform data if needed before merging into store
            return slice
          },
        },
        // Local Storage bucket - persists across sessions
        {
          adapter: 'localStorage',
          key: 'persistent-counters',
          include: ['countL', 'extCountL'],
          debounceDelayMs: 200, // Slower updates for persistent storage
          beforeHydrate: (slice, store) => {
            console.log('💾 Local Storage: Before hydrate for store', store.$id, slice)
            return slice
          },
        },
        // Cookie Storage bucket - with advanced cookie options
        {
          adapter: 'cookies',
          key: 'cookie-counters',
          include: ['countC', 'extCountC'],
          debounceDelayMs: 300, // Even slower for cookies due to size limitations
          options: {
            path: '/',
            domain: undefined, // Use current domain
            secure: false, // Set to true in HTTPS environments
            sameSite: 'Lax',
            maxAgeSeconds: 30, // 30 seconds
            priority: 'Medium',
            // partitioned: true, // For third-party contexts
          },
          beforeHydrate: (slice, store) => {
            console.log('🍪 Cookie Storage: Before hydrate for store', store.$id, slice)
            // Cookies have size limitations, might need data compression
            return slice
          },
        },
        // IndexedDB bucket - for complex data structures
        {
          adapter: 'indexedDB',
          key: 'indexed-counters',
          include: ['countI', 'extCountI'],
          debounceDelayMs: 150, // Moderate debounce for IndexedDB
          options: {
            dbName: 'PiniaAdvancedDemo',
            storeName: 'counters',
            dbVersion: 1,
          },
          beforeHydrate: (slice, store) => {
            console.log('🗄️ IndexedDB: Before hydrate for store', store.$id, slice)
            // IndexedDB can handle complex objects and large data
            return slice
          },
        },
      ],
      // Example of comprehensive error handling
      onError: (error, ctx) => {
        console.warn(
          `🚨 Storage error in ${ctx.stage}/${ctx.operation} for ${ctx.storeId} (${ctx.adapter}):`,
          error,
        )

        // Different error handling strategies per adapter
        switch (ctx.adapter) {
          case 'cookies':
            if (ctx.operation === 'write') {
              console.warn('Cookie storage might be full or disabled')
            }
            break
          case 'localStorage':
            if (ctx.operation === 'write') {
              console.warn('Local storage quota might be exceeded')
            }
            break
          case 'sessionStorage':
            if (ctx.operation === 'write') {
              console.warn('Session storage quota might be exceeded')
            }
            break
          case 'indexedDB':
            if (ctx.operation === 'write') {
              console.warn('IndexedDB transaction failed - database might be locked')
            }
            break
        }

        // In production, you might want to send this to your error tracking service
        // errorTracker.captureException(error, {
        //   extra: {
        //     ...ctx,
        //     userAgent: navigator.userAgent,
        //     timestamp: new Date().toISOString()
        //   }
        // })
      },
    },
  },
)
