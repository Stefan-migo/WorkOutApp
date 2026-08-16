import type { DayAssignment, Workout, Sequence } from '@/types/workout'

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
