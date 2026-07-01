'use client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import WorkoutEditor from '@/components/WorkoutEditor'

export default function EditWorkoutPage() {
  const { getWorkout, saveWorkout } = useWorkoutContext()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const existing = getWorkout(params.id)

  if (!existing) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-32 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Workout not found</h1>
        <Link href="/workouts" className="text-secondary hover:underline">&larr; Back to workouts</Link>
      </div>
    )
  }

  return (
    <WorkoutEditor
      existingWorkout={existing}
      onSave={(workout) => { saveWorkout(workout); router.push('/workouts') }}
      onCancel={() => router.back()}
    />
  )
}
