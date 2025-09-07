import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPiniaPluginStorage, PLUGIN_VERSION } from 'pinia-plugin-storage'

import App from './App.vue'

console.log('Using Pinia Plugin Storage version:', PLUGIN_VERSION)

const app = createApp(App)

const pinia = createPinia()
pinia.use(createPiniaPluginStorage)
app.use(pinia)

app.mount('#app')
