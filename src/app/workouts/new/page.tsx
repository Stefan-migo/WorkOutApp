'use client'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutContext } from '@/context/WorkoutContext'
import WorkoutBuilder from '@/components/WorkoutBuilder'

function NewWorkoutInner() {
  const { saveWorkout } = useWorkoutContext()
  const router = useRouter()

  function handleBuilderSave(intervals: import('@/types/workout').Interval[], title: string) {
    const id = crypto.randomUUID()
    const workout: import('@/types/workout').Workout = {
      id,
      title: title.trim() || 'Untitled',
      intervals,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveWorkout(workout)
    // Navigate to Screen 2 (detail editor) after building
    router.push(`/workouts/${id}/edit`)
  }

  return <WorkoutBuilder onSave={handleBuilderSave} onCancel={() => router.push('/workouts')} />
}

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={<div className="p-24 text-center text-on-surface-variant">Loading...</div>}>
      <NewWorkoutInner />
    </Suspense>
  )
}
