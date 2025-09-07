<script setup lang="ts">
import {
  useCounterStore,
  useCounterStoreDefault,
  useCounterStoreAdvanced,
  useCounterStoreSession,
  useCounterStoreIndexedDB,
  useCounterStoreCrossTab,
} from './stores/counter'
const counterStore = useCounterStore()
const counterStoreDefault = useCounterStoreDefault()
const counterStoreAdvanced = useCounterStoreAdvanced()
const counterStoreSession = useCounterStoreSession()
const counterStoreIndexedDB = useCounterStoreIndexedDB()
const counterStoreCrossTab = useCounterStoreCrossTab()
</script>

<template>
  <h1>Pinia Plugin Storage</h1>
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
        <td>none</td>
        <td><button @click="counterStore.increment()">+</button></td>
        <td>{{ counterStore.count }}</td>
        <td>{{ counterStore.extCount }}</td>
        <td>Values should not persist after page reload</td>
      </tr>
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

<style scoped></style>
