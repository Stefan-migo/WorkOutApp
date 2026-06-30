'use client'
import { useRouter } from 'next/navigation'
import { useWorkoutContext } from '@/context/WorkoutContext'
import WorkoutEditor from '@/components/WorkoutEditor'

export default function NewWorkoutPage() {
  const { saveWorkout } = useWorkoutContext()
  const router = useRouter()
  return (
    <WorkoutEditor
      onSave={(workout) => { saveWorkout(workout); router.push('/workouts') }}
    />
  )
}
