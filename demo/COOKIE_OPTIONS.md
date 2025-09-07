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
  expires?: Date | number // Expiration (Date object or days from now)
  maxAge?: number         // Max age in seconds
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
          maxAge: 2592000 // 30 days in seconds
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

### `expires` (Date | number)
- Sets cookie expiration
- `Date` object: specific expiration date
- `number`: days from now
- Example: `expires: 7` (7 days) or `expires: new Date('2025-12-31')`

### `maxAge` (number)
- Maximum age in seconds
- Takes precedence over `expires` if both are set
- Example: `maxAge: 3600` (1 hour)

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
    maxAge: 2592000   // 30 days in seconds
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
    // No expires/maxAge = session cookie
  }
}
```

## Best Practices

1. **Use `secure: true` in production** to ensure cookies are only sent over HTTPS
2. **Set appropriate `sameSite` values** based on your cross-site requirements
3. **Use `domain` carefully** - overly broad domains can be security risks
4. **Consider `maxAge` over `expires`** for more precise control
5. **Test cookie behavior** across different browsers and scenarios

## Backward Compatibility

The default `cookiesStorage` export maintains backward compatibility. Existing code will continue to work without changes, using default cookie options (`path=/`).
