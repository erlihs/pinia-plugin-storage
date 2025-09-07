import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { performHydration, persistPlan, initializeChangeDetection } from '../src/operations'
import { localStorageMock, sessionStorageMock } from './setup'
import type { BucketPlan } from '../src/operations'

// Mock adapters for testing
const createMockAdapter = (getData: any = null) => ({
  getItem: vi.fn().mockResolvedValue(getData ? JSON.stringify(getData) : null),
  setItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn(() => () => {})
})

describe('Operations', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('Hydration', () => {
    it('performs basic hydration from storage', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        const name = ref('default')
        return { count, name }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter({ count: 5, name: 'hydrated' })
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { adapter: 'localStorage' },
        adapter: mockAdapter
      }]

      await performHydration(store, bucketPlans, undefined, undefined, undefined)

      expect(mockAdapter.getItem).toHaveBeenCalledWith('test')
      expect(store.count).toBe(5)
      expect(store.name).toBe('hydrated')
    })

    it('handles hydration with namespace and version', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter({ count: 10 })
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { adapter: 'localStorage', key: 'data' },
        adapter: mockAdapter
      }]

      await performHydration(store, bucketPlans, undefined, 'myapp', 'v1')

      expect(mockAdapter.getItem).toHaveBeenCalledWith('myapp:vv1:test:data')
      expect(store.count).toBe(10)
    })

    it('handles hydration with custom key', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter({ count: 15 })
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { adapter: 'localStorage', key: 'custom-key' },
        adapter: mockAdapter
      }]

      await performHydration(store, bucketPlans, undefined, undefined, undefined)

      expect(mockAdapter.getItem).toHaveBeenCalledWith('test:custom-key')
      expect(store.count).toBe(15)
    })

    it('handles hydration with include fields', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        const name = ref('default')
        const temp = ref('temp')
        return { count, name, temp }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter({ 
        count: 20, 
        name: 'hydrated',
        temp: 'should-be-ignored'
      })
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { 
          adapter: 'localStorage', 
          include: ['count', 'name']
        },
        adapter: mockAdapter
      }]

      await performHydration(store, bucketPlans, undefined, undefined, undefined)

      expect(store.count).toBe(20)
      expect(store.name).toBe('hydrated')
      expect(store.temp).toBe('temp') // Should remain default
    })

    it('handles hydration errors gracefully', async () => {
      const onError = vi.fn()
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = {
        getItem: vi.fn().mockRejectedValue(new Error('Storage error')),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        subscribe: vi.fn(() => () => {})
      }
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { adapter: 'localStorage' },
        adapter: mockAdapter
      }]

      await performHydration(store, bucketPlans, onError, undefined, undefined)

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          stage: 'hydrate',
          operation: 'read',
          storeId: 'test',
          adapter: 'localStorage'
        })
      )
      expect(store.count).toBe(0) // Should remain default
    })

    it('handles beforeHydrate transformations', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter({ count: 100 })
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { 
          adapter: 'localStorage',
          beforeHydrate: (slice) => {
            return { count: (slice as any).count * 2 }
          }
        },
        adapter: mockAdapter
      }]

      await performHydration(store, bucketPlans, undefined, undefined, undefined)

      expect(store.count).toBe(200) // 100 * 2
    })

    it('handles invalid JSON in storage', async () => {
      const onError = vi.fn()
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = {
        getItem: vi.fn().mockResolvedValue('invalid-json{'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        subscribe: vi.fn(() => () => {})
      }
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { adapter: 'localStorage' },
        adapter: mockAdapter
      }]

      await performHydration(store, bucketPlans, onError, undefined, undefined)

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          stage: 'hydrate',
          operation: 'parse'
        })
      )
      expect(store.count).toBe(0) // Should remain default
    })
  })

  describe('Persistence', () => {
    it('persists state changes', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(5)
        const name = ref('test')
        return { count, name }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter()
      
      const bucketPlan: BucketPlan = {
        bucket: { adapter: 'localStorage' },
        adapter: mockAdapter
      }

      const bucketLastStates = new Map()
      
      await persistPlan(bucketPlan, store, bucketLastStates, undefined, undefined, undefined)

      expect(mockAdapter.setItem).toHaveBeenCalledWith(
        'test',
        JSON.stringify({ count: 5, name: 'test' })
      )
    })

    it('skips persistence if state unchanged', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(5)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter()
      
      const bucketPlan: BucketPlan = {
        bucket: { adapter: 'localStorage' },
        adapter: mockAdapter
      }

      const bucketLastStates = new Map()
      const stateJson = JSON.stringify({ count: 5 })
      bucketLastStates.set(bucketPlan, stateJson)
      
      await persistPlan(bucketPlan, store, bucketLastStates, undefined, undefined, undefined)

      expect(mockAdapter.setItem).not.toHaveBeenCalled()
    })

    it('persists with namespace and version', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(10)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter()
      
      const bucketPlan: BucketPlan = {
        bucket: { adapter: 'localStorage', key: 'data' },
        adapter: mockAdapter
      }

      const bucketLastStates = new Map()
      
      await persistPlan(bucketPlan, store, bucketLastStates, undefined, 'myapp', 'v2')

      expect(mockAdapter.setItem).toHaveBeenCalledWith(
        'myapp:vv2:test:data',
        JSON.stringify({ count: 10 })
      )
    })

    it('handles persistence errors', async () => {
      const onError = vi.fn()
      const useTestStore = defineStore('test', () => {
        const count = ref(5)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = {
        getItem: vi.fn(),
        setItem: vi.fn().mockRejectedValue(new Error('Storage quota exceeded')),
        removeItem: vi.fn(),
        subscribe: vi.fn(() => () => {})
      }
      
      const bucketPlan: BucketPlan = {
        bucket: { adapter: 'localStorage' },
        adapter: mockAdapter
      }

      const bucketLastStates = new Map()
      
      await persistPlan(bucketPlan, store, bucketLastStates, onError, undefined, undefined)

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          stage: 'persist',
          operation: 'write',
          storeId: 'test',
          adapter: 'localStorage'
        })
      )
    })

    it('persists only included fields', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(5)
        const name = ref('test')
        const temp = ref('temporary')
        return { count, name, temp }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter()
      
      const bucketPlan: BucketPlan = {
        bucket: { 
          adapter: 'localStorage',
          include: ['count', 'name']
        },
        adapter: mockAdapter
      }

      const bucketLastStates = new Map()
      
      await persistPlan(bucketPlan, store, bucketLastStates, undefined, undefined, undefined)

      expect(mockAdapter.setItem).toHaveBeenCalledWith(
        'test',
        JSON.stringify({ count: 5, name: 'test' })
      )
    })
  })

  describe('Change Detection', () => {
    it('initializes change detection state', () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(5)
        return { count }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter()
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { adapter: 'localStorage' },
        adapter: mockAdapter
      }]

      const bucketLastStates = new Map()
      
      initializeChangeDetection(bucketPlans, store, bucketLastStates)

      expect(bucketLastStates.has(bucketPlans[0])).toBe(true)
      expect(bucketLastStates.get(bucketPlans[0])).toBe(
        JSON.stringify({ count: 5 })
      )
    })

    it('initializes change detection with filtered state', () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(5)
        const name = ref('test')
        const temp = ref('ignored')
        return { count, name, temp }
      })

      const store = useTestStore()
      const mockAdapter = createMockAdapter()
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { 
          adapter: 'localStorage',
          include: ['count']
        },
        adapter: mockAdapter
      }]

      const bucketLastStates = new Map()
      
      initializeChangeDetection(bucketPlans, store, bucketLastStates)

      expect(bucketLastStates.get(bucketPlans[0])).toBe(
        JSON.stringify({ count: 5 })
      )
    })

    it('handles multiple bucket plans', () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(5)
        const name = ref('test')
        return { count, name }
      })

      const store = useTestStore()
      
      const bucketPlans: BucketPlan[] = [
        {
          bucket: { adapter: 'localStorage', include: ['count'] },
          adapter: createMockAdapter()
        },
        {
          bucket: { adapter: 'sessionStorage', include: ['name'] },
          adapter: createMockAdapter()
        }
      ]

      const bucketLastStates = new Map()
      
      initializeChangeDetection(bucketPlans, store, bucketLastStates)

      expect(bucketLastStates.size).toBe(2)
      expect(bucketLastStates.get(bucketPlans[0])).toBe(JSON.stringify({ count: 5 }))
      expect(bucketLastStates.get(bucketPlans[1])).toBe(JSON.stringify({ name: 'test' }))
    })
  })

  describe('Integration', () => {
    it('full hydration and persistence cycle', async () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        const name = ref('default')
        return { count, name }
      })

      const store = useTestStore()
      
      // Mock adapter with initial data
      const mockAdapter = createMockAdapter({ count: 42, name: 'stored' })
      
      const bucketPlans: BucketPlan[] = [{
        bucket: { adapter: 'localStorage' },
        adapter: mockAdapter
      }]

      const bucketLastStates = new Map()

      // 1. Hydrate from storage
      await performHydration(store, bucketPlans, undefined, undefined, undefined)
      
      expect(store.count).toBe(42)
      expect(store.name).toBe('stored')

      // 2. Initialize change detection
      initializeChangeDetection(bucketPlans, store, bucketLastStates)

      // 3. Make changes
      store.count = 100
      store.name = 'updated'

      // 4. Persist changes
      mockAdapter.setItem.mockClear() // Clear previous calls
      await persistPlan(bucketPlans[0], store, bucketLastStates, undefined, undefined, undefined)

      expect(mockAdapter.setItem).toHaveBeenCalledWith(
        'test',
        JSON.stringify({ count: 100, name: 'updated' })
      )
    })
  })
})
