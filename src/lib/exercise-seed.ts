import type { Exercise, ExerciseCategory } from '@/types/workout'

// ponytail: static seed list, move to external JSON if i18n or >50 exercises are needed
export const EXERCISE_SEEDS: Exercise[] = [
  // Strength — Chest
  { id: 'bench-press', name: 'Bench Press', description: 'Barbell chest press on flat bench. Targets chest, shoulders, and triceps.', muscleGroups: ['Chest', 'Shoulders', 'Triceps'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'dumbbell-flyes', name: 'Dumbbell Flyes', description: 'Isolation chest movement on flat or incline bench.', muscleGroups: ['Chest'], category: 'strength', createdAt: 0, updatedAt: 0 },

  // Strength — Back
  { id: 'deadlift', name: 'Deadlift', description: 'Full-body compound pull from the floor. Targets posterior chain.', muscleGroups: ['Back', 'Hamstrings', 'Glutes', 'Core'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'pull-ups', name: 'Pull-ups', description: 'Vertical pull using an overhand grip on a bar.', muscleGroups: ['Back', 'Biceps'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'barbell-row', name: 'Barbell Row', description: 'Bent-over barbell row targeting the mid-back.', muscleGroups: ['Back', 'Biceps'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', description: 'Machine-based vertical pull targeting the lats.', muscleGroups: ['Back', 'Biceps'], category: 'strength', createdAt: 0, updatedAt: 0 },

  // Strength — Shoulders
  { id: 'overhead-press', name: 'Overhead Press', description: 'Barbell or dumbbell press from shoulders to overhead.', muscleGroups: ['Shoulders', 'Triceps'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'lateral-raises', name: 'Lateral Raises', description: 'Dumbbell lateral raise targeting the medial deltoid.', muscleGroups: ['Shoulders'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'face-pull', name: 'Face Pull', description: 'Cable face pull for rear delts and external rotation.', muscleGroups: ['Shoulders', 'Upper Back'], category: 'strength', createdAt: 0, updatedAt: 0 },

  // Strength — Arms
  { id: 'bicep-curl', name: 'Bicep Curl', description: 'Dumbbell or barbell curl for biceps.', muscleGroups: ['Biceps'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'tricep-extension', name: 'Tricep Extension', description: 'Overhead or cable tricep extension.', muscleGroups: ['Triceps'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'dips', name: 'Dips', description: 'Bodyweight or weighted dips on parallel bars.', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], category: 'strength', createdAt: 0, updatedAt: 0 },

  // Strength — Legs
  { id: 'squat', name: 'Squat', description: 'Barbell back squat targeting quads, hamstrings, and glutes.', muscleGroups: ['Quads', 'Hamstrings', 'Glutes', 'Core'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', description: 'Hip-hinge movement targeting hamstrings and glutes.', muscleGroups: ['Hamstrings', 'Glutes'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'lunges', name: 'Lunges', description: 'Forward or reverse lunges with dumbbells or barbell.', muscleGroups: ['Quads', 'Hamstrings', 'Glutes'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'hip-thrust', name: 'Hip Thrust', description: 'Barbell hip thrust on bench for glute activation.', muscleGroups: ['Glutes', 'Hamstrings'], category: 'strength', createdAt: 0, updatedAt: 0 },

  // Core
  { id: 'plank', name: 'Plank', description: 'Core stability hold on forearms and toes.', muscleGroups: ['Core'], category: 'strength', createdAt: 0, updatedAt: 0 },
  { id: 'crunches', name: 'Crunches', description: 'Classic floor crunch for the rectus abdominis.', muscleGroups: ['Core'], category: 'strength', createdAt: 0, updatedAt: 0 },

  // Cardio
  { id: 'jumping-jacks', name: 'Jumping Jacks', description: 'Full-body cardio — jump while spreading arms and legs.', muscleGroups: ['Full Body'], category: 'cardio', createdAt: 0, updatedAt: 0 },
  { id: 'burpees', name: 'Burpees', description: 'Full-body explosive movement: squat, plank, push-up, jump.', muscleGroups: ['Full Body'], category: 'cardio', createdAt: 0, updatedAt: 0 },
]
