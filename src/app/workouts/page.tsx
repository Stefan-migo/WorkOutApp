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
        <h1 className="text-3xl font-bold">WorkOutApp</h1>
        <p className="text-zinc-400">No workouts yet. Create your first one!</p>
        <button
          onClick={() => router.push('/workouts/new')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
        >
          Create Workout
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <button
          onClick={() => router.push('/workouts/new')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          + New Workout
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {workouts.map((w) => {
          const totalSec = w.intervals.reduce((s, i) => s + i.duration, 0)
          return (
            <div key={w.id} className="p-4 rounded-lg bg-zinc-800 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="font-semibold text-white truncate">{w.title}</h2>
                <p className="text-sm text-zinc-400">
                  {formatDuration(totalSec)} &middot; {w.intervals.length} interval{w.intervals.length !== 1 && 's'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => router.push(`/workouts/${w.id}/edit`)}
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => router.push(`/workouts/${w.id}/play`)}
                  className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm transition-colors"
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
