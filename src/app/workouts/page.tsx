'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { Button, EmptyState } from '@/components/ui'
import { WorkoutCard } from '@/components/blocks/WorkoutCard'

export default function WorkoutListPage() {
  const { workouts, deleteWorkout } = useWorkoutContext()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  // ponytail: client-side filter by title — no debounce needed at this scale
  const filtered = useMemo(() => {
    let result = workouts
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((w) => w.title.toLowerCase().includes(q))
    }
    // ponytail: simple type heuristic — first interval type determines "category"
    if (typeFilter) {
      result = result.filter((w) => {
        const t = w.intervals[0]?.type
        return typeFilter === 'all' || !typeFilter || t === typeFilter
      })
    }
    return result
  }, [workouts, search, typeFilter])

  if (workouts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<span className="material-symbols-outlined text-[48px] text-muted">fitness_center</span>}
          title="No workouts yet"
          body="Create your first workout to start tracking your training sessions and progress."
          action={<Button onClick={() => router.push('/workouts/new')}>Create Workout</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-24 space-y-24">
      {/* Search & Filters + New Workout */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted">search</span>
          <input
            className="w-full bg-surface border border-border/50 rounded-lg pl-12 pr-4 py-3 font-body-md focus:border-accent focus:ring-1 focus:ring-accent transition-all outline-none focus-visible:focus-ring"
            placeholder="Search workouts..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" onClick={() => router.push('/workouts/new')}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Workout
          </Button>
          <button
            onClick={() => setTypeFilter(typeFilter === null ? 'all' : null)}
            className={`px-4 py-2 rounded-full transition-colors border font-label-caps text-label-caps flex items-center gap-2 focus-visible:focus-ring ${
              typeFilter !== null
                ? 'bg-accent text-accent-on border-accent'
                : 'bg-surface text-fg-2 border-transparent hover:bg-surface-warm'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">filter_list</span> Type
          </button>
        </div>
      </div>

      {/* Workout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24 pb-20">
        {filtered.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onOpen={() => router.push(`/workouts/${w.id}/edit`)}
            onPlay={() => router.push(`/workouts/${w.id}/play`)}
            onEdit={() => router.push(`/workouts/${w.id}/edit`)}
            onPreview={() => router.push(`/workouts/${w.id}/preview`)}
            onDelete={() => {
              if (confirm('Delete this workout?')) deleteWorkout(w.id)
            }}
          />
        ))}
      </div>

      {/* FAB - mobile only */}
      <Button
        variant="primary"
        pill
        elevated
        aria-label="Create workout"
        onClick={() => router.push('/workouts/new')}
        className="fixed bottom-24 right-24 w-14 h-14 px-0 md:hidden z-50"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </Button>
    </div>
  )
}
