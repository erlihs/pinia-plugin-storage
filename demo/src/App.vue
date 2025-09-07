<script setup lang="ts">
import { useCounterStoreNone } from './stores/counter-none'
import { useCounterStoreBasic } from './stores/counter-basic'
import { useCounterStoreAdvanced } from './stores/counter-advanced'

const counterStoreNone = useCounterStoreNone()
const counterStoreBasic = useCounterStoreBasic()
const counterStoreAdvanced = useCounterStoreAdvanced()

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

  <h2>Advanced</h2>

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
        <td>Values persist during session but reset after browser restart. Debounce: 50ms</td>
      </tr>
      <tr>
        <td>localStorage</td>
        <td>
          <button @click="counterStoreAdvanced.incrementL(-1)">-</button>
          <button @click="counterStoreAdvanced.incrementL(1)">+</button>
        </td>
        <td>{{ counterStoreAdvanced.countL }}&nbsp;&nbsp;{{ counterStoreAdvanced.extCountL }}</td>
        <td>Values persist across sessions and browser restarts. Debounce: 200ms</td>
      </tr>
      <tr>
        <td>cookies</td>
        <td>
          <button @click="counterStoreAdvanced.incrementC(-1)">-</button>
          <button @click="counterStoreAdvanced.incrementC(1)">+</button>
        </td>
        <td>{{ counterStoreAdvanced.countC }}&nbsp;&nbsp;{{ counterStoreAdvanced.extCountC }}</td>
        <td>Values stored in cookies with 30s expiry. Check browser dev tools. Debounce: 300ms</td>
      </tr>
      <tr>
        <td>indexedDB</td>
        <td>
          <button @click="counterStoreAdvanced.incrementI(-1)">-</button>
          <button @click="counterStoreAdvanced.incrementI(1)">+</button>
        </td>
        <td>{{ counterStoreAdvanced.countI }}&nbsp;&nbsp;{{ counterStoreAdvanced.extCountI }}</td>
        <td>Values stored in IndexedDB for complex data and large storage. Debounce: 150ms</td>
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
</style>
