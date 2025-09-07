import { describe, it, expect, beforeEach, vi } from 'vitest'
import { localStorageAdapter } from '../src/adapters/localStorage'
import { sessionStorageAdapter } from '../src/adapters/sessionStorage'
import { cookiesAdapter } from '../src/adapters/cookies'
import { indexedDBAdapter } from '../src/adapters/indexedDB'
import { localStorageMock, sessionStorageMock, indexedDBMock } from './setup'

describe('Storage Adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('localStorage Adapter', () => {
    it('getItem returns string data', async () => {
      const testData = '{"count":5,"name":"test"}'
      localStorageMock.getItem.mockReturnValue(testData)
      
      const adapter = localStorageAdapter()
      const result = await adapter.getItem('test-key')
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
      expect(result).toBe(testData)
    })

    it('getItem returns undefined for missing keys', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const adapter = localStorageAdapter()
      const result = await adapter.getItem('missing-key')
      
      expect(result).toBeUndefined()
    })

    it('getItem handles storage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })
      
      const adapter = localStorageAdapter()
      const result = await adapter.getItem('error-key')
      
      expect(result).toBeUndefined()
    })

    it('setItem stores string data', async () => {
      const testData = '{"count":5,"name":"test"}'
      
      const adapter = localStorageAdapter()
      await adapter.setItem('test-key', testData)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', testData)
    })

    it('setItem handles storage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const adapter = localStorageAdapter()
      
      // Should not throw error, fails silently
      await expect(adapter.setItem('test-key', 'data')).resolves.toBeUndefined()
    })

    it('removeItem calls localStorage.removeItem', async () => {
      const adapter = localStorageAdapter()
      await adapter.removeItem('test-key')
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
    })

    it('subscribe sets up storage event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const callback = vi.fn()
      
      const adapter = localStorageAdapter()
      const unsubscribe = adapter.subscribe?.('test-key', callback)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))
      
      unsubscribe?.()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))
    })
  })

  describe('sessionStorage Adapter', () => {
    it('getItem returns string data', async () => {
      const testData = '{"count":5,"name":"test"}'
      sessionStorageMock.getItem.mockReturnValue(testData)
      
      const adapter = sessionStorageAdapter()
      const result = await adapter.getItem('test-key')
      
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('test-key')
      expect(result).toBe(testData)
    })

    it('setItem stores string data', async () => {
      const testData = '{"count":5,"name":"test"}'
      
      const adapter = sessionStorageAdapter()
      await adapter.setItem('test-key', testData)
      
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test-key', testData)
    })
  })

  describe('cookies Adapter', () => {
    beforeEach(() => {
      // Reset document.cookie mock
      Object.defineProperty(document, 'cookie', {
        get: vi.fn(() => ''),
        set: vi.fn(),
        configurable: true,
      })
    })

    it('getItem parses cookie data', async () => {
      const testData = '{"count":5}'
      const cookieString = `test-key=${encodeURIComponent(testData)}`
      
      Object.defineProperty(document, 'cookie', {
        get: vi.fn(() => cookieString),
        set: vi.fn(),
        configurable: true,
      })
      
      const adapter = cookiesAdapter()
      const result = await adapter.getItem('test-key')
      
      expect(result).toBe(testData)
    })

    it('getItem returns undefined for missing cookies', async () => {
      Object.defineProperty(document, 'cookie', {
        get: vi.fn(() => ''),
        set: vi.fn(),
        configurable: true,
      })
      
      const adapter = cookiesAdapter()
      const result = await adapter.getItem('missing-key')
      
      expect(result).toBeUndefined()
    })

    it('setItem creates cookie with data', async () => {
      const testData = '{"count":5}'
      const setSpy = vi.fn()
      
      Object.defineProperty(document, 'cookie', {
        get: vi.fn(() => ''),
        set: setSpy,
        configurable: true,
      })
      
      const adapter = cookiesAdapter()
      await adapter.setItem('test-key', testData)
      
      expect(setSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-key=')
      )
    })

    it('setItem with custom options', async () => {
      const testData = '{"count":5}'
      const setSpy = vi.fn()
      
      Object.defineProperty(document, 'cookie', {
        get: vi.fn(() => ''),
        set: setSpy,
        configurable: true,
      })
      
      const adapter = cookiesAdapter({
        path: '/app',
        maxAgeSeconds: 3600,
        secure: true,
        sameSite: 'Strict'
      })
      
      await adapter.setItem('test-key', testData)
      
      const cookieCall = setSpy.mock.calls[0][0]
      expect(cookieCall).toContain('path=/app')
      expect(cookieCall).toContain('Max-Age=3600')
      expect(cookieCall).toContain('Secure')
      expect(cookieCall).toContain('SameSite=Strict')
    })

    it('removeItem sets cookie with past expiration', async () => {
      const setSpy = vi.fn()
      
      Object.defineProperty(document, 'cookie', {
        get: vi.fn(() => ''),
        set: setSpy,
        configurable: true,
      })
      
      const adapter = cookiesAdapter()
      await adapter.removeItem('test-key')
      
      expect(setSpy).toHaveBeenCalledWith(
        expect.stringContaining('Max-Age=0')
      )
    })
  })

  describe('indexedDB Adapter', () => {
    const defaultOptions = { dbName: 'TestDB', storeName: 'TestStore' }

    it('creates adapter with default options', () => {
      const adapter = indexedDBAdapter(defaultOptions)
      expect(adapter).toBeDefined()
      expect(typeof adapter.getItem).toBe('function')
      expect(typeof adapter.setItem).toBe('function')
      expect(typeof adapter.removeItem).toBe('function')
    })

    it('creates adapter with custom options', () => {
      const adapter = indexedDBAdapter({
        dbName: 'CustomDB',
        storeName: 'CustomStore',
        dbVersion: 2
      })
      expect(adapter).toBeDefined()
    })

    it('getItem handles missing data', async () => {
      // Mock IndexedDB operation that returns undefined
      const mockRequest = {
        onsuccess: null,
        onerror: null,
        result: undefined
      }
      
      const mockTransaction = {
        objectStore: vi.fn(() => ({
          get: vi.fn(() => mockRequest),
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
        })),
        oncomplete: null,
        onerror: null,
      }
      
      const mockDB = {
        transaction: vi.fn(() => mockTransaction),
        createObjectStore: vi.fn(),
        deleteObjectStore: vi.fn(),
        close: vi.fn(),
      }
      
      const mockOpen = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDB
      }
      
      indexedDBMock.open.mockReturnValue(mockOpen)
      
      const adapter = indexedDBAdapter(defaultOptions)
      
      // Simulate the async operation
      const getPromise = adapter.getItem('test-key')
      
      // Trigger success callbacks
      setTimeout(() => {
        if (mockOpen.onsuccess) {
          ;(mockOpen.onsuccess as any)({ target: { result: mockDB } })
        }
      }, 0)
      
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          ;(mockRequest.onsuccess as any)({ target: { result: undefined } })
        }
      }, 0)
      
      const result = await getPromise
      expect(result).toBeUndefined()
    })

    it('setItem works with string data', async () => {
      const testData = '{"count":5}'
      
      // Mock successful IndexedDB operation
      const mockRequest = {
        onsuccess: null,
        onerror: null
      }
      
      const mockTransaction = {
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({ onsuccess: null, onerror: null, result: undefined })),
          put: vi.fn(() => mockRequest),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
        })),
        oncomplete: null,
        onerror: null,
      }
      
      const mockDB = {
        transaction: vi.fn(() => mockTransaction),
        createObjectStore: vi.fn(),
        deleteObjectStore: vi.fn(),
        close: vi.fn(),
      }
      
      const mockOpen = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDB
      }
      
      indexedDBMock.open.mockReturnValue(mockOpen)
      
      const adapter = indexedDBAdapter(defaultOptions)
      
      // Simulate the async operation
      const setPromise = adapter.setItem('test-key', testData)
      
      // Trigger success callbacks
      setTimeout(() => {
        if (mockOpen.onsuccess) {
          ;(mockOpen.onsuccess as any)({ target: { result: mockDB } })
        }
      }, 0)
      
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          ;(mockRequest.onsuccess as any)({})
        }
      }, 0)
      
      await expect(setPromise).resolves.toBeUndefined()
    })

    it('handles IndexedDB errors gracefully', async () => {
      const mockOpen = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: {
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              get: vi.fn(() => ({ onsuccess: null, onerror: null, result: undefined })),
              put: vi.fn(() => ({ onsuccess: null, onerror: null })),
              delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
            })),
            oncomplete: null,
            onerror: null,
          })),
          createObjectStore: vi.fn(),
          deleteObjectStore: vi.fn(),
          close: vi.fn(),
        }
      }
      
      indexedDBMock.open.mockReturnValue(mockOpen)
      
      const adapter = indexedDBAdapter(defaultOptions)
      
      // Simulate the async operation
      const getPromise = adapter.getItem('test-key')
      
      // Trigger error callback
      setTimeout(() => {
        if (mockOpen.onerror) {
          ;(mockOpen.onerror as any)({ target: { error: new Error('DB error') } })
        }
      }, 0)
      
      // The adapter catches errors and returns undefined for graceful degradation
      const result = await getPromise
      expect(result).toBeUndefined()
    })

    it('subscribe sets up BroadcastChannel listener', () => {
      const callback = vi.fn()
      
      const adapter = indexedDBAdapter(defaultOptions)
      const unsubscribe = adapter.subscribe?.('test-key', callback)
      
      expect(unsubscribe).toBeTypeOf('function')
    })
  })

  describe('Adapter Integration', () => {
    it('all adapters implement the same interface', () => {
      const adapters = [
        localStorageAdapter(),
        sessionStorageAdapter(),
        cookiesAdapter(),
        indexedDBAdapter({ dbName: 'test', storeName: 'test' })
      ]
      
      adapters.forEach(adapter => {
        expect(typeof adapter.getItem).toBe('function')
        expect(typeof adapter.setItem).toBe('function')
        expect(typeof adapter.removeItem).toBe('function')
      })
    })

    it('adapters handle empty string values', async () => {
      const adapters = [
        localStorageAdapter(),
        sessionStorageAdapter(),
        cookiesAdapter()
      ]
      
      for (const adapter of adapters) {
        await expect(adapter.setItem('empty-test', '')).resolves.toBeUndefined()
      }
    })

    it('adapters handle JSON string values', async () => {
      const adapters = [
        localStorageAdapter(),
        sessionStorageAdapter(),
        cookiesAdapter()
      ]
      
      const jsonString = '{"test":"value","number":42}'
      
      for (const adapter of adapters) {
        await expect(adapter.setItem('json-test', jsonString)).resolves.toBeUndefined()
      }
    })
  })
})
