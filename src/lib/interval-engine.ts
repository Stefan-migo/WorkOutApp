import type { Interval, Workout } from '@/types/workout'

export interface FlattenedInterval extends Interval {
  cycleIndex?: number // 1-based
  setIndex?: number // 1-based
  depth: number // 0 = top-level, 1 = inside a cycle, etc.
}

export interface DurationAtResult {
  interval: FlattenedInterval
  localElapsed: number
}

function flattenInterval(
  interval: Interval,
  depth: number,
  cycleIndex?: number,
  setIndex?: number,
  parentCycleCount?: number,
  parentSetCount?: number,
): FlattenedInterval[] {
  // Leaf: emit as-is
  if (!interval.children?.length) {
    return [{
      ...interval,
      depth,
      cycleIndex,
      setIndex,
      cycleCount: parentCycleCount ?? interval.cycleCount,
      setCount: parentSetCount ?? interval.setCount,
    }]
  }

  const cycleCount = interval.cycleCount ?? 1
  const setCount = interval.setCount ?? 1
  const restBetween = interval.restBetweenCycles ?? 0
  const result: FlattenedInterval[] = []

  for (let s = 1; s <= setCount; s++) {
    for (let c = 1; c <= cycleCount; c++) {
      for (const child of interval.children) {
        result.push(...flattenInterval(child, depth + 1, c, s, cycleCount, setCount))
      }
      // Rest between cycles (not after last)
      if (c < cycleCount && restBetween > 0) {
        result.push({
          id: `${interval.id}-rest-s${s}-c${c}`,
          type: 'rest',
          title: 'Rest',
          duration: restBetween,
          isGenerated: true,
          depth: depth + 1,
          cycleIndex: c,
          setIndex: s,
          cycleCount,
          setCount,
        })
      }
    }
  }

  return result
}

// ponytail: DFS flatten re-allocates on each call; memoize in consumers if profiling shows perf issue
export function flattenWorkout(workout: Workout): FlattenedInterval[] {
  const result: FlattenedInterval[] = []
  for (const interval of workout.intervals) {
    result.push(...flattenInterval(interval, 0))
  }
  return result
}

// ponytail: reuses flattenWorkout — no separate recursive sum to avoid duplication
export function totalDuration(workout: Workout): number {
  return flattenWorkout(workout).reduce((sum, i) => sum + i.duration, 0)
}

// ponytail: linear scan over flattened array; binary search if workouts exceed 500 intervals
export function durationAt(
  workout: Workout,
  elapsed: number,
): DurationAtResult | undefined {
  const flat = flattenWorkout(workout)
  let accumulated = 0
  for (const interval of flat) {
    if (elapsed < accumulated + interval.duration) {
      return { interval, localElapsed: elapsed - accumulated }
    }
    accumulated += interval.duration
  }
  return undefined
}

// ponytail: inline self-tests removed in 2026-07 — covered by Vitest in src/lib/__tests__/
