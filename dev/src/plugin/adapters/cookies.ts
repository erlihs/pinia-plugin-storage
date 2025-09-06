import type { StorageAdapter } from './index'

export type CookieOptions = {
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
  maxAgeSeconds?: number
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const m = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : undefined
}

function writeCookie(name: string, value: string, opts: CookieOptions = {}) {
  if (typeof document === 'undefined') return
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `path=${opts.path ?? '/'}`,
    opts.domain ? `domain=${opts.domain}` : '',
    opts.secure ? 'Secure' : '',
    `SameSite=${opts.sameSite ?? 'Lax'}`,
    typeof opts.maxAgeSeconds === 'number' ? `Max-Age=${opts.maxAgeSeconds}` : '',
  ].filter(Boolean)
  document.cookie = parts.join('; ')
}

function deleteCookie(name: string, path = '/') {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=${path}`
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
})
