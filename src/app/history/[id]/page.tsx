'use client'

import { useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useSessions } from '@/hooks/useSessions'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { formatDuration } from '@/lib/format'
import { SEGMENT_BORDER } from '@/lib/segment-styles'
import type { IntervalType } from '@/types/workout'

function formatDateFull(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TYPE_LABELS: Record<IntervalType, string> = {
  prepare: 'Warm Up',
  work: 'Effort',
  rest: 'Recovery',
  cooldown: 'Cool Down',
}

// ponytail: heuristic type chips from interval composition — no category field
function deriveTypeChips(
  intervals: { type: IntervalType; title: string }[],
): string[] {
  const chips: string[] = []
  if (intervals.some((i) => i.type === 'work')) chips.push('High Intensity')
  if (intervals.some((i) => /run|treadmill|bike|row/i.test(i.title)))
    chips.push('Cardio')
  if (!chips.length) chips.push('Training')
  return chips
}

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { sessions } = useSessions()
  const { getWorkout } = useWorkoutContext()
  const { getSequence } = useSequences()

  const session = useMemo(
    () => sessions.find((s) => s.id === params.id),
    [sessions, params.id],
  )

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-16 p-margin-mobile md:p-margin-desktop text-center">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          Session not found
        </h1>
        <Link
          href="/history"
          className="font-body-md text-body-md text-secondary-container hover:underline"
        >
          &larr; Back to history
        </Link>
      </div>
    )
  }

  const name =
    session.type === 'workout'
      ? getWorkout(session.workoutId!)?.title ?? 'Unknown Workout'
      : getSequence(session.sequenceId!)?.title ?? 'Unknown Sequence'

  const totalDuration = session.intervals.reduce(
    (s, i) => s + i.actualDuration,
    0,
  )
  const chips = deriveTypeChips(session.intervals)

  function handleRepeat() {
    if (!session) return
    if (session.type === 'workout' && session.workoutId) {
      router.push(`/workouts/${session.workoutId}/play`)
    } else if (session.type === 'sequence' && session.sequenceId) {
      router.push(`/sequences/${session.sequenceId}/play`)
    }
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-6xl mx-auto flex flex-col gap-24">
      {/* Header */}
      <section className="flex flex-col gap-16 mb-16">
        <Link
          href="/history"
          className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-xs w-fit"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to history
        </Link>

        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-8 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">
              calendar_today
            </span>
            <span className="font-data-sm text-data-sm">
              {formatDateFull(session.startedAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-16">
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
              {name}
            </h2>
            <button
              onClick={handleRepeat}
              className="shrink-0 px-24 py-16 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-primary/90 transition-colors ambient-shadow flex items-center gap-8 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-sm">repeat</span>
              Repeat
            </button>
          </div>
          <div className="flex gap-8 mt-xs">
            {chips.map((c) => (
              <span
                key={c}
                className="bg-surface-variant text-on-surface-variant font-label-caps text-label-caps px-8 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-16">
        {/* Total Duration */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-16 flex flex-col justify-between min-h-[8rem] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-surface-variant rounded-full opacity-30 group-hover:scale-110 transition-transform" />
          <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-8">
            <span className="material-symbols-outlined text-sm">timer</span>
            Total Duration
          </span>
          <span className="font-data-lg text-data-lg text-on-surface">
            {formatDuration(totalDuration)}
          </span>
        </div>
      </section>

      {/* Interval Breakdown */}
      <section className="flex flex-col gap-16 mb-32">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Interval Breakdown
        </h3>
        <div className="flex flex-col gap-8">
          {session.intervals.map((intv, idx) => (
            <div
              key={intv.intervalId}
              className={`bg-surface-container-lowest border-l-4 ${SEGMENT_BORDER[intv.type]} border-y border-r border-outline-variant/30 rounded-r-lg p-16 flex justify-between items-center hover:bg-surface-container-low transition-colors group cursor-default`}
            >
              <div className="flex items-center gap-16">
                <div className="w-12 h-12 bg-surface flex items-center justify-center rounded font-data-sm text-data-sm text-on-surface-variant border border-outline-variant/20">
                  {idx + 1}
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md font-bold text-on-surface">
                    {intv.title}
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant mt-1">
                    {TYPE_LABELS[intv.type]}
                    {intv.completed ? '' : ' \u2022 Incomplete'}
                  </span>
                </div>
              </div>
              <div className="flex gap-24 items-center">
                <div className="flex flex-col items-end">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Target
                  </span>
                  <span className="font-data-sm text-data-sm text-on-surface">
                    {formatDuration(intv.plannedDuration)}
                  </span>
                </div>
                <div className="flex flex-col items-end w-16">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Actual
                  </span>
                  <span className="font-data-sm text-data-sm text-on-surface font-bold">
                    {formatDuration(intv.actualDuration)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
