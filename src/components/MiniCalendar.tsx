import Link from 'next/link'

interface MiniCalendarProps {
  monday: string
  todayIndex: number
  weekPlanDays: (unknown | null)[]
}

export default function MiniCalendar({ monday, todayIndex, weekPlanDays }: MiniCalendarProps) {
  const assignedDays = weekPlanDays.filter((day) => day != null).length

  return (
    <section className="glass-card flex flex-col justify-between gap-2 rounded-dialog p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-8">
        <h2 className="text-lg font-bold text-fg-2">This week</h2>
        <Link href="/calendar" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent hover:underline">
          Calendar <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
      <ol className="grid grid-cols-7 gap-xs text-center" aria-label="Weekly plan">
        {Array.from({ length: 7 }, (_, index) => {
          const date = new Date(monday + 'T00:00:00')
          date.setDate(date.getDate() + index)
          const planned = weekPlanDays[index] != null
          const isToday = index === todayIndex

          return (
            <li key={index} className="flex min-w-0 flex-col items-center gap-1" aria-current={isToday ? 'date' : undefined}>
              <span className="sr-only">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, {planned ? 'planned' : 'no session'}</span>
              <span aria-hidden="true" className="text-xs text-muted">{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
              <span aria-hidden="true" className={`grid aspect-square w-full max-w-9 place-items-center rounded-control text-sm font-semibold ${isToday ? 'bg-accent text-accent-on' : planned ? 'bg-surface-warm text-fg-2' : 'text-muted'}`}>
                {date.getDate()}
              </span>
              <span aria-hidden="true" className={`h-1 w-1 rounded-full ${planned ? 'bg-accent' : 'bg-transparent'}`} />
            </li>
          )
        })}
      </ol>
      <p className="border-t border-border-soft pt-2 text-sm text-muted">
        <span className="font-semibold text-fg-2">{assignedDays}</span> {assignedDays === 1 ? 'day planned' : 'days planned'}
      </p>
    </section>
  )
}
