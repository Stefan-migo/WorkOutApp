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

export interface Sequence {
  id: string
  title: string
  description?: string
  workoutIds: string[]
  repeatCount: number
  createdAt: number
  updatedAt: number
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

export interface CompletedInterval {
  intervalId: string
  title: string
  type: IntervalType
  plannedDuration: number
  actualDuration: number
  completed: boolean
}

export interface Session {
  id: string
  type: 'workout' | 'sequence'
  sequenceId?: string
  workoutId?: string
  startedAt: number
  completedAt?: number
  intervals: CompletedInterval[]
}

export interface ProgramTemplate {
  id: string
  title: string
  description?: string
  days: (DayAssignment | null)[] // length 7
  createdAt: number
  updatedAt: number
}
