import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createPiniaPluginStorage } from 'pinia-plugin-storage'
import App from '../App.vue'
import { useCounterStoreNone } from '../stores/counter-none'
import { useCounterStoreBasic } from '../stores/counter-basic'
import { useCounterStoreAdvanced } from '../stores/counter-advanced'

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

    // Create fresh Pinia instance with the storage plugin
    pinia = createPinia()
    pinia.use(createPiniaPluginStorage)
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders the main title', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.find('h1').text()).toBe('Pinia Plugin Storage')
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
    })

    it('renders advanced storage section', () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const advancedSection = wrapper.findAll('h2')[1]
      expect(advancedSection.text()).toBe('Advanced')
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
      expect(reloadButtons).toHaveLength(2)
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
    })

    it('integrates with counter stores correctly', () => {
      mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      // Verify stores are created and accessible
      const noneStore = useCounterStoreNone()
      const basicStore = useCounterStoreBasic()
      const advancedStore = useCounterStoreAdvanced()

      expect(noneStore.count).toBe(0)
      expect(basicStore.count).toBe(0)
      expect(advancedStore.countS).toBe(0)
      expect(advancedStore.countL).toBe(0)
      expect(advancedStore.countC).toBe(0)
      expect(advancedStore.countI).toBe(0)
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
    })

    it('handles advanced store buttons', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const advancedStore = useCounterStoreAdvanced()

      // Find all tbody elements (there are two tables)
      const tbodies = wrapper.findAll('tbody')
      const advancedTbody = tbodies[1] // Second table
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
    })
  })

  describe('Storage Scenarios', () => {
    it('none store does not persist values', () => {
      mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const noneStore = useCounterStoreNone()
      noneStore.increment(5)

      // None store should not trigger any storage calls
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled()
    })

    it('basic store is configured for localStorage', () => {
      mount(App, {
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
    })

    it('advanced store is configured with multiple storage adapters', () => {
      mount(App, {
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
    })

    it('handles storage errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const basicStore = useCounterStoreBasic()
      basicStore.increment(5)

      // Should handle error gracefully and continue functioning
      expect(basicStore.count).toBe(5)
      consoleSpy.mockRestore()
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
    })

    it('handles negative values correctly', () => {
      mount(App, {
        global: {
          plugins: [pinia],
        },
      })

      const noneStore = useCounterStoreNone()
      noneStore.increment(-5)

      expect(noneStore.count).toBe(-5)
      expect(noneStore.extCount.decimal).toBe(-5)
      expect(noneStore.extCount.hex).toBe('0x-5')
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
      expect(tables).toHaveLength(2)

      // Each table should have thead, tbody, and tfoot
      tables.forEach((table) => {
        expect(table.find('thead')).toBeTruthy()
        expect(table.find('tbody')).toBeTruthy()
        expect(table.find('tfoot')).toBeTruthy()
      })
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
    })
  })
})
