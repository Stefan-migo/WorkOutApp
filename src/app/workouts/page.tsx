'use client'

import { useRouter } from 'next/navigation'
import { useWorkoutContext } from '@/context/WorkoutContext'

export default function WorkoutListPage() {
  const { workouts } = useWorkoutContext()
  const router = useRouter()

  function formatDuration(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
        <h1 className="text-3xl font-bold text-fg">WorkOutApp</h1>
        <p className="text-muted">No workouts yet. Create your first one!</p>
        <button
          onClick={() => router.push('/workouts/new')}
          className="px-6 py-3 bg-accent hover:bg-accent text-accent-on rounded-lg font-medium transition-colors"
        >
          Create Workout
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">Workouts</h1>
        <button
          onClick={() => router.push('/workouts/new')}
          className="px-4 py-2 bg-accent hover:bg-accent text-accent-on rounded-lg text-sm font-medium transition-colors"
        >
          + New Workout
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {workouts.map((w) => {
          const totalSec = w.intervals.reduce((s, i) => s + i.duration, 0)
          return (
            <div key={w.id} className="p-4 rounded-[8px] bg-surface border border-border-soft flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="font-semibold text-fg truncate">{w.title}</h2>
                <p className="text-sm text-muted">
                  {formatDuration(totalSec)} &middot; {w.intervals.length} interval{w.intervals.length !== 1 && 's'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => router.push(`/workouts/${w.id}/edit`)}
                  className="px-3 py-1.5 bg-surface border border-border rounded text-sm text-fg hover:bg-surface-alt transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => router.push(`/workouts/${w.id}/play`)}
                  className="px-3 py-1.5 bg-accent hover:bg-accent text-accent-on rounded text-sm transition-colors"
                >
                  Play
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
