import { describe, it, expect } from 'vitest'
import type { Sequence, Workout } from '@/types/workout'
import { getTotalRounds, getRoundAt, getProgress, resolveWorkouts } from '../sequence-engine'

function makeSeq(overrides: Partial<Sequence> = {}): Sequence {
  return {
    id: 'seq-1',
    title: 'Test',
    workoutIds: ['a', 'b', 'c'],
    repeatCount: 2,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

function makeWorkout(id: string): Workout {
  return { id, title: id.toUpperCase(), intervals: [], createdAt: 0, updatedAt: 0 }
}

describe('getTotalRounds', () => {
  it('multiplies workoutIds length by repeatCount', () => {
    expect(getTotalRounds(makeSeq({ workoutIds: ['a', 'b', 'c'], repeatCount: 2 }))).toBe(6)
  })

  it('returns 1 for single workout with repeatCount 1', () => {
    expect(getTotalRounds(makeSeq({ workoutIds: ['a'], repeatCount: 1 }))).toBe(1)
  })

  it('returns 0 for empty workoutIds', () => {
    expect(getTotalRounds(makeSeq({ workoutIds: [], repeatCount: 5 }))).toBe(0)
  })
})

describe('getRoundAt', () => {
  const seq = makeSeq()

  it('returns first workout on index 0', () => {
    expect(getRoundAt(seq, 0)).toEqual({ workoutId: 'a', round: 1 })
  })

  it('returns last workout of first round on index 2', () => {
    expect(getRoundAt(seq, 2)).toEqual({ workoutId: 'c', round: 1 })
  })

  it('returns first workout of second round on index 3', () => {
    expect(getRoundAt(seq, 3)).toEqual({ workoutId: 'a', round: 2 })
  })

  it('returns undefined for negative index', () => {
    expect(getRoundAt(seq, -1)).toBeUndefined()
  })

  it('returns undefined for index beyond total rounds', () => {
    expect(getRoundAt(seq, 6)).toBeUndefined()
  })

  it('returns undefined for empty sequence', () => {
    const empty = makeSeq({ workoutIds: [], repeatCount: 1 })
    expect(getRoundAt(empty, 0)).toBeUndefined()
  })
})

describe('getProgress', () => {
  const seq = makeSeq() // total = 6

  it('reports correct current, total, and percent at midpoint', () => {
    expect(getProgress(seq, 3)).toEqual({ current: 3, total: 6, percent: 50 })
  })

  it('reports 0% at start', () => {
    expect(getProgress(seq, 0)).toEqual({ current: 0, total: 6, percent: 0 })
  })

  it('reports 100% when at total', () => {
    expect(getProgress(seq, 6)).toEqual({ current: 6, total: 6, percent: 100 })
  })

  it('caps current at total and reports 100% when past total', () => {
    expect(getProgress(seq, 99)).toEqual({ current: 6, total: 6, percent: 100 })
  })
})

describe('resolveWorkouts', () => {
  it('filters missing workout IDs and preserves order', () => {
    const workouts = [makeWorkout('a'), makeWorkout('b')]
    const seq = makeSeq({ workoutIds: ['a', 'b', 'missing'] })
    const resolved = resolveWorkouts(seq, workouts)
    expect(resolved).toHaveLength(2)
    expect(resolved[0]!.id).toBe('a')
    expect(resolved[1]!.id).toBe('b')
  })

  it('returns empty array when no workouts match', () => {
    const workouts = [makeWorkout('x'), makeWorkout('y')]
    const seq = makeSeq({ workoutIds: ['a', 'b'] })
    expect(resolveWorkouts(seq, workouts)).toEqual([])
  })

  it('returns empty array for empty workoutIds', () => {
    const workouts = [makeWorkout('a')]
    const seq = makeSeq({ workoutIds: [] })
    expect(resolveWorkouts(seq, workouts)).toEqual([])
  })
})
