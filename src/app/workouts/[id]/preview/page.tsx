'use client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { SEGMENT_BG, SEGMENT_BORDER, SEGMENT_TEXT, TYPE_ICONS } from '@/lib/segment-styles'
import { formatDuration } from '@/lib/format'
import { getIntervalName } from '@/lib/interval-display'
import { getEffectiveMode } from '@/lib/interval-engine'
import { useExercises } from '@/hooks/useExercises'
import { Button } from '@/components/ui'
import { PageHeading } from '@/components/ui/PageHeading'

export default function PreviewWorkoutPage() {
  const { workouts, isLoading } = useWorkoutContext()
  const { exercises } = useExercises()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const workout = workouts.find((w) => w.id === params.id)

  if (!workout) {
    if (isLoading) return <p role="status" className="text-muted">Loading workout…</p>
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-32 text-center">
        <h1 className="text-2xl font-bold text-fg-2">Workout not found</h1>
        <Link href="/workouts" className="text-accent hover:underline">&larr; Back to workouts</Link>
      </div>
    )
  }

  const hasRepIntervals = workout.intervals.some((interval) =>
    interval.type === 'work' && getEffectiveMode(workout, interval) === 'reps',
  )
  const total = workout.intervals.reduce((s, i) => s + i.duration, 0)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-24">
      <PageHeading
        title={workout.title}
        description={workout.description}
        action={<Button onClick={() => router.push(`/workouts/${workout.id}/play`)}>Start workout</Button>}
      />

      {/* Intervals list (read-only) */}
      <div className="flex flex-col gap-8">
        <span className="font-label-caps text-label-caps uppercase text-muted tracking-wider px-4">
          {workout.intervals.length} interval{workout.intervals.length !== 1 && 's'} · {hasRepIntervals ? 'Includes repetitions' : formatDuration(total)}
        </span>
        {(() => {
          let workCount = 0
          return workout.intervals.map((interval) => {
            if (interval.type === 'work') workCount++
            const exercise = interval.exerciseId
              ? exercises.find((e) => e.id === interval.exerciseId)
              : undefined
            return (
              <div
                key={interval.id}
                className={`glass-card rounded-lg flex items-center pl-0 border-l-4 ${SEGMENT_BORDER[interval.type] ?? 'border-l-segment-work'}`}
              >
                <div className={`p-8 mx-8 ${SEGMENT_BG[interval.type]} ${SEGMENT_TEXT[interval.type]} rounded-md flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[20px]">{TYPE_ICONS[interval.type]}</span>
                </div>
                <div className="min-w-0 flex-1 py-8">
                  <span className="font-body-md font-semibold text-fg-2">
                    {getIntervalName(interval, workCount, exercise)}
                  </span>
                  {interval.description && (
                    <p className="text-[11px] text-muted font-body-md mt-2">{interval.description}</p>
                  )}
                </div>
                <div className="shrink-0 px-16 font-mono text-data-sm text-accent">
                  {interval.type === 'work' && getEffectiveMode(workout, interval) === 'reps'
                    ? `${interval.reps ?? 0} reps`
                    : formatDuration(interval.duration)}
                </div>
              </div>
            )
          })
        })()}
      </div>

      {/* Back button */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => router.back()}
          className="flex-1 py-3 bg-surface border border-border text-fg-2 rounded-lg font-medium hover:bg-surface transition-colors"
        >
          &larr; Back
        </button>
        <button
          onClick={() => router.push(`/workouts/${workout.id}/edit`)}
          className="flex-1 py-3 bg-accent hover:bg-accent-hover text-accent-on rounded-lg font-medium transition-colors"
        >
          Edit Workout
        </button>
      </div>
    </div>
  )
}
