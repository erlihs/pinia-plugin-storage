import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { debounce, throttle, isServerEnvironment } from '../src/utils'

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

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('executes function immediately on first call', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('ignores subsequent calls within throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('executes again after throttle period expires', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('schedules final execution if called during throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)

      // Call again during throttle period
      vi.advanceTimersByTime(50)
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)

      // Should execute the scheduled call
      vi.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('passes arguments to the throttled function', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('arg1', 'arg2', 42)
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 42)
    })

    it('handles zero delay', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 0)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('handles rapid calls correctly', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      // Simulate 60fps updates (16.67ms intervals)
      throttledFn() // Should execute immediately
      expect(fn).toHaveBeenCalledTimes(1)

      // Advance time by small increments, calling each time
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(16)
        throttledFn() // Should be throttled, but final call will be scheduled
      }
      // Only the initial call should have executed at this point
      expect(fn).toHaveBeenCalledTimes(1)

      // After the remaining throttle period, the final call should execute
      vi.advanceTimersByTime(20) // Total 100ms passed since first call
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('handles async functions', async () => {
      const asyncFn = vi.fn().mockResolvedValue('result')
      const throttledFn = throttle(asyncFn, 100)

      throttledFn()
      expect(asyncFn).toHaveBeenCalledTimes(1)

      await vi.runAllTimersAsync()
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
      // @ts-expect-error - Intentionally deleting global.window to test server environment detection
      delete global.window
      expect(isServerEnvironment()).toBe(true)
    })

    it('returns true when document is undefined', () => {
      // @ts-expect-error - Intentionally deleting global.document to test server environment detection
      delete global.document
      expect(isServerEnvironment()).toBe(true)
    })

    it('returns true when both window and document are undefined', () => {
      // @ts-expect-error - Intentionally deleting global.window to test server environment detection
      delete global.window
      // @ts-expect-error - Intentionally deleting global.document to test server environment detection
      delete global.document
      expect(isServerEnvironment()).toBe(true)
    })

    it('handles edge case where window exists but document does not', () => {
      // @ts-expect-error - Intentionally deleting global.document to test edge case behavior
      delete global.document
      global.window = {} as any
      expect(isServerEnvironment()).toBe(true)
    })

    it('handles edge case where document exists but window does not', () => {
      // @ts-expect-error - Intentionally deleting global.window to test edge case behavior
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
