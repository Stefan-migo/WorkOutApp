'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { EXERCISE_SEEDS } from '@/lib/exercise-seed'
import type { Exercise } from '@/types/workout'

const STORAGE_KEY = 'workoutapp.exercises'

// ponytail: mirrors useWorkouts pattern, seed-on-empty via effect
export function useExercises() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEY, [])
  const seeded = useRef(false)

  // Auto-seed on first load if empty
  useEffect(() => {
    if (!seeded.current && exercises.length === 0) {
      setExercises(EXERCISE_SEEDS)
      seeded.current = true
    }
  }, [exercises, setExercises])

  const getExercise = useCallback(
    (id: string): Exercise | undefined => {
      return exercises.find((e) => e.id === id)
    },
    [exercises],
  )

  const saveExercise = useCallback(
    (exercise: Exercise) => {
      setExercises((prev) => {
        const idx = prev.findIndex((e) => e.id === exercise.id)
        const updated = { ...exercise, updatedAt: Date.now() }
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [...prev, updated]
      })
    },
    [setExercises],
  )

  const deleteExercise = useCallback(
    (id: string) => {
      setExercises((prev) => prev.filter((e) => e.id !== id))
    },
    [setExercises],
  )

  return { exercises, getExercise, saveExercise, deleteExercise }
}
