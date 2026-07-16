import type { Interval } from '@/types/workout'

type Action =
  | { type: 'ADD_INTERVAL'; interval: Interval }
  | { type: 'REMOVE_INTERVAL'; index: number }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'CHANGE_INTERVAL'; index: number; interval: Partial<Interval> }

// ponytail: simple reducer — 4 flat-list actions only
export function workoutReducer(state: Interval[], action: Action): Interval[] {
  switch (action.type) {
    case 'ADD_INTERVAL':
      return [...state, action.interval]

    case 'REMOVE_INTERVAL':
      if (action.index < 0 || action.index >= state.length) return state
      return state.filter((_, i) => i !== action.index)

    case 'REORDER': {
      if (action.fromIndex === action.toIndex) return state
      if (action.fromIndex < 0 || action.fromIndex >= state.length) return state
      if (action.toIndex < 0 || action.toIndex >= state.length) return state
      const next = [...state]
      const [removed] = next.splice(action.fromIndex, 1)
      if (!removed) return state
      next.splice(action.toIndex, 0, removed)
      return next
    }

    case 'CHANGE_INTERVAL': {
      if (action.index < 0 || action.index >= state.length) return state
      const next = [...state]
      // ponytail: action.interval is Partial<Interval> — spread preserves existing id
      next[action.index] = { ...next[action.index], ...action.interval } as Interval
      return next
    }

    default:
      return state
  }
}
