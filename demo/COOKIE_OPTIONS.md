# Cookie Options Integration

## Overview

The Pinia storage plugin now supports comprehensive cookie options configuration for fine-grained control over cookie behavior. You can configure cookie attributes like `path`, `domain`, `secure`, `sameSite`, `expires`, and `maxAge`.

## Cookie Options Interface

```typescript
interface CookieOptions {
  path?: string           // Cookie path (default: '/')
  domain?: string         // Cookie domain
  secure?: boolean        // Require HTTPS
  sameSite?: 'Strict' | 'Lax' | 'None'  // SameSite attribute
  expires?: Date | string | number // Expiration (Date object, string, or days from now)
  maxAgeSeconds?: number  // Max age in seconds
  httpOnly?: boolean      // Prevent JavaScript access (security)
  priority?: 'Low' | 'Medium' | 'High'  // Cookie priority (Chrome)
  partitioned?: boolean   // Enable CHIPS partitioning
}
```

## Usage Methods

### Method 1: Using `cookieOptions` in Strategy

This method allows you to use the default cookies storage but with custom options:

```typescript
import { defineStore } from 'pinia'
import cookiesStorage from '@/plugin/adapters/cookies'

export const useMyStore = defineStore('myStore', () => {
  // ... store logic
}, {
  storage: {
    enabled: true,
    strategies: [
      {
        key: 'my-store-key',
        storage: cookiesStorage,
        cookieOptions: {
          path: '/',
          domain: 'example.com',
          secure: true,
          sameSite: 'Strict',
          expires: 30, // 30 days
          maxAgeSeconds: 2592000 // 30 days in seconds
        },
        paths: ['field1', 'field2']
      }
    ]
  }
})
```

### Method 2: Using `createCookiesStorage` Factory

This method creates a pre-configured cookie storage instance:

```typescript
import { defineStore } from 'pinia'
import { createCookiesStorage } from '@/plugin/adapters/cookies'

const customCookieStorage = createCookiesStorage({
  path: '/app',
  secure: true,
  sameSite: 'Lax',
  expires: new Date('2025-12-31')
})

export const useMyStore = defineStore('myStore', () => {
  // ... store logic
}, {
  storage: {
    enabled: true,
    strategies: [
      {
        key: 'my-store-key',
        storage: customCookieStorage,
        paths: ['field1', 'field2']
      }
    ]
  }
})
```

## Cookie Options Explained

### `path` (string)
- Specifies the path where the cookie is valid
- Default: `'/'` (root path)
- Example: `path: '/admin'` - cookie only sent for admin pages

### `domain` (string)
- Specifies which domain can receive the cookie
- Default: current domain only
- Example: `domain: '.example.com'` - available to all subdomains

### `secure` (boolean)
- Requires HTTPS for cookie transmission
- Default: `false`
- Example: `secure: true` - only sent over HTTPS

### `sameSite` ('Strict' | 'Lax' | 'None')
- Controls cross-site request behavior
- `'Strict'`: Never sent in cross-site requests
- `'Lax'`: Sent with top-level navigation (default for most cases)
- `'None'`: Always sent (requires `secure: true`)

### `expires` (Date | string | number)
- Sets cookie expiration
- `Date` object: specific expiration date
- `string`: date string (will be parsed)
- `number`: days from now
- Example: `expires: 7` (7 days) or `expires: new Date('2025-12-31')`

### `maxAgeSeconds` (number)
- Maximum age in seconds
- Takes precedence over `expires` if both are set
- Example: `maxAgeSeconds: 3600` (1 hour)

### `httpOnly` (boolean)
- Prevents access via JavaScript (security feature)
- Default: `false`
- Example: `httpOnly: true` - cookie cannot be accessed via `document.cookie`
- Note: This is primarily useful for server-side cookies, less relevant for client-side storage

### `priority` ('Low' | 'Medium' | 'High')
- Sets cookie priority for Chrome's cookie eviction algorithm
- Chrome-specific attribute
- Example: `priority: 'High'` - less likely to be evicted when storage is full

### `partitioned` (boolean)
- Enables CHIPS (Cookies Having Independent Partitioned State)
- Allows cookies to be partitioned by top-level site
- Default: `false`
- Example: `partitioned: true` - cookie will be partitioned by embedding context

## Examples

### Development Environment
```typescript
{
  cookieOptions: {
    path: '/',
    secure: false,     // HTTP allowed in dev
    sameSite: 'Lax',
    expires: 1         // 1 day
  }
}
```

### Production Environment
```typescript
{
  cookieOptions: {
    path: '/',
    domain: '.myapp.com',
    secure: true,      // HTTPS required
    sameSite: 'Strict',
    expires: 30,       // 30 days
    maxAgeSeconds: 2592000   // 30 days in seconds
  }
}
```

### Session Cookie (No Expiration)
```typescript
{
  cookieOptions: {
    path: '/',
    secure: true,
    sameSite: 'Lax'
    // No expires/maxAgeSeconds = session cookie
  }
}
```

### Security-Enhanced Cookie
```typescript
{
  cookieOptions: {
    path: '/',
    secure: true,
    sameSite: 'Strict',
    httpOnly: true,     // Prevent XSS access
    priority: 'High',   // High priority for Chrome
    expires: 7          // 7 days
  }
}
```

### Partitioned Cookie (CHIPS)
```typescript
{
  cookieOptions: {
    path: '/',
    secure: true,       // Required for partitioned cookies
    sameSite: 'None',   // Required for partitioned cookies
    partitioned: true,  // Enable CHIPS
    maxAgeSeconds: 86400 // 1 day
  }
}
```

## Best Practices

1. **Use `secure: true` in production** to ensure cookies are only sent over HTTPS
2. **Set appropriate `sameSite` values** based on your cross-site requirements
3. **Use `domain` carefully** - overly broad domains can be security risks
4. **Consider `maxAgeSeconds` over `expires`** for more precise control
5. **Use `httpOnly: true` for sensitive data** when possible (though less relevant for client-side storage)
6. **Set `priority: 'High'`** for critical cookies in Chrome environments
7. **Use `partitioned: true`** for third-party contexts requiring CHIPS compliance
8. **Test cookie behavior** across different browsers and scenarios
9. **Remember partitioned cookies require `secure: true` and `sameSite: 'None'`**
10. **Monitor cookie size limits** - browsers have size restrictions per cookie and per domain

## Important Notes

### Browser Limitations
- **`httpOnly`**: When set from client-side JavaScript, this flag may not be properly enforced by all browsers. This option is most effective when cookies are set server-side.
- **`priority`**: This is a Chrome-specific feature and may be ignored by other browsers.
- **`partitioned`**: This is part of the CHIPS specification and requires modern browser support.

### Client-Side vs Server-Side
This plugin sets cookies from client-side JavaScript, which has some limitations:
- Some security features work better with server-side cookie setting
- Consider your security requirements when choosing cookie options
- For highly sensitive data, consider server-side session management instead

## Backward Compatibility

The default `cookiesStorage` export maintains backward compatibility. Existing code will continue to work without changes, using default cookie options (`path=/`).
