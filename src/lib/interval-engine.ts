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

// --- Inline self-check (call from dev console) ---
// ponytail: no test framework — assert-based demo covers the main paths
export function runEngineTests(): string[] {
  const results: string[] = []
  const ok = (name: string) => results.push(`✓ ${name}`)
  const fail = (name: string, msg: string) => results.push(`✗ ${name}: ${msg}`)
  const assert = (cond: unknown, name: string, msg: string) =>
    cond ? ok(name) : fail(name, msg)

  const baseWorkout: Workout = {
    id: 'test',
    title: 'Test',
    intervals: [],
    createdAt: 0,
    updatedAt: 0,
  }

  // IE-5: Empty input
  assert(
    flattenWorkout({ ...baseWorkout, intervals: [] }).length === 0,
    'empty → []',
    'expected 0 got ' + flattenWorkout({ ...baseWorkout, intervals: [] }).length,
  )
  assert(
    totalDuration({ ...baseWorkout, intervals: [] }) === 0,
    'empty totalDuration → 0',
    '',
  )
  assert(
    durationAt({ ...baseWorkout, intervals: [] }, 5) === undefined,
    'empty durationAt → undefined',
    '',
  )

  // Flat passthrough
  const flat = [
    { id: 'a', type: 'work' as const, title: 'A', duration: 10 },
    { id: 'b', type: 'rest' as const, title: 'B', duration: 20 },
    { id: 'c', type: 'work' as const, title: 'C', duration: 15 },
  ]
  const flatWorkout = { ...baseWorkout, intervals: flat }
  const flatResult = flattenWorkout(flatWorkout)
  assert(
    flatResult.length === 3,
    'flat → 3 intervals',
    'expected 3 got ' + flatResult.length,
  )
  assert(
    flatResult[0].depth === 0 && flatResult[1].depth === 0 && flatResult[2].depth === 0,
    'flat → all depth 0',
    '',
  )
  assert(
    flatResult.every((f) => f.cycleIndex === undefined && f.setIndex === undefined),
    'flat → no cycle/set indices',
    '',
  )
  assert(totalDuration(flatWorkout) === 45, 'flat totalDuration → 45', '')

  // durationAt scenarios
  const daResult = durationAt(flatWorkout, 25)
  assert(daResult !== undefined, 'durationAt(25) → found', '')
  assert(daResult!.interval.id === 'b', 'durationAt(25) → interval b', '')
  assert(daResult!.localElapsed === 15, 'durationAt(25) → localElapsed 15', '')

  const daBeyond = durationAt(flatWorkout, 100)
  assert(daBeyond === undefined, 'durationAt(100) → undefined', '')

  // Cycle expansion: 2 children × 2 cycles = 4 (setCount=1)
  const cycleParent = {
    id: 'p1',
    type: 'work' as const,
    title: 'Cycle',
    duration: 0,
    children: [
      { id: 'c1', type: 'work' as const, title: 'Child1', duration: 10 },
      { id: 'c2', type: 'rest' as const, title: 'Child2', duration: 5 },
    ],
    cycleCount: 2,
    setCount: 1,
  }
  const cycleResult = flattenWorkout({ ...baseWorkout, intervals: [cycleParent] })
  assert(cycleResult.length === 4, 'cycle 2×2 → 4', `expected 4 got ${cycleResult.length}`)
  assert(
    cycleResult.every((f) => f.depth === 1),
    'cycle → all depth 1',
    '',
  )
  assert(
    cycleResult[0].cycleIndex === 1 && cycleResult[0].setIndex === 1,
    'cycle → first has cycleIndex=1 setIndex=1',
    '',
  )
  assert(
    cycleResult[2].cycleIndex === 2,
    'cycle → third has cycleIndex=2',
    '',
  )

  // Set + cycle expansion: 2 children × 2 cycles × 2 sets = 8
  const setParent = { ...cycleParent, setCount: 2 }
  const setResult = flattenWorkout({ ...baseWorkout, intervals: [setParent] })
  assert(setResult.length === 8, 'set+cycle 2×2×2 → 8', `expected 8 got ${setResult.length}`)
  assert(
    setResult[4].setIndex === 2,
    'set → 5th interval has setIndex=2',
    '',
  )
  assert(
    setResult[4].cycleIndex === 1,
    'set → 5th interval has cycleIndex=1',
    '',
  )

  // Rest insertion
  const restParent = {
    id: 'p2',
    type: 'work' as const,
    title: 'RestCycle',
    duration: 0,
    children: [{ id: 'x', type: 'work' as const, title: 'X', duration: 30 }],
    cycleCount: 2,
    setCount: 1,
    restBetweenCycles: 10,
  }
  const restResult = flattenWorkout({ ...baseWorkout, intervals: [restParent] })
  assert(restResult.length === 3, 'rest 1 child × 2 cycles + rest → 3', `expected 3 got ${restResult.length}`)
  assert(restResult[1].isGenerated === true, 'rest → middle is generated', '')
  assert(restResult[1].duration === 10, 'rest → duration 10', '')
  assert(restResult[1].type === 'rest', 'rest → type is rest', '')
  assert(
    restResult[2].duration === 30,
    'rest → last child unchanged',
    `expected 30 got ${restResult[2].duration}`,
  )

  // Nested DFS
  const nested = {
    id: 'g',
    type: 'work' as const,
    title: 'Group',
    duration: 0,
    children: [
      {
        id: 'sub',
        type: 'work' as const,
        title: 'Sub',
        duration: 0,
        children: [
          { id: 'leaf1', type: 'work' as const, title: 'Leaf1', duration: 5 },
          { id: 'leaf2', type: 'work' as const, title: 'Leaf2', duration: 5 },
        ],
        cycleCount: 1,
        setCount: 1,
      },
    ],
    cycleCount: 1,
    setCount: 1,
  }
  const nestedResult = flattenWorkout({ ...baseWorkout, intervals: [nested] })
  assert(nestedResult.length === 2, 'nested → 2 leaves', `expected 2 got ${nestedResult.length}`)
  assert(
    nestedResult[0].depth === 2,
    'nested → leaf depth 2',
    `expected 2 got ${nestedResult[0].depth}`,
  )

  // Mix: flat + cycle in same workout
  const mixed = {
    ...baseWorkout,
    intervals: [flat[0], cycleParent as Interval],
  }
  const mixedResult = flattenWorkout(mixed)
  assert(mixedResult.length === 5, 'mixed → 1 flat + 4 cycle = 5', `expected 5 got ${mixedResult.length}`)
  assert(mixedResult[0].id === 'a', 'mixed → first is flat leaf A', '')
  assert(mixedResult[0].depth === 0, 'mixed → flat leaf depth 0', '')
  assert(mixedResult[2].depth === 1, 'mixed → cycle child depth 1', '')

  return results
}

// Auto-run in dev when imported directly (e.g. `npx tsx src/lib/interval-engine.ts`)
if (typeof process !== 'undefined' && process.argv?.[1]?.includes('interval-engine')) {
  console.log(runEngineTests().join('\n'))
}
