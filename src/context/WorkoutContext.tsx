'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useWorkouts } from '@/hooks/useWorkouts'
import type { Workout } from '@/types/workout'

interface WorkoutContextValue {
  workouts: Workout[]
  getWorkout: (id: string) => Promise<Workout | undefined>
  saveWorkout: (workout: Workout) => Promise<void>
  deleteWorkout: (id: string) => Promise<void>
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null)

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { workouts, getWorkout, saveWorkout, deleteWorkout } = useWorkouts()

  return (
    <WorkoutContext.Provider value={{ workouts, getWorkout, saveWorkout, deleteWorkout }}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkoutContext(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext)
  if (!ctx) {
    throw new Error('useWorkoutContext must be used within a WorkoutProvider')
  }
  return ctx
}
