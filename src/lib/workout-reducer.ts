import type { Interval } from '@/types/workout'

// ponytail: counter ID, upgrade to crypto.randomUUID if collisions become an issue
let nextId = 1
function intervalId(): string {
  return `int-${nextId++}`
}

type Action =
  | { type: 'ADD_INTERVAL'; interval: Interval }
  | { type: 'CHANGE_INTERVAL'; index: number; interval: Interval }
  | { type: 'REMOVE_INTERVAL'; index: number }
  | { type: 'MOVE_UP'; index: number }
  | { type: 'MOVE_DOWN'; index: number }
  | { type: 'CYCLE_COUNT_CHANGE'; parentIndex: number; count: number }
  | { type: 'CHILD_CHANGE'; parentIndex: number; childIndex: number; child: Interval }
  | { type: 'REMOVE_CHILD'; parentIndex: number; childIndex: number }
  | { type: 'CHILD_MOVE_UP'; parentIndex: number; childIndex: number }
  | { type: 'CHILD_MOVE_DOWN'; parentIndex: number; childIndex: number }
  | { type: 'WRAP_IN_CYCLE' }
  | { type: 'SHEET_SAVE'; index: number; interval: Interval }

export function workoutReducer(state: Interval[], action: Action): Interval[] {
  switch (action.type) {
    case 'ADD_INTERVAL':
      return [...state, action.interval]

    case 'CHANGE_INTERVAL': {
      const forcedType =
        action.index === 0 ? 'prepare' as const
          : action.index === state.length - 1 ? 'cooldown' as const
            : action.interval.type
      const next = [...state]
      next[action.index] = { ...action.interval, type: forcedType }
      return next
    }

    case 'REMOVE_INTERVAL':
      return state.filter((_, i) => i !== action.index)

    case 'MOVE_UP': {
      if (action.index <= 0) return state
      const next = [...state]
      ;[next[action.index - 1], next[action.index]] = [next[action.index]!, next[action.index - 1]!]
      return next
    }

    case 'MOVE_DOWN': {
      if (action.index >= state.length - 1) return state
      const next = [...state]
      ;[next[action.index]!, next[action.index + 1]!] = [next[action.index + 1]!, next[action.index]!]
      return next
    }

    case 'CYCLE_COUNT_CHANGE': {
      const next = [...state]
      const parent = next[action.parentIndex]
      if (!parent) return state
      next[action.parentIndex] = { ...parent, cycleCount: action.count }
      return next
    }

    case 'CHILD_CHANGE': {
      const next = [...state]
      const parent = next[action.parentIndex]
      if (!parent?.children) return state
      const children = [...parent.children] as Interval[]
      children[action.childIndex] = action.child
      next[action.parentIndex] = { ...parent, children }
      return next
    }

    case 'REMOVE_CHILD': {
      const next = [...state]
      const parent = next[action.parentIndex]
      if (!parent?.children) return state
      const children = parent.children.filter((_, i) => i !== action.childIndex)
      next[action.parentIndex] = (
        children.length === 0
          ? { ...parent, children: undefined }
          : { ...parent, children }
      ) as Interval
      return next
    }

    case 'CHILD_MOVE_UP': {
      if (action.childIndex <= 0) return state
      const next = [...state]
      const parent = next[action.parentIndex]
      if (!parent?.children) return state
      const children = [...parent.children] as Interval[]
      ;[children[action.childIndex - 1]!, children[action.childIndex]!] =
        [children[action.childIndex]!, children[action.childIndex - 1]!]
      next[action.parentIndex] = { ...parent, children }
      return next
    }

    case 'CHILD_MOVE_DOWN': {
      const next = [...state]
      const parent = next[action.parentIndex]
      if (!parent?.children || action.childIndex >= parent.children.length - 1) return state
      const children = [...parent.children] as Interval[]
      ;[children[action.childIndex]!, children[action.childIndex + 1]!] =
        [children[action.childIndex + 1]!, children[action.childIndex]!]
      next[action.parentIndex] = { ...parent, children }
      return next
    }

    case 'WRAP_IN_CYCLE': {
      if (state.length < 2) return state
      const lastTwo = state.slice(-2)
      const cycle: Interval = {
        id: intervalId(),
        type: 'work',
        title: 'Block',
        duration: 0,
        children: lastTwo,
        cycleCount: 4,
      }
      return [...state.slice(0, -2), cycle]
    }

    case 'SHEET_SAVE': {
      const next = [...state]
      next[action.index] = action.interval
      return next
    }

    default:
      return state
  }
}
