export type IntervalType = 'prepare' | 'work' | 'rest' | 'cooldown'

export interface Interval {
  id: string
  type: IntervalType
  title: string
  duration: number // seconds
  description?: string
  exerciseId?: string // only for type='work'
  // Phase 1: nesting
  children?: Interval[]
  cycleCount?: number       // repeats children this many times
  setCount?: number         // repeats entire block this many times
  restBetweenCycles?: number // rest seconds inserted between cycles
  isGenerated?: true        // synthetic rest from engine expansion
}

export interface Workout {
  id: string
  title: string
  description?: string
  intervals: Interval[]
  createdAt: number
  updatedAt: number
}

export interface Exercise {
  id: string
  name: string
  description: string
  muscleGroup: string
  imageUrl?: string
}
