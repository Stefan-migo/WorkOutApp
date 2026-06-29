export type IntervalType = 'prepare' | 'work' | 'rest' | 'cooldown'

export interface Interval {
  id: string
  type: IntervalType
  title: string
  duration: number // seconds
  description?: string
  exerciseId?: string // only for type='work'
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
