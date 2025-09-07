/**
 * State resolution utilities for include/exclude filtering
 */

import type { PiniaPluginContext } from 'pinia'

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

/**
 * Resolves the state slice based on include/exclude configuration
 * @param state - The store state
 * @param include - Properties to include
 * @param exclude - Properties to exclude
 * @returns Filtered state slice
 */
export const resolveState = (
  state: Store['$state'],
  include?: string[] | string,
  exclude?: string[] | string,
): PartialState => {
  if (include && exclude) {
    throw new Error('Cannot use both include and exclude in the same bucket')
  }

  if (include) {
    const paths = Array.isArray(include) ? include : [include]
    return paths.reduce((finalObj, key) => {
      if (key in state) {
        finalObj[key] = state[key]
      }
      return finalObj
    }, {} as PartialState)
  } else if (exclude) {
    const paths = Array.isArray(exclude) ? exclude : [exclude]
    return Object.keys(state).reduce((finalObj, key) => {
      if (!paths.includes(key)) {
        finalObj[key] = state[key]
      }
      return finalObj
    }, {} as PartialState)
  } else {
    return state
  }
}
