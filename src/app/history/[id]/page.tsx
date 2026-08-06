'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useSessions } from '@/hooks/useSessions'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { formatDuration } from '@/lib/format'
import { SEGMENT_BORDER } from '@/lib/segment-styles'
import { getIntervalName } from '@/lib/interval-display'
import { updateCompletedInterval } from '@/lib/session-intervals'
import { IntervalEditModal } from '@/components/IntervalEditModal'
import type { IntervalType, CompletedInterval } from '@/types/workout'

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
  rest_between_cycles: 'Recovery',
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
  const { sessions, updateSession } = useSessions()
  const { workouts } = useWorkoutContext()
  const { sequences } = useSequences()

  const session = useMemo(
    () => sessions.find((s) => s.id === params.id),
    [sessions, params.id],
  )

  // ponytail: index-based modal editing — intervalId is NOT unique across cycles (duplicate key bug)
  // NOTE: all hooks run BEFORE the conditional return below (Rules of Hooks — was broken once)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSaveInterval = useCallback(
    async (index: number, patch: Partial<CompletedInterval>) => {
      if (!session || saving) return
      setSaving(true)
      const updated = updateCompletedInterval(session.intervals, index, patch)
      await updateSession(session.id, { intervals: updated })
      setSaving(false)
      setEditingIndex(null)
    },
    [session, saving, updateSession],
  )

  // ponytail: work + rest intervals are editable; prepare/cooldown stay read-only
  const isEditableType = (type: IntervalType) =>
    type === 'work' || type === 'rest' || type === 'rest_between_cycles'

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-16 p-margin-mobile md:p-margin-desktop text-center">
        <h1 className="font-headline-lg text-headline-lg text-fg-2">
          Session not found
        </h1>
        <Link
          href="/history"
          className="font-body-md text-body-md text-accent-container hover:underline"
        >
          &larr; Back to history
        </Link>
      </div>
    )
  }

  const name =
    session.type === 'workout'
      ? workouts.find((w) => w.id === session.workoutId)?.title ?? 'Unknown Workout'
      : sequences.find((sq) => sq.id === session.sequenceId)?.title ?? 'Unknown Sequence'

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
          className="font-body-md text-body-md text-muted hover:text-fg-2 transition-colors inline-flex items-center gap-xs w-fit"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to history
        </Link>

        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-8 text-muted">
            <span className="material-symbols-outlined text-sm">
              calendar_today
            </span>
            <span className="font-data-sm text-data-sm">
              {formatDateFull(session.startedAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-16">
            <h2 className="font-headline-lg text-headline-lg text-fg-2 tracking-tight font-bold">
              {name}
            </h2>
            <button
              onClick={handleRepeat}
              className="shrink-0 px-24 py-16 bg-accent text-accent-on rounded-lg font-label-caps text-label-caps hover:bg-accent/90 transition-colors ambient-shadow flex items-center gap-8 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-sm">repeat</span>
              Repeat
            </button>
          </div>
          <div className="flex gap-8 mt-xs">
            {chips.map((c) => (
              <span
                key={c}
                className="bg-surface text-muted font-label-caps text-label-caps px-8 py-1 rounded-full"
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
        <div className="bg-surface border border-outline-variant/30 rounded-xl p-16 flex flex-col justify-between min-h-[8rem] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-surface rounded-full opacity-30 group-hover:scale-110 transition-transform" />
          <span className="font-label-caps text-label-caps text-muted flex items-center gap-8">
            <span className="material-symbols-outlined text-sm">timer</span>
            Total Duration
          </span>
          <span className="font-data-lg text-data-lg text-fg-2">
            {formatDuration(totalDuration)}
          </span>
        </div>
      </section>

      {/* Interval Breakdown */}
      <section className="flex flex-col gap-16 mb-32">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-fg-2">
            Interval Breakdown
          </h3>
        </div>

        <div className="flex flex-col gap-8">
          {(() => {
            let workCount = 0
            return session.intervals.map((intv, idx) => {
              if (intv.type === 'work') workCount++
              const editable = isEditableType(intv.type)
              return (
                <div
                  key={`${intv.intervalId}-${idx}`}
                  onClick={() => editable && setEditingIndex(idx)}
                  role={editable ? 'button' : undefined}
                  tabIndex={editable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (editable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      setEditingIndex(idx)
                    }
                  }}
                  aria-label={editable ? `Edit interval ${idx + 1}` : undefined}
                  className={`bg-surface border-l-4 ${SEGMENT_BORDER[intv.type]} border-y border-r border-outline-variant/30 rounded-r-lg p-16 flex justify-between items-center group transition-colors ${
                    editable
                      ? 'cursor-pointer hover:bg-surface-warm-low focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none'
                      : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-16">
                    <div className="w-12 h-12 bg-surface flex items-center justify-center rounded font-data-sm text-data-sm text-muted border border-outline-variant/20">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md font-bold text-fg-2">
                        {getIntervalName(intv, workCount)}
                      </span>
                      <span className="font-label-caps text-label-caps text-muted mt-1">
                        {TYPE_LABELS[intv.type]}
                        {intv.completed ? '' : ' \u2022 Incomplete'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-24 items-center">
                    <div className="flex flex-col items-end">
                      <span className="font-label-caps text-label-caps text-muted">
                        Target
                      </span>
                      <span className="font-data-sm text-data-sm text-fg-2">
                        {formatDuration(intv.plannedDuration)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end w-16">
                      <span className="font-label-caps text-label-caps text-muted">
                        Actual
                      </span>
                      <span className="font-data-sm text-data-sm text-fg-2 font-bold">
                        {formatDuration(intv.actualDuration)}
                      </span>
                    </div>
                    {editable && (
                      <span className="material-symbols-outlined text-sm text-outline-variant">
                        chevron_right
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </section>

      {/* Interval edit modal — mounted only while open so its state resets per interval */}
      {editingIndex != null &&
        (() => {
          const editingIntv = session.intervals[editingIndex]
          if (!editingIntv) return null
          const editingWorkCount =
            session.intervals.slice(0, editingIndex).filter((i) => i.type === 'work').length + 1
          return (
            <IntervalEditModal
              interval={editingIntv}
              title={getIntervalName(editingIntv, editingWorkCount)}
              typeLabel={TYPE_LABELS[editingIntv.type]}
              onSave={(patch) => handleSaveInterval(editingIndex, patch)}
              onClose={() => setEditingIndex(null)}
            />
          )
        })()}
    </div>
  )
}
