# Quick Start Guide

Get **pinia-plugin-storage** up and running in your Vue 3 + Pinia application in just a few minutes.

## 📦 Installation

```bash
npm install pinia-plugin-storage
```

## 🔧 Setup

### 1. Register the Plugin

Add the plugin to your Pinia instance in your main application file:

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPiniaPluginStorage } from 'pinia-plugin-storage'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// Register the storage plugin
pinia.use(createPiniaPluginStorage)

app.use(pinia)
app.mount('#app')
```

### 2. Add Storage to Your Store

The simplest way to add persistence is with a string adapter:

```typescript
// stores/counter.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const increment = () => count.value++
  const decrement = () => count.value--

  return { count, increment, decrement }
}, {
  // Add this single line to enable localStorage persistence
  storage: 'localStorage'
})
```

### 3. Use Your Store

```vue
<!-- Counter.vue -->
<template>
  <div>
    <h2>Counter: {{ counter.count }}</h2>
    <button @click="counter.increment()">+</button>
    <button @click="counter.decrement()">-</button>
    <button @click="reloadPage">Reload Page</button>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
const reloadPage = () => window.location.reload()
</script>
```

That's it! Your counter state will now persist across page reloads and browser sessions.

## 🎯 Available Storage Adapters

You can use any of these adapters with a simple string:

```typescript
// Choose your storage adapter
storage: 'localStorage'     // Persists until manually cleared
storage: 'sessionStorage'   // Persists until tab is closed  
storage: 'cookies'          // Persists with cookie expiration
storage: 'indexedDB'        // Persists with larger storage capacity
```

## 🚀 What Happens Automatically

When you add `storage: 'localStorage'` to your store:

1. **Automatic Hydration**: When your app loads, the plugin automatically restores saved state
2. **Automatic Persistence**: Every time your state changes, it's saved to localStorage
3. **Type Safety**: Full TypeScript support with no additional configuration
4. **Error Handling**: Graceful fallbacks if storage is unavailable
5. **SSR Safe**: Works with server-side rendering out of the box

## 🧪 Test It Out

1. Open your app in the browser
2. Increment the counter a few times
3. Reload the page
4. The counter value should be preserved!
5. Check your browser's Developer Tools → Application → Local Storage to see the stored data

## 🔄 Cross-Tab Synchronization

For storage adapters that support it (localStorage, sessionStorage, indexedDB), changes in one tab automatically sync to other tabs:

1. Open your app in two browser tabs
2. Change the counter in one tab
3. Watch it update in the other tab automatically!

## ⚡ Performance Features

The plugin includes several performance optimizations by default:

- **Debounced Writes**: Rapid state changes are batched to avoid excessive storage operations
- **Change Detection**: Only writes to storage when state actually changes
- **Selective Updates**: Cross-tab sync only updates changed properties

## 🎨 Next Steps

Now that you have basic persistence working, you might want to explore:

- **[Selective Persistence](./configuration.md#selective-persistence)** - Only persist specific properties
- **[Multiple Storage Adapters](./bucket-system.md)** - Use different storage for different data
- **[Error Handling](./error-handling.md)** - Handle storage failures gracefully
- **[Advanced Configuration](./configuration.md)** - Fine-tune performance and behavior

## 🐛 Common Issues

### Storage Not Working?

1. **Check Browser Support**: Ensure your target browsers support the chosen storage adapter
2. **Private Browsing**: Some storage adapters are disabled in private/incognito mode
3. **Storage Quota**: Check if storage quota is exceeded
4. **SSR Issues**: Ensure you're not accessing storage during server-side rendering

### State Not Persisting?

1. **Plugin Registration**: Make sure you registered the plugin with `pinia.use(createPiniaPluginStorage)`
2. **Store Configuration**: Verify the `storage` option is in the correct place (third parameter of `defineStore`)
3. **State Structure**: Complex nested objects might need [transformation hooks](./configuration.md#state-transformation)

Need help? Check our [Troubleshooting Guide](./troubleshooting.md) for solutions to common problems.
