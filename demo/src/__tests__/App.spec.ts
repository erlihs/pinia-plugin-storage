import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createPiniaPluginStorage } from 'pinia-plugin-storage'
import App from '../App.vue'
import { useCounterStoreNone } from '../stores/counter-none'
import { useCounterStoreBasic } from '../stores/counter-basic'
import { useCounterStoreAdvanced } from '../stores/counter-advanced'
import { useCounterStoreRateLimit } from '../stores/counter-rate-limit'

// Mock storage APIs
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock IndexedDB (simplified)
const indexedDBMock = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({ onsuccess: null, onerror: null })),
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
        })),
      })),
    },
  })),
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock })

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
})

describe('App.vue', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Use fake timers to prevent actual timeouts from running
    vi.useFakeTimers()

    // Create fresh Pinia instance with the storage plugin
    pinia = createPinia()
    pinia.use(createPiniaPluginStorage)
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.clearAllMocks()
    // Clear any running timers to prevent leaks
    vi.clearAllTimers()
    // Restore real timers
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('renders the main title', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.find('h1').text()).toBe('Pinia Plugin Storage')
      wrapper.unmount()
    })

    it('renders basic storage section', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const basicSection = wrapper.find('h2')
      expect(basicSection.text()).toBe('Basic')

      // Check first table headers (there are 2 tables total)
      const firstTable = wrapper.find('table')
      const tableHeaders = firstTable.findAll('th')
      expect(tableHeaders).toHaveLength(4)
      expect(tableHeaders[0].text()).toBe('storageType')
      expect(tableHeaders[1].text()).toBe('Action')
      expect(tableHeaders[2].text()).toBe('Value')
      expect(tableHeaders[3].text()).toBe('Expected behavior')
      wrapper.unmount()
    })

    it('renders advanced storage sections', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const h2Elements = wrapper.findAll('h2')
      expect(h2Elements).toHaveLength(3)
      expect(h2Elements[0].text()).toBe('Basic')
      expect(h2Elements[1].text()).toBe('Advanced - adapters')
      expect(h2Elements[2].text()).toBe('Advanced - rate limiting')
      wrapper.unmount()
    })

    it('renders cross-tab broadcasting information', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const crossTabSection = wrapper.find('h3')
      expect(crossTabSection.text()).toBe('Cross-tab broadcasting')

      const description = wrapper.find('p')
      expect(description.text()).toContain(
        'Cross-tab broadcasting enables real-time synchronization',
      )
      wrapper.unmount()
    })

    it('renders reload buttons', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const reloadButtons = wrapper
        .findAll('button')
        .filter((button) => button.text().includes('🔄 Reload Page'))
      expect(reloadButtons).toHaveLength(3) // Now we have 3 tables with reload buttons
      wrapper.unmount()
    })
  })

  describe('Store Integration', () => {
    it('displays initial counter values', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      // Check that counters start at 0 and display correctly
      const text = wrapper.text()
      // The values are displayed as "0  0x0" format in the UI
      expect(text).toContain('0')
      expect(text).toContain('0x0')

      // Verify store state directly
      const noneStore = useCounterStoreNone()
      expect(noneStore.count).toBe(0)
      expect(noneStore.extCount.hex).toBe('0x0')
      wrapper.unmount()
    })

    it('integrates with counter stores correctly', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      // Verify stores are created and accessible
      const noneStore = useCounterStoreNone()
      const basicStore = useCounterStoreBasic()
      const advancedStore = useCounterStoreAdvanced()
      const rateLimitStore = useCounterStoreRateLimit()

      expect(noneStore.count).toBe(0)
      expect(basicStore.count).toBe(0)
      expect(advancedStore.countS).toBe(0)
      expect(advancedStore.countL).toBe(0)
      expect(advancedStore.countC).toBe(0)
      expect(advancedStore.countI).toBe(0)
      expect(rateLimitStore.countNone).toBe(0)
      expect(rateLimitStore.countDebounced).toBe(0)
      expect(rateLimitStore.countThrottled).toBe(0)
      expect(rateLimitStore.countMixed).toBe(0)
      wrapper.unmount()
    })
  })

  describe('Button Interactions', () => {
    it('handles none store increment/decrement buttons', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const noneStore = useCounterStoreNone()

      // Find the buttons for the "None" row (first tbody tr)
      const noneRow = wrapper.find('tbody tr')
      const buttons = noneRow.findAll('button')

      // Click increment button
      await buttons[1].trigger('click')
      expect(noneStore.count).toBe(1)
      expect(noneStore.extCount.decimal).toBe(1)
      expect(noneStore.extCount.hex).toBe('0x1')

      // Click decrement button
      await buttons[0].trigger('click')
      expect(noneStore.count).toBe(0)
      wrapper.unmount()
    })

    it('handles basic store increment/decrement buttons', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const basicStore = useCounterStoreBasic()

      // Find the buttons for the "localStorage" row (second tbody tr)
      const localStorageRow = wrapper.findAll('tbody tr')[1]
      const buttons = localStorageRow.findAll('button')

      // Click increment button
      await buttons[1].trigger('click')
      expect(basicStore.count).toBe(1)
      expect(basicStore.extCount.decimal).toBe(1)
      expect(basicStore.extCount.hex).toBe('0x1')
      wrapper.unmount()
    })

    it('handles advanced store buttons', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const advancedStore = useCounterStoreAdvanced()

      // Find all tbody elements (there are now three tables)
      const tbodies = wrapper.findAll('tbody')
      const advancedTbody = tbodies[1] // Second table (Advanced - adapters)
      const rows = advancedTbody.findAll('tr')

      // Test sessionStorage buttons (first row)
      const sessionButtons = rows[0].findAll('button')
      await sessionButtons[1].trigger('click')
      expect(advancedStore.countS).toBe(1)

      // Test localStorage buttons (second row)
      const localButtons = rows[1].findAll('button')
      await localButtons[1].trigger('click')
      expect(advancedStore.countL).toBe(1)

      // Test cookies buttons (third row)
      const cookieButtons = rows[2].findAll('button')
      await cookieButtons[1].trigger('click')
      expect(advancedStore.countC).toBe(1)

      // Test indexedDB buttons (fourth row)
      const indexedButtons = rows[3].findAll('button')
      await indexedButtons[1].trigger('click')
      expect(advancedStore.countI).toBe(1)
      wrapper.unmount()
    })

    it('handles rate limiting store buttons', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const rateLimitStore = useCounterStoreRateLimit()

      // Find the rate limiting tbody (third table)
      const tbodies = wrapper.findAll('tbody')
      const rateLimitTbody = tbodies[2] // Third table (Advanced - rate limiting)
      const rows = rateLimitTbody.findAll('tr')

      // Test none rate limiting buttons (first row)
      const noneButtons = rows[0].findAll('button')
      await noneButtons[1].trigger('click')
      expect(rateLimitStore.countNone).toBe(1)

      // Test debounced buttons (second row)
      const debouncedButtons = rows[1].findAll('button')
      await debouncedButtons[1].trigger('click')
      expect(rateLimitStore.countDebounced).toBe(1)

      // Test throttled buttons (third row)
      const throttledButtons = rows[2].findAll('button')
      await throttledButtons[1].trigger('click')
      expect(rateLimitStore.countThrottled).toBe(1)

      // Test mixed buttons (fourth row)
      const mixedButtons = rows[3].findAll('button')
      await mixedButtons[1].trigger('click')
      expect(rateLimitStore.countMixed).toBe(1)
      wrapper.unmount()
    })

    it('handles page reload button', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const reloadButtons = wrapper
        .findAll('button')
        .filter((button) => button.text().includes('🔄 Reload Page'))

      await reloadButtons[0].trigger('click')
      expect(window.location.reload).toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('Storage Scenarios', () => {
    it('none store does not persist values', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const noneStore = useCounterStoreNone()
      noneStore.increment(5)

      // None store should not trigger any storage calls
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('basic store is configured for localStorage', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const basicStore = useCounterStoreBasic()
      expect(basicStore.$id).toBe('counter-basic')

      // Verify store works regardless of storage
      basicStore.increment(5)
      expect(basicStore.count).toBe(5)
      expect(basicStore.extCount.decimal).toBe(5)
      expect(basicStore.extCount.hex).toBe('0x5')
      wrapper.unmount()
    })

    it('advanced store is configured with multiple storage adapters', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const advancedStore = useCounterStoreAdvanced()
      expect(advancedStore.$id).toBe('counter-advanced')

      // Verify all counter functions work
      advancedStore.incrementS(1) // sessionStorage
      advancedStore.incrementL(2) // localStorage
      advancedStore.incrementC(3) // cookies
      advancedStore.incrementI(4) // indexedDB

      expect(advancedStore.countS).toBe(1)
      expect(advancedStore.countL).toBe(2)
      expect(advancedStore.countC).toBe(3)
      expect(advancedStore.countI).toBe(4)
      wrapper.unmount()
    })

    it('rate limiting store is configured correctly', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const rateLimitStore = useCounterStoreRateLimit()
      expect(rateLimitStore.$id).toBe('counter-rate-limit')

      // Verify all rate limiting counter functions work
      rateLimitStore.incrementNone(1)
      rateLimitStore.incrementDebounced(2)
      rateLimitStore.incrementThrottled(3)
      rateLimitStore.incrementMixed(4)

      expect(rateLimitStore.countNone).toBe(1)
      expect(rateLimitStore.countDebounced).toBe(2)
      expect(rateLimitStore.countThrottled).toBe(3)
      expect(rateLimitStore.countMixed).toBe(4)
      wrapper.unmount()
    })

    it('handles storage errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const basicStore = useCounterStoreBasic()
      basicStore.increment(5)

      // Should handle error gracefully and continue functioning
      expect(basicStore.count).toBe(5)
      consoleSpy.mockRestore()
      wrapper.unmount()
    })
  })

  describe('Computed Values', () => {
    it('updates hex values when decimal values change', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const noneStore = useCounterStoreNone()

      // Increment to 15 to get a nice hex value
      for (let i = 0; i < 15; i++) {
        noneStore.increment(1)
      }

      expect(noneStore.count).toBe(15)
      expect(noneStore.extCount.decimal).toBe(15)
      expect(noneStore.extCount.hex).toBe('0xf')

      await wrapper.vm.$nextTick()

      // Check that the UI displays the updated values
      const text = wrapper.text()
      expect(text).toContain('15')
      expect(text).toContain('0xf')
      wrapper.unmount()
    })

    it('handles negative values correctly', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const noneStore = useCounterStoreNone()
      noneStore.increment(-5)

      expect(noneStore.count).toBe(-5)
      expect(noneStore.extCount.decimal).toBe(-5)
      expect(noneStore.extCount.hex).toBe('0x-5')
      wrapper.unmount()
    })
  })

  describe('Accessibility and Structure', () => {
    it('has proper table structure', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const tables = wrapper.findAll('table')
      expect(tables).toHaveLength(3) // Now we have 3 tables

      // Each table should have thead, tbody, and tfoot
      tables.forEach((table) => {
        expect(table.find('thead')).toBeTruthy()
        expect(table.find('tbody')).toBeTruthy()
        expect(table.find('tfoot')).toBeTruthy()
      })
      wrapper.unmount()
    })

    it('has descriptive expected behavior text', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const text = wrapper.text()
      expect(text).toContain('Values should not persist after page reload')
      expect(text).toContain('Values should persist after page reload')
      expect(text).toContain('Values persist during session but reset after browser restart')
      expect(text).toContain('Values stored in cookies with 30s expiry')
      expect(text).toContain('Values stored in IndexedDB for complex data')
      // Rate limiting behaviors
      expect(text).toContain('Every click saves immediately to localStorage')
      expect(text).toContain('Saves only after 1 second of inactivity')
      expect(text).toContain('Saves at most once per second')
      wrapper.unmount()
    })
  })

  describe('Live Storage Monitoring', () => {
    it('sets up localStorage polling on mount', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')

      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 200)

      wrapper.unmount()
    })

    it('cleans up polling on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      wrapper.unmount()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('displays localStorage values in the UI', async () => {
      // Mock localStorage values
      localStorageMock.getItem.mockImplementation((key) => {
        const mockData = {
          'counter-rate-limit:none-counters':
            '{"countNone":5,"extCountNone":{"decimal":5,"hex":"0x5"}}',
          'counter-rate-limit:debounced-counters':
            '{"countDebounced":3,"extCountDebounced":{"decimal":3,"hex":"0x3"}}',
        }
        return mockData[key as keyof typeof mockData] || null
      })

      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      await wrapper.vm.$nextTick()

      // Check that localStorage values are displayed in code elements
      const codeElements = wrapper.findAll('code.storage-value')
      expect(codeElements.length).toBeGreaterThan(0)

      wrapper.unmount()
    })

    it('updates localStorage values when polling triggers', async () => {
      // Mock localStorage values that change over time
      let callCount = 0
      localStorageMock.getItem.mockImplementation((key) => {
        callCount++
        const mockData = {
          'counter-rate-limit:none-counters': `{"countNone":${callCount},"extCountNone":{"decimal":${callCount},"hex":"0x${callCount.toString(16)}"}}`,
        }
        return mockData[key as keyof typeof mockData] || null
      })

      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      // Advance timers to trigger the polling
      vi.advanceTimersByTime(200)
      await wrapper.vm.$nextTick()

      // Verify that localStorage.getItem was called during polling
      expect(localStorageMock.getItem).toHaveBeenCalledWith('counter-rate-limit:none-counters')

      wrapper.unmount()
    })
  })
})
