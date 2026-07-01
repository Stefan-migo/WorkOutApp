import { describe, it, expect } from 'vitest'
import { computeStats } from '../useStats'
import type { Session, CompletedInterval } from '@/types/workout'

function session(overrides: Partial<Session> & { startedAt: number }): Session {
  return {
    id: `s-${Math.random().toString(36).slice(2, 8)}`,
    type: 'workout',
    workoutId: 'w1',
    intervals: [],
    ...overrides,
    completedAt: overrides.completedAt ?? overrides.startedAt + 1800,
  }
}

function interval(actual: number, overrides?: Partial<CompletedInterval>): CompletedInterval {
  return {
    intervalId: 'i1',
    title: 'Work',
    type: 'work',
    plannedDuration: actual,
    actualDuration: actual,
    completed: true,
    ...overrides,
  }
}

describe('computeStats', () => {
  describe('empty state', () => {
    it('returns zeros and empty arrays for no sessions', () => {
      const now = new Date('2026-06-30T12:00:00Z')
      const r = computeStats([], now)

      expect(r.totalWorkouts).toBe(0)
      expect(r.totalTimeSeconds).toBe(0)
      expect(r.currentStreak).toBe(0)
      expect(r.sessionsThisWeek).toBe(0)
      expect(r.weeklyVolume).toHaveLength(12)
      expect(r.recentSessions).toEqual([])
    })

    it('weeklyVolume contains 12 entries with zero seconds', () => {
      const now = new Date('2026-06-30T12:00:00Z')
      const r = computeStats([], now)

      expect(r.weeklyVolume).toHaveLength(12)
      for (const w of r.weeklyVolume) {
        expect(w.totalSeconds).toBe(0)
      }
    })
  })

  describe('totals', () => {
    it('counts total workouts and sums interval actual durations', () => {
      // Two sessions on the same day, different durations
      const sessions = [
        session({
          startedAt: new Date('2026-06-28T10:00:00Z').getTime(),
          intervals: [interval(600), interval(120)],
        }),
        session({
          startedAt: new Date('2026-06-28T14:00:00Z').getTime(),
          intervals: [interval(900)],
        }),
      ]

      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))
      expect(r.totalWorkouts).toBe(2)
      expect(r.totalTimeSeconds).toBe(600 + 120 + 900)
    })
  })

  describe('streak', () => {
    it('counts 1 for a single session today', () => {
      const sessions = [
        session({ startedAt: new Date('2026-06-30T10:00:00Z').getTime() }),
      ]
      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))
      expect(r.currentStreak).toBe(1)
    })

    it('counts consecutive days backward from today', () => {
      // Sessions on Jun 28, 29, 30 (today)
      const sessions = [
        session({ startedAt: new Date('2026-06-28T08:00:00Z').getTime() }),
        session({ startedAt: new Date('2026-06-29T10:00:00Z').getTime() }),
        session({ startedAt: new Date('2026-06-30T09:00:00Z').getTime() }),
      ]
      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))
      expect(r.currentStreak).toBe(3)
    })

    it('resets streak when there is a gap day', () => {
      // Sessions on Jun 28, 30 — gap on Jun 29
      const sessions = [
        session({ startedAt: new Date('2026-06-28T10:00:00Z').getTime() }),
        session({ startedAt: new Date('2026-06-30T09:00:00Z').getTime() }),
      ]
      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))
      // Only Jun 30 counts — gap on 29 resets
      expect(r.currentStreak).toBe(1)
    })

    it('returns 0 for sessions only in the past with gap before today', () => {
      // Session on Jun 28, today is Jun 30, no session on 29 or 30
      const sessions = [
        session({ startedAt: new Date('2026-06-28T10:00:00Z').getTime() }),
      ]
      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))
      expect(r.currentStreak).toBe(0)
    })

    it('treats multiple sessions on same day as one day of streak', () => {
      const sessions = [
        session({ startedAt: new Date('2026-06-29T08:00:00Z').getTime() }),
        session({ startedAt: new Date('2026-06-29T14:00:00Z').getTime() }),
        session({ startedAt: new Date('2026-06-30T09:00:00Z').getTime() }),
      ]
      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))
      expect(r.currentStreak).toBe(2)
    })
  })

  describe('sessionsThisWeek', () => {
    it('counts sessions in the current ISO week', () => {
      // 2026-06-30 is a Tuesday in ISO week 2026-W27
      // ISO week starts Monday: 2026-06-29 (Mon) to 2026-07-05 (Sun)
      const sessions = [
        session({ startedAt: new Date('2026-06-29T10:00:00Z').getTime() }), // Mon (this week)
        session({ startedAt: new Date('2026-06-30T09:00:00Z').getTime() }), // Tue (today)
        session({ startedAt: new Date('2026-06-28T10:00:00Z').getTime() }), // Sun (last week)
      ]
      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))
      expect(r.sessionsThisWeek).toBe(2)
    })
  })

  describe('weeklyVolume', () => {
    it('groups sessions by ISO week over last 12 weeks', () => {
      // Create sessions in different ISO weeks
      const now = new Date('2026-06-30T12:00:00Z')
      // Current week: 2026-W27 (Mon Jun 29 - Sun Jul 5)
      // Last week: 2026-W26 (Mon Jun 22 - Sun Jun 28)
      // Two weeks ago: 2026-W25 (Mon Jun 15 - Sun Jun 21)
      const sessions = [
        session({
          startedAt: new Date('2026-06-30T10:00:00Z').getTime(),
          intervals: [interval(600)],
        }),
        session({
          startedAt: new Date('2026-06-23T10:00:00Z').getTime(),
          intervals: [interval(300), interval(300)],
        }),
        session({
          startedAt: new Date('2026-06-16T10:00:00Z').getTime(),
          intervals: [interval(900)],
        }),
      ]
      const r = computeStats(sessions, now)

      // Find each week
      const w27 = r.weeklyVolume.find(w => w.weekLabel === '2026-W27')
      const w26 = r.weeklyVolume.find(w => w.weekLabel === '2026-W26')
      const w25 = r.weeklyVolume.find(w => w.weekLabel === '2026-W25')

      expect(w27?.totalSeconds).toBe(600)
      expect(w26?.totalSeconds).toBe(600)
      expect(w25?.totalSeconds).toBe(900)

      // Other weeks should be 0
      const nonZero = r.weeklyVolume.filter(w => w.totalSeconds > 0)
      expect(nonZero).toHaveLength(3)
    })

    it('returns exactly 12 weeks', () => {
      const now = new Date('2026-06-30T12:00:00Z')
      const r = computeStats([], now)
      expect(r.weeklyVolume).toHaveLength(12)

      // Check labels follow ISO week format
      expect(r.weeklyVolume[0]!.weekLabel).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('recentSessions', () => {
    it('returns up to 10 sessions sorted by startedAt descending', () => {
      const sessions = Array.from({ length: 15 }, (_, i) =>
        session({ startedAt: new Date(`2026-06-${30 - i}T10:00:00Z`).getTime() }),
      )
      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))

      expect(r.recentSessions).toHaveLength(10)
      // First should be most recent (Jun 30)
      expect(new Date(r.recentSessions[0]!.startedAt).toISOString().slice(0, 10)).toBe('2026-06-30')
      // Last should be Jun 21
      expect(new Date(r.recentSessions[9]!.startedAt).toISOString().slice(0, 10)).toBe('2026-06-21')
    })

    it('returns all sessions when fewer than 10', () => {
      const sessions = [
        session({ startedAt: new Date('2026-06-29T10:00:00Z').getTime() }),
        session({ startedAt: new Date('2026-06-28T10:00:00Z').getTime() }),
      ]
      const r = computeStats(sessions, new Date('2026-06-30T12:00:00Z'))

      expect(r.recentSessions).toHaveLength(2)
    })

    it('returns empty array when no sessions', () => {
      const r = computeStats([], new Date('2026-06-30T12:00:00Z'))
      expect(r.recentSessions).toEqual([])
    })
  })
})
