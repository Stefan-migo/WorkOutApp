'use client'

import type { DayAssignment, Workout, Sequence } from '@/types/workout'
import { Button } from '@/components/ui/Button'

interface TodaysFocusProps {
  assignment: DayAssignment | null
  workout?: Workout
  sequence?: Sequence
  typeLabel: string
  isCurrentWeek: boolean
  /** Precomputed one-line "next up" summary; null = empty/rest state (CU-5). */
  nextUpLabel: string | null
  onStartWorkout: () => void
}

// Compact hero shown only on the current week, with a single-line next-up
// summary that always renders (empty/rest state included) — CU-5.
export function TodaysFocus({
  assignment,
  workout,
  sequence,
  typeLabel,
  isCurrentWeek,
  nextUpLabel,
  onStartWorkout,
}: TodaysFocusProps) {
  if (!isCurrentWeek) return null

  const title = workout?.title ?? sequence?.title
  const totalSec = workout
    ? workout.intervals.reduce((s, i) => s + i.duration, 0)
    : 0

  return (
    <section className="w-full bg-surface rounded-card p-16 flex flex-col gap-12 border border-border-soft self-start">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="min-w-0">
          <span className="text-label-caps text-accent font-bold">
            Today&apos;s Focus
          </span>
          {assignment && title ? (
            <h3 className="mt-xs break-words text-headline-md font-bold text-fg-2">
              {title}
            </h3>
          ) : (
            <h3 className="mt-xs text-headline-md font-bold text-fg-2">
              No session scheduled
            </h3>
          )}
        </div>
        {assignment && title && (
          <span className="px-12 py-xs bg-accent/15 text-accent text-label-caps rounded-pill shrink-0">
            {typeLabel}
            {totalSec > 0 ? ` · ${Math.floor(totalSec / 60)} min` : ''}
          </span>
        )}
      </div>

      {assignment && title ? (
        <Button
          onClick={onStartWorkout}
          variant="primary"
          size="lg"
          elevated
          className="w-full"
        >
          <span className="material-symbols-outlined">play_arrow</span>
          {sequence ? 'Start Sequence' : 'Start Workout'}
        </Button>
      ) : null}

      {/* CU-5: one-line next-up — always present, empty/rest state included */}
      <p className="flex items-center gap-8 text-data-sm text-muted border-t border-border-soft pt-8">
        <span className="material-symbols-outlined text-sm text-accent">
          event_upcoming
        </span>
        {nextUpLabel ? `Up next: ${nextUpLabel}` : 'Nothing else scheduled this week.'}
      </p>
    </section>
  )
}
