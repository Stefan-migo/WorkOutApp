'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { formatDuration } from '@/lib/format'
import { SEGMENT_BG_80 } from '@/lib/segment-styles'
import type { IntervalType } from '@/types/workout'
import { Button, Card, EmptyState, IconButton } from '@/components/ui'

function totalSeconds(intervals: { duration: number }[]) {
  return intervals.reduce((s, i) => s + i.duration, 0)
}

function TimelinePreview({ intervals }: { intervals: { type: IntervalType; duration: number }[] }) {
  const total = totalSeconds(intervals)
  if (total === 0) return null
  return (
    <div className="h-2 w-full bg-surface rounded-full overflow-hidden flex">
      {intervals.map((i, idx) => (
        <div
          key={idx}
          className={`h-full ${SEGMENT_BG_80[i.type]}`}
          style={{ width: `${(i.duration / total) * 100}%` }}
        />
      ))}
    </div>
  )
}

export default function WorkoutListPage() {
  const { workouts, deleteWorkout } = useWorkoutContext()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

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
        {filtered.map((w) => {
          const total = totalSeconds(w.intervals)
          return (
            <Card
              key={w.id}
              interactive
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/workouts/${w.id}/edit`)}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/workouts/${w.id}/edit`) }}
              className="p-16 flex flex-col gap-4 relative group"
            >
              {/* Three-dot menu */}
              <div className="absolute top-4 right-4 z-40">
                <button
                  className="text-muted hover:text-accent p-1 rounded-full hover:bg-surface transition-colors focus-visible:focus-ring"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === w.id ? null : w.id) }}
                  aria-label="Workout options"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
                {menuOpen === w.id && (
                  <>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }} />
                    <div className="absolute right-0 top-8 z-20 bg-surface border border-border-soft rounded-xl shadow-lg py-4 min-w-[180px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { router.push(`/workouts/${w.id}/play`); setMenuOpen(null) }}
                        className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-accent hover:bg-accent/5 transition-colors text-left font-semibold"
                      >
                        <span className="material-symbols-outlined text-[18px] text-accent">play_arrow</span>
                        Play
                      </button>
                      <div className="border-t border-border-soft my-4" />
                      <button
                        onClick={() => { router.push(`/workouts/${w.id}/edit`); setMenuOpen(null) }}
                        className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-fg-2 hover:bg-surface transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[18px] text-muted">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => { router.push(`/workouts/${w.id}/preview`); setMenuOpen(null) }}
                        className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-fg-2 hover:bg-surface transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[18px] text-muted">visibility</span>
                        Preview
                      </button>
                      <div className="border-t border-border-soft my-4" />
                      <button
                        onClick={() => { if (confirm('Delete this workout?')) { deleteWorkout(w.id); setMenuOpen(null) } }}
                        className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-danger hover:bg-danger/5 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Play button — always visible on card */}
              <IconButton
                variant="primary"
                size="sm"
                aria-label={`Play ${w.title}`}
                onClick={(e) => { e.stopPropagation(); router.push(`/workouts/${w.id}/play`) }}
                className="absolute bottom-4 right-4 shadow-fab"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </IconButton>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline-md text-[20px] leading-tight font-bold text-fg-2 mb-1">{w.title}</h3>
                  <p className="font-data-sm text-data-sm text-muted flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">timer</span>
                    {formatDuration(total)}
                    <span className="w-1 h-1 rounded-full bg-border-soft/50" />
                    {w.intervals.length} interval{w.intervals.length !== 1 && 's'}
                  </p>
                </div>
              </div>

              {/* Timeline Preview */}
              <TimelinePreview intervals={w.intervals} />

            </Card>
          )
        })}
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
