'use client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { SEGMENT_BG, SEGMENT_BORDER, SEGMENT_TEXT, TYPE_ICONS } from '@/lib/segment-styles'
import { formatDuration } from '@/lib/format'
import { getIntervalName } from '@/lib/interval-display'
import { useExercises } from '@/hooks/useExercises'

export default function PreviewWorkoutPage() {
  const { workouts } = useWorkoutContext()
  const { exercises } = useExercises()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const workout = workouts.find((w) => w.id === params.id)

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-32 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Workout not found</h1>
        <Link href="/workouts" className="text-secondary hover:underline">&larr; Back to workouts</Link>
      </div>
    )
  }

  const total = workout.intervals.reduce((s, i) => s + i.duration, 0)

  return (
    <div className="max-w-2xl mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col gap-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface font-bold">{workout.title}</h1>
          {workout.description && (
            <p className="font-body-md text-body-md text-on-surface-variant mt-4">{workout.description}</p>
          )}
        </div>
        <div className="text-right">
          <span className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Duration</span>
          <span className="font-mono text-display-timer-mobile text-primary tracking-tighter">{formatDuration(total)}</span>
        </div>
      </div>

      {/* Intervals list (read-only) */}
      <div className="flex flex-col gap-8">
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider px-4">
          {workout.intervals.length} interval{workout.intervals.length !== 1 && 's'}
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
                <div className="flex-1 py-md">
                  <span className="font-body-md font-semibold text-on-surface">
                    {getIntervalName(interval, workCount, exercise)}
                  </span>
                  {interval.description && (
                    <p className="text-[11px] text-on-surface-variant font-body-md mt-2">{interval.description}</p>
                  )}
                </div>
                <div className="px-16 font-data-lg text-data-lg text-primary font-bold tracking-tight font-mono">
                  {formatDuration(interval.duration)}
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
          className="flex-1 py-3 bg-surface border border-outline-variant text-on-surface rounded-lg font-medium hover:bg-surface-dim transition-colors"
        >
          &larr; Back
        </button>
        <button
          onClick={() => router.push(`/workouts/${workout.id}/edit`)}
          className="flex-1 py-3 bg-primary-btn hover:bg-primary-btn-hover text-on-primary-btn rounded-lg font-medium transition-colors"
        >
          Edit Workout
        </button>
      </div>
    </div>
  )
}
