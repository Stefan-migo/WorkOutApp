import type { Exercise, ExerciseCategory } from '@/types/workout'

// ponytail: pin to a release tag when free-exercise-db publishes one
export const FREE_EXERCISE_DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'

export const FREE_EXERCISE_DB_IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

// The raw JSON shape from free-exercise-db
export interface RawExercise {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[] | null
}

const CATEGORY_MAP: Record<string, ExerciseCategory> = {
  strength: 'strength',
  cardio: 'cardio',
  stretching: 'stretching',
  plyometrics: 'plyometrics',
  strongman: 'strongman',
  powerlifting: 'powerlifting',
}

function mapCategory(raw: string): ExerciseCategory {
  return CATEGORY_MAP[raw] ?? 'other'
}

const LEVEL_MAP: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  expert: 'advanced',
}

function mapLevel(level: string): 'beginner' | 'intermediate' | 'advanced' {
  return LEVEL_MAP[level] ?? 'beginner'
}

function mapEquipment(eq: string | null): string[] {
  if (!eq) return []
  return eq.split(',').map((s) => s.trim()).filter(Boolean)
}

function mapImages(images: string[] | null): string[] {
  if (!images) return []
  return images.map((img) => `${FREE_EXERCISE_DB_IMAGE_BASE}${img}`)
}

export function mapFreeExerciseDbEntry(raw: RawExercise): Exercise {
  const now = Date.now()
  return {
    id: raw.id,
    name: raw.name,
    description: undefined,
    category: mapCategory(raw.category),
    primaryMuscles: raw.primaryMuscles ?? [],
    secondaryMuscles: raw.secondaryMuscles ?? [],
    equipment: mapEquipment(raw.equipment),
    instructions: raw.instructions ?? [],
    difficulty: mapLevel(raw.level),
    force: (raw.force as Exercise['force']) ?? undefined,
    mechanic: (raw.mechanic as Exercise['mechanic']) ?? undefined,
    images: mapImages(raw.images),
    source: 'free-exercise-db',
    createdAt: now,
    updatedAt: now,
  }
}

export async function fetchAndSeedExercises(): Promise<Exercise[]> {
  try {
    const res = await fetch(FREE_EXERCISE_DB_URL)
    if (!res.ok) {
      console.warn(`[free-exercise-db] fetch failed: ${res.status} ${res.statusText}`)
      return []
    }
    const data: RawExercise[] = await res.json()
    return data.map(mapFreeExerciseDbEntry)
  } catch (err) {
    console.warn('[free-exercise-db] fetch error:', err)
    return []
  }
}
