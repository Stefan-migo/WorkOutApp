import type { Interval, Workout, WorkoutMode } from '@/types/workout'

// ponytail: cascade: interval.mode ?? workout.mode ?? 'timed'
export function getEffectiveMode(workout: Workout, interval: { mode?: WorkoutMode }): WorkoutMode {
  return interval.mode ?? workout.mode ?? 'timed'
}

// ponytail: identity passthrough — flatten is a no-op in the flat model
export function flattenWorkout(workout: Workout): Interval[] {
  return workout.intervals
}

// ponytail: direct sum over flat array; binary search if workouts exceed 500 intervals
export function totalDuration(workout: Workout): number {
  return workout.intervals.reduce((sum, i) => sum + i.duration, 0)
}

// ponytail: linear scan over flat array; binary search if workouts exceed 500 intervals
export function durationAt(
  workout: Workout,
  elapsed: number,
): { interval: Interval; localElapsed: number } | undefined {
  let accumulated = 0
  for (const interval of workout.intervals) {
    if (elapsed < accumulated + interval.duration) {
      return { interval, localElapsed: elapsed - accumulated }
    }
    accumulated += interval.duration
  }
  return undefined
}
