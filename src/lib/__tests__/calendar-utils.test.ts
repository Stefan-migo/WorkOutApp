import { describe, it, expect } from 'vitest'
import { getMonday, formatWeekRange, previousWeek, nextWeek, getDayOfWeek, weekOfDate, buildMonthMatrix, deriveNextUp } from '../calendar-utils'
import type { WeekPlan } from '@/types/workout'

function makeWeekPlan(startDate: string, assignedDayIndexes: number[] = []): WeekPlan {
  const days = [null, null, null, null, null, null, null] as WeekPlan['days']
  for (const i of assignedDayIndexes) days[i] = { workoutId: `w-${startDate}-${i}` }
  return { id: startDate, startDate, days, createdAt: 0, updatedAt: 0 }
}

describe('getMonday', () => {
  it('returns itself for a Monday', () => {
    const mon = new Date('2026-06-29T12:00:00') // Monday
    expect(getMonday(mon)).toBe('2026-06-29')
  })

  it('returns previous Monday for a Wednesday', () => {
    const wed = new Date('2026-07-01T12:00:00') // Wednesday
    expect(getMonday(wed)).toBe('2026-06-29')
  })

  it('returns previous Monday for a Sunday', () => {
    const sun = new Date('2026-07-05T12:00:00') // Sunday
    expect(getMonday(sun)).toBe('2026-06-29')
  })

  it('handles cross-month boundary correctly', () => {
    // Wednesday July 1 → Monday June 29
    const wed = new Date('2026-07-01T12:00:00')
    expect(getMonday(wed)).toBe('2026-06-29')
  })

  it('handles cross-year boundary correctly', () => {
    // Thursday Jan 1, 2026 → Monday Dec 29, 2025
    const thu = new Date('2026-01-01T12:00:00')
    expect(getMonday(thu)).toBe('2025-12-29')
  })
})

describe('formatWeekRange', () => {
  it('formats a week range with start day, end day, and year', () => {
    const range = formatWeekRange('2026-06-29')
    expect(range).toContain('Jun 29')
    expect(range).toContain('Jul 5')
    expect(range).toContain('2026')
  })

  it('handles cross-month week', () => {
    // Week starting Jan 26 goes into Feb
    const range = formatWeekRange('2026-01-26')
    expect(range).toContain('Jan 26')
    expect(range).toContain('Feb 1')
    expect(range).toContain('2026')
  })

  it('handles cross-year week', () => {
    // Week starting Dec 28, 2026 goes into 2027
    const range = formatWeekRange('2026-12-28')
    expect(range).toContain('Dec 28')
    expect(range).toContain('Jan 3')
    expect(range).toContain('2026')
  })
})

describe('previousWeek', () => {
  it('subtracts 7 days', () => {
    expect(previousWeek('2026-06-29')).toBe('2026-06-22')
  })

  it('handles cross-month boundary', () => {
    expect(previousWeek('2026-07-01')).toBe('2026-06-24')
  })

  it('handles cross-year boundary', () => {
    expect(previousWeek('2026-01-01')).toBe('2025-12-25')
  })
})

describe('nextWeek', () => {
  it('adds 7 days', () => {
    expect(nextWeek('2026-06-29')).toBe('2026-07-06')
  })

  it('handles cross-month boundary', () => {
    expect(nextWeek('2026-06-25')).toBe('2026-07-02')
  })

  it('handles cross-year boundary', () => {
    expect(nextWeek('2026-12-28')).toBe('2027-01-04')
  })
})

describe('getDayOfWeek', () => {
  it('returns 0 for Monday', () => {
    expect(getDayOfWeek(new Date('2026-06-29T12:00:00'))).toBe(0)
  })

  it('returns 1 for Tuesday', () => {
    expect(getDayOfWeek(new Date('2026-06-30T12:00:00'))).toBe(1)
  })

  it('returns 6 for Sunday', () => {
    expect(getDayOfWeek(new Date('2026-07-05T12:00:00'))).toBe(6)
  })

  it('returns 2 for Wednesday', () => {
    expect(getDayOfWeek(new Date('2026-07-01T12:00:00'))).toBe(2)
  })
})

describe('weekOfDate', () => {
  it('returns the Monday ISO string for a mid-week date', () => {
    // Wednesday July 1, 2026 → Monday June 29
    expect(weekOfDate('2026-07-01')).toBe('2026-06-29')
  })

  it('returns the same ISO string when the date is already a Monday', () => {
    expect(weekOfDate('2026-06-29')).toBe('2026-06-29')
  })

  it('returns the previous Monday for a Sunday (string in, string out)', () => {
    expect(weekOfDate('2026-07-05')).toBe('2026-06-29')
  })

  it('handles cross-year boundary', () => {
    // Thursday Jan 1, 2026 → Monday Dec 29, 2025
    expect(weekOfDate('2026-01-01')).toBe('2025-12-29')
  })
})

describe('buildMonthMatrix', () => {
  it('builds a 5-row Mon-start grid for a month starting on Monday (June 2026)', () => {
    const matrix = buildMonthMatrix('2026-06-01', [])
    expect(matrix).toHaveLength(5)
    expect(matrix[0][0]).toMatchObject({ date: '2026-06-01', isCurrentMonth: true })
    expect(matrix[0]).toHaveLength(7)
    expect(matrix[4][6].date).toBe('2026-07-05')
  })

  it('flags adjacent-month cells as not current month and without density', () => {
    // July 2026 starts Wednesday → grid starts Mon Jun 29 and ends Sun Aug 2
    const plans = [makeWeekPlan('2026-06-29', [0, 1])] // Jun 29, Jun 30 assigned
    const matrix = buildMonthMatrix('2026-07-01', plans)
    expect(matrix[0][0]).toEqual({
      date: '2026-06-29',
      isCurrentMonth: false,
      hasAssignment: false,
    })
    expect(matrix[0][2]).toEqual({
      date: '2026-07-01',
      isCurrentMonth: true,
      hasAssignment: false,
    })
  })

  it('derives density via weekPlans.find(startDate) day lookup', () => {
    // Week of Jun 29 2026 spans June and July; Tue Jun 30 and Wed Jul 1 assigned
    const plans = [makeWeekPlan('2026-06-29', [1, 2])]
    const matrix = buildMonthMatrix('2026-07-01', plans)
    // Jun 30 is adjacent-month cell → no density reported for displayed month
    expect(matrix[0][1].hasAssignment).toBe(false)
    // Jul 1 (index 2 of that week) is current-month → density true
    expect(matrix[0][2].hasAssignment).toBe(true)
  })

  it('builds a 6-row grid for a month spanning six Mon-start weeks (August 2026)', () => {
    const matrix = buildMonthMatrix('2026-08-03', [])
    expect(matrix).toHaveLength(6)
    expect(matrix[0][0].date).toBe('2026-07-27')
    expect(matrix[5][0].date).toBe('2026-08-31')
    expect(matrix[5][0].isCurrentMonth).toBe(true)
    expect(matrix[5][6].date).toBe('2026-09-06')
    expect(matrix[5][6].isCurrentMonth).toBe(false)
  })

  it('marks days without an assignment (null day) as no density', () => {
    const plans = [makeWeekPlan('2026-06-01', [3])] // only Thursday assigned
    const matrix = buildMonthMatrix('2026-06-01', plans)
    expect(matrix[0][0].hasAssignment).toBe(false)
    expect(matrix[0][3].hasAssignment).toBe(true)
  })
})

describe('deriveNextUp', () => {
  // Week of Jun 29 – Jul 5, 2026; "now" Wed Jul 1, 2026 10:00 local
  const now = new Date('2026-07-01T10:00:00')

  it('returns the first assignment at/after now in the displayed week (future day)', () => {
    const plan = makeWeekPlan('2026-06-29', [4]) // Friday Jul 3
    const next = deriveNextUp(plan, '2026-06-29', now)
    expect(next).not.toBeNull()
    expect(next!.date).toBe('2026-07-03')
    expect(next!.dayIndex).toBe(4)
    expect(next!.assignment.workoutId).toBe('w-2026-06-29-4')
  })

  it('includes an assignment later today (CU-5 later-today)', () => {
    const plan = makeWeekPlan('2026-06-29', [2]) // Wednesday Jul 1 = today
    const next = deriveNextUp(plan, '2026-06-29', now)
    expect(next).not.toBeNull()
    expect(next!.dayIndex).toBe(2)
    expect(next!.date).toBe('2026-07-01')
  })

  it('skips earlier days of the current week', () => {
    const plan = makeWeekPlan('2026-06-29', [0, 4]) // Monday Jun 29 + Friday Jul 3
    const next = deriveNextUp(plan, '2026-06-29', now)
    expect(next!.dayIndex).toBe(4)
  })

  it('returns null when the whole displayed week is already past (wrap-past-week)', () => {
    const plan = makeWeekPlan('2026-06-22', [0, 6]) // week Jun 22–28, before now
    expect(deriveNextUp(plan, '2026-06-22', now)).toBeNull()
  })

  it('returns null for an empty weekPlan', () => {
    expect(deriveNextUp(undefined, '2026-06-29', now)).toBeNull()
  })

  it('returns null when the displayed week has no assignments', () => {
    const plan = makeWeekPlan('2026-06-29', [])
    expect(deriveNextUp(plan, '2026-06-29', now)).toBeNull()
  })

  it('scans a future week from Monday (index 0)', () => {
    const plan = makeWeekPlan('2026-07-06', [0]) // Monday Jul 6
    const next = deriveNextUp(plan, '2026-07-06', now)
    expect(next!.dayIndex).toBe(0)
    expect(next!.date).toBe('2026-07-06')
  })
})
