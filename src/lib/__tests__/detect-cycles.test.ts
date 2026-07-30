import { describe, it, expect } from 'vitest'
import { detectCycles } from '@/lib/detect-cycles'
import type { Interval } from '@/types/workout'

function work(id: string, title: string, duration: number, opts?: { cycleIndex?: number; cycleId?: string; cycleTitle?: string }): Interval {
  return { id, type: 'work', title, duration, ...opts }
}

function rest(id: string, duration: number): Interval {
  return { id, type: 'rest', title: 'Rest', duration }
}

describe('detectCycles', () => {
  // --- by cycleId (most reliable) ---
  it('groups by cycleId with sequential labels', () => {
    const intervals = [
      work('a1', 'Work', 30, { cycleId: 'c1' }),
      rest('a2', 15),
      work('a3', 'Work', 30, { cycleId: 'c1' }),
      rest('a4', 15),
      work('a5', 'Work', 30, { cycleId: 'c2' }),
      rest('a6', 15),
      work('a7', 'Work', 30, { cycleId: 'c2' }),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(2)
    expect(result[0]!.label).toBe('Cycle 1')
    expect(result[1]!.label).toBe('Cycle 2')
  })

  it('uses custom cycleTitle when available', () => {
    const intervals = [
      work('a', 'Work', 30, { cycleId: 'c1', cycleTitle: 'Superset A' }),
      work('b', 'Work', 30, { cycleId: 'c1', cycleTitle: 'Superset A' }),
      work('c', 'Work', 30, { cycleId: 'c2', cycleTitle: 'Superset B' }),
      work('d', 'Work', 30, { cycleId: 'c2', cycleTitle: 'Superset B' }),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(2)
    expect(result[0]!.label).toBe('Superset A')
    expect(result[1]!.label).toBe('Superset B')
  })

  it('falls back to sequential label when cycleTitle is default "Cycle"', () => {
    const intervals = [
      work('a', 'Work', 30, { cycleId: 'c1', cycleTitle: 'Cycle' }),
      work('b', 'Work', 30, { cycleId: 'c1', cycleTitle: 'Cycle' }),
      work('c', 'Work', 30, { cycleId: 'c2', cycleTitle: 'Cycle' }),
      work('d', 'Work', 30, { cycleId: 'c2', cycleTitle: 'Cycle' }),
    ]
    const result = detectCycles(intervals)
    expect(result[0]!.label).toBe('Cycle 1')
    expect(result[1]!.label).toBe('Cycle 2')
  })

  it('handles single cycleId block (no duplicate)', () => {
    const intervals = [
      work('a', 'Work', 30, { cycleId: 'c1' }),
      work('b', 'Work', 30, { cycleId: 'c1' }),
      work('c', 'Work', 30, { cycleId: 'c1' }),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(1)
    expect(result[0]!.intervals).toHaveLength(3)
  })

  it('separates two duplicated cycles by cycleId', () => {
    const intervals = [
      work('a', 'Work', 30, { cycleId: 'c1' }),
      work('b', 'Work', 30, { cycleId: 'c1' }),
      work('c', 'Work', 30, { cycleId: 'c1' }),
      work('d', 'Work', 30, { cycleId: 'c2' }),
      work('e', 'Work', 30, { cycleId: 'c2' }),
      work('f', 'Work', 30, { cycleId: 'c2' }),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(2)
    expect(result[0]!.intervals).toHaveLength(3)
    expect(result[1]!.intervals).toHaveLength(3)
  })

  // --- by cycleIndex (fallback for workouts without cycleId) ---
  it('detects cycleIndex reset to 0 as boundary, sequential labels', () => {
    const intervals = [
      work('a', 'Work', 30, { cycleIndex: 0 }),
      work('b', 'Work', 30, { cycleIndex: 1 }),
      work('c', 'Work', 30, { cycleIndex: 2 }),
      work('d', 'Work', 30, { cycleIndex: 0 }),
      work('e', 'Work', 30, { cycleIndex: 1 }),
      work('f', 'Work', 30, { cycleIndex: 2 }),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(2)
    expect(result[0]!.label).toBe('Cycle 1')
    expect(result[1]!.label).toBe('Cycle 2')
    expect(result[0]!.intervals).toHaveLength(3)
    expect(result[1]!.intervals).toHaveLength(3)
  })

  it('handles single cycle with cycleIndex (no reset)', () => {
    const intervals = [
      work('a', 'Work', 30, { cycleIndex: 0 }),
      work('b', 'Work', 30, { cycleIndex: 1 }),
      work('c', 'Work', 30, { cycleIndex: 2 }),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(1)
    expect(result[0]!.intervals).toHaveLength(3)
  })

  // --- heuristic fallback (existing workouts, no metadata) ---
  it('detects consecutive same work intervals as cycle (heuristic)', () => {
    const intervals = [
      work('a', 'Work', 30),
      work('b', 'Work', 30),
      work('c', 'Work', 30),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(1)
    expect(result[0]!.intervals).toHaveLength(3)
  })

  it('does not merge non-consecutive work intervals', () => {
    const intervals = [
      work('a', 'Work', 30),
      rest('b', 15),
      work('c', 'Work', 30),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(0)
  })

  it('returns empty for no work intervals', () => {
    expect(detectCycles([])).toEqual([])
    expect(detectCycles([rest('a', 10)])).toEqual([])
  })

  // --- priority: cycleId > cycleIndex > heuristic ---
  it('prefers cycleId over cycleIndex over heuristic', () => {
    const intervals = [
      work('a', 'Work', 30, { cycleId: 'c1', cycleIndex: 0 }),
      work('b', 'Work', 30, { cycleId: 'c1', cycleIndex: 1 }),
      work('c', 'Work', 30, { cycleId: 'c2', cycleIndex: 0 }),
    ]
    const result = detectCycles(intervals)
    expect(result).toHaveLength(1)
    expect(result[0]!.intervals).toHaveLength(2)
    expect(result[0]!.label).toBe('Cycle 1')
  })
})
