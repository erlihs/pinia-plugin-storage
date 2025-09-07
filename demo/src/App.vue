<script setup lang="ts">
import { useCounterStoreNone } from './stores/counter-none'
import {
  useCounterStoreDefault,
  useCounterStoreAdvanced,
  useCounterStoreSession,
  useCounterStoreIndexedDB,
  useCounterStoreCrossTab,
} from './stores/counter'

const counterStoreNone = useCounterStoreNone()
const counterStoreDefault = useCounterStoreDefault()
const counterStoreAdvanced = useCounterStoreAdvanced()
const counterStoreSession = useCounterStoreSession()
const counterStoreIndexedDB = useCounterStoreIndexedDB()
const counterStoreCrossTab = useCounterStoreCrossTab()

const reloadPage = () => {
  window.location.reload()
}
</script>

<template>
  <h1>Pinia Plugin Storage</h1>

  <h2>None</h2>

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
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align: right">
          <button @click="reloadPage">🔄 Reload Page</button>
        </td>
      </tr>
    </tfoot>
  </table>

  <h2>Source</h2>
  <p>//todo</p>
  <h2>Tests</h2>

  <table>
    <thead>
      <tr>
        <th>Storage type</th>
        <th>Action</th>
        <th>Simple value</th>
        <th>Object</th>
        <th>Expected behaviors</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>localStorage</td>
        <td><button @click="counterStoreDefault.increment()">+</button></td>
        <td>{{ counterStoreDefault.count }}</td>
        <td>{{ counterStoreDefault.extCount }}</td>
        <td>Values should persist after page reload</td>
      </tr>
      <tr>
        <td>advancedStorage</td>
        <td><button @click="counterStoreAdvanced.increment()">+</button></td>
        <td>{{ counterStoreAdvanced.count }}</td>
        <td>{{ counterStoreAdvanced.extCount }}</td>
        <td>Values should persist after page reload</td>
      </tr>
      <tr>
        <td>sessionStorage</td>
        <td><button @click="counterStoreSession.increment()">+</button></td>
        <td>{{ counterStoreSession.count }}</td>
        <td>{{ counterStoreSession.extCount }}</td>
        <td>Values should persist after page reload</td>
      </tr>
      <tr>
        <td>indexedDB</td>
        <td><button @click="counterStoreIndexedDB.increment()">+</button></td>
        <td>{{ counterStoreIndexedDB.count }}</td>
        <td>{{ counterStoreIndexedDB.extCount }}</td>
        <td>Values should persist after page reload</td>
      </tr>
    </tbody>
  </table>

  <h2>Cross-Tab Sync Demo</h2>
  <p>Open this page in multiple tabs to see real-time synchronization!</p>
  <table>
    <thead>
      <tr>
        <th>Property</th>
        <th>Action</th>
        <th>Value</th>
        <th>Storage</th>
        <th>Expected behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Count</td>
        <td><button @click="counterStoreCrossTab.increment()">+</button></td>
        <td>{{ counterStoreCrossTab.count }}</td>
        <td>localStorage</td>
        <td>Syncs across tabs instantly</td>
      </tr>
      <tr>
        <td>User Name</td>
        <td>
          <button @click="counterStoreCrossTab.updateName('User ' + Date.now())">
            Update Name
          </button>
        </td>
        <td>{{ counterStoreCrossTab.name }}</td>
        <td>localStorage</td>
        <td>Syncs across tabs instantly</td>
      </tr>
      <tr>
        <td>Theme</td>
        <td><button @click="counterStoreCrossTab.toggleTheme()">Toggle Theme</button></td>
        <td>{{ counterStoreCrossTab.settings.theme }}</td>
        <td>indexedDB</td>
        <td>Syncs across tabs with BroadcastChannel</td>
      </tr>
    </tbody>
  </table>
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
}
</style>
