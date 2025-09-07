import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { debounce, isServerEnvironment } from '../src/utils'

describe('Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('calls function after delay', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('cancels previous calls when called multiple times', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      vi.advanceTimersByTime(50)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('passes arguments to the debounced function', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1', 'arg2', 42)
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 42)
    })

    it('handles zero delay', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 0)

      debouncedFn()
      vi.advanceTimersByTime(0)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('handles negative delay as immediate execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, -100)

      debouncedFn()
      vi.advanceTimersByTime(0)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('preserves function context', () => {
      const obj = {
        value: 'test',
        method: vi.fn(function (this: any) {
          return this.value
        }),
      }

      const debouncedMethod = debounce(obj.method.bind(obj), 100)
      debouncedMethod()
      vi.advanceTimersByTime(100)

      expect(obj.method).toHaveBeenCalled()
    })

    it('can be called multiple times with different arguments', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('first')
      vi.advanceTimersByTime(50)

      debouncedFn('second') // Should cancel first call
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('second')
    })

    it('handles async functions', async () => {
      const asyncFn = vi.fn().mockResolvedValue('result')
      const debouncedFn = debounce(asyncFn, 100)

      debouncedFn()
      vi.advanceTimersByTime(100)

      await vi.runAllTimersAsync()
      expect(asyncFn).toHaveBeenCalledTimes(1)
    })

    it('handles errors in debounced function', () => {
      const errorFn = vi.fn(() => {
        throw new Error('Test error')
      })
      const debouncedFn = debounce(errorFn, 100)

      // Debounce itself should not throw when called
      expect(() => {
        debouncedFn()
      }).not.toThrow()

      // But the error should occur when the timer executes
      expect(() => {
        vi.advanceTimersByTime(100)
      }).toThrow('Test error')

      expect(errorFn).toHaveBeenCalled()
    })
  })

  describe('isServerEnvironment', () => {
    const originalWindow = global.window
    const originalDocument = global.document

    afterEach(() => {
      global.window = originalWindow
      global.document = originalDocument
    })

    it('returns false in browser environment', () => {
      // Ensure window and document exist (jsdom environment)
      expect(isServerEnvironment()).toBe(false)
    })

    it('returns true when window is undefined', () => {
      // @ts-ignore
      delete global.window
      expect(isServerEnvironment()).toBe(true)
    })

    it('returns true when document is undefined', () => {
      // @ts-ignore
      delete global.document
      expect(isServerEnvironment()).toBe(true)
    })

    it('returns true when both window and document are undefined', () => {
      // @ts-ignore
      delete global.window
      // @ts-ignore
      delete global.document
      expect(isServerEnvironment()).toBe(true)
    })

    it('handles edge case where window exists but document does not', () => {
      // @ts-ignore
      delete global.document
      global.window = {} as any
      expect(isServerEnvironment()).toBe(true)
    })

    it('handles edge case where document exists but window does not', () => {
      // @ts-ignore
      delete global.window
      global.document = {} as any
      expect(isServerEnvironment()).toBe(true)
    })
  })

  describe('Utility Integration', () => {
    it('debounce works correctly in simulated browser environment', () => {
      vi.useFakeTimers()

      expect(isServerEnvironment()).toBe(false)

      const fn = vi.fn()
      const debouncedFn = debounce(fn, 200)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(200)
      expect(fn).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it('utilities handle edge cases gracefully', () => {
      // Test with very large delay
      vi.useFakeTimers()
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 999999)

      debouncedFn()
      vi.advanceTimersByTime(999999)
      expect(fn).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })
})
