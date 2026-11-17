'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { Button, EmptyState, SearchInput } from '@/components/ui'
import { PageHeading } from '@/components/ui/PageHeading'
import { WorkoutCard } from '@/components/blocks/WorkoutCard'
import { getEffectiveMode } from '@/lib/interval-engine'
import type { WorkoutMode } from '@/types/workout'

const modes = [
  { value: 'all', label: 'All workouts' },
  { value: 'timed', label: 'Timed' },
  { value: 'reps', label: 'Repetitions' },
] as const

export default function WorkoutListPage() {
  const { workouts, deleteWorkout, isLoading } = useWorkoutContext()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<WorkoutMode | 'all'>('all')
  const query = search.trim().toLowerCase()
  const filtered = workouts.filter((workout) =>
    workout.title.toLowerCase().includes(query) &&
    (mode === 'all' || workout.intervals.some((interval) =>
      interval.type === 'work' && getEffectiveMode(workout, interval) === mode,
    )),
  )

  function createWorkout() {
    router.push('/workouts/new')
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 sm:gap-24">
      <PageHeading
        title="Workouts"
        action={workouts.length > 0 && (
          <Button aria-label="Create workout" onClick={createWorkout}>
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">add</span>
            New workout
          </Button>
        )}
      />

      {workouts.length === 0 ? (
        isLoading ? <p role="status" className="text-muted">Loading workouts…</p> : (
          <div className="glass-card rounded-xl px-16">
            <EmptyState
              icon={<span className="material-symbols-outlined text-[40px]">fitness_center</span>}
              title="No workouts yet"
              body="Create a routine by adding exercises and setting the time or repetitions."
              action={<Button onClick={createWorkout}>Create workout</Button>}
            />
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-card bg-surface-warm/60 p-3 lg:flex-row lg:items-end">
            <div className="w-full lg:max-w-sm">
              <SearchInput label="Search workouts" value={search} onChange={setSearch} />
            </div>
            <div role="group" aria-label="Workout mode" className="flex flex-wrap gap-1">
              {modes.map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  pill
                  variant={mode === value ? 'primary' : 'ghost'}
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No workouts match"
              action={<Button variant="outline" onClick={() => { setSearch(''); setMode('all') }}>Reset filters</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onOpen={() => router.push(`/workouts/${workout.id}/edit`)}
                  onPlay={() => router.push(`/workouts/${workout.id}/play`)}
                  onEdit={() => router.push(`/workouts/${workout.id}/edit`)}
                  onPreview={() => router.push(`/workouts/${workout.id}/preview`)}
                  onDelete={() => {
                    if (confirm('Delete this workout?')) deleteWorkout(workout.id)
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
