'use client'

import { formatDuration } from '@/lib/format'
import type { DayAssignment, Workout, Sequence } from '@/types/workout'

interface TodaysFocusProps {
  assignment: DayAssignment | null
  workout?: Workout
  sequence?: Sequence
  typeLabel: string
  isCurrentWeek: boolean
  onStartWorkout: () => void
}

export function TodaysFocus({
  assignment,
  workout,
  sequence,
  typeLabel,
  isCurrentWeek,
  onStartWorkout,
}: TodaysFocusProps) {
  const title = workout?.title ?? sequence?.title
  const totalSec = workout
    ? workout.intervals.reduce((s, i) => s + i.duration, 0)
    : 0

  if (!isCurrentWeek || !assignment || !title) {
    return (
      <div className="w-full lg:w-96 bg-surface rounded-lg p-24 flex flex-col gap-24 border border-outline-variant/20 self-start">
        <span className="font-label-caps text-label-caps text-accent font-bold">
          Today&apos;s Focus
        </span>
        <div className="flex flex-col items-center gap-8 py-24 text-center">
          <span className="material-symbols-outlined text-[40px] text-muted">
            event_busy
          </span>
          <p className="font-body-md text-body-md text-muted">
            No session scheduled for today.
          </p>
        </div>
      </div>
    )
  }

  const intervals = workout?.intervals ?? []

  return (
    <div className="w-full lg:w-96 bg-surface rounded-lg p-24 flex flex-col gap-24 border border-outline-variant/20 self-start">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-label-caps text-label-caps text-accent font-bold">
            Today&apos;s Focus
          </span>
          <h3 className="font-headline-md text-headline-md font-bold text-fg-2 mt-xs">
            {title}
          </h3>
        </div>
        <span className="px-16 py-xs bg-accent text-accent-on font-label-caps text-label-caps rounded-full">
          {typeLabel}
        </span>
      </div>
      <div className="flex flex-col gap-16">
        <div className="flex items-center gap-8 text-muted">
          <span className="material-symbols-outlined text-sm">timer</span>
          <span className="font-data-sm text-data-sm">
            {totalSec > 0 ? `${Math.floor(totalSec / 60)} Minutes Total` : ''}
          </span>
        </div>
        {intervals.length > 0 && (
          <div className="flex flex-col gap-8">
            <h5 className="font-label-caps text-label-caps text-muted border-b border-outline-variant/30 pb-xs">
              Exercise List
            </h5>
            <ul className="flex flex-col gap-xs">
              {intervals.map((iv, idx) => (
                <li
                  key={idx}
                  className="flex justify-between text-body-md text-sm"
                >
                  <span className="text-fg-2">{iv.title}</span>
                  <span className="font-data-sm text-data-sm text-muted">
                    {formatDuration(iv.duration)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <button
        onClick={onStartWorkout}
        className="mt-auto w-full py-16 bg-accent text-accent-on rounded-lg font-label-caps text-label-caps font-bold hover:bg-accent/90 transition-colors ambient-shadow flex items-center justify-center gap-8"
      >
        <span className="material-symbols-outlined">play_arrow</span>
        Start Workout
      </button>
    </div>
  )
}
