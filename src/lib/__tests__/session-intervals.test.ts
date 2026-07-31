import { describe, it, expect } from 'vitest'
import { parseDurationInput, updateCompletedInterval } from '../session-intervals'
import type { CompletedInterval } from '@/types/workout'

function intv(id: string, overrides: Partial<CompletedInterval> = {}): CompletedInterval {
  return {
    intervalId: id,
    title: 'Work',
    type: 'work',
    plannedDuration: 60,
    actualDuration: 60,
    completed: true,
    ...overrides,
  }
}

describe('updateCompletedInterval', () => {
  it('replaces only the interval at the given index and does not mutate the original array', () => {
    const intervals = [intv('a'), intv('b'), intv('c')]
    const updated = updateCompletedInterval(intervals, 1, { notes: 'heavy' })

    expect(updated[1]?.notes).toBe('heavy')
    expect(updated[0]).toBe(intervals[0])
    expect(updated[2]).toBe(intervals[2])
    // Original array untouched — other entries are the same object references
    expect(intervals[1]?.notes).toBeUndefined()
  })

  it('returns the array unchanged for out-of-range indexes', () => {
    const intervals = [intv('a')]
    expect(updateCompletedInterval(intervals, 5, { notes: 'x' })).toBe(intervals)
    expect(updateCompletedInterval(intervals, -1, { notes: 'x' })).toBe(intervals)
  })
})

describe('parseDurationInput', () => {
  it('parses MM:SS into seconds (padding optional)', () => {
    expect(parseDurationInput('02:05')).toBe(125)
    expect(parseDurationInput('1:3')).toBe(63)
  })

  it('returns null for input that is not a valid MM:SS pair', () => {
    expect(parseDurationInput('')).toBeNull()
    expect(parseDurationInput('abc')).toBeNull()
    expect(parseDurationInput('1:2:3')).toBeNull()
    expect(parseDurationInput('12:ab')).toBeNull()
  })
})
