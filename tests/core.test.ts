import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { resolveBuckets } from '../src/core/bucket-resolver'
import { resolveStorage } from '../src/core/storage-resolver'
import { resolveOnError } from '../src/core/error-handling'
import { resolveState } from '../src/core/state-resolver'
import type { StorageOptions } from '../src/types'

describe('Core Modules', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('Bucket Resolver', () => {
    it('resolves simple string storage option', () => {
      const buckets = resolveBuckets('localStorage')

      expect(buckets).toEqual([
        {
          adapter: 'localStorage',
        },
      ])
    })

    it('resolves single bucket object', () => {
      const config = {
        adapter: 'sessionStorage' as const,
        include: ['count'],
        key: 'session-data',
      }

      const buckets = resolveBuckets(config)

      expect(buckets).toEqual([config])
    })

    it('resolves buckets array', () => {
      const config = {
        buckets: [
          { adapter: 'localStorage' as const, include: ['count'] },
          { adapter: 'sessionStorage' as const, include: ['name'] },
        ],
      }

      const buckets = resolveBuckets(config)

      expect(buckets).toEqual(config.buckets)
    })

    it('resolves single bucket in buckets property', () => {
      const bucket = { adapter: 'localStorage' as const, include: ['count'] }
      const config = { buckets: bucket }

      const buckets = resolveBuckets(config)

      expect(buckets).toEqual([bucket])
    })

    it('handles complex storage options', () => {
      const config: StorageOptions = {
        namespace: 'app',
        version: 'v1',
        debounceDelayMs: 100,
        buckets: [
          {
            adapter: 'localStorage',
            include: ['persistent'],
            key: 'app-data',
          },
          {
            adapter: 'cookies',
            include: ['session'],
            options: { maxAgeSeconds: 3600 },
          },
        ],
        onError: vi.fn(),
      }

      const buckets = resolveBuckets(config)

      expect(buckets).toEqual(config.buckets)
      expect(buckets).toHaveLength(2)
      expect(buckets[0].adapter).toBe('localStorage')
      expect(buckets[1].adapter).toBe('cookies')
    })
  })

  describe('Storage Resolver', () => {
    it('resolves localStorage adapter', () => {
      const bucket = { adapter: 'localStorage' as const }
      const adapter = resolveStorage(bucket, 'test-store')

      expect(adapter).toBeDefined()
      expect(typeof adapter.getItem).toBe('function')
      expect(typeof adapter.setItem).toBe('function')
    })

    it('resolves sessionStorage adapter', () => {
      const bucket = { adapter: 'sessionStorage' as const }
      const adapter = resolveStorage(bucket, 'test-store')

      expect(adapter).toBeDefined()
    })

    it('resolves cookies adapter with options', () => {
      const bucket = {
        adapter: 'cookies' as const,
        options: {
          path: '/app',
          maxAgeSeconds: 3600,
        },
      }
      const adapter = resolveStorage(bucket, 'test-store')

      expect(adapter).toBeDefined()
    })

    it('resolves indexedDB adapter with options', () => {
      const bucket = {
        adapter: 'indexedDB' as const,
        options: {
          dbName: 'TestDB',
          storeName: 'TestStore',
        },
      }
      const adapter = resolveStorage(bucket, 'test-store')

      expect(adapter).toBeDefined()
    })

    it('resolves indexedDB adapter with default options', () => {
      const bucket = { adapter: 'indexedDB' as const }
      const adapter = resolveStorage(bucket, 'test-store')

      expect(adapter).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('returns undefined for string storage options', () => {
      const onError = resolveOnError('localStorage')
      expect(onError).toBeUndefined()
    })

    it('returns undefined for bucket objects without onError', () => {
      const config = { adapter: 'localStorage' as const }
      const onError = resolveOnError(config)
      expect(onError).toBeUndefined()
    })

    it('returns onError function from complex storage options', () => {
      const errorHandler = vi.fn()
      const config: StorageOptions = {
        buckets: { adapter: 'localStorage' },
        onError: errorHandler,
      }

      const onError = resolveOnError(config)
      expect(onError).toBe(errorHandler)
    })

    it('calls onError with correct context', () => {
      const errorHandler = vi.fn()
      const config: StorageOptions = {
        buckets: { adapter: 'localStorage' },
        onError: errorHandler,
      }

      const onError = resolveOnError(config)
      const error = new Error('Test error')
      const context = {
        stage: 'persist' as const,
        operation: 'write' as const,
        storeId: 'test-store',
        adapter: 'localStorage',
        key: 'test-key',
      }

      onError?.(error, context)

      expect(errorHandler).toHaveBeenCalledWith(error, context)
    })
  })

  describe('State Resolver', () => {
    it('returns full state when no include/exclude specified', () => {
      const state = {
        count: 5,
        name: 'test',
        nested: { value: 42 },
      }

      const result = resolveState(state, undefined, undefined)
      expect(result).toEqual(state)
    })

    it('includes only specified fields with string include', () => {
      const state = {
        count: 5,
        name: 'test',
        temp: 'ignored',
      }

      const result = resolveState(state, 'count', undefined)
      expect(result).toEqual({ count: 5 })
    })

    it('includes only specified fields with array include', () => {
      const state = {
        count: 5,
        name: 'test',
        temp: 'ignored',
      }

      const result = resolveState(state, ['count', 'name'], undefined)
      expect(result).toEqual({ count: 5, name: 'test' })
    })

    it('excludes specified fields with string exclude', () => {
      const state = {
        count: 5,
        name: 'test',
        temp: 'ignored',
      }

      const result = resolveState(state, undefined, 'temp')
      expect(result).toEqual({ count: 5, name: 'test' })
    })

    it('excludes specified fields with array exclude', () => {
      const state = {
        count: 5,
        name: 'test',
        temp: 'ignored',
        other: 'also-ignored',
      }

      const result = resolveState(state, undefined, ['temp', 'other'])
      expect(result).toEqual({ count: 5, name: 'test' })
    })

    it('handles non-existent include fields gracefully', () => {
      const state = {
        count: 5,
        name: 'test',
      }

      const result = resolveState(state, ['count', 'nonexistent'], undefined)
      expect(result).toEqual({ count: 5 })
    })

    it('handles non-existent exclude fields gracefully', () => {
      const state = {
        count: 5,
        name: 'test',
      }

      const result = resolveState(state, undefined, ['nonexistent'])
      expect(result).toEqual({ count: 5, name: 'test' })
    })

    it('handles empty include array', () => {
      const state = {
        count: 5,
        name: 'test',
      }

      const result = resolveState(state, [], undefined)
      expect(result).toEqual({})
    })

    it('handles empty exclude array', () => {
      const state = {
        count: 5,
        name: 'test',
      }

      const result = resolveState(state, undefined, [])
      expect(result).toEqual({ count: 5, name: 'test' })
    })

    it('works with nested objects in includes', () => {
      const state = {
        user: { name: 'John', age: 30 },
        count: 5,
        temp: 'ignored',
      }

      const result = resolveState(state, ['user', 'count'], undefined)
      expect(result).toEqual({
        user: { name: 'John', age: 30 },
        count: 5,
      })
    })

    it('preserves reactive state structure', () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(5)
        const name = ref('test')
        return { count, name }
      })

      const store = useTestStore()
      const result = resolveState(store.$state, ['count'], undefined)

      expect(result).toEqual({ count: 5 })
      expect(result).not.toBe(store.$state)
    })
  })

  describe('Integration Tests', () => {
    it('all core modules work together', () => {
      const config: StorageOptions = {
        namespace: 'test-app',
        version: 'v1',
        buckets: [
          {
            adapter: 'localStorage',
            include: ['count'],
            key: 'counter-data',
          },
        ],
        onError: vi.fn(),
      }

      // Resolve buckets
      const buckets = resolveBuckets(config)
      expect(buckets).toHaveLength(1)

      // Resolve storage adapter
      const adapter = resolveStorage(buckets[0], 'test-store')
      expect(adapter).toBeDefined()

      // Resolve error handler
      const onError = resolveOnError(config)
      expect(onError).toBe(config.onError)

      // Resolve state
      const state = { count: 5, name: 'test', temp: 'ignored' }
      const resolvedState = resolveState(state, buckets[0].include, buckets[0].exclude)
      expect(resolvedState).toEqual({ count: 5 })
    })

    it('handles edge cases in integration', () => {
      // Test with minimal configuration
      const buckets = resolveBuckets('localStorage')
      const adapter = resolveStorage(buckets[0], 'minimal-store')
      const onError = resolveOnError('localStorage')
      const state = resolveState({ data: 'test' }, undefined, undefined)

      expect(buckets).toHaveLength(1)
      expect(adapter).toBeDefined()
      expect(onError).toBeUndefined()
      expect(state).toEqual({ data: 'test' })
    })
  })
})
