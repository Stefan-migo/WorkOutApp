'use client'

import { EXERCISE_IMAGE_STORE, openExerciseImageDB } from '@/lib/exercise-image-db'
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

  // Image migration runs in the background.
  void openExerciseImageDB().then(async (db) => {
    try {
      const recordsToMigrate = await new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction(EXERCISE_IMAGE_STORE, 'readonly').objectStore(EXERCISE_IMAGE_STORE).getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      const records = recordsToMigrate as Array<{ id: string; exerciseId: string; blobData: ArrayBuffer; blobType: string }>
      for (const record of records) {
        const file = new File([record.blobData], record.id, { type: record.blobType })
        const path = `${record.exerciseId}/${record.id.split('::')[1] ?? record.id}.${record.blobType.split('/')[1] ?? 'png'}`
        await supabase.storage.from('exercise-images').upload(path, file, { upsert: true })
      }
    } finally {
      db.close()
    }
  }).catch(() => {
    // Preserve the local exercise data if image migration fails.
  })

  // Mark as migrated
  localStorage.setItem(`workoutapp.migrated_${userId}`, 'true')

  return result
}
