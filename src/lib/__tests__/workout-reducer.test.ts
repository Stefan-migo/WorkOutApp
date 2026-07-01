import { describe, it, expect } from 'vitest'
import { workoutReducer } from '@/lib/workout-reducer'
import type { Interval } from '@/types/workout'

const base: Interval = { id: 'a', type: 'work', title: 'Test', duration: 30 }
const prepare: Interval = { id: 'b', type: 'prepare', title: 'Prepare', duration: 10 }
const rest: Interval = { id: 'c', type: 'rest', title: 'Rest', duration: 20 }

describe('workoutReducer', () => {
  it('ADD_INTERVAL appends to the list', () => {
    const r = workoutReducer([base], { type: 'ADD_INTERVAL', interval: rest })
    expect(r).toHaveLength(2)
    expect(r[1]!.id).toBe('c')
  })

  it('CHANGE_INTERVAL replaces an interval', () => {
    const r = workoutReducer([base, rest], { type: 'CHANGE_INTERVAL', index: 1, interval: { ...rest, duration: 99 } })
    expect(r[1]!.duration).toBe(99)
  })

  it('REMOVE_INTERVAL removes by index', () => {
    const r = workoutReducer([base, rest], { type: 'REMOVE_INTERVAL', index: 0 })
    expect(r).toHaveLength(1)
    expect(r[0]!.id).toBe('c')
  })

  it('MOVE_UP swaps with the previous item', () => {
    const r = workoutReducer([base, rest], { type: 'MOVE_UP', index: 1 })
    expect(r[0]!.id).toBe('c')
    expect(r[1]!.id).toBe('a')
  })

  it('MOVE_DOWN swaps with the next item', () => {
    const r = workoutReducer([base, rest], { type: 'MOVE_DOWN', index: 0 })
    expect(r[0]!.id).toBe('c')
    expect(r[1]!.id).toBe('a')
  })

  it('WRAP_IN_CYCLE wraps last two items', () => {
    const r = workoutReducer([prepare, base, rest], { type: 'WRAP_IN_CYCLE' })
    expect(r).toHaveLength(2)
    expect(r[0]!.id).toBe('b')
    expect(r[1]!.children).toHaveLength(2)
    expect(r[1]!.children![0]!.id).toBe('a')
    expect(r[1]!.children![1]!.id).toBe('c')
  })

  it('SHEET_SAVE updates by index', () => {
    const r = workoutReducer([base, rest], { type: 'SHEET_SAVE', index: 0, interval: { ...base, duration: 45 } })
    expect(r[0]!.duration).toBe(45)
  })
})
