import { ref } from 'vue'
import { defineStore } from 'pinia'
import '../plugin/types'
import cookiesStorage from '../plugin/adapters/cookies'
//import cookiesStorage, { createCookiesStorage } from '@/plugin/adapters/cookies'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  const extCount = ref({
    decimal: 0,
    hex: '0x0',
  })

  function increment() {
    count.value++

    extCount.value.decimal = count.value
    extCount.value.hex = '0x' + count.value.toString(16)
  }

  return { count, extCount, increment }
})

export const useCounterStoreDefault = defineStore(
  'counter-default',
  () => {
    const count = ref(0)

    const extCount = ref({
      decimal: 0,
      hex: '0x0',
    })

    function increment() {
      count.value++

      extCount.value.decimal = count.value
      extCount.value.hex = '0x' + count.value.toString(16)
    }

    return { count, extCount, increment }
  },
  {
    storage: {
      buckets: [
        {
          key: 'my-counter',
          storage: localStorage,
          paths: ['count', 'extCount'],
        },
      ],
    },
  },
)

export const useCounterStoreAdvanced = defineStore(
  'counter-advanced',
  () => {
    const count = ref(0)

    const extCount = ref({
      decimal: 0,
      hex: '0x0',
    })

    function increment() {
      count.value++

      extCount.value.decimal = count.value
      extCount.value.hex = '0x' + count.value.toString(16)
    }

    return { count, extCount, increment }
  },
  {
    storage: {
      buckets: [
        {
          key: 'my-counter',
          storage: cookiesStorage,
          paths: ['count', 'extCount'],
          cookieOptions: {
           maxAge: 60, // 1 minute
          }
        },
      ],
    },
  },
)

