import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStoreBasic = defineStore(
  'counter-basic',
  () => {
    const count = ref(0)

    const extCount = ref({
      decimal: 0,
      hex: '0x0',
    })

    function increment(incrementBy?: number) {
      count.value += incrementBy ?? 1

      extCount.value.decimal = count.value
      extCount.value.hex = '0x' + count.value.toString(16)
    }

    return { count, extCount, increment }
  },
  {
    storage: 'localStorage',
  },
)
