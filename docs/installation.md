# Installation Guide

Complete installation and setup instructions for **pinia-plugin-storage**.

## 📋 Prerequisites

Before installing, ensure you have:

- **Vue 3.0+**: The plugin requires Vue 3.x
- **Pinia 2.0+**: Compatible with Pinia 2.x and 3.x
- **Modern Browser**: ES6+ support required
- **Node.js 18+**: For development and build tools

## 📦 Package Installation

### NPM

```bash
npm install pinia-plugin-storage
```

### Yarn

```bash
yarn add pinia-plugin-storage
```

### PNPM

```bash
pnpm add pinia-plugin-storage
```

### CDN (Browser)

For direct browser usage without a build tool:

```html
<!-- Vue 3 -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<!-- Pinia -->
<script src="https://unpkg.com/pinia@2/dist/pinia.iife.js"></script>
<!-- Pinia Plugin Storage -->
<script src="https://unpkg.com/pinia-plugin-storage@latest/dist/index.iife.js"></script>

<script>
  const { createApp } = Vue
  const { createPinia } = Pinia
  const { createPiniaPluginStorage } = PiniaPluginStorage
  
  const pinia = createPinia()
  pinia.use(createPiniaPluginStorage)
  
  createApp({
    // Your app
  }).use(pinia).mount('#app')
</script>
```

## 🔧 Basic Setup

### 1. Main Application File

Add the plugin to your main application file:

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPiniaPluginStorage } from 'pinia-plugin-storage'
import App from './App.vue'

// Create Pinia instance
const pinia = createPinia()

// Register the storage plugin
pinia.use(createPiniaPluginStorage)

// Create and mount app
const app = createApp(App)
app.use(pinia)
app.mount('#app')
```

### 2. TypeScript Configuration

If using TypeScript, the plugin includes built-in type definitions. No additional setup required!

```typescript
// The plugin automatically extends Pinia's types
export const useStore = defineStore('store', () => {
  const data = ref('')
  return { data }
}, {
  storage: 'localStorage'  // ✅ Fully typed!
})
```

### 3. First Store with Storage

Create your first store with persistence:

```typescript
// stores/user.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const name = ref('')
  const email = ref('')
  const preferences = ref({
    theme: 'light',
    language: 'en'
  })
  
  return { name, email, preferences }
}, {
  storage: 'localStorage'  // Enable persistence
})
```

### 4. Use in Components

```vue
<!-- UserProfile.vue -->
<template>
  <div>
    <h2>Welcome, {{ user.name }}!</h2>
    <p>Theme: {{ user.preferences.theme }}</p>
    <button @click="user.preferences.theme = 'dark'">
      Switch to Dark Theme
    </button>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const user = useUserStore()
</script>
```

## 🌍 Framework-Specific Setup

### Vite

Works out of the box with Vite:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
  // No additional configuration needed
})
```

### Nuxt 3

For Nuxt 3 applications:

```typescript
// plugins/pinia-storage.client.ts
import { createPiniaPluginStorage } from 'pinia-plugin-storage'

export default defineNuxtPlugin(({ $pinia }) => {
  $pinia.use(createPiniaPluginStorage)
})
```

**Note**: Use `.client.ts` suffix to ensure it only runs on the client side.

### Quasar

```typescript
// src/boot/pinia-storage.ts
import { boot } from 'quasar/wrappers'
import { createPiniaPluginStorage } from 'pinia-plugin-storage'

export default boot(({ store }) => {
  store.use(createPiniaPluginStorage)
})
```

Register in `quasar.config.js`:

```javascript
// quasar.config.js
module.exports = {
  boot: [
    'pinia-storage'
  ]
}
```

### Electron

For Electron applications, the plugin works in the renderer process:

```typescript
// src/main.ts (renderer process)
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPiniaPluginStorage } from 'pinia-plugin-storage'

const pinia = createPinia()
pinia.use(createPiniaPluginStorage)

// Works with all storage adapters in Electron
```

## 🏗️ Build Tool Configuration

### Webpack

If using Webpack directly:

```javascript
// webpack.config.js
module.exports = {
  // ... other config
  resolve: {
    alias: {
      'pinia-plugin-storage': 'pinia-plugin-storage/dist/index.js'
    }
  }
}
```

### Rollup

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve'

export default {
  plugins: [
    resolve({
      preferBuiltins: false
    })
  ]
}
```

### Parcel

Works out of the box with Parcel 2:

```json
{
  "scripts": {
    "dev": "parcel src/index.html",
    "build": "parcel build src/index.html"
  }
}
```

## 🔧 Environment Configuration

### Development vs Production

Set up different configurations for different environments:

```typescript
// config/storage.ts
const isDevelopment = process.env.NODE_ENV === 'development'

export const storageConfig = {
  namespace: isDevelopment ? 'myapp-dev' : 'myapp',
  version: '1.0',
  debounceDelayMs: isDevelopment ? 0 : 300,
  onError: (error, ctx) => {
    if (isDevelopment) {
      console.warn('Storage error:', error, ctx)
    } else {
      // Send to error tracking service
      errorTracker.captureException(error, { extra: ctx })
    }
  }
}

// In your stores
export const useStore = defineStore('store', () => {
  // ... store logic
}, {
  storage: {
    ...storageConfig,
    adapter: 'localStorage'
  }
})
```

### Environment Variables

```bash
# .env
VITE_STORAGE_NAMESPACE=myapp
VITE_STORAGE_VERSION=1.0
VITE_ENABLE_STORAGE_DEBUG=true
```

```typescript
// Use in configuration
export const storageConfig = {
  namespace: import.meta.env.VITE_STORAGE_NAMESPACE,
  version: import.meta.env.VITE_STORAGE_VERSION,
  onError: (error, ctx) => {
    if (import.meta.env.VITE_ENABLE_STORAGE_DEBUG) {
      console.warn('Storage error:', error, ctx)
    }
  }
}
```

## 🧪 Testing Setup

### Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom', // Required for storage APIs
    setupFiles: ['./tests/setup.ts']
  }
})
```

```typescript
// tests/setup.ts
import { beforeEach } from 'vitest'

beforeEach(() => {
  // Clear storage before each test
  localStorage.clear()
  sessionStorage.clear()
})

// Mock storage for tests that need consistent behavior
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
})
```

### Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
}
```

```javascript
// tests/setup.js
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
```

## 🔍 Verification

Verify your installation is working:

```typescript
// stores/test.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useTestStore = defineStore('test', () => {
  const counter = ref(0)
  const increment = () => counter.value++
  
  return { counter, increment }
}, {
  storage: 'localStorage'
})
```

```vue
<!-- TestComponent.vue -->
<template>
  <div>
    <p>Counter: {{ test.counter }}</p>
    <button @click="test.increment()">Increment</button>
    <button @click="reload">Reload Page</button>
  </div>
</template>

<script setup>
import { useTestStore } from '@/stores/test'

const test = useTestStore()
const reload = () => window.location.reload()
</script>
```

**Test Steps:**
1. Click increment a few times
2. Reload the page
3. Counter should maintain its value ✅

## 🐛 Troubleshooting Installation

### Common Issues

1. **"Cannot resolve module" Error**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript Errors**
   ```typescript
   // Add to tsconfig.json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true
     }
   }
   ```

3. **Build Errors**
   ```javascript
   // vite.config.ts - add to optimizeDeps
   export default defineConfig({
     optimizeDeps: {
       include: ['pinia-plugin-storage']
     }
   })
   ```

4. **SSR Hydration Warnings**
   ```typescript
   // Ensure plugin is only used on client side
   if (typeof window !== 'undefined') {
     pinia.use(createPiniaPluginStorage)
   }
   ```

### Version Compatibility

| Plugin Version | Pinia Version | Vue Version | Node Version |
|----------------|---------------|-------------|--------------|
| 1.x | 2.0+ / 3.0+ | 3.0+ | 18+ |

### Bundle Size

The plugin is lightweight:
- **Minified**: ~15KB
- **Gzipped**: ~5KB
- **Tree-shakable**: Only import what you use

## 🚀 Next Steps

After installation:

1. **Read the [Quick Start Guide](./quick-start.md)** for immediate usage
2. **Explore [Examples](./examples.md)** for real-world patterns
3. **Review [Configuration](./configuration.md)** for advanced setups
4. **Check [Best Practices](./best-practices.md)** for production tips

## 📞 Support

If you encounter issues during installation:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Search [GitHub Issues](https://github.com/yourusername/pinia-plugin-storage/issues)
3. Create a new issue with:
   - Package manager and version
   - Node.js version
   - Build tool and version
   - Complete error messages
   - Minimal reproduction case
