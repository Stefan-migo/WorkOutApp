import { describe, it, expect } from 'vitest'
import { workoutReducer } from '@/lib/workout-reducer'
import type { Interval } from '@/types/workout'

const a: Interval = { id: 'a', type: 'work', title: 'A', duration: 30 }
const b: Interval = { id: 'b', type: 'work', title: 'B', duration: 30 }
const c: Interval = { id: 'c', type: 'work', title: 'C', duration: 30 }
const rest: Interval = { id: 'r', type: 'rest', title: 'Rest', duration: 20 }

describe('workoutReducer', () => {
  describe('ADD_INTERVAL', () => {
    it('appends to empty list', () => {
      const r = workoutReducer([], { type: 'ADD_INTERVAL', interval: a })
      expect(r).toHaveLength(1)
      expect(r[0]!.id).toBe('a')
    })

    it('appends to non-empty list', () => {
      const r = workoutReducer([a, b], { type: 'ADD_INTERVAL', interval: c })
      expect(r).toHaveLength(3)
      expect(r[2]!.id).toBe('c')
    })
  })

  describe('REMOVE_INTERVAL', () => {
    it('removes first item', () => {
      const r = workoutReducer([a, b, c], { type: 'REMOVE_INTERVAL', index: 0 })
      expect(r).toHaveLength(2)
      expect(r[0]!.id).toBe('b')
      expect(r[1]!.id).toBe('c')
    })

    it('removes last item', () => {
      const r = workoutReducer([a, b, c], { type: 'REMOVE_INTERVAL', index: 2 })
      expect(r).toHaveLength(2)
      expect(r[0]!.id).toBe('a')
      expect(r[1]!.id).toBe('b')
    })

    it('removes middle item', () => {
      const r = workoutReducer([a, b, c], { type: 'REMOVE_INTERVAL', index: 1 })
      expect(r).toHaveLength(2)
      expect(r[0]!.id).toBe('a')
      expect(r[1]!.id).toBe('c')
    })

    it('returns state unchanged for positive out-of-bounds index', () => {
      const r = workoutReducer([a, b], { type: 'REMOVE_INTERVAL', index: 5 })
      expect(r).toHaveLength(2)
      expect(r[0]!.id).toBe('a')
      expect(r[1]!.id).toBe('b')
    })

    it('returns state unchanged for negative index', () => {
      const r = workoutReducer([a, b], { type: 'REMOVE_INTERVAL', index: -1 })
      expect(r).toHaveLength(2)
    })
  })

  describe('REORDER', () => {
    it('moves a work block to the target round and keeps the source round separate', () => {
      const roundOne = { cycleId: 'r1', cycleTitle: 'Round 1' }
      const roundTwo = { cycleId: 'r2', cycleTitle: 'Round 2' }
      const state = [{ ...a, ...roundOne }, { ...b, ...roundOne }, { ...c, ...roundTwo }]
      const result = workoutReducer(state, { type: 'REORDER', fromIndex: 1, toIndex: 2 })
      expect(result.map((block) => [block.id, block.cycleId])).toEqual([['a', 'r1'], ['c', 'r2'], ['b', 'r2']])
      expect(result[2]!.cycleTitle).toBe('Round 2')
    })

    it('moves a recovery from the end to the gap before a cycle in one step', () => {
      const recovery = { ...rest, type: 'rest_between_cycles' as const }
      const state = [{ ...a, cycleId: 'r1' }, { ...b, cycleId: 'r2' }, { ...c, cycleId: 'r2' }, recovery]
      const result = workoutReducer(state, { type: 'REORDER', fromIndex: 3, toIndex: 2 })
      expect(result.map((block) => block.id)).toEqual(['a', 'r', 'b', 'c'])
      expect(result[1]!.cycleId).toBeUndefined()
    })

    it('reorders forward (fromIndex < toIndex)', () => {
      const r = workoutReducer([a, b, c], { type: 'REORDER', fromIndex: 0, toIndex: 2 })
      expect(r).toHaveLength(3)
      expect(r[0]!.id).toBe('b')
      expect(r[1]!.id).toBe('c')
      expect(r[2]!.id).toBe('a')
    })

    it('reorders backward (fromIndex > toIndex)', () => {
      const r = workoutReducer([a, b, c], { type: 'REORDER', fromIndex: 2, toIndex: 0 })
      expect(r).toHaveLength(3)
      expect(r[0]!.id).toBe('c')
      expect(r[1]!.id).toBe('a')
      expect(r[2]!.id).toBe('b')
    })

    it('returns state unchanged when fromIndex equals toIndex (no-op)', () => {
      const r = workoutReducer([a, b, c], { type: 'REORDER', fromIndex: 1, toIndex: 1 })
      expect(r).toHaveLength(3)
      expect(r[0]!.id).toBe('a')
      expect(r[1]!.id).toBe('b')
      expect(r[2]!.id).toBe('c')
    })

    it('returns state unchanged for out-of-bounds fromIndex', () => {
      const r = workoutReducer([a, b], { type: 'REORDER', fromIndex: 5, toIndex: 0 })
      expect(r).toHaveLength(2)
    })

    it('returns state unchanged for out-of-bounds toIndex', () => {
      const r = workoutReducer([a, b], { type: 'REORDER', fromIndex: 0, toIndex: 5 })
      expect(r).toHaveLength(2)
    })

    it('returns state unchanged for negative fromIndex', () => {
      const r = workoutReducer([a, b], { type: 'REORDER', fromIndex: -1, toIndex: 0 })
      expect(r).toHaveLength(2)
    })
  })

  describe('CHANGE_INTERVAL', () => {
    it('changes duration', () => {
      const r = workoutReducer([a, rest], { type: 'CHANGE_INTERVAL', index: 1, interval: { duration: 99 } })
      expect(r[1]!.duration).toBe(99)
      // unchanged fields are preserved
      expect(r[1]!.title).toBe('Rest')
      expect(r[1]!.type).toBe('rest')
    })

    it('changes title', () => {
      const r = workoutReducer([a], { type: 'CHANGE_INTERVAL', index: 0, interval: { title: 'New Title' } })
      expect(r[0]!.title).toBe('New Title')
      expect(r[0]!.duration).toBe(30) // unchanged
    })

    it('changes multiple fields at once', () => {
      const r = workoutReducer([a], {
        type: 'CHANGE_INTERVAL',
        index: 0,
        interval: { title: 'Updated', duration: 60, description: 'desc' },
      })
      expect(r[0]!.title).toBe('Updated')
      expect(r[0]!.duration).toBe(60)
      expect(r[0]!.description).toBe('desc')
    })

    it('returns state unchanged for positive out-of-bounds index', () => {
      const r = workoutReducer([a], { type: 'CHANGE_INTERVAL', index: 5, interval: { duration: 99 } })
      expect(r).toHaveLength(1)
      expect(r[0]!.duration).toBe(30)
    })

    it('returns state unchanged for negative index', () => {
      const r = workoutReducer([a], { type: 'CHANGE_INTERVAL', index: -1, interval: { duration: 99 } })
      expect(r[0]!.duration).toBe(30)
    })
  })
})
