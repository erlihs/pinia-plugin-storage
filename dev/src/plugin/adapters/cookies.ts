export interface CookieOptions {
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
  expires?: Date | number // Date object or days from now
  maxAge?: number // seconds
}

const formatCookieOptions = (options: CookieOptions = {}): string => {
  const parts: string[] = []

  if (options.path !== undefined) {
    parts.push(`path=${options.path}`)
  } else {
    parts.push('path=/')
  }

  if (options.domain) {
    parts.push(`domain=${options.domain}`)
  }

  if (options.secure) {
    parts.push('secure')
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`)
  }

  if (options.expires) {
    if (typeof options.expires === 'number') {
      // Convert days to date
      const date = new Date()
      date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000)
      parts.push(`expires=${date.toUTCString()}`)
    } else {
      parts.push(`expires=${options.expires.toUTCString()}`)
    }
  }

  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`)
  }

  return parts.length > 0 ? `; ${parts.join('; ')}` : ''
}

export const createCookiesStorage = (options: CookieOptions = {}): Storage => {
  const cookieOptionsString = formatCookieOptions(options)

  return {
    setItem(key, state) {
      document.cookie = `${key}=${state}${cookieOptionsString}`
    },
    getItem(key) {
      const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'))
      return match ? match[2] : null
    },
    removeItem(key) {
      const path = options.path || '/'
      const domain = options.domain ? `; domain=${options.domain}` : ''
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain}`
    },
    clear() {
      document.cookie.split(';').forEach((cookie) => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        const path = options.path || '/'
        const domain = options.domain ? `; domain=${options.domain}` : ''
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain}`
      })
    },
    key(index) {
      const cookies = document.cookie.split(';').map((cookie) => cookie.split('=')[0].trim())
      return index < cookies.length ? cookies[index] : null
    },
    get length() {
      return document.cookie.split(';').filter((cookie) => cookie.trim() !== '').length
    },
  }
}

// Default instance for backward compatibility
const cookiesStorage: Storage = createCookiesStorage()

export default cookiesStorage
