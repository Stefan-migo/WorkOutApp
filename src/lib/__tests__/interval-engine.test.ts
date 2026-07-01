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

  it('passes flat intervals through at depth 0 with no cycle/set indices', () => {
    const flat = [
      { id: 'a', type: 'work' as const, title: 'A', duration: 10 },
      { id: 'b', type: 'rest' as const, title: 'B', duration: 20 },
      { id: 'c', type: 'work' as const, title: 'C', duration: 15 },
    ]
    const result = flattenWorkout(makeWorkout(flat))
    expect(result).toHaveLength(3)
    expect(result[0]!.depth).toBe(0)
    expect(result[1]!.depth).toBe(0)
    expect(result[2]!.depth).toBe(0)
    expect(result.every((f) => f.cycleIndex === undefined && f.setIndex === undefined)).toBe(true)
  })

  it('expands cycles: 2 children × 2 cycles = 4 items with correct depth and indices', () => {
    const cycleParent = {
      id: 'p1',
      type: 'work' as const,
      title: 'Cycle',
      duration: 0,
      children: [
        { id: 'c1', type: 'work' as const, title: 'Child1', duration: 10 },
        { id: 'c2', type: 'rest' as const, title: 'Child2', duration: 5 },
      ],
      cycleCount: 2,
      setCount: 1,
    }
    const result = flattenWorkout(makeWorkout([cycleParent]))
    expect(result).toHaveLength(4)
    expect(result.every((f) => f.depth === 1)).toBe(true)
    expect(result[0]!.cycleIndex).toBe(1)
    expect(result[0]!.setIndex).toBe(1)
    expect(result[2]!.cycleIndex).toBe(2)
  })

  it('expands sets + cycles: 2 children × 2 cycles × 2 sets = 8 items', () => {
    const base = {
      id: 'p1',
      type: 'work' as const,
      title: 'Cycle',
      duration: 0,
      children: [
        { id: 'c1', type: 'work' as const, title: 'Child1', duration: 10 },
        { id: 'c2', type: 'rest' as const, title: 'Child2', duration: 5 },
      ],
      cycleCount: 2,
      setCount: 2,
    }
    const result = flattenWorkout(makeWorkout([base]))
    expect(result).toHaveLength(8)
    expect(result[4]!.setIndex).toBe(2)
    expect(result[4]!.cycleIndex).toBe(1)
  })

  it('inserts rest intervals between cycles', () => {
    const restParent = {
      id: 'p2',
      type: 'work' as const,
      title: 'RestCycle',
      duration: 0,
      children: [{ id: 'x', type: 'work' as const, title: 'X', duration: 30 }],
      cycleCount: 2,
      setCount: 1,
      restBetweenCycles: 10,
    }
    const result = flattenWorkout(makeWorkout([restParent]))
    expect(result).toHaveLength(3) // child + rest + child
    expect(result[1]!.isGenerated).toBe(true)
    expect(result[1]!.duration).toBe(10)
    expect(result[1]!.type).toBe('rest')
    expect(result[2]!.duration).toBe(30) // last child unchanged
  })

  it('propagates depth correctly through nested intervals (DFS)', () => {
    const nested = {
      id: 'g',
      type: 'work' as const,
      title: 'Group',
      duration: 0,
      children: [
        {
          id: 'sub',
          type: 'work' as const,
          title: 'Sub',
          duration: 0,
          children: [
            { id: 'leaf1', type: 'work' as const, title: 'Leaf1', duration: 5 },
            { id: 'leaf2', type: 'work' as const, title: 'Leaf2', duration: 5 },
          ],
          cycleCount: 1,
          setCount: 1,
        },
      ],
      cycleCount: 1,
      setCount: 1,
    }
    const result = flattenWorkout(makeWorkout([nested]))
    expect(result).toHaveLength(2)
    expect(result[0]!.depth).toBe(2)
    expect(result[1]!.depth).toBe(2)
  })

  it('handles mixed flat and nested intervals in the same workout', () => {
    const flat = { id: 'a', type: 'work' as const, title: 'A', duration: 10 }
    const cycleParent = {
      id: 'p1',
      type: 'work' as const,
      title: 'Cycle',
      duration: 0,
      children: [
        { id: 'c1', type: 'work' as const, title: 'Child1', duration: 10 },
        { id: 'c2', type: 'rest' as const, title: 'Child2', duration: 5 },
      ],
      cycleCount: 2,
      setCount: 1,
    }
    const result = flattenWorkout(makeWorkout([flat, cycleParent]))
    expect(result).toHaveLength(5) // 1 flat + 4 cycle
    expect(result[0]!.id).toBe('a')
    expect(result[0]!.depth).toBe(0)
    expect(result[2]!.depth).toBe(1)
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

  it('sums nested intervals with cycle expansion', () => {
    const cycleParent = {
      id: 'p1',
      type: 'work' as const,
      title: 'Cycle',
      duration: 0,
      children: [
        { id: 'c1', type: 'work' as const, title: 'Child1', duration: 10 },
        { id: 'c2', type: 'rest' as const, title: 'Child2', duration: 5 },
      ],
      cycleCount: 2,
      setCount: 1,
    }
    // 2 cycles × (10 + 5) = 30
    expect(totalDuration(makeWorkout([cycleParent]))).toBe(30)
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
    expect(result!.localElapsed).toBe(15) // 25 - 10
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
