import { ref } from 'vue'
import { defineStore } from 'pinia'
import '@/plugin/types'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  const extCount = ref({
    decimal: 0,
    hex: '0x0',
  })

  function increment() {
    count.value++

    extCount.value.decimal = count.value
    extCount.value.hex = '0x' + count.value.toString(16)
  }

  return { count, extCount, increment }
})

export const useCounterStoreDefault = defineStore(
  'counter-default',
  () => {
    const count = ref(0)

    const extCount = ref({
      decimal: 0,
      hex: '0x0',
    })

    function increment() {
      count.value++

      extCount.value.decimal = count.value
      extCount.value.hex = '0x' + count.value.toString(16)
    }

    return { count, extCount, increment }
  },
  {
    storage: {
      debounceDelayMs: 500,
      buckets: [
        {
          adapter: 'localStorage',
          include: ['count', 'extCount'],
          beforeHydrate: (slice, store) => {
            console.log('Before Hydrate slice for store', store.$id, slice)
          },
        },
      ],
      // Example of comprehensive error handling
      onError: (error, ctx) => {
        console.warn(
          `Storage error in ${ctx.stage}/${ctx.operation} for ${ctx.storeId} (${ctx.adapter}):`,
          error,
        )
        // In production, you might want to send this to your error tracking service
        // errorTracker.captureException(error, { extra: ctx })
      },
    },
  },
)

export const useCounterStoreAdvanced = defineStore(
  'counter-advanced',
  () => {
    const count = ref(0)

    const extCount = ref({
      decimal: 0,
      hex: '0x0',
    })

    function increment() {
      count.value++

      extCount.value.decimal = count.value
      extCount.value.hex = '0x' + count.value.toString(16)
    }

    return { count, extCount, increment }
  },
  {
    storage: {
      buckets: [
        {
          adapter: 'cookies',
          include: ['count', 'extCount'],
          options: {
            maxAgeSeconds: 30,
          },
        },
      ],
    },
  },
)

export const useCounterStoreSession = defineStore(
  'counter-session',
  () => {
    const count = ref(0)

    const extCount = ref({
      decimal: 0,
      hex: '0x0',
    })

    function increment() {
      count.value++

      extCount.value.decimal = count.value
      extCount.value.hex = '0x' + count.value.toString(16)
    }

    return { count, extCount, increment }
  },
  {
    storage: 'sessionStorage',
  },
)

export const useCounterStoreIndexedDB = defineStore(
  'counter-indexedDB',
  () => {
    const count = ref(0)

    const extCount = ref({
      decimal: 0,
      hex: '0x0',
    })

    function increment() {
      count.value++

      extCount.value.decimal = count.value
      extCount.value.hex = '0x' + count.value.toString(16)
    }

    return { count, extCount, increment }
  },
  {
    storage: 'indexedDB',
  },
)

// Demo store for testing cross-tab sync with multiple buckets
export const useCounterStoreCrossTab = defineStore(
  'counter-crosstab',
  () => {
    const count = ref(0)
    const name = ref('Default User')
    const settings = ref({
      theme: 'light',
      notifications: true,
    })

    function increment() {
      count.value++
    }

    function updateName(newName: string) {
      name.value = newName
    }

    function toggleTheme() {
      settings.value.theme = settings.value.theme === 'light' ? 'dark' : 'light'
    }

    return { count, name, settings, increment, updateName, toggleTheme }
  },
  {
    storage: {
      buckets: [
        {
          adapter: 'localStorage',
          include: ['count', 'name'], // Counter and name sync across tabs
        },
        {
          adapter: 'indexedDB',
          include: ['settings'], // Settings sync via IndexedDB
          options: { dbName: 'app', storeName: 'userSettings' },
        },
      ],
      onError: (error, ctx) => {
        console.warn(`Cross-tab sync error in ${ctx.stage}/${ctx.operation}:`, error)
      },
    },
  },
)

// Demo store showcasing KEY NAMESPACING features - prevents collisions and enables versioning
export const useCounterStoreNamespaced = defineStore(
  'counter-namespaced',
  () => {
    const count = ref(0)
    const metadata = ref({
      version: '2.0',
      lastUpdated: new Date().toISOString(),
    })

    function increment() {
      count.value++
      metadata.value.lastUpdated = new Date().toISOString()
    }

    return { count, metadata, increment }
  },
  {
    storage: {
      // Global namespacing prevents app collisions
      namespace: 'myApp', // Keys: "myApp:v2:counter-namespaced:main"
      version: '2', // Enables schema migration from v1 → v2

      buckets: [
        {
          adapter: 'localStorage',
          key: 'main', // Bucket identifier for multi-bucket setups
          include: ['count', 'metadata'],
        },
        {
          adapter: 'sessionStorage',
          key: 'cache', // Keys: "myApp:v2:counter-namespaced:cache"
          include: ['metadata'], // Different bucket for temporary metadata
        },
      ],

      onError: (error, ctx) => {
        console.warn(
          `Namespaced storage error in ${ctx.stage}/${ctx.operation} for key ${ctx.key}:`,
          error,
        )
      },
    },
  },
)
