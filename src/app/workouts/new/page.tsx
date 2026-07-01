'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useExercises } from '@/hooks/useExercises'
import WorkoutEditor, { buildExerciseInterval } from '@/components/WorkoutEditor'

export default function NewWorkoutPage() {
  const { saveWorkout } = useWorkoutContext()
  const { getExercise } = useExercises()
  const router = useRouter()
  const searchParams = useSearchParams()
  const exerciseId = searchParams.get('exerciseId')

  const exercise = exerciseId ? getExercise(exerciseId) : undefined
  const initialIntervals = exercise ? [buildExerciseInterval(exercise)] : undefined

  return (
    <WorkoutEditor
      initialIntervals={initialIntervals}
      onSave={(workout) => { saveWorkout(workout); router.push('/workouts') }}
    />
  )
}
