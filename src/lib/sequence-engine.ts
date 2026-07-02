import type { Sequence, Workout } from '@/types/workout'

export function getTotalRounds(seq: Sequence): number {
  return seq.workoutIds.length * seq.repeatCount
}

export function getRoundAt(
  seq: Sequence,
  idx: number,
): { workoutId: string; round: number } | undefined {
  if (idx < 0 || idx >= getTotalRounds(seq)) return undefined
  const totalWorkouts = seq.workoutIds.length
  return {
    workoutId: seq.workoutIds[idx % totalWorkouts]!,
    round: Math.floor(idx / totalWorkouts) + 1,
  }
}

export function getProgress(
  seq: Sequence,
  idx: number,
): { current: number; total: number; percent: number } {
  const total = getTotalRounds(seq)
  const current = Math.min(idx, total)
  const percent = total > 0 ? Math.round((current / total) * 100) : 100
  return { current, total, percent }
}

// ponytail: missing IDs silently dropped — add warning when UI needs it
export function resolveWorkouts(seq: Sequence, workouts: Workout[]): Workout[] {
  return seq.workoutIds
    .map((id) => workouts.find((w) => w.id === id))
    .filter((w): w is Workout => w !== undefined)
}

// ponytail: inline self-tests removed in 2026-07 — covered by Vitest in src/lib/__tests__/
