'use client'

import { useRouter } from 'next/navigation'
import { useWorkoutContext } from '@/context/WorkoutContext'
import type { IntervalType } from '@/types/workout'

const SEGMENT_COLORS: Record<IntervalType, string> = {
  prepare: 'bg-segment-prepare',
  work: 'bg-segment-work',
  rest: 'bg-segment-rest',
  cooldown: 'bg-segment-cooldown',
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function totalSeconds(intervals: { duration: number }[]) {
  return intervals.reduce((s, i) => s + i.duration, 0)
}

function TimelinePreview({ intervals }: { intervals: { type: IntervalType; duration: number }[] }) {
  const total = totalSeconds(intervals)
  if (total === 0) return null
  return (
    <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden flex">
      {intervals.map((i, idx) => (
        <div
          key={idx}
          className={`h-full ${SEGMENT_COLORS[i.type]}/80`}
          style={{ width: `${(i.duration / total) * 100}%` }}
        />
      ))}
    </div>
  )
}

export default function WorkoutListPage() {
  const { workouts } = useWorkoutContext()
  const router = useRouter()

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">fitness_center</span>
        <h1 className="font-headline-md text-[24px] font-bold text-on-surface">No workouts yet</h1>
        <p className="font-body-md text-on-surface-variant max-w-sm">
          Create your first workout to start tracking your training sessions and progress.
        </p>
        <button
          onClick={() => router.push('/workouts/new')}
          className="px-6 py-3 bg-primary-container hover:bg-primary disabled:bg-surface-container-low text-on-primary rounded-lg font-medium transition-colors"
        >
          Create Workout
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-lg space-y-lg">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            className="w-full bg-surface border border-outline-variant/50 rounded-lg pl-12 pr-4 py-3 font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none"
            placeholder="Search workouts..."
            type="text"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 rounded-full bg-surface-dim text-on-surface font-label-caps text-label-caps flex items-center gap-2 hover:bg-surface-container-high transition-colors border border-transparent">
            <span className="material-symbols-outlined text-[16px]">filter_list</span> Type
          </button>
          <button className="px-4 py-2 rounded-full bg-surface-dim text-on-surface font-label-caps text-label-caps flex items-center gap-2 hover:bg-surface-container-high transition-colors border border-transparent">
            <span className="material-symbols-outlined text-[16px]">schedule</span> Duration
          </button>
          <button className="px-4 py-2 rounded-full bg-surface border border-outline-variant/30 text-on-surface font-label-caps text-label-caps flex items-center gap-2 hover:border-outline-variant transition-colors">
            <span className="material-symbols-outlined text-[16px]">fitness_center</span> Equipment
          </button>
        </div>
      </div>

      {/* Workout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {workouts.map((w) => {
          const total = totalSeconds(w.intervals)
          return (
            <div
              key={w.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/workouts/${w.id}/edit`)}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/workouts/${w.id}/edit`) }}
              className="bg-surface rounded-xl border border-outline-variant/30 p-md flex flex-col gap-4 hover:shadow-[0_8px_30px_rgba(11,28,48,0.04)] transition-shadow duration-300 relative group cursor-pointer"
            >
              {/* Three-dot menu — hidden by default, visible on group-hover */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-variant transition-colors" onClick={(e) => e.stopPropagation()}>
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline-md text-[20px] leading-tight font-bold text-on-surface mb-1">{w.title}</h3>
                  <p className="font-data-sm text-data-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">timer</span>
                    {formatDuration(total)}
                    <span className="w-1 h-1 rounded-full bg-outline-variant/50" />
                    {w.intervals.length} interval{w.intervals.length !== 1 && 's'}
                  </p>
                </div>
              </div>

              {/* Timeline Preview */}
              <TimelinePreview intervals={w.intervals} />

              {/* Equipment chips placeholder — show none for now */}
              <div className="flex gap-2 mt-auto pt-2" />
            </div>
          )
        })}
      </div>

      {/* FAB - mobile only */}
      <button
        aria-label="Create workout"
        onClick={() => router.push('/workouts/new')}
        className="fixed bottom-lg right-lg w-14 h-14 bg-primary-container text-on-primary rounded-full shadow-[0_4px_20px_rgba(30,41,59,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform md:hidden z-50"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>
    </div>
  )
}
