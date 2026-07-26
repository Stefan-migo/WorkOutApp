'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useIndexedDB } from './useIndexedDB'
import type { Exercise } from '@/types/workout'

function mapRowToExercise(row: Record<string, unknown>): Exercise {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    category: row.category as Exercise['category'],
    primaryMuscles: (row.primary_muscles as string[]) ?? undefined,
    secondaryMuscles: (row.secondary_muscles as string[]) ?? undefined,
    equipment: (row.equipment as string[]) ?? undefined,
    instructions: (row.instructions as string[]) ?? undefined,
    force: (row.force as Exercise['force']) ?? undefined,
    mechanic: (row.mechanic as Exercise['mechanic']) ?? undefined,
    difficulty: (row.difficulty as Exercise['difficulty']) ?? undefined,
    images: (row.images as string[]) ?? undefined,
    source: (row.source as Exercise['source']) ?? undefined,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }
}

function toUpsertPayload(exercise: Exercise, userId: string) {
  return {
    id: exercise.id,
    user_id: userId,
    name: exercise.name,
    description: exercise.description ?? null,
    category: exercise.category,
    primary_muscles: exercise.primaryMuscles ?? [],
    secondary_muscles: exercise.secondaryMuscles ?? [],
    equipment: exercise.equipment ?? [],
    instructions: exercise.instructions ?? [],
    force: exercise.force ?? null,
    mechanic: exercise.mechanic ?? null,
    difficulty: exercise.difficulty ?? 'beginner',
    images: exercise.images ?? [],
    source: (exercise.source ?? 'user') as string,
    updated_at: new Date().toISOString(),
  }
}

export function useExercises() {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getImages, saveImage, deleteImage } = useIndexedDB()

  const fetchExercises = useCallback(async () => {
    if (!user) {
      setExercises([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Fetch user's own exercises UNION public seed exercises (user_id IS NULL)
    const { data, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name')

    if (fetchError) {
      setError(fetchError.message)
      setExercises([])
    } else {
      setExercises((data ?? []).map(mapRowToExercise))
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  const getExercise = useCallback(
    async (id: string): Promise<Exercise | undefined> => {
      if (!user) return undefined
      const { data, error: fetchError } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !data) return undefined
      return mapRowToExercise(data as Record<string, unknown>)
    },
    [user, supabase],
  )

  const saveExercise = useCallback(
    async (exercise: Exercise) => {
      if (!user) return
      setError(null)

      const { error: upsertError } = await supabase
        .from('exercises')
        .upsert(toUpsertPayload(exercise, user.id))

      if (upsertError) {
        setError(upsertError.message)
      } else {
        await fetchExercises()
      }
    },
    [user, supabase, fetchExercises],
  )

  const deleteExercise = useCallback(
    async (id: string) => {
      if (!user) return
      setError(null)

      const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        setError(deleteError.message)
      } else {
        await fetchExercises()
      }
    },
    [user, supabase, fetchExercises],
  )

  return {
    exercises,
    getExercise,
    saveExercise,
    deleteExercise,
    getExerciseImages: getImages,
    saveExerciseImage: saveImage,
    deleteExerciseImage: deleteImage,
    isLoading,
    error,
  }
}

export type UseExercisesReturn = ReturnType<typeof useExercises>

