import type { Exercise } from '@/types/workout'

// ponytail: hardcoded exercise list, replace with DB/external source when >10 exercises
const exercises: Exercise[] = [
  {
    id: 'pushups',
    name: 'Push-ups',
    description: 'Classic chest, shoulders, and triceps exercise. Keep your body in a straight line.',
    muscleGroup: 'Chest',
  },
  {
    id: 'squats',
    name: 'Squats',
    description: 'Lower body compound movement targeting quads, hamstrings, and glutes.',
    muscleGroup: 'Legs',
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'Core stability exercise. Hold a straight body position on forearms and toes.',
    muscleGroup: 'Core',
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    description: 'Full body cardio move. Jump while spreading arms and legs, then return.',
    muscleGroup: 'Cardio',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    description: 'Dynamic core and cardio exercise. Drive knees toward chest in plank position.',
    muscleGroup: 'Core',
  },
]

export function getExercises(): Exercise[] {
  return exercises
}

export function getExercise(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id)
}
