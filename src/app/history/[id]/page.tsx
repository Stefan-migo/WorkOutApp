'use client'

import { useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useSessions } from '@/hooks/useSessions'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const TYPE_BADGES: Record<string, string> = {
  prepare: 'bg-interval-prepare',
  work: 'bg-interval-work',
  rest: 'bg-interval-rest',
  cooldown: 'bg-interval-cooldown',
}

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { sessions } = useSessions()
  const { getWorkout } = useWorkoutContext()
  const { getSequence } = useSequences()

  const session = useMemo(() => sessions.find((s) => s.id === params.id), [sessions, params.id])

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-fg">Session not found</h1>
        <Link href="/history" className="text-accent hover:underline">
          &larr; Back to history
        </Link>
      </div>
    )
  }

  const name =
    session.type === 'workout'
      ? getWorkout(session.workoutId!)?.title ?? 'Unknown Workout'
      : getSequence(session.sequenceId!)?.title ?? 'Unknown Sequence'

  const totalDuration = session.intervals.reduce((s, i) => s + i.actualDuration, 0)

  function handleRepeat() {
    if (!session) return
    if (session.type === 'workout' && session.workoutId) {
      router.push(`/workouts/${session.workoutId}/play`)
    } else if (session.type === 'sequence' && session.sequenceId) {
      router.push(`/sequences/${session.sequenceId}/play`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <Link href="/history" className="text-sm text-muted hover:text-fg transition-colors">
        &larr; Back to history
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                session.type === 'sequence'
                  ? 'bg-interval-prepare'
                  : 'bg-interval-work'
              }`}
            >
              {session.type}
            </span>
            <span className="text-sm text-muted">{formatDate(session.startedAt)}</span>
          </div>
          <h1 className="text-2xl font-bold text-fg">{name}</h1>
          <p className="text-muted mt-1">
            {formatDuration(totalDuration)} &middot; {session.intervals.length} interval
            {session.intervals.length !== 1 && 's'}
          </p>
        </div>
        <button
          onClick={handleRepeat}
          className="px-5 py-2.5 bg-accent text-accent-on rounded-lg font-medium transition-colors min-w-[44px] min-h-[44px]"
        >
          Repeat
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted border-b border-border-soft">
              <th className="pb-2 font-medium">Interval</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium text-right">Planned</th>
              <th className="pb-2 font-medium text-right">Actual</th>
              <th className="pb-2 font-medium text-center">Done</th>
            </tr>
          </thead>
          <tbody>
            {session.intervals.map((intv) => (
              <tr key={intv.intervalId} className="border-b border-border-soft/50">
                <td className="py-2.5 pr-4 text-fg font-medium">{intv.title}</td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                      TYPE_BADGES[intv.type] ?? 'bg-zinc-600'
                    }`}
                  >
                    {intv.type}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right text-muted tabular-nums">
                  {formatDuration(intv.plannedDuration)}
                </td>
                <td className="py-2.5 px-2 text-right text-muted tabular-nums">
                  {formatDuration(intv.actualDuration)}
                </td>
                <td className="py-2.5 pl-2 text-center">
                  {intv.completed ? (
                    <span style={{ color: '#3a7050' }}>&#10003;</span>
                  ) : (
                    <span style={{ color: '#7a3840' }}>&#10007;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
