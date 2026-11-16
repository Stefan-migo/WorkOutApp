'use client'

import { useRouter } from 'next/navigation'
import { useSequences } from '@/hooks/useSequences'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { resolveWorkouts } from '@/lib/sequence-engine'
import { flattenWorkout } from '@/lib/interval-engine'
import { formatDuration } from '@/lib/format'
import { Button, EmptyState } from '@/components/ui'
import { PageHeading } from '@/components/ui/PageHeading'

export default function SequenceListPage() {
  const { sequences, deleteSequence, isLoading } = useSequences()
  const { workouts } = useWorkoutContext()
  const router = useRouter()
  const createSequence = () => router.push('/sequences/new')

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-24">
      <PageHeading
        title="Sequences"
        description="Combine multiple workouts into one session."
        action={sequences.length > 0 && <Button onClick={createSequence}>New sequence</Button>}
      />

      {sequences.length === 0 ? (
        isLoading ? <p role="status" className="text-muted">Loading sequences…</p> : (
          <div className="glass-card rounded-xl px-16">
            <EmptyState
              title="No sequences yet"
              body="Choose the workouts you want to do and arrange them in order."
              action={<Button onClick={createSequence}>New sequence</Button>}
            />
          </div>
        )
      ) : (
        <ul className="grid gap-16 xl:grid-cols-2">
          {sequences.map((seq) => {
            const resolved = resolveWorkouts(seq, workouts)
            const missing = seq.workoutIds.length - resolved.length
            const totalDuration = resolved.reduce(
              (sum, workout) => sum + flattenWorkout(workout).reduce((total, interval) => total + interval.duration, 0),
              0,
            ) * seq.repeatCount

            return (
              <li key={seq.id} className="glass-card flex flex-col gap-16 rounded-xl p-16 sm:p-24">
                <div className="min-w-0">
                  <h2 className="wrap-break-word font-headline text-headline-md text-fg-2">{seq.title}</h2>
                  {seq.description && <p className="mt-xs line-clamp-2 text-body-md text-muted">{seq.description}</p>}
                  <p className="mt-8 font-mono text-data-sm text-muted">
                    {resolved.length} workout{resolved.length !== 1 && 's'}
                    {seq.repeatCount > 1 && ` × ${seq.repeatCount}`}
                    {' · '}
                    {formatDuration(totalDuration)}
                    {missing > 0 && <span className="ml-1 text-warn">· {missing} missing</span>}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-8 border-t border-border-soft pt-16">
                  <Button onClick={() => router.push(`/sequences/${seq.id}/play`)}>
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">play_arrow</span>
                    Start sequence
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Delete ${seq.title}`}
                    onClick={() => {
                      if (confirm('Delete this sequence?')) deleteSequence(seq.id)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
