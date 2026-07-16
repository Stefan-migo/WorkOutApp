import type { Exercise } from '@/types/workout'

export function createMockExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: 'ex-1',
    name: 'Push Up',
    category: 'strength',
    primaryMuscles: ['chest', 'triceps', 'shoulders'],
    secondaryMuscles: ['core'],
    equipment: ['body weight'],
    instructions: ['Start in plank position', 'Lower your body', 'Push back up'],
    force: 'push',
    mechanic: 'compound',
    difficulty: 'beginner',
    images: ['https://example.com/pushup.jpg'],
    source: 'free-exercise-db',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

export const mockExerciseWithNoImages = createMockExercise({
  id: 'ex-2',
  name: 'Squat',
  images: [],
  source: 'user',
})
