import { describe, it, expect } from 'vitest'
import { computePRs, hasStrength } from '../pr-engine'
import type { CompletedInterval, Session } from '@/types/workout'

function interval(overrides: Partial<CompletedInterval> & { title: string }): CompletedInterval {
  return {
    intervalId: 'i-' + overrides.title,
    type: 'work',
    plannedDuration: 0,
    actualDuration: 0,
    completed: true,
    ...overrides,
  }
}

function session(intervals: CompletedInterval[]): Session {
  return {
    id: 's-' + Math.random().toString(36).slice(2, 8),
    type: 'workout',
    startedAt: Date.now(),
    intervals,
  }
}

describe('computePRs', () => {
  it('returns [] for empty sessions', () => {
    expect(computePRs([])).toEqual([])
  })

  it('returns [] when no session has rep/weight/cardio data', () => {
    const s = session([
      interval({ title: 'Sprints', actualDuration: 300 }),
      interval({ title: 'Squat' }),
    ])
    expect(computePRs([s])).toEqual([])
  })

  it('groups by exerciseId even when titles differ', () => {
    const s = session([
      interval({ title: 'Bench Press', exerciseId: 'ex1', weight: 80, actualReps: 10 }),
      interval({ title: 'Bench Press (wide grip)', exerciseId: 'ex1', weight: 100, actualReps: 5 }),
    ])
    const prs = computePRs([s])
    expect(prs).toHaveLength(1)
    const pr = prs[0]!
    expect(pr.exercise).toBe('Bench Press')
    expect(pr.bestWeight).toBe(100)
    expect(pr.bestReps).toBe(10)
  })

  it('groups by normalized title when exerciseId is missing', () => {
    const s = session([
      interval({ title: '  Squat ' }),
      interval({ title: 'squat' }),
    ])
    // no metrics on either — group is dropped
    expect(computePRs([s])).toEqual([])

    const s2 = session([
      interval({ title: '  Squat ', weight: 50, actualReps: 8 }),
      interval({ title: 'squat', weight: 60, actualReps: 8 }),
    ])
    const prs = computePRs([s2])
    expect(prs).toHaveLength(1)
    const pr = prs[0]!
    expect(pr.exercise).toBe('  Squat ')
    expect(pr.bestWeight).toBe(60)
  })

  it('keeps separate records when same title maps to different exerciseIds', () => {
    const s = session([
      interval({ title: 'Press', exerciseId: 'exA', weight: 40, actualReps: 10 }),
      interval({ title: 'Press', exerciseId: 'exB', weight: 50, actualReps: 8 }),
    ])
    const prs = computePRs([s])
    expect(prs).toHaveLength(2)
  })

  it('only counts completed work intervals', () => {
    const s = session([
      interval({ title: 'Bench', weight: 80, actualReps: 10 }),
      interval({ title: 'Skipped Bench', weight: 200, actualReps: 50, completed: false }),
      interval({ title: 'Rest', type: 'rest', actualDuration: 60 }),
      interval({ title: 'Cooldown', type: 'cooldown', weight: 300, actualReps: 100 }),
    ])
    const prs = computePRs([s])
    expect(prs).toHaveLength(1)
    const pr = prs[0]!
    expect(pr.exercise).toBe('Bench')
    expect(pr.bestWeight).toBe(80)
  })

  it('computes bestWeight, bestReps and bestE1RM (Epley) per exercise', () => {
    const s = session([
      interval({ title: 'Deadlift', weight: 60, actualReps: 5 }),
      interval({ title: 'Deadlift', weight: 80, actualReps: 12 }),
    ])
    const pr = computePRs([s])[0]!
    expect(pr.bestWeight).toBe(80)
    expect(pr.bestReps).toBe(12)
    expect(pr.bestE1RM).toBeCloseTo(80 * (1 + 12 / 30), 5)
  })

  it('ignores zero/absent weight and reps', () => {
    const s = session([
      interval({ title: 'Bench', weight: 0, actualReps: 0 }),
      interval({ title: 'Bench', weight: undefined, actualReps: undefined }),
    ])
    expect(computePRs([s])).toEqual([])
  })

  it('tracks best cardio duration by title heuristic (run/treadmill/bike/row)', () => {
    const s = session([
      interval({ title: 'Treadmill Run', actualDuration: 1800 }),
      interval({ title: 'Treadmill Run', actualDuration: 1500 }),
      interval({ title: 'Row 500m', actualDuration: 120 }),
      interval({ title: 'Sprints', actualDuration: 300 }), // not matched
    ])
    const prs = computePRs([s])
    const treadmill = prs.find((p) => p.exercise === 'Treadmill Run')
    expect(treadmill?.bestCardioSeconds).toBe(1800)
    expect(prs.find((p) => p.exercise === 'Row 500m')?.bestCardioSeconds).toBe(120)
    expect(prs.find((p) => p.exercise === 'Sprints')).toBeUndefined()
  })

  it('sorts strength records before cardio, alphabetical within groups', () => {
    const s = session([
      interval({ title: 'Bike Intervals', actualDuration: 600 }),
      interval({ title: 'Squat', weight: 100, actualReps: 8 }),
      interval({ title: 'Bench', weight: 80, actualReps: 10 }),
      interval({ title: 'Row', actualDuration: 300 }),
    ])
    const names = computePRs([s]).map((p) => p.exercise)
    expect(names).toEqual(['Bench', 'Squat', 'Bike Intervals', 'Row'])
  })

  it('hasStrength is false for cardio-only records', () => {
    const s = session([interval({ title: 'Row', actualDuration: 300 })])
    const pr = computePRs([s])[0]!
    expect(hasStrength(pr)).toBe(false)
  })
})
