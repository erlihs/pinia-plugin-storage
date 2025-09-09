import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPiniaPluginStorage, PLUGIN_VERSION } from 'pinia-plugin-storage'

import App from './App.vue'

console.log('Using Pinia Plugin Storage version:', PLUGIN_VERSION)

const app = createApp(App)

const pinia = createPinia()

// Example 1: Basic usage without parentheses
// pinia.use(createPiniaPluginStorage)

// Example 2: With empty parentheses
// pinia.use(createPiniaPluginStorage())

// Example 3: With global configuration
pinia.use(
  createPiniaPluginStorage({
    namespace: 'my-app',
    version: '1.0',
    onError: (error, ctx) => {
      console.error('Storage error:', error, ctx)
    },
  }),
)

app.use(pinia)

app.mount('#app')
