<script setup lang="ts">
import {
  useCounterStore,
  useCounterStoreDefault,
  useCounterStoreAdvanced,
  useCounterStoreSession,
} from './stores/counter'
const counterStore = useCounterStore()
const counterStoreDefault = useCounterStoreDefault()
const counterStoreAdvanced = useCounterStoreAdvanced()
const counterStoreSession = useCounterStoreSession()
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
    </tbody>
  </table>
</template>

<style scoped></style>
