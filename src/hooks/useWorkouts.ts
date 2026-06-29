'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { Workout } from '@/types/workout'

const STORAGE_KEY = 'workoutapp.workouts'

export function useWorkouts() {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEY, [])

  const getWorkout = useCallback(
    (id: string): Workout | undefined => {
      return workouts.find((w) => w.id === id)
    },
    [workouts],
  )

  const saveWorkout = useCallback(
    (workout: Workout) => {
      setWorkouts((prev) => {
        const idx = prev.findIndex((w) => w.id === workout.id)
        const updated = { ...workout, updatedAt: Date.now() }
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [...prev, updated]
      })
    },
    [setWorkouts],
  )

  const deleteWorkout = useCallback(
    (id: string) => {
      setWorkouts((prev) => prev.filter((w) => w.id !== id))
    },
    [setWorkouts],
  )

  return { workouts, getWorkout, saveWorkout, deleteWorkout }
}
