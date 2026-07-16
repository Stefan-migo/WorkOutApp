import { describe, it, expect } from 'vitest'
import { mapFreeExerciseDbEntry } from '@/lib/free-exercise-db-mapper'
import type { Exercise } from '@/types/workout'

function makeRaw(overrides: Record<string, unknown> = {}) {
  return {
    id: 'Test_Exercise',
    name: 'Test Exercise',
    force: 'push',
    level: 'beginner',
    mechanic: 'compound',
    equipment: 'barbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    instructions: ['Step one', 'Step two'],
    category: 'strength',
    images: ['Test_Exercise/0.jpg', 'Test_Exercise/1.jpg'],
    ...overrides,
  }
}

describe('mapFreeExerciseDbEntry', () => {
  it('maps level "expert" to difficulty "advanced"', () => {
    const raw = makeRaw({ level: 'expert' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.difficulty).toBe('advanced')
  })

  it('maps level "beginner" directly', () => {
    const raw = makeRaw({ level: 'beginner' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.difficulty).toBe('beginner')
  })

  it('splits comma-separated equipment into string array', () => {
    const raw = makeRaw({ equipment: 'barbell, dumbbell' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.equipment).toEqual(['barbell', 'dumbbell'])
  })

  it('handles single equipment value as single-element array', () => {
    const raw = makeRaw({ equipment: 'barbell' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.equipment).toEqual(['barbell'])
  })

  it('handles null equipment as empty array', () => {
    const raw = makeRaw({ equipment: null })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.equipment).toEqual([])
  })

  it('preserves instructions array order', () => {
    const raw = makeRaw({
      instructions: ['First', 'Second', 'Third'],
    })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.instructions).toEqual(['First', 'Second', 'Third'])
  })

  it('sets source to "free-exercise-db"', () => {
    const raw = makeRaw()
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.source).toBe('free-exercise-db')
  })

  it('preserves the free-exercise-db id as-is', () => {
    const raw = makeRaw({ id: 'Barbell_Bench_Press' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.id).toBe('Barbell_Bench_Press')
  })

  it('maps primaryMuscles directly', () => {
    const raw = makeRaw({ primaryMuscles: ['chest', 'shoulders'] })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.primaryMuscles).toEqual(['chest', 'shoulders'])
  })

  it('maps secondaryMuscles directly', () => {
    const raw = makeRaw({ secondaryMuscles: ['triceps', 'forearms'] })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.secondaryMuscles).toEqual(['triceps', 'forearms'])
  })

  it('constructs full image URLs from relative paths', () => {
    const raw = makeRaw({ images: ['Test/0.jpg', 'Test/1.jpg'] })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.images).toEqual([
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Test/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Test/1.jpg',
    ])
  })

  it('handles null images as empty array', () => {
    const raw = makeRaw({ images: null })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.images).toEqual([])
  })

  it('maps force directly', () => {
    const raw = makeRaw({ force: 'pull' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.force).toBe('pull')
  })

  it('maps null force as undefined', () => {
    const raw = makeRaw({ force: null })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.force).toBeUndefined()
  })

  it('maps mechanic directly', () => {
    const raw = makeRaw({ mechanic: 'isolation' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.mechanic).toBe('isolation')
  })

  it('maps null mechanic as undefined', () => {
    const raw = makeRaw({ mechanic: null })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.mechanic).toBeUndefined()
  })

  it('maps category including new free-exercise-db categories', () => {
    const raw = makeRaw({ category: 'plyometrics' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.category).toBe('plyometrics')
  })

  it('maps unknown category to "other"', () => {
    const raw = makeRaw({ category: 'unknown-sport' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.category).toBe('other')
  })

  it('maps string category "cardio" directly', () => {
    const raw = makeRaw({ category: 'cardio' })
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.category).toBe('cardio')
  })

  it('sets createdAt and updatedAt to a valid timestamp', () => {
    const raw = makeRaw()
    const result = mapFreeExerciseDbEntry(raw)
    expect(result.createdAt).toBeGreaterThan(0)
    expect(result.updatedAt).toBeGreaterThan(0)
  })

  it('returns an object conforming to Exercise type shape', () => {
    const raw = makeRaw()
    const result = mapFreeExerciseDbEntry(raw) as Exercise
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('description')
    expect(result).toHaveProperty('category')
    expect(result).toHaveProperty('primaryMuscles')
    expect(result).toHaveProperty('secondaryMuscles')
    expect(result).toHaveProperty('equipment')
    expect(result).toHaveProperty('instructions')
    expect(result).toHaveProperty('difficulty')
    expect(result).toHaveProperty('force')
    expect(result).toHaveProperty('mechanic')
    expect(result).toHaveProperty('images')
    expect(result).toHaveProperty('source')
  })
})
