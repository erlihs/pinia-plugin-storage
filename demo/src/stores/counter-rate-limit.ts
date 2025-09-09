import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStoreRateLimit = defineStore(
  'counter-rate-limit',
  () => {
    // None - no rate limiting
    const countNone = ref(0)
    const extCountNone = ref({
      decimal: 0,
      hex: '0x0',
    })

    function incrementNone(incrementBy?: number) {
      countNone.value += incrementBy ?? 1
      extCountNone.value.decimal = countNone.value
      extCountNone.value.hex = '0x' + countNone.value.toString(16)
    }

    // Debounced - saves after 1 second of inactivity
    const countDebounced = ref(0)
    const extCountDebounced = ref({
      decimal: 0,
      hex: '0x0',
    })

    function incrementDebounced(incrementBy?: number) {
      countDebounced.value += incrementBy ?? 1
      extCountDebounced.value.decimal = countDebounced.value
      extCountDebounced.value.hex = '0x' + countDebounced.value.toString(16)
    }

    // Throttled - saves at most once per second
    const countThrottled = ref(0)
    const extCountThrottled = ref({
      decimal: 0,
      hex: '0x0',
    })

    function incrementThrottled(incrementBy?: number) {
      countThrottled.value += incrementBy ?? 1
      extCountThrottled.value.decimal = countThrottled.value
      extCountThrottled.value.hex = '0x' + countThrottled.value.toString(16)
    }

    // Mixed - debounce for count, throttle for extCount
    const countMixed = ref(0)
    const extCountMixed = ref({
      decimal: 0,
      hex: '0x0',
    })

    function incrementMixed(incrementBy?: number) {
      countMixed.value += incrementBy ?? 1
      extCountMixed.value.decimal = countMixed.value
      extCountMixed.value.hex = '0x' + countMixed.value.toString(16)
    }

    return {
      countNone,
      extCountNone,
      incrementNone,
      countDebounced,
      extCountDebounced,
      incrementDebounced,
      countThrottled,
      extCountThrottled,
      incrementThrottled,
      countMixed,
      extCountMixed,
      incrementMixed,
    }
  },
  {
    storage: {
      buckets: [
        // None - no rate limiting
        {
          adapter: 'localStorage',
          key: 'none-counters',
          include: ['countNone', 'extCountNone'],
        },
        // Debounced - 1 second
        {
          adapter: 'localStorage',
          key: 'debounced-counters',
          include: ['countDebounced', 'extCountDebounced'],
          debounceDelayMs: 1000,
        },
        // Throttled - 1 second
        {
          adapter: 'localStorage',
          key: 'throttled-counters',
          include: ['countThrottled', 'extCountThrottled'],
          throttleDelayMs: 1000,
        },
        // Mixed - 1.5 seconds
        {
          adapter: 'localStorage',
          key: 'mixed-count',
          include: ['countMixed'],
          debounceDelayMs: 1500,
        },
        {
          adapter: 'localStorage',
          key: 'mixed-extcount',
          include: ['extCountMixed'],
          throttleDelayMs: 1500,
        },
      ],
    },
  },
)
