'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { formatDuration } from '@/lib/format'
import { SEGMENT_BG_80 } from '@/lib/segment-styles'
import type { IntervalType } from '@/types/workout'

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
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-32 text-center">
        <span className="material-symbols-outlined text-[48px] text-muted">fitness_center</span>
        <h1 className="font-headline-md text-[24px] font-bold text-fg-2">No workouts yet</h1>
        <p className="font-body-md text-muted max-w-sm">
          Create your first workout to start tracking your training sessions and progress.
        </p>
        <button
          onClick={() => router.push('/workouts/new')}
          className="px-6 py-3 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-muted text-accent-on rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          Create Workout
        </button>
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
            className="w-full bg-surface border border-outline-variant/50 rounded-lg pl-12 pr-4 py-3 font-body-md focus:border-accent focus:ring-1 focus:ring-secondary transition-all outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            placeholder="Search workouts..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => router.push('/workouts/new')}
            className="px-4 py-2 rounded-lg bg-accent text-accent-on font-label-caps text-label-caps hover:opacity-90 transition-opacity flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Workout
          </button>
          <button
            onClick={() => setTypeFilter(typeFilter === null ? 'all' : null)}
            className={`px-4 py-2 rounded-full transition-colors border font-label-caps text-label-caps flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
              typeFilter !== null
                ? 'bg-accent text-accent-on border-primary'
                : 'bg-surface text-fg-2 border-transparent hover:bg-surface-warm-high'
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
            <div
              key={w.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/workouts/${w.id}/edit`)}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/workouts/${w.id}/edit`) }}
              className="bg-surface rounded-xl border border-outline-variant/30 p-16 flex flex-col gap-4 hover:shadow-[0_8px_30px_rgba(11,28,48,0.04)] transition-shadow duration-300 relative group cursor-pointer"
            >
              {/* Three-dot menu */}
              <div className="absolute top-4 right-4 z-40">
                <button
                  className="text-muted hover:text-accent p-1 rounded-full hover:bg-surface transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === w.id ? null : w.id) }}
                  aria-label="Workout options"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
                {menuOpen === w.id && (
                  <>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }} />
                    <div className="absolute right-0 top-8 z-20 bg-surface border border-outline-variant/30 rounded-xl shadow-lg py-4 min-w-[180px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { router.push(`/workouts/${w.id}/play`); setMenuOpen(null) }}
                        className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-accent hover:bg-accent/5 transition-colors text-left font-semibold"
                      >
                        <span className="material-symbols-outlined text-[18px] text-accent">play_arrow</span>
                        Play
                      </button>
                      <div className="border-t border-outline-variant/20 my-4" />
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
                      <div className="border-t border-outline-variant/20 my-4" />
                      <button
                        onClick={() => { if (confirm('Delete this workout?')) { deleteWorkout(w.id); setMenuOpen(null) } }}
                        className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-error hover:bg-error/5 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Play button — always visible on card */}
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/workouts/${w.id}/play`) }}
                className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-accent text-accent-on flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                aria-label={`Play ${w.title}`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </button>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline-md text-[20px] leading-tight font-bold text-fg-2 mb-1">{w.title}</h3>
                  <p className="font-data-sm text-data-sm text-muted flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">timer</span>
                    {formatDuration(total)}
                    <span className="w-1 h-1 rounded-full bg-outline-variant/50" />
                    {w.intervals.length} interval{w.intervals.length !== 1 && 's'}
                  </p>
                </div>
              </div>

              {/* Timeline Preview */}
              <TimelinePreview intervals={w.intervals} />

            </div>
          )
        })}
      </div>

      {/* FAB - mobile only */}
      <button
        aria-label="Create workout"
        onClick={() => router.push('/workouts/new')}
        className="fixed bottom-24 right-24 w-14 h-14 bg-accent text-accent-on rounded-full shadow-[0_4px_20px_rgba(30,41,59,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform md:hidden z-50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>
    </div>
  )
}
