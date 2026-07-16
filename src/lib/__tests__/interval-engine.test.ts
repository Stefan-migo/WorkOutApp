import { describe, it, expect } from 'vitest'
import type { Workout } from '@/types/workout'
import { flattenWorkout, totalDuration, durationAt } from '../interval-engine'

function makeWorkout(intervals: Workout['intervals'] = []): Workout {
  return { id: 'test', title: 'Test', intervals, createdAt: 0, updatedAt: 0 }
}

describe('flattenWorkout', () => {
  it('returns empty array for empty intervals', () => {
    const result = flattenWorkout(makeWorkout([]))
    expect(result).toEqual([])
  })

  it('passes flat intervals through as identity (same array reference)', () => {
    const flat = [
      { id: 'a', type: 'work' as const, title: 'A', duration: 10 },
      { id: 'b', type: 'rest' as const, title: 'B', duration: 20 },
      { id: 'c', type: 'work' as const, title: 'C', duration: 15 },
    ]
    const workout = makeWorkout(flat)
    const result = flattenWorkout(workout)
    // Must be identity — same reference, no transformation
    expect(result).toBe(workout.intervals)
  })

  it('passes single interval through as identity', () => {
    const flat = [{ id: 'solo', type: 'work' as const, title: 'Solo', duration: 60 }]
    const workout = makeWorkout(flat)
    const result = flattenWorkout(workout)
    expect(result).toBe(workout.intervals)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('solo')
  })
})

describe('totalDuration', () => {
  it('sums flat intervals', () => {
    const flat = [
      { id: 'a', type: 'work' as const, title: 'A', duration: 10 },
      { id: 'b', type: 'rest' as const, title: 'B', duration: 20 },
      { id: 'c', type: 'work' as const, title: 'C', duration: 15 },
    ]
    expect(totalDuration(makeWorkout(flat))).toBe(45)
  })

  it('returns 0 for empty workout', () => {
    expect(totalDuration(makeWorkout([]))).toBe(0)
  })
})

describe('durationAt', () => {
  it('finds the correct interval and localElapsed at a given offset', () => {
    const flat = [
      { id: 'a', type: 'work' as const, title: 'A', duration: 10 },
      { id: 'b', type: 'rest' as const, title: 'B', duration: 20 },
      { id: 'c', type: 'work' as const, title: 'C', duration: 15 },
    ]
    const result = durationAt(makeWorkout(flat), 25)
    expect(result).toBeDefined()
    expect(result!.interval.id).toBe('b')
    expect(result!.localElapsed).toBe(15)
  })

  it('returns undefined for elapsed beyond total duration', () => {
    const flat = [
      { id: 'a', type: 'work' as const, title: 'A', duration: 10 },
      { id: 'b', type: 'rest' as const, title: 'B', duration: 20 },
      { id: 'c', type: 'work' as const, title: 'C', duration: 15 },
    ]
    expect(durationAt(makeWorkout(flat), 100)).toBeUndefined()
  })

  it('returns undefined for empty workout', () => {
    expect(durationAt(makeWorkout([]), 5)).toBeUndefined()
  })
})
