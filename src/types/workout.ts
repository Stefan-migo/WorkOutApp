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

// Phase 4: Calendar & Programming
export interface DayAssignment {
  workoutId?: string
  sequenceId?: string
  notes?: string
}

export interface WeekPlan {
  id: string
  title?: string
  startDate: string // ISO YYYY-MM-DD of the Monday
  days: [DayAssignment | null, DayAssignment | null, DayAssignment | null,
         DayAssignment | null, DayAssignment | null, DayAssignment | null,
         DayAssignment | null]
  createdAt: number
  updatedAt: number
}

export interface ProgramTemplate {
  id: string
  title: string
  description?: string
  days: (DayAssignment | null)[] // length 7
  createdAt: number
  updatedAt: number
}
