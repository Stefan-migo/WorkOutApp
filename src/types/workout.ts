export type IntervalType = 'prepare' | 'work' | 'rest' | 'rest_between_cycles' | 'cooldown'

export interface Interval {
  id: string
  type: IntervalType
  title: string
  duration: number // seconds
  description?: string
  imageUrl?: string // external URL only
  exerciseId?: string // only for type='work'
  cycleIndex?: number // position within a cycle (0-based)
  cycleId?: string    // identifies which CycleTemplate this came from; all intervals from the same expanded cycle share the same id
  cycleTitle?: string // custom name the user gave the cycle, e.g. "Superset A"
}

export interface Workout {
  id: string
  title: string
  description?: string
  imageUrl?: string
  intervals: Interval[]
  createdAt: number
  updatedAt: number
}

export type ExerciseCategory = 'strength' | 'cardio' | 'stretching' | 'mobility' | 'plyometrics' | 'strongman' | 'powerlifting' | 'other'

export interface Exercise {
  id: string
  name: string
  description?: string
  // deprecated — use primaryMuscles + secondaryMuscles
  muscleGroups?: string[]
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  equipment?: string[]
  instructions?: string[]
  force?: 'push' | 'pull' | 'static'
  mechanic?: 'compound' | 'isolation'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  images?: string[]
  source?: 'user' | 'free-exercise-db'
  category: ExerciseCategory
  createdAt: number
  updatedAt: number
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
  notes?: string
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

/**
 * @internal Transient creation-time helper. NOT persisted to localStorage.
 * Used in Workout Builder to define a repeated block before expanding to flat intervals on save.
 */
export interface CycleTemplate {
  id: string
  title: string
  description?: string
  repeat: number
  workDuration: number
  restDuration: number
  skipLastRest: boolean
}
