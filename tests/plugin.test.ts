import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { createPiniaPluginStorage, updateStorage } from '../src/plugin'
import { localStorageMock } from './setup'

// Test store definitions using composition API
const useBasicStore = defineStore('basic', () => {
  const count = ref(0)
  const name = ref('test')
  const nested = ref({ value: 42 })

  function increment() {
    count.value++
  }

  function updateName(newName: string) {
    name.value = newName
  }

  return { count, name, nested, increment, updateName }
})

const useStorageStore = defineStore(
  'storage',
  () => {
    const count = ref(0)
    const name = ref('test')
    const temp = ref('not-persisted')

    function increment() {
      count.value++
    }

    function updateName(newName: string) {
      name.value = newName
    }

    return { count, name, temp, increment, updateName }
  },
  {
    storage: 'localStorage',
  },
)

// Currently unused but kept for future bucket testing
// const useBucketStore = defineStore(
//   'bucket',
//   () => {
//     const persistentData = ref('important')
//     const sessionData = ref('temporary')
//     const localData = ref('cached')
//     const excludedData = ref('volatile')

//     function updatePersistent(value: string) {
//       persistentData.value = value
//     }

//     function updateSession(value: string) {
//       sessionData.value = value
//     }

//     function updateLocal(value: string) {
//       localData.value = value
//     }

//     return {
//       persistentData,
//       sessionData,
//       localData,
//       excludedData,
//       updatePersistent,
//       updateSession,
//       updateLocal,
//     }
//   },
//   {
//     storage: {
//       buckets: [
//         {
//           adapter: 'localStorage',
//           include: ['persistentData', 'localData'],
//           key: 'persistent-bucket',
//         },
//         {
//           adapter: 'sessionStorage',
//           include: ['sessionData'],
//           key: 'session-bucket',
//         },
//       ],
//     },
//   },
// )

describe('Pinia Plugin Storage', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    pinia.use(createPiniaPluginStorage)
    setActivePinia(pinia)
  })

  describe('Plugin Registration', () => {
    it('registers without errors', () => {
      expect(() => {
        const testPinia = createPinia()
        testPinia.use(createPiniaPluginStorage)
      }).not.toThrow()
    })

    it('works with stores without storage configuration', () => {
      const store = useBasicStore()
      expect(store.count).toBe(0)

      store.increment()
      expect(store.count).toBe(1)

      // Should not call storage
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Basic Storage Configuration', () => {
    it('initializes store with default values when no stored data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const store = useStorageStore()
      expect(store.count).toBe(0)
      expect(store.name).toBe('test')
    })

    it('handles storage errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const store = useStorageStore()
      store.increment()

      // Wait for persistence attempt
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Store should still function
      expect(store.count).toBe(1)

      consoleSpy.mockRestore()
    })
  })

  describe('External API', () => {
    it('updateStorage function works', async () => {
      const store = useBasicStore()
      store.increment()

      await updateStorage({ adapter: 'localStorage', include: ['count'] }, store)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('basic', JSON.stringify({ count: 1 }))
    })
  })

  describe('Edge Cases', () => {
    it('handles invalid JSON in storage', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json{')

      const store = useStorageStore()

      // Wait for hydration attempt
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Should fall back to default values
      expect(store.count).toBe(0)
      expect(store.name).toBe('test')
    })

    it('handles null values in storage', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const store = useStorageStore()

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(store.count).toBe(0)
    })

    it('handles empty storage values', async () => {
      localStorageMock.getItem.mockReturnValue('')

      const store = useStorageStore()

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(store.count).toBe(0)
    })

    it('prevents hydration during persistence', async () => {
      const store = useStorageStore()

      // Trigger rapid changes
      store.increment()
      store.increment()
      store.increment()

      // Should not cause race conditions
      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(store.count).toBe(3)
    })
  })
})
