import type { DayAssignment, Workout, Sequence, WeekPlan } from '@/types/workout'

// ponytail: pure js date math — no date-fns/luxon for 4 trivial functions

/** ISO YYYY-MM-DD of the Monday of the week containing `date`. */
export function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun … 6=Sat
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().slice(0, 10)
}

/** ISO YYYY-MM-DD of the Monday of the week containing the ISO date string. */
export function weekOfDate(date: string): string {
  return getMonday(new Date(date + 'T00:00:00'))
}

/** A single cell of a month-overview grid. */
export interface MonthCell {
  date: string // ISO YYYY-MM-DD
  isCurrentMonth: boolean
  hasAssignment: boolean
}

function isoAddDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Mon-start week rows covering the month of `anchorMonday`.
 * Density (hasAssignment) only reported for displayed-month cells, derived from
 * the already-loaded `weekPlans` list via startDate lookup.
 */
export function buildMonthMatrix(anchorMonday: string, weekPlans: WeekPlan[]): MonthCell[][] {
  const anchorDate = new Date(anchorMonday + 'T00:00:00')
  const month = anchorDate.getMonth()
  const year = anchorDate.getFullYear()

  // First cell: Monday of the week containing the 1st of the month
  const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
  // Last day of month: day 0 of next month (handles December → January rollover)
  const lastDay = new Date(year, month + 1, 0)
  const lastDayIso = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

  const matrix: MonthCell[][] = []
  let weekStart = weekOfDate(firstOfMonth)
  while (true) {
    const plan = weekPlans.find((wp) => wp.startDate === weekStart)
    const row: MonthCell[] = []
    for (let i = 0; i < 7; i++) {
      const date = isoAddDays(weekStart, i)
      const isCurrentMonth = new Date(date + 'T00:00:00').getMonth() === month
      row.push({
        date,
        isCurrentMonth,
        // Adjacent-month cells never report density for the displayed month
        hasAssignment: isCurrentMonth && plan != null && plan.days[i] != null,
      })
    }
    matrix.push(row)
    // Done when this row contains the month's last day
    if (weekStart <= lastDayIso && lastDayIso <= isoAddDays(weekStart, 6)) break
    weekStart = isoAddDays(weekStart, 7)
  }
  return matrix
}

/** Human-readable week range e.g. "Jun 29 - Jul 5, 2026" */
export function formatWeekRange(startDate: string): string {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const year = start.getFullYear()
  return `${fmt(start)} - ${fmt(end)}, ${year}`
}

/** ISO YYYY-MM-DD of the Monday of the previous week. */
export function previousWeek(startDate: string): string {
  const d = new Date(startDate + 'T00:00:00')
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

/** ISO YYYY-MM-DD of the Monday of the next week. */
export function nextWeek(startDate: string): string {
  const d = new Date(startDate + 'T00:00:00')
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

/** 0=Mon … 6=Sun for calendar day indexing. */
export function getDayOfWeek(date: Date): number {
  // JS getDay: 0=Sun → shift so 0=Mon
  return (date.getDay() + 6) % 7
}

/** The next upcoming assignment within a displayed week (or null). */
export interface NextUp {
  date: string // ISO YYYY-MM-DD
  dayIndex: number // 0=Mon … 6=Sun
  assignment: DayAssignment
}

/**
 * First assignment at/after `now` within the displayed week (day granularity:
 * today counts as upcoming). Null when the week is past, empty, or unassigned.
 */
export function deriveNextUp(
  weekPlan: WeekPlan | undefined,
  weekStart: string,
  now: Date,
): NextUp | null {
  if (!weekPlan) return null

  // Start scanning from today when viewing the current week, else Monday
  let start = 0
  const nowWeek = getMonday(now)
  if (nowWeek === weekStart) start = getDayOfWeek(now)
  // Whole displayed week already past
  else if (weekStart < nowWeek) return null

  for (let i = start; i < 7; i++) {
    const a = weekPlan.days[i]
    if (a) return { date: isoAddDays(weekStart, i), dayIndex: i, assignment: a }
  }
  return null
}

/**
 * Derive a human-readable type label from a DayAssignment + resolved workout/sequence.
 */
export function deriveTypeLabel(
  assignment: DayAssignment,
  workout?: Workout,
  sequence?: Sequence,
): string {
  if (assignment.workoutId && workout) {
    const hasNonWork = workout.intervals.some(
      (i): boolean => i.type !== undefined && i.type !== 'work',
    )
    return hasNonWork ? 'HIIT' : 'Strength'
  }
  if (assignment.sequenceId && sequence) {
    return sequence.workoutIds.length > 1 ? 'Circuit' : 'Strength'
  }
  return 'Training'
}

// ponytail: inline self-tests removed in 2026-07 — covered by Vitest in src/lib/__tests__/
