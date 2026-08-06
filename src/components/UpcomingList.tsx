'use client'

import { formatDuration } from '@/lib/format'
import { deriveTypeLabel } from '@/lib/calendar-utils'
import type { DayAssignment, Workout, Sequence } from '@/types/workout'

interface UpcomingListProps {
  upcomingDays: { index: number; assignment: DayAssignment }[]
  weekStart: string
  workouts: Workout[]
  sequences: Sequence[]
}

export function UpcomingList({
  upcomingDays,
  weekStart,
  workouts,
  sequences,
}: UpcomingListProps) {
  const getWorkout = (id: string) => workouts.find((w) => w.id === id)
  const getSequence = (id: string) => sequences.find((s) => s.id === id)

  return (
    <div className="bg-surface border border-border-soft rounded-lg p-16 flex flex-col gap-16">
      <h4 className="font-label-caps text-label-caps text-muted border-b border-border-soft pb-8">
        Upcoming
      </h4>
      {upcomingDays.length === 0 && (
        <p className="text-body-md text-sm text-muted">
          No sessions scheduled.
        </p>
      )}
      {upcomingDays.map(({ index, assignment }) => {
        const d = new Date(weekStart + 'T00:00:00')
        d.setDate(d.getDate() + index)
        const w = assignment.workoutId
          ? getWorkout(assignment.workoutId)
          : undefined
        const s = assignment.sequenceId
          ? getSequence(assignment.sequenceId)
          : undefined
        const title = w?.title ?? s?.title ?? '(deleted)'
        const label = deriveTypeLabel(assignment, w, s)
        const seconds = w
          ? w.intervals.reduce((sum, iv) => sum + iv.duration, 0)
          : 0
        return (
          <div key={index} className="flex gap-8 items-start">
            <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center flex-shrink-0 text-accent-container font-data-lg text-data-lg font-bold">
              {d.getDate()}
            </div>
            <div className="min-w-0">
              <span className="block font-body-md text-body-md font-bold text-sm text-fg-2 truncate">
                {title}
              </span>
              <span className="block font-data-sm text-data-sm text-muted mt-xs">
                {label}
                {seconds > 0 && ` \u2022 ${formatDuration(seconds)}`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
