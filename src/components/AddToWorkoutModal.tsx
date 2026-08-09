'use client'

import { useMemo, useState } from 'react'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { getIntervalName } from '@/lib/interval-display'
import type { Exercise, Workout } from '@/types/workout'
import { detectCycles, isInCycle } from '@/lib/detect-cycles'
import { Dialog } from './ui/Dialog'
import { IconButton } from './ui/IconButton'

interface Props {
  exercise: Exercise
  onClose: () => void
}

export function AddToWorkoutModal({ exercise, onClose }: Props) {
  const { workouts, saveWorkout } = useWorkoutContext()
  // ponytail: modal only mounts while the parent wants it — internal open state
  // (DD-F) avoids a parent ripple; onOpenChange(false) funnels to onClose().
  const [open, setOpen] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const assignable = useMemo(
    () => workouts.filter((w) => w.intervals.some((i) => i.type === 'work')),
    [workouts],
  )

  const selectedWorkout = useMemo(
    () => assignable.find((w) => w.id === selectedId),
    [assignable, selectedId],
  )

  const cycles = useMemo(() => detectCycles(selectedWorkout?.intervals ?? []), [selectedWorkout])

  async function handleAssign(intervalId: string) {
    if (!selectedWorkout) return
    setSaving(true)
    const updated: Workout = {
      ...selectedWorkout,
      intervals: selectedWorkout.intervals.map((i) =>
        i.id === intervalId
          ? { ...i, exerciseId: exercise.id, title: exercise.name }
          : i,
      ),
      updatedAt: Date.now(),
    }
    await saveWorkout(updated)
    setSaving(false)
    onClose()
  }

  // Index all work intervals so we can show where they sit (inside cycle or standalone)
  const workIntervals = useMemo(() => {
    if (!selectedWorkout) return []
    return selectedWorkout.intervals
      .map((i, idx) => ({ interval: i, globalIdx: idx }))
      .filter(({ interval }) => interval.type === 'work')
  }, [selectedWorkout])

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) onClose()
      }}
      variant="fixed"
      title={`Assign "${exercise.name}"`}
      className="p-6 max-h-[80vh]"
    >
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Close"
        onClick={() => {
          setOpen(false)
          onClose()
        }}
        className="absolute right-4 top-4"
      >
        ✕
      </IconButton>

      <div className="flex flex-col gap-4 overflow-y-auto">
        {assignable.length === 0 ? (
          <p className="text-muted font-body text-body-md text-center py-8">
            No workouts with work intervals yet.{' '}
            <a href={`/workouts/new?exerciseId=${exercise.id}`} className="text-accent underline">Create one</a>
          </p>
        ) : (
          <>
            <p className="font-body text-body-sm text-muted">
              Select a workout and pick a work interval to assign this exercise.
            </p>

            <div className="flex flex-col gap-2">
              {assignable.map((w) => (
                <div key={w.id} className="rounded-xl bg-surface overflow-hidden">
                  <button
                    onClick={() => setSelectedId((prev) => (prev === w.id ? null : w.id))}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-warm transition-colors text-left"
                  >
                    <span className="font-label text-label-lg font-medium text-fg-2">{w.title}</span>
                    <span className="text-muted text-sm">{selectedId === w.id ? '▾' : '▸'}</span>
                  </button>

                  {selectedId === w.id && (
                    <div className="flex flex-col border-t border-border-soft">
                      {workIntervals.length === 0 ? (
                        <p className="px-4 py-3 text-body-sm text-muted">No work intervals.</p>
                      ) : (
                        workIntervals.map(({ interval, globalIdx }, wi) => {
                          const cycle = isInCycle(globalIdx, cycles)
                          const already = interval.exerciseId
                          return (
                            <button
                              key={interval.id}
                              onClick={() => handleAssign(interval.id)}
                              disabled={saving || already === exercise.id}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-warm transition-colors disabled:opacity-50 text-left border-b border-border-soft last:border-b-0"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-body text-body-sm text-fg-2">
                                  {getIntervalName(interval, wi + 1)}
                                  {cycle && (
                                    <span className="text-body-xs text-muted ml-2">
                                      · {cycle.label}
                                    </span>
                                  )}
                                </span>
                                <span className="font-body text-body-xs text-muted">
                                  {formatDuration(interval.duration)}
                                  {already && already !== exercise.id && ' · currently assigned'}
                                </span>
                              </div>
                              <span className="font-body text-body-xs text-accent font-medium shrink-0 ml-2">
                                {already === exercise.id ? 'Assigned ✓' : saving ? 'Saving…' : 'Assign'}
                              </span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}m`
}
