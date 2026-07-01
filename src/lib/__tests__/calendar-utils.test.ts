import { describe, it, expect } from 'vitest'
import { getMonday, formatWeekRange, previousWeek, nextWeek, getDayOfWeek } from '../calendar-utils'

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
