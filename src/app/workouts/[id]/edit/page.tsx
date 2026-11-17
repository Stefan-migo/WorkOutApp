'use client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import WorkoutEditor from '@/components/WorkoutEditor'

export default function EditWorkoutPage() {
  const { workouts, saveWorkout, isLoading } = useWorkoutContext()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const existing = workouts.find((w) => w.id === params.id)

  if (!existing) {
    if (isLoading) return <p role="status" className="text-muted">Loading workout…</p>
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-32 text-center">
        <h1 className="text-2xl font-bold text-fg-2">Workout not found</h1>
        <Link href="/workouts" className="text-accent hover:underline">&larr; Back to workouts</Link>
      </div>
    )
  }

  return (
    <WorkoutEditor
      existingWorkout={existing}
      onSave={async (workout) => {
        if (!await saveWorkout(workout)) throw new Error('Could not save the workout. Try again.')
        router.push('/workouts')
      }}
      onCancel={() => router.back()}
    />
  )
}
