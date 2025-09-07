import type { StorageAdapter } from './index'

export type CookieOptions = {
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
  maxAgeSeconds?: number
  expires?: Date | string | number
  httpOnly?: boolean
  priority?: 'Low' | 'Medium' | 'High'
  partitioned?: boolean
}

function formatExpires(expires: Date | string | number): string {
  if (expires instanceof Date) {
    return expires.toUTCString()
  }
  if (typeof expires === 'string') {
    return new Date(expires).toUTCString()
  }
  if (typeof expires === 'number') {
    // Treat number as days from now
    const date = new Date()
    date.setDate(date.getDate() + expires)
    return date.toUTCString()
  }
  return ''
}

function readCookie(name: string): string | undefined {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : undefined
  } catch {
    // Cookie reading might fail in some environments
    return undefined
  }
}

function writeCookie(name: string, value: string, opts: CookieOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  try {
    const parts = [
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
      `path=${opts.path ?? '/'}`,
      opts.domain ? `domain=${opts.domain}` : '',
      opts.secure ? 'Secure' : '',
      opts.httpOnly ? 'HttpOnly' : '',
      `SameSite=${opts.sameSite ?? 'Lax'}`,
      typeof opts.maxAgeSeconds === 'number' ? `Max-Age=${opts.maxAgeSeconds}` : '',
      opts.expires ? `Expires=${formatExpires(opts.expires)}` : '',
      opts.priority ? `Priority=${opts.priority}` : '',
      opts.partitioned ? 'Partitioned' : '',
    ].filter(Boolean)
    document.cookie = parts.join('; ')
  } catch {
    // Cookie writing might fail in some environments
  }
}

function deleteCookie(name: string, path = '/') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  try {
    document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=${path}`
  } catch {
    // Cookie deletion might fail in some environments
  }
}

export const cookiesAdapter = (opts: CookieOptions = {}): StorageAdapter => ({
  async getItem(k) {
    return readCookie(k) ?? undefined
  },
  async setItem(k, v) {
    writeCookie(k, v, opts)
  },
  async removeItem(k) {
    deleteCookie(k, opts.path ?? '/')
  },
  // Note: Cookies don't have a built-in change event mechanism
  // Cross-tab sync would require polling or server-side coordination
})
