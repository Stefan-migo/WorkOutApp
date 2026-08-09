import type { Interval, Workout } from '@/types/workout'

// WB-5 shared mock data for block stories. No colors (token audit rule 3 safe).

export const MOCK_TIMED_INTERVALS: Interval[] = [
  { id: 't1', type: 'prepare', title: 'Prepare', duration: 180 },
  { id: 't2', type: 'work', title: 'Work', duration: 30 },
  { id: 't3', type: 'rest', title: 'Rest', duration: 30 },
  { id: 't4', type: 'cooldown', title: 'Cooldown', duration: 120 },
]

export const MOCK_REPS_INTERVALS: Interval[] = [
  { id: 'r1', type: 'work', title: 'Work', duration: 30, reps: 10, weight: 60, exerciseId: 'ex1' },
]

const TS = 1700000000000

export const MOCK_WORKOUTS: Workout[] = [
  {
    id: 'w1',
    title: 'Morning HIIT',
    mode: 'timed',
    intervals: MOCK_TIMED_INTERVALS,
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'w2',
    title: 'Strength Circuit',
    mode: 'reps',
    intervals: MOCK_REPS_INTERVALS,
    createdAt: TS,
    updatedAt: TS,
  },
]
