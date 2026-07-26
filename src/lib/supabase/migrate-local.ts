'use client'

import { createClient } from './client'

const STORAGE_KEYS = {
  workouts: 'workoutapp.workouts',
  exercises: 'workoutapp.exercises',
  sessions: 'workoutapp.sessions',
  sequences: 'workoutapp.sequences',
  weekPlans: 'workoutapp.weekplans',
  programTemplates: 'workoutapp.programtemplates',
  favorites: 'workoutapp.favorites',
} as const

export interface MigrationResult {
  total: number
  migrated: number
  errors: string[]
}

export async function migrateLocalData(userId: string): Promise<MigrationResult> {
  const supabase = createClient()
  const result: MigrationResult = { total: 0, migrated: 0, errors: [] }

  // Check if already migrated
  const migrated = localStorage.getItem(`workoutapp.migrated_${userId}`)
  if (migrated === 'true') {
    return { total: 0, migrated: 0, errors: [] }
  }

  // Migrate each table
  const tables: [string, string, string][] = [
    ['workouts', STORAGE_KEYS.workouts, 'id'],
    ['exercises', STORAGE_KEYS.exercises, 'id'],
    ['sessions', STORAGE_KEYS.sessions, 'id'],
    ['sequences', STORAGE_KEYS.sequences, 'id'],
    ['week_plans', STORAGE_KEYS.weekPlans, 'id'],
    ['program_templates', STORAGE_KEYS.programTemplates, 'id'],
  ]

  for (const [table, key, conflictColumn] of tables) {
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const items = JSON.parse(raw)
      if (!Array.isArray(items) || items.length === 0) continue
      result.total += items.length

      const rows = items.map((item: Record<string, unknown>) => ({ ...item, user_id: userId }))
      const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictColumn, ignoreDuplicates: false })
      if (error) {
        result.errors.push(`${table}: ${error.message}`)
      } else {
        result.migrated += items.length
      }
    } catch (e) {
      result.errors.push(`${table}: ${e instanceof Error ? e.message : 'parse error'}`)
    }
  }

  // Migrate favorites (stored differently — array of exercise IDs or object map)
  const favRaw = localStorage.getItem(STORAGE_KEYS.favorites)
  if (favRaw) {
    try {
      const favData = JSON.parse(favRaw)
      const exerciseIds: string[] = Array.isArray(favData) ? favData : Object.keys(favData)
      if (exerciseIds.length > 0) {
        result.total += exerciseIds.length
        const rows = exerciseIds.map(exerciseId => ({ user_id: userId, exercise_id: exerciseId }))
        const { error } = await supabase.from('favorites').upsert(rows, { onConflict: 'user_id,exercise_id', ignoreDuplicates: true })
        if (error) {
          result.errors.push(`favorites: ${error.message}`)
        } else {
          result.migrated += exerciseIds.length
        }
      }
    } catch (e) {
      result.errors.push(`favorites: ${e instanceof Error ? e.message : 'parse error'}`)
    }
  }

  // Mark as migrated
  localStorage.setItem(`workoutapp.migrated_${userId}`, 'true')

  return result
}
