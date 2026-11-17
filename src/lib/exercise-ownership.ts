import type { Exercise } from '@/types/workout'

export function isSharedExercise(exercise: Exercise) {
  return exercise.isShared ?? (exercise.source === 'free-exercise-db' || exercise.source === 'system')
}

export function canManageExercise(exercise: Exercise) {
  return exercise.isOwned ?? !isSharedExercise(exercise)
}

export function snapshotExerciseDescription(exercise: Exercise) {
  if (exercise.visibility !== 'community') return undefined
  return [exercise.description, ...(exercise.instructions ?? [])].filter(Boolean).join('\n') || undefined
}
