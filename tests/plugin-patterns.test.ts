import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createPiniaPluginStorage } from '../src/plugin'

// Mock storage APIs
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('createPiniaPluginStorage Usage Patterns', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.clearAllMocks()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should work without parentheses (backwards compatible)', () => {
    expect(() => {
      // This should not throw TypeScript or runtime errors
      pinia.use(createPiniaPluginStorage)
    }).not.toThrow()
  })

  it('should work with empty parentheses', () => {
    expect(() => {
      // This should work now
      pinia.use(createPiniaPluginStorage())
    }).not.toThrow()
  })

  it('should work with global configuration', () => {
    const onError = vi.fn()

    expect(() => {
      // This should work with global config
      pinia.use(
        createPiniaPluginStorage({
          namespace: 'test-app',
          version: '1.0',
          debounceDelayMs: 100,
          onError,
        }),
      )
    }).not.toThrow()

    // Verify the configuration is available for stores
    // (This would be tested in integration tests with actual stores)
  })

  it('should return correct types for all patterns', () => {
    // Test type inference
    const directPlugin = createPiniaPluginStorage
    const factoryNoOptions = createPiniaPluginStorage()
    const factoryWithOptions = createPiniaPluginStorage({ namespace: 'test' })

    // These should have correct types without TypeScript errors
    expect(typeof directPlugin).toBe('function')
    expect(typeof factoryNoOptions).toBe('function')
    expect(typeof factoryWithOptions).toBe('function')
  })
})
