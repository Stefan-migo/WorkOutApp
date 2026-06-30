// ponytail: pure js date math — no date-fns/luxon for 4 trivial functions

/** ISO YYYY-MM-DD of the Monday of the week containing `date`. */
export function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun … 6=Sat
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().slice(0, 10)
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

// --- Inline self-check ---
// ponytail: no test framework — assert-based demo per interval-engine.ts pattern
export function runCalendarTests(): string[] {
  const results: string[] = []
  const ok = (name: string) => results.push(`✓ ${name}`)
  const fail = (name: string, msg: string) => results.push(`✗ ${name}: ${msg}`)
  const assert = (cond: unknown, name: string, msg: string) =>
    cond ? ok(name) : fail(name, msg)

  // getMonday
  const mon = new Date('2026-06-29T12:00:00') // Monday
  assert(getMonday(mon) === '2026-06-29', 'getMonday on Monday → itself', '')

  const wed = new Date('2026-07-01T12:00:00') // Wednesday
  assert(getMonday(wed) === '2026-06-29', 'getMonday on Wed → prev Mon', '')

  const sun = new Date('2026-07-05T12:00:00') // Sunday
  assert(getMonday(sun) === '2026-06-29', 'getMonday on Sun → prev Mon', '')

  // formatWeekRange
  const range = formatWeekRange('2026-06-29')
  assert(range.includes('Jun 29'), 'formatWeekRange → contains start day', '')
  assert(range.includes('Jul 5'), 'formatWeekRange → contains end day', '')
  assert(range.includes('2026'), 'formatWeekRange → contains year', '')

  // previousWeek / nextWeek
  assert(previousWeek('2026-06-29') === '2026-06-22', 'previousWeek → -7 days', '')
  assert(nextWeek('2026-06-29') === '2026-07-06', 'nextWeek → +7 days', '')

  // getDayOfWeek
  assert(getDayOfWeek(new Date('2026-06-29T12:00:00')) === 0, 'getDayOfWeek Mon → 0', '')
  assert(getDayOfWeek(new Date('2026-06-30T12:00:00')) === 1, 'getDayOfWeek Tue → 1', '')
  assert(getDayOfWeek(new Date('2026-07-05T12:00:00')) === 6, 'getDayOfWeek Sun → 6', '')

  return results
}

// Auto-run in dev
if (typeof process !== 'undefined' && process.argv?.[1]?.includes('calendar-utils')) {
  console.log(runCalendarTests().join('\n'))
}
