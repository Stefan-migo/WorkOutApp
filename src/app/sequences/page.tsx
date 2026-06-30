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
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
        <h1 className="text-3xl font-bold text-fg">Sequences</h1>
        <p className="text-muted">No sequences yet. Chain your workouts!</p>
        <button
          onClick={() => router.push('/sequences/new')}
          className="px-6 py-3 bg-accent hover:bg-accent text-accent-on rounded-lg font-medium transition-colors"
        >
          New Sequence
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">Sequences</h1>
        <button
          onClick={() => router.push('/sequences/new')}
          className="px-4 py-2 bg-accent hover:bg-accent text-accent-on rounded-lg text-sm font-medium transition-colors"
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
              className="p-4 rounded-[8px] bg-surface border border-border-soft flex items-center justify-between"
            >
              <div className="min-w-0">
                <h2 className="font-semibold text-fg truncate">{seq.title}</h2>
                {seq.description && (
                  <p className="text-sm text-muted truncate">{seq.description}</p>
                )}
                <p className="text-sm text-muted mt-1">
                  {resolved.length}/{seq.workoutIds.length} workout
                  {seq.workoutIds.length !== 1 && 's'}
                  {' · '}
                  {formatDuration(totalDuration)}
                  {seq.repeatCount > 1 && ` · ${seq.repeatCount}×`}
                  {missing > 0 && (
                    <span className="text-status-warning ml-1">
                      ({missing} missing)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => router.push(`/sequences/${seq.id}/play`)}
                  className="px-3 py-1.5 bg-accent hover:bg-accent text-accent-on rounded text-sm transition-colors"
                >
                  Play
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this sequence?')) deleteSequence(seq.id)
                  }}
                  className="px-3 py-1.5 bg-surface border border-border rounded text-sm text-fg hover:bg-surface-alt transition-colors"
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
