'use client'

import type { DayAssignment, Workout, Sequence } from '@/types/workout'

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
    <section className="w-full bg-surface rounded-lg p-16 flex flex-col gap-12 border border-border-soft self-start">
      <div className="flex justify-between items-center gap-16">
        <div className="min-w-0">
          <span className="font-label-caps text-label-caps text-accent font-bold">
            Today&apos;s Focus
          </span>
          {assignment && title ? (
            <h3 className="font-headline-md text-headline-md font-bold text-fg-2 mt-xs truncate">
              {title}
            </h3>
          ) : (
            <h3 className="font-headline-md text-headline-md font-bold text-muted mt-xs">
              Rest day
            </h3>
          )}
        </div>
        {assignment && title && (
          <span className="px-12 py-xs bg-accent/15 text-accent font-label-caps text-label-caps rounded-full shrink-0">
            {typeLabel}
            {totalSec > 0 ? ` · ${Math.floor(totalSec / 60)} min` : ''}
          </span>
        )}
      </div>

      {assignment && title ? (
        <button
          onClick={onStartWorkout}
          className="w-full py-12 bg-accent text-accent-on rounded-lg font-label-caps text-label-caps font-bold hover:bg-accent/90 transition-colors ambient-shadow flex items-center justify-center gap-8"
        >
          <span className="material-symbols-outlined">play_arrow</span>
          Start Workout
        </button>
      ) : null}

      {/* CU-5: one-line next-up — always present, empty/rest state included */}
      <p className="flex items-center gap-8 font-data-sm text-data-sm text-muted border-t border-border-soft pt-8">
        <span className="material-symbols-outlined text-sm text-accent">
          event_upcoming
        </span>
        {nextUpLabel ?? 'Nothing else scheduled this week — enjoy the rest.'}
      </p>
    </section>
  )
}
