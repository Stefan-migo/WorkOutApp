import type { Exercise, Interval, Workout } from '@/types/workout'

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

// Remote placeholder for visual review; jsdom never fetches CSS backgrounds.
// Animated GIF — proves the full-bleed background plays GIFs natively.
export const MOCK_EXERCISE_IMAGE =
  'https://movilidad-stefan-millantu.bopbee.app/files/mov01.gif?v=1'

const TS = 1700000000000

// EL-1 shared mock exercises for the ExerciseLibrary block stories.
export const MOCK_EXERCISES: Exercise[] = [
  {
    id: 'ex1',
    name: 'Bench Press',
    category: 'strength',
    description: 'Classic compound chest press',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['shoulders'],
    equipment: ['barbell', 'bench'],
    instructions: ['Lie on bench', 'Press the bar'],
    force: 'push',
    mechanic: 'compound',
    difficulty: 'intermediate',
    images: [MOCK_EXERCISE_IMAGE],
    source: 'free-exercise-db',
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'ex2',
    name: 'Kettlebell Swing',
    category: 'strength',
    description: 'Hip-hinge power swing',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['lower back', 'shoulders'],
    equipment: ['kettlebell'],
    instructions: ['Hinge at hips', 'Swing the bell'],
    force: 'pull',
    mechanic: 'compound',
    difficulty: 'intermediate',
    images: [MOCK_EXERCISE_IMAGE],
    source: 'free-exercise-db',
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'ex3',
    name: 'Dumbbell Curl',
    category: 'strength',
    description: 'Isolation biceps curl',
    primaryMuscles: ['biceps'],
    equipment: ['dumbbell'],
    force: 'pull',
    mechanic: 'isolation',
    difficulty: 'beginner',
    source: 'user',
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'ex4',
    name: 'Treadmill Run',
    category: 'cardio',
    description: 'Steady-state running',
    primaryMuscles: ['quadriceps', 'hamstrings'],
    equipment: ['treadmill'],
    force: 'push',
    mechanic: 'compound',
    difficulty: 'beginner',
    source: 'user',
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'ex5',
    name: 'Jump Rope',
    category: 'cardio',
    description: 'Fast-paced jump intervals',
    primaryMuscles: ['calves', 'shoulders'],
    equipment: ['rope'],
    mechanic: 'compound',
    difficulty: 'intermediate',
    images: [MOCK_EXERCISE_IMAGE],
    source: 'free-exercise-db',
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'ex6',
    name: 'Standing Hamstring Stretch',
    category: 'stretching',
    description: 'Static hamstring stretch',
    primaryMuscles: ['hamstrings'],
    difficulty: 'beginner',
    source: 'user',
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'ex7',
    name: 'Hip Mobility Flow',
    category: 'mobility',
    description: 'Open up the hips',
    primaryMuscles: ['hips', 'glutes'],
    equipment: ['mat'],
    difficulty: 'beginner',
    source: 'user',
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'ex8',
    name: 'Deadlift',
    category: 'strength',
    description: 'Full-body hinge pull',
    primaryMuscles: ['glutes', 'hamstrings', 'lower back'],
    secondaryMuscles: ['traps', 'forearms'],
    equipment: ['barbell'],
    instructions: ['Set the back', 'Drive through the floor'],
    force: 'pull',
    mechanic: 'compound',
    difficulty: 'advanced',
    images: [MOCK_EXERCISE_IMAGE],
    source: 'free-exercise-db',
    createdAt: TS,
    updatedAt: TS,
  },
  {
    id: 'ex9',
    name: 'Walking Lunge',
    category: 'strength',
    description: 'Alternating forward lunge',
    primaryMuscles: ['quadriceps', 'glutes'],
    equipment: ['bodyweight'],
    force: 'push',
    mechanic: 'compound',
    difficulty: 'beginner',
    source: 'user',
    createdAt: TS,
    updatedAt: TS,
  },
]

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
