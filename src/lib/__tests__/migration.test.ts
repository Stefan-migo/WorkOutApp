import { describe, it, expect } from 'vitest'
import { migrateWorkout } from '../migration'
import type { IntervalType } from '@/types/workout'

function makeOldWorkout(intervals: Record<string, unknown>[] = [], extra: Record<string, unknown> = {}) {
  return { id: 'w1', title: 'Test', intervals, createdAt: 0, updatedAt: 0, ...extra }
}

describe('migrateWorkout', () => {
  it('passes flat intervals through unchanged', () => {
    const old = makeOldWorkout([
      { id: 'a', type: 'work', title: 'A', duration: 30 },
      { id: 'b', type: 'rest', title: 'B', duration: 15 },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    expect(result!.intervals).toHaveLength(2)
    expect(result!.intervals[0]!.id).toBe('a')
    expect(result!.intervals[1]!.id).toBe('b')
  })

  it('expands a cycle with children × cycleCount into flat intervals', () => {
    const old = makeOldWorkout([
      {
        id: 'cycle1',
        type: 'work',
        title: 'Cycle',
        duration: 0,
        children: [
          { id: 'c1', type: 'work', title: 'Child1', duration: 45 },
          { id: 'c2', type: 'rest', title: 'Child2', duration: 20 },
        ],
        cycleCount: 2,
        setCount: 1,
      },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    // 2 cycles × 2 children = 4 intervals
    expect(result!.intervals).toHaveLength(4)
    expect(result!.intervals[0]!.id).toBe('c1')
    expect(result!.intervals[1]!.id).toBe('c2')
    expect(result!.intervals[2]!.id).toBe('c1')
    expect(result!.intervals[3]!.id).toBe('c2')
  })

  it('removes deprecated fields from all intervals (children, cycleCount, setCount, restBetweenCycles, collapseTrailingRest, isGenerated)', () => {
    const old = makeOldWorkout([
      {
        id: 'cycle1',
        type: 'work',
        title: 'Cycle',
        duration: 0,
        children: [{ id: 'c1', type: 'work', title: 'Child1', duration: 45 }],
        cycleCount: 2,
        setCount: 1,
        restBetweenCycles: 10,
        collapseTrailingRest: false,
      },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    for (const interval of result!.intervals) {
      expect(interval).not.toHaveProperty('children')
      expect(interval).not.toHaveProperty('cycleCount')
      expect(interval).not.toHaveProperty('setCount')
      expect(interval).not.toHaveProperty('restBetweenCycles')
      expect(interval).not.toHaveProperty('collapseTrailingRest')
      expect(interval).not.toHaveProperty('isGenerated')
    }
  })

  it('inserts synthetic rest intervals between cycle repeats when restBetweenCycles > 0', () => {
    const old = makeOldWorkout([
      {
        id: 'cycle1',
        type: 'work',
        title: 'Cycle',
        duration: 0,
        children: [{ id: 'c1', type: 'work', title: 'X', duration: 30 }],
        cycleCount: 2,
        setCount: 1,
        restBetweenCycles: 10,
      },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    // [work, rest(10), work] = 3 intervals
    expect(result!.intervals).toHaveLength(3)
    expect(result!.intervals[0]!.id).toBe('c1')
    expect(result!.intervals[0]!.duration).toBe(30)
    expect(result!.intervals[1]!.type).toBe('rest_between_cycles' satisfies IntervalType)
    expect(result!.intervals[1]!.duration).toBe(10)
    expect(result!.intervals[2]!.duration).toBe(30)
  })

  it('omits last rest when collapseTrailingRest is true and next root is rest/cooldown', () => {
    const old = makeOldWorkout([
      {
        id: 'cycle1',
        type: 'work',
        title: 'Cycle',
        duration: 0,
        children: [
          { id: 'c1', type: 'work', title: 'Work', duration: 45 },
          { id: 'c2', type: 'rest', title: 'Rest', duration: 20 },
        ],
        cycleCount: 1,
        setCount: 1,
        collapseTrailingRest: true,
      },
      { id: 'cooldown', type: 'cooldown', title: 'Cool Down', duration: 60 },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    // Without collapse: [work(45), rest(20), cooldown(60)]
    // With collapse (next root is cooldown): [work(45), cooldown(60)]
    expect(result!.intervals).toHaveLength(2)
    expect(result!.intervals[0]!.id).toBe('c1')
    expect(result!.intervals[1]!.id).toBe('cooldown')
  })

  it('keeps last rest when collapseTrailingRest is true but next root is NOT rest/cooldown', () => {
    const old = makeOldWorkout([
      {
        id: 'cycle1',
        type: 'work',
        title: 'Cycle',
        duration: 0,
        children: [
          { id: 'c1', type: 'work', title: 'Work', duration: 45 },
          { id: 'c2', type: 'rest', title: 'Rest', duration: 20 },
        ],
        cycleCount: 1,
        setCount: 1,
        collapseTrailingRest: true,
      },
      { id: 'next', type: 'work', title: 'Next Set', duration: 30 },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    // Next root is work, not rest/cooldown → keep last rest
    expect(result!.intervals).toHaveLength(3)
    expect(result!.intervals[0]!.id).toBe('c1')
    expect(result!.intervals[1]!.id).toBe('c2')
    expect(result!.intervals[2]!.id).toBe('next')
  })

  it('returns null for malformed data (null input)', () => {
    const result = migrateWorkout(null)
    expect(result).toBeNull()
  })

  it('returns null for malformed data (non-object input)', () => {
    const result = migrateWorkout('not an object')
    expect(result).toBeNull()
  })

  it('returns null for malformed data (missing intervals)', () => {
    const result = migrateWorkout({ id: 'w1', title: 'Bad' })
    expect(result).toBeNull()
  })

  it('returns null for malformed data (intervals not an array)', () => {
    const result = migrateWorkout({ id: 'w1', title: 'Bad', intervals: 'not array' })
    expect(result).toBeNull()
  })

  it('handles empty intervals list', () => {
    const old = makeOldWorkout([])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    expect(result!.intervals).toEqual([])
  })

  it('expands with setCount: 2 cycles × 2 sets = 4 expansions of children', () => {
    const old = makeOldWorkout([
      {
        id: 'cycle1',
        type: 'work',
        title: 'Cycle',
        duration: 0,
        children: [{ id: 'c1', type: 'work', title: 'X', duration: 30 }],
        cycleCount: 2,
        setCount: 2,
      },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    // 2 sets × 2 cycles × 1 child = 4 intervals
    expect(result!.intervals).toHaveLength(4)
  })

  it('strips deprecated fields from flat passthrough intervals', () => {
    const old = makeOldWorkout([
      { id: 'a', type: 'work', title: 'A', duration: 30, isGenerated: true as const },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    expect(result!.intervals[0]!).not.toHaveProperty('isGenerated')
  })

  it('preserves Workout-level description and imageUrl fields', () => {
    const old = makeOldWorkout(
      [{ id: 'a', type: 'work', title: 'A', duration: 30 }],
      { description: 'A test workout', imageUrl: 'https://example.com/img.png' },
    )
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    expect(result!.description).toBe('A test workout')
    expect(result!.imageUrl).toBe('https://example.com/img.png')
  })

  it('treats interval with empty children array as flat (passthrough)', () => {
    const old = makeOldWorkout([
      { id: 'a', type: 'work', title: 'A', duration: 30, children: [] },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    expect(result!.intervals).toHaveLength(1)
    expect(result!.intervals[0]!.id).toBe('a')
  })

  it('treats interval with no children key as flat', () => {
    const old = makeOldWorkout([
      { id: 'a', type: 'work', title: 'A', duration: 30 },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    expect(result!.intervals).toHaveLength(1)
    expect(result!.intervals[0]!.id).toBe('a')
  })

  it('collapseTrailingRest: removes last rest even with multiple cycles', () => {
    const old = makeOldWorkout([
      {
        id: 'cycle1',
        type: 'work',
        title: 'Cycle',
        duration: 0,
        children: [
          { id: 'c1', type: 'work', title: 'Work', duration: 45 },
          { id: 'c2', type: 'rest', title: 'Rest', duration: 20 },
        ],
        cycleCount: 3,
        setCount: 1,
        collapseTrailingRest: true,
      },
      { id: 'cooldown', type: 'cooldown', title: 'Cool Down', duration: 60 },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    // 3 cycles × 2 children = 6, minus 1 collapsed rest = 5, plus cooldown = 6 total
    expect(result!.intervals).toHaveLength(6)
    // Last interval before cooldown should be work(45), not rest(20)
    expect(result!.intervals[4]!.id).toBe('c1')
    expect(result!.intervals[4]!.duration).toBe(45)
    expect(result!.intervals[5]!.id).toBe('cooldown')
  })

  it('restBetweenCycles with collapseTrailingRest: keeps synthetic rest but removes trailing child rest', () => {
    const old = makeOldWorkout([
      {
        id: 'cycle1',
        type: 'work',
        title: 'Cycle',
        duration: 0,
        children: [
          { id: 'c1', type: 'work', title: 'Work', duration: 45 },
          { id: 'c2', type: 'rest', title: 'Rest', duration: 20 },
        ],
        cycleCount: 2,
        setCount: 1,
        restBetweenCycles: 10,
        collapseTrailingRest: true,
      },
      { id: 'cooldown', type: 'cooldown', title: 'Cool Down', duration: 60 },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    // Without collapse: [work, rest, rest(10), work, rest, cooldown] = 6
    // With collapse (removing last rest): [work, rest, rest(10), work, cooldown] = 5
    expect(result!.intervals).toHaveLength(5)
    expect(result!.intervals[0]!.id).toBe('c1')
    expect(result!.intervals[1]!.id).toBe('c2')
    expect(result!.intervals[2]!.type).toBe('rest_between_cycles')
    expect(result!.intervals[2]!.duration).toBe(10)
    expect(result!.intervals[3]!.id).toBe('c1')
    expect(result!.intervals[4]!.id).toBe('cooldown')
  })

  it('does NOT crash on children: null', () => {
    const old = makeOldWorkout([
      { id: 'a', type: 'work', title: 'A', duration: 30, children: null },
    ])
    const result = migrateWorkout(old)
    expect(result).not.toBeNull()
    expect(result!.intervals).toHaveLength(1)
  })
})
