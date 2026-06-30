'use client'

import Link from 'next/link'
import { useSessions } from '@/hooks/useSessions'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function HistoryPage() {
  const { sessions } = useSessions()
  const { getWorkout } = useWorkoutContext()
  const { getSequence } = useSequences()

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
        <h1 className="text-3xl font-bold text-fg">History</h1>
        <p className="text-muted">No sessions yet. Complete a workout to see it here.</p>
        <Link
          href="/workouts"
          className="px-6 py-3 bg-accent text-accent-on rounded-lg font-medium transition-colors"
        >
          Browse Workouts
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-fg">History</h1>
      <div className="flex flex-col gap-3">
        {sessions.map((s) => {
          const name =
            s.type === 'workout'
              ? getWorkout(s.workoutId!)?.title ?? 'Unknown Workout'
              : getSequence(s.sequenceId!)?.title ?? 'Unknown Sequence'
          const totalDuration = s.intervals.reduce(
            (sum, i) => sum + i.actualDuration,
            0,
          )

          return (
            <Link
              key={s.id}
              href={`/history/${s.id}`}
              className="p-4 rounded-[8px] bg-surface border border-border-soft flex items-center justify-between hover:bg-surface-alt transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                      s.type === 'sequence'
                        ? 'bg-interval-prepare'
                        : 'bg-interval-work'
                    }`}
                  >
                    {s.type}
                  </span>
                  <span className="text-sm text-muted">{formatDate(s.startedAt)}</span>
                </div>
                <h2 className="font-semibold text-fg truncate mt-1">{name}</h2>
                <p className="text-sm text-muted">
                  {formatDuration(totalDuration)} &middot; {s.intervals.length} interval
                  {s.intervals.length !== 1 && 's'}
                </p>
              </div>
              <span className="text-muted shrink-0">&rarr;</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
