import { detectCycles, isInCycle } from './detect-cycles'
import type { Interval } from '@/types/workout'

type Action =
  | { type: 'ADD_INTERVAL'; interval: Interval; index?: number }
  | { type: 'REMOVE_INTERVAL'; index: number }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'CHANGE_INTERVAL'; index: number; interval: Partial<Interval> }

export function workoutReducer(state: Interval[], action: Action): Interval[] {
  switch (action.type) {
    case 'ADD_INTERVAL': {
      const index = action.index ?? state.length
      if (index < 0 || index > state.length) return state
      return [...state.slice(0, index), action.interval, ...state.slice(index)]
    }

    case 'REMOVE_INTERVAL':
      if (action.index < 0 || action.index >= state.length) return state
      return state.filter((_, i) => i !== action.index)

    case 'REORDER': {
      if (action.fromIndex === action.toIndex) return state
      if (action.fromIndex < 0 || action.fromIndex >= state.length) return state
      if (action.toIndex < 0 || action.toIndex >= state.length) return state
      const cycles = detectCycles(state)
      const sourceCycle = isInCycle(action.fromIndex, cycles)
      const targetCycle = isInCycle(action.toIndex, cycles)
      const block = state[action.fromIndex]!
      const recovery = block.type === 'rest_between_cycles'
      const destination = recovery && targetCycle
        ? action.fromIndex < action.toIndex ? targetCycle.endIdx : targetCycle.startIdx
        : action.toIndex

      // Older rounds only stored positions. Give affected rounds a stable identity before reordering.
      const next = [...state]
      const usesLegacyPositions = [sourceCycle, targetCycle].some((cycle) =>
        cycle?.intervals.some((interval) => !interval.cycleId && interval.cycleIndex != null),
      )
      for (const cycle of usesLegacyPositions ? cycles : []) {
        if (!cycle.intervals.some((interval) => interval.cycleIndex != null)) continue
        const cycleId = `legacy-cycle:${state[cycle.startIdx]!.id}`
        for (let index = cycle.startIdx; index <= cycle.endIdx; index++) {
          next[index] = { ...state[index]!, cycleId, cycleTitle: cycle.label }
        }
      }

      const moved = next[action.fromIndex]!
      const target = next[action.toIndex]!
      const canJoinCycle = moved.type === 'work' || moved.type === 'rest'
      if (recovery || (canJoinCycle && sourceCycle !== targetCycle)) {
        next[action.fromIndex] = {
          ...moved,
          cycleId: recovery ? undefined : target.cycleId ?? targetCycle?.intervals[0]?.cycleId,
          cycleTitle: recovery ? undefined : target.cycleTitle ?? targetCycle?.intervals[0]?.cycleTitle,
          cycleIndex: undefined,
        }
      }
      const [removed] = next.splice(action.fromIndex, 1)
      next.splice(destination, 0, removed!)
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
