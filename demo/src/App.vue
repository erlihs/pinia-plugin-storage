<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCounterStoreNone } from './stores/counter-none'
import { useCounterStoreBasic } from './stores/counter-basic'
import { useCounterStoreAdvanced } from './stores/counter-advanced'
import { useCounterStoreRateLimit } from './stores/counter-rate-limit'

const counterStoreNone = useCounterStoreNone()
const counterStoreBasic = useCounterStoreBasic()
const counterStoreAdvanced = useCounterStoreAdvanced()
const counterStoreRateLimit = useCounterStoreRateLimit()

// Live localStorage monitoring
const liveStorageValues = ref({
  none: '',
  debounced: '',
  throttled: '',
  mixed: '',
})

let pollInterval: ReturnType<typeof setInterval>

const updateStorageValues = () => {
  liveStorageValues.value.none = localStorage.getItem('counter-rate-limit:none-counters') || 'null'
  liveStorageValues.value.debounced =
    localStorage.getItem('counter-rate-limit:debounced-counters') || 'null'
  liveStorageValues.value.throttled =
    localStorage.getItem('counter-rate-limit:throttled-counters') || 'null'
  liveStorageValues.value.mixed =
    localStorage.getItem('counter-rate-limit:mixed-count') +
      ' | ' +
      localStorage.getItem('counter-rate-limit:mixed-extcount') || 'null'
}

onMounted(() => {
  updateStorageValues()
  pollInterval = setInterval(updateStorageValues, 200)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})

const reloadPage = () => {
  window.location.reload()
}
</script>

<template>
  <h1>Pinia Plugin Storage</h1>

  <h2>Basic</h2>

  <table>
    <thead>
      <tr>
        <th>storageType</th>
        <th>Action</th>
        <th>Value</th>
        <th>Expected behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>None</td>
        <td>
          <button @click="counterStoreNone.increment(-1)">-</button>
          <button @click="counterStoreNone.increment(1)">+</button>
        </td>
        <td>{{ counterStoreNone.count }}&nbsp;&nbsp;{{ counterStoreNone.extCount }}</td>
        <td>Values should not persist after page reload</td>
      </tr>
      <tr>
        <td>localStorage</td>
        <td>
          <button @click="counterStoreBasic.increment(-1)">-</button>
          <button @click="counterStoreBasic.increment(1)">+</button>
        </td>
        <td>{{ counterStoreBasic.count }}&nbsp;&nbsp;{{ counterStoreBasic.extCount }}</td>
        <td>
          Values should persist after page reload and value should be seen in browser's localStorage
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align: right">
          <button @click="reloadPage">🔄 Reload Page</button>
        </td>
      </tr>
    </tfoot>
  </table>

  <h2>Advanced - adapters</h2>

  <table>
    <thead>
      <tr>
        <th>storageType</th>
        <th>Action</th>
        <th>Value</th>
        <th>Expected behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>sessionStorage</td>
        <td>
          <button @click="counterStoreAdvanced.incrementS(-1)">-</button>
          <button @click="counterStoreAdvanced.incrementS(1)">+</button>
        </td>
        <td>{{ counterStoreAdvanced.countS }}&nbsp;&nbsp;{{ counterStoreAdvanced.extCountS }}</td>
        <td>Values persist during session but reset after browser restart.</td>
      </tr>
      <tr>
        <td>localStorage</td>
        <td>
          <button @click="counterStoreAdvanced.incrementL(-1)">-</button>
          <button @click="counterStoreAdvanced.incrementL(1)">+</button>
        </td>
        <td>{{ counterStoreAdvanced.countL }}&nbsp;&nbsp;{{ counterStoreAdvanced.extCountL }}</td>
        <td>Values persist across sessions and browser restarts.</td>
      </tr>
      <tr>
        <td>cookies</td>
        <td>
          <button @click="counterStoreAdvanced.incrementC(-1)">-</button>
          <button @click="counterStoreAdvanced.incrementC(1)">+</button>
        </td>
        <td>{{ counterStoreAdvanced.countC }}&nbsp;&nbsp;{{ counterStoreAdvanced.extCountC }}</td>
        <td>Values stored in cookies with 30s expiry. Check browser dev tools.</td>
      </tr>
      <tr>
        <td>indexedDB</td>
        <td>
          <button @click="counterStoreAdvanced.incrementI(-1)">-</button>
          <button @click="counterStoreAdvanced.incrementI(1)">+</button>
        </td>
        <td>{{ counterStoreAdvanced.countI }}&nbsp;&nbsp;{{ counterStoreAdvanced.extCountI }}</td>
        <td>Values stored in IndexedDB for complex data and large storage.</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align: right">
          <button @click="reloadPage">🔄 Reload Page</button>
        </td>
      </tr>
    </tfoot>
  </table>

  <h2>Advanced - rate limiting</h2>

  <table>
    <thead>
      <tr>
        <th>Rate Limiting</th>
        <th>Action</th>
        <th>Store Value</th>
        <th>localStorage Value</th>
        <th>Expected behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>None</td>
        <td>
          <button @click="counterStoreRateLimit.incrementNone(-1)">-</button>
          <button @click="counterStoreRateLimit.incrementNone(1)">+</button>
        </td>
        <td>
          {{ counterStoreRateLimit.countNone }}&nbsp;&nbsp;{{ counterStoreRateLimit.extCountNone }}
        </td>
        <td>
          <code class="storage-value">{{ liveStorageValues.none }}</code>
        </td>
        <td>Every click saves immediately to localStorage</td>
      </tr>
      <tr>
        <td>Debounced (1s)</td>
        <td>
          <button @click="counterStoreRateLimit.incrementDebounced(-1)">-</button>
          <button @click="counterStoreRateLimit.incrementDebounced(1)">+</button>
        </td>
        <td>
          {{ counterStoreRateLimit.countDebounced }}&nbsp;&nbsp;{{
            counterStoreRateLimit.extCountDebounced
          }}
        </td>
        <td>
          <code class="storage-value">{{ liveStorageValues.debounced }}</code>
        </td>
        <td>Saves only after 1 second of inactivity</td>
      </tr>
      <tr>
        <td>Throttled (1s)</td>
        <td>
          <button @click="counterStoreRateLimit.incrementThrottled(-1)">-</button>
          <button @click="counterStoreRateLimit.incrementThrottled(1)">+</button>
        </td>
        <td>
          {{ counterStoreRateLimit.countThrottled }}&nbsp;&nbsp;{{
            counterStoreRateLimit.extCountThrottled
          }}
        </td>
        <td>
          <code class="storage-value">{{ liveStorageValues.throttled }}</code>
        </td>
        <td>Saves at most once per second</td>
      </tr>
      <tr>
        <td>Mixed (1.5s)</td>
        <td>
          <button @click="counterStoreRateLimit.incrementMixed(-1)">-</button>
          <button @click="counterStoreRateLimit.incrementMixed(1)">+</button>
        </td>
        <td>
          {{ counterStoreRateLimit.countMixed }}&nbsp;&nbsp;{{
            counterStoreRateLimit.extCountMixed
          }}
        </td>
        <td>
          <code class="storage-value">{{ liveStorageValues.mixed }}</code>
        </td>
        <td>Uses debounce for count, throttle for extCount</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="text-align: right">
          <button @click="reloadPage">🔄 Reload Page</button>
        </td>
      </tr>
    </tfoot>
  </table>

  <h3>Cross-tab broadcasting</h3>
  <p>
    Cross-tab broadcasting enables real-time synchronization of state changes across multiple
    browser tabs. <br />
    This is automatically available for <strong>localStorage</strong> (via storage events) and
    <strong>indexedDB</strong> (via BroadcastChannel API). <br />
    When you change a value in one tab, it instantly updates in all other tabs without requiring
    manual refresh. <br />
  </p>
</template>

<style scoped>
/* Minimal normalize */
* {
  box-sizing: border-box;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 0.85rem;
}

/* Headings */
h1 {
  font-size: 1.3rem;
  margin: 1.5rem 0 1rem 0;
}

h2 {
  font-size: 1.15rem;
  margin: 1.25rem 0 0.75rem 0;
}

h3 {
  font-size: 1rem;
  margin: 1rem 0 0.5rem 0;
}

/* Buttons */
button {
  cursor: pointer;
  padding: 6px 12px;
  margin-right: 3px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  transition: all 0.2s ease;
}

button:hover {
  background-color: #e9e9e9;
  border-color: #999;
}

/* Tables */
table {
  border-collapse: collapse;
  border: 1px solid #ddd;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Storage value display */
.storage-value {
  font-style: italic;
}
</style>
