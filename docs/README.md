# Pinia Plugin Storage Documentation

Welcome to the comprehensive documentation for **pinia-plugin-storage** - a powerful state persistence and synchronization plugin for Pinia that supports multiple storage adapters.

## 📚 Documentation Structure

This documentation is organized into several focused guides:

### 🚀 Getting Started
- **[Quick Start Guide](./quick-start.md)** - Get up and running in minutes
- **[Installation Guide](./installation.md)** - Detailed installation instructions
- **[Basic Usage](./basic-usage.md)** - Simple configuration examples

### 📖 Core Concepts
- **[Storage Adapters](./storage-adapters.md)** - Understanding different storage backends
- **[Bucket System](./bucket-system.md)** - Advanced multi-storage configuration
- **[State Management](./state-management.md)** - How state persistence works

### 🔧 Configuration
- **[Configuration Guide](./configuration.md)** - Complete configuration reference
- **[Error Handling](./error-handling.md)** - Handling storage errors gracefully
- **[Performance Optimization](./performance.md)** - Optimizing for production

### 📋 API Reference
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Types & Interfaces](./types.md)** - TypeScript definitions

### 🛠️ Advanced Topics
- **[Migration Guide](./migration.md)** - Upgrading from other plugins
- **[SSR Support](./ssr-support.md)** - Server-side rendering considerations
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

### 💡 Examples
- **[Examples](./examples.md)** - Real-world usage examples
- **[Best Practices](./best-practices.md)** - Recommended patterns

## 🎯 What This Plugin Offers

- **🔄 Multi-Adapter Support**: localStorage, sessionStorage, cookies, and IndexedDB
- **🎯 Selective Persistence**: Choose which state properties to persist
- **📦 Multiple Buckets**: Different state parts can use different storage adapters
- **🔄 Automatic Hydration**: Seamlessly restore state on app initialization
- **⚡ Real-time Sync**: Cross-tab synchronization for supported adapters
- **⏱️ Debounced Persistence**: Configurable debouncing for optimal performance
- **🏷️ Namespacing**: Prevent storage key collisions between apps
- **🔄 Versioning**: Support for data schema migrations
- **🔄 State Transformation**: Before/after hooks for data processing
- **🖥️ SSR Compatible**: Works with server-side rendering
- **🛡️ Error Resilient**: Comprehensive error handling and graceful degradation

## 🚀 Quick Example

```typescript
// Basic usage
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const increment = () => count.value++
  
  return { count, increment }
}, {
  storage: 'localStorage' // That's it!
})

// Advanced usage with multiple adapters
export const useAdvancedStore = defineStore('advanced', () => {
  // ... your state
}, {
  storage: {
    namespace: 'myApp',
    version: '1.0',
    buckets: [
      {
        adapter: 'localStorage',
        include: ['persistentData'],
        debounceDelayMs: 200
      },
      {
        adapter: 'sessionStorage', 
        include: ['temporaryData'],
        debounceDelayMs: 50
      },
      {
        adapter: 'indexedDB',
        include: ['largeData'],
        options: { dbName: 'myApp', storeName: 'data' }
      }
    ]
  }
})
```

## 📦 Installation

```bash
npm install pinia-plugin-storage
# or
pnpm add pinia-plugin-storage
# or
yarn add pinia-plugin-storage
```

## 🏃‍♂️ Quick Setup

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPiniaPluginStorage } from 'pinia-plugin-storage'

const app = createApp(App)
const pinia = createPinia()

pinia.use(createPiniaPluginStorage)
app.use(pinia)
```

## 🤝 Contributing

We welcome contributions! Please see our [contributing guidelines](../CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENCE) file for details.

---

**Next Steps:**
- Start with the [Quick Start Guide](./quick-start.md) for immediate results
- Check out [Examples](./examples.md) for real-world patterns
- Explore [Configuration Guide](./configuration.md) for advanced setups
