'use client'

import type { MonthCell } from '@/lib/calendar-utils'

interface MonthOverviewProps {
  anchorMonday: string // any Monday within month to display
  currentMonday: string
  matrix: MonthCell[][]
  todayIso: string
  onSelectWeek: (monday: string) => void
  onSelectDay: (dateIso: string) => void
}

// Month overview (CU-3): Mon-start grid, per-day density dots, adjacent-month
// de-emphasis, week gutter to jump weeks, day click for direct assignment.
export function MonthOverview({
  anchorMonday,
  currentMonday,
  matrix,
  todayIso,
  onSelectWeek,
  onSelectDay,
}: MonthOverviewProps) {
  const anchorDate = new Date(anchorMonday + 'T00:00:00')
  const monthLabel = anchorDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="glass-card rounded-card p-16 flex flex-col gap-12" aria-label={`Month overview ${monthLabel}`}>
      <h2 className="text-label-caps text-accent tracking-wider">
        {monthLabel}
      </h2>
      <div className="grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] items-center gap-1">
        <span /> {/* week-gutter spacer */}
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span
            key={i}
            className="text-center text-label-caps text-muted"
          >
            {d}
          </span>
        ))}
        {matrix.map((week) => {
          const monday = week[0]!.date
          const isSelectedWeek = monday === currentMonday
          const weekNum = isoWeekNumber(monday)
          return (
            <div key={monday} className="col-span-8 grid grid-cols-subgrid gap-1">
              <button
                onClick={() => onSelectWeek(monday)}
                aria-label={`Select week of ${monday}`}
                className={`h-8 w-6 rounded text-[11px] font-bold transition-colors focus-visible:focus-ring cursor-pointer ${
                  isSelectedWeek
                    ? 'bg-accent text-accent-on'
                    : 'text-muted hover:text-accent hover:bg-surface-warm'
                }`}
              >
                {weekNum}
              </button>
              {week.map((cell) => {
                const isToday = cell.date === todayIso
                return (
                  <button
                    key={cell.date}
                    onClick={() => onSelectDay(cell.date)}
                    aria-label={`${cell.date}${cell.hasAssignment ? ' (assigned)' : ''}`}
                    aria-current={isToday ? 'date' : undefined}
                    className={`relative flex min-h-9 flex-col items-center justify-center rounded-control py-1 text-sm transition-colors focus-visible:focus-ring cursor-pointer ${
                      cell.isCurrentMonth
                        ? 'text-fg-2 hover:bg-surface-warm'
                        : 'text-muted hover:bg-surface-warm/50'
                    } ${
                      isToday
                        ? 'ring-1 ring-accent font-bold'
                        : ''
                    }`}
                  >
                    <span>{cell.date.slice(8)}</span>
                    <span
                      aria-hidden
                      className={`w-1.5 h-1.5 rounded-pill ${
                        cell.hasAssignment ? 'bg-accent' : 'bg-transparent'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** ISO-8601 week number for the Monday starting the given ISO week. */
function isoWeekNumber(monday: string): number {
  const d = new Date(monday + 'T00:00:00')
  // Thursday of this week defines the ISO year/week
  d.setDate(d.getDate() + 3)
  const week1Thu = new Date(d.getFullYear(), 0, 4)
  week1Thu.setDate(week1Thu.getDate() + 3 - ((week1Thu.getDay() + 6) % 7))
  return 1 + Math.round((d.getTime() - week1Thu.getTime()) / (7 * 24 * 3600 * 1000))
}
