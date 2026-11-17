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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 sm:gap-24">
      <PageHeading
        title="Sequences"
        action={sequences.length > 0 && <Button onClick={createSequence}><span aria-hidden="true" className="material-symbols-outlined !text-lg">add</span>New sequence</Button>}
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
              <li key={seq.id} className="glass-card flex min-w-0 flex-col gap-3 rounded-card p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-warm text-accent">
                    <span className="material-symbols-outlined !text-xl">repeat</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="wrap-break-word font-headline text-headline-md text-fg-2">{seq.title}</h2>
                    {seq.description && <p className="mt-xs line-clamp-2 text-body-md text-muted">{seq.description}</p>}
                    <p className="mt-1 text-sm tabular-nums text-muted">
                      {resolved.length} workout{resolved.length !== 1 && 's'}
                      {seq.repeatCount > 1 && ` × ${seq.repeatCount}`}
                      {' · '}
                      {formatDuration(totalDuration)}
                      {missing > 0 && <span className="ml-1 text-warn">· {missing} missing</span>}
                    </p>
                  </div>
                </div>
                {resolved.length > 0 && (
                  <p className="line-clamp-2 text-sm text-muted">{resolved.slice(0, 3).map((workout) => workout.title).join(' → ')}{resolved.length > 3 && ` · +${resolved.length - 3} more`}</p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <Button size="sm" onClick={() => router.push(`/sequences/${seq.id}/play`)}>
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">play_arrow</span>
                    Start sequence
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-danger"
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
