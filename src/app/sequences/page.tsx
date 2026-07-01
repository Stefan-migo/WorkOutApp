'use client'

import { useRouter } from 'next/navigation'
import { useSequences } from '@/hooks/useSequences'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { resolveWorkouts } from '@/lib/sequence-engine'
import { flattenWorkout } from '@/lib/interval-engine'

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function SequenceListPage() {
  const { sequences, deleteSequence } = useSequences()
  const { workouts } = useWorkoutContext()
  const router = useRouter()

  if (sequences.length === 0) {
    return (
      <div className="max-w-2xl mx-auto w-full p-6 flex flex-col items-center justify-center flex-1 gap-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-16 h-16 text-outline-variant/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1 className="font-headline text-headline-lg font-bold text-primary">Sequences</h1>
          <p className="font-body text-body-md text-on-surface-variant">No sequences yet. Chain your workouts!</p>
          <button
            onClick={() => router.push('/sequences/new')}
            className="px-6 py-3 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors"
          >
            New Sequence
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-headline-lg font-bold text-primary">Sequences</h1>
        <button
          onClick={() => router.push('/sequences/new')}
          className="px-4 py-2 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors"
        >
          + New Sequence
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {sequences.map((seq) => {
          const resolved = resolveWorkouts(seq, workouts)
          const missing = seq.workoutIds.length - resolved.length
          const totalDuration = resolved.reduce(
            (sum, w) => sum + flattenWorkout(w).reduce((s, i) => s + i.duration, 0),
            0,
          )

          return (
            <div
              key={seq.id}
              className="glass-card rounded-lg p-md flex items-center gap-md relative"
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-sm opacity-50" />

              <div className="flex-1 min-w-0 pl-3">
                <h2 className="font-body text-body-lg font-bold text-on-surface truncate">
                  {seq.title}
                </h2>
                {seq.description && (
                  <p className="font-body text-body-md text-on-surface-variant truncate">
                    {seq.description}
                  </p>
                )}
                <p className="font-data text-data-sm text-on-surface-variant mt-1">
                  {resolved.length}/{seq.workoutIds.length} workout
                  {seq.workoutIds.length !== 1 && 's'}
                  {' · '}
                  {formatDuration(totalDuration)}
                  {seq.repeatCount > 1 && ` · ${seq.repeatCount}×`}
                  {missing > 0 && (
                    <span className="text-secondary ml-1">
                      ({missing} missing)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => router.push(`/sequences/${seq.id}/play`)}
                  className="px-3 py-1.5 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors"
                >
                  Play
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this sequence?')) deleteSequence(seq.id)
                  }}
                  className="px-3 py-1.5 border border-outline-variant/30 text-outline-variant hover:text-error font-label text-label-caps rounded-lg hover:bg-error-container/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
