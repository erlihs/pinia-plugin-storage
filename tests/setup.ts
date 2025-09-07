import { beforeEach, vi } from 'vitest'

// Mock storage APIs globally
const createStorageMock = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
})

const localStorageMock = createStorageMock()
const sessionStorageMock = createStorageMock()

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(() => ({
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
    },
  })),
  deleteDatabase: vi.fn(),
}

// Mock BroadcastChannel
const broadcastChannelMock = vi.fn(() => ({
  postMessage: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onmessage: null,
  onmessageerror: null,
}))

// Apply mocks to global window object
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, writable: true })
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock, writable: true })
Object.defineProperty(global, 'indexedDB', { value: indexedDBMock, writable: true })
Object.defineProperty(global, 'BroadcastChannel', { value: broadcastChannelMock, writable: true })

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  get: vi.fn(() => ''),
  set: vi.fn(),
  configurable: true,
})

// Mock addEventListener and removeEventListener on window
Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(window, 'removeEventListener', {
  value: vi.fn(),
  writable: true,
})

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()

  // Reset storage mock state
  localStorageMock.length = 0
  sessionStorageMock.length = 0

  // Reset storage methods
  localStorageMock.getItem.mockReturnValue(null)
  localStorageMock.setItem.mockImplementation(() => {})
  localStorageMock.removeItem.mockImplementation(() => {})

  sessionStorageMock.getItem.mockReturnValue(null)
  sessionStorageMock.setItem.mockImplementation(() => {})
  sessionStorageMock.removeItem.mockImplementation(() => {})

  // Reset cookie
  Object.defineProperty(document, 'cookie', {
    get: vi.fn(() => ''),
    set: vi.fn(),
    configurable: true,
  })

  // Reset window event listeners
  window.addEventListener = vi.fn()
  window.removeEventListener = vi.fn()
})

// Export mocks for test usage
export { localStorageMock, sessionStorageMock, indexedDBMock, broadcastChannelMock }
