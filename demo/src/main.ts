import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPiniaPluginStorage } from './plugin'

import App from './App.vue'

const app = createApp(App)

const pinia = createPinia()
pinia.use(createPiniaPluginStorage)
app.use(pinia)

app.mount('#app')
