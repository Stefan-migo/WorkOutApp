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

// --- Inline self-check (call from dev console) ---
// ponytail: no test framework — assert-based demo covers main paths
export function runEngineTests(): string[] {
  const results: string[] = []
  const ok = (name: string) => results.push(`✓ ${name}`)
  const fail = (name: string, msg: string) => results.push(`✗ ${name}: ${msg}`)
  const assert = (cond: unknown, name: string, msg: string) =>
    cond ? ok(name) : fail(name, msg)

  const baseSeq: Sequence = {
    id: 'seq-1',
    title: 'Test',
    workoutIds: ['a', 'b', 'c'],
    repeatCount: 2,
    createdAt: 0,
    updatedAt: 0,
  }

  // SE-1
  assert(getTotalRounds(baseSeq) === 6, '3×2 = 6', '')
  assert(getTotalRounds({ ...baseSeq, workoutIds: ['a'], repeatCount: 1 }) === 1, '1×1 = 1', '')

  // SE-2
  const r0 = getRoundAt(baseSeq, 0)
  assert(r0?.workoutId === 'a' && r0?.round === 1, 'idx 0 → a r1', '')
  const r2 = getRoundAt(baseSeq, 2)
  assert(r2?.workoutId === 'c' && r2?.round === 1, 'idx 2 → c r1', '')
  const r3 = getRoundAt(baseSeq, 3)
  assert(r3?.workoutId === 'a' && r3?.round === 2, 'idx 3 → a r2', '')
  assert(getRoundAt(baseSeq, -1) === undefined, 'idx -1 → null', '')
  assert(getRoundAt(baseSeq, 6) === undefined, 'idx 6 → null', '')

  // SE-5
  assert(getProgress(baseSeq, 3).current === 3, 'prog current', '')
  assert(getProgress(baseSeq, 3).total === 6, 'prog total', '')
  assert(getProgress(baseSeq, 3).percent === 50, 'prog 50%', '')
  assert(getProgress(baseSeq, 0).percent === 0, 'prog 0%', '')
  assert(getProgress(baseSeq, 6).percent === 100, 'prog 100% done', '')
  assert(getProgress(baseSeq, 99).percent === 100, 'prog capped', '')

  // resolveWorkouts
  const workouts: Workout[] = [
    { id: 'a', title: 'A', intervals: [], createdAt: 0, updatedAt: 0 },
    { id: 'b', title: 'B', intervals: [], createdAt: 0, updatedAt: 0 },
  ]
  const resolved = resolveWorkouts({ ...baseSeq, workoutIds: ['a', 'b', 'missing'] }, workouts)
  assert(resolved.length === 2, 'resolveWorkouts filters missing', `expected 2 got ${resolved.length}`)
  assert(resolved[0]!.id === 'a', 'resolve order a', '')
  assert(resolved[1]!.id === 'b', 'resolve order b', '')

  return results
}

// Auto-run when called directly: npx tsx src/lib/sequence-engine.ts
if (typeof process !== 'undefined' && process.argv?.[1]?.includes('sequence-engine')) {
  console.log(runEngineTests().join('\n'))
}
