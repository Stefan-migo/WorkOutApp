'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFallback, setFallback } from '@/lib/supabase/offline-fallback'
import { useAuth } from '@/context/AuthContext'
import { withExerciseMediaAccess } from '@/lib/exercise-media'
import { catalogMedia } from '@/lib/catalog-media'
import { useIndexedDB } from './useIndexedDB'
import type { Exercise } from '@/types/workout'

function mapRowToExercise(row: Record<string, unknown>, userId: string): Exercise {
  const id = row.id as string
  const own = row.user_id === userId
  const community = row.visibility === 'community'
  const images = (row.images as string[] | null) ?? []
  const catalogImages = row.user_id === null && row.source === 'system' ? catalogMedia(row.name as string)?.images : undefined
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
    images: images.length ? images.map((image) => community && !own ? withExerciseMediaAccess(image, id) : image) : catalogImages ?? (row.images == null ? undefined : images),
    visibility: community ? 'community' : 'private',
    authorName: community ? (row.author_name as string | null) ?? undefined : undefined,
    isOwned: own,
    isShared: row.user_id === undefined ? undefined : row.user_id === null,
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
    visibility: exercise.visibility ?? 'private',
    author_name: exercise.visibility === 'community' ? exercise.authorName?.trim() ?? null : null,
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

    const { data, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null,visibility.eq.community`)
      .order('name')

    if (fetchError) {
      setError(fetchError.message)
      setExercises(getFallback<Exercise>(`exercises.${user.id}`))
    } else {
      const mapped = (data ?? []).map((row) => mapRowToExercise(row, user.id))
      setExercises(mapped)
      setFallback(`exercises.${user.id}`, mapped.filter((exercise) => exercise.isOwned || exercise.isShared))
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
      return mapRowToExercise(data as Record<string, unknown>, user.id)
    },
    [user, supabase],
  )

  const saveExercise = useCallback(
    async (exercise: Exercise) => {
      if (!user) return false
      setError(null)

      const { error: upsertError } = await supabase
        .from('exercises')
        .upsert(toUpsertPayload(exercise, user.id))

      if (upsertError) {
        setError(upsertError.message)
        return false
      }
      await fetchExercises()
      return true
    },
    [user, supabase, fetchExercises],
  )

  const deleteExercises = useCallback(async (ids: string[]) => {
    const deletedIds: string[] = []
    if (!user) return { deletedIds, error: 'Sign in to delete exercises.' }
    setError(null)
    const requested = [...new Set(ids)]
    let message: string | null = null

    // Bound request URLs and keep confirmed results if a later batch fails.
    for (let i = 0; i < requested.length; i += 100) {
      const batch = requested.slice(i, i + 100)
      const { data, error: deleteError } = await supabase.from('exercises').delete()
        .eq('user_id', user.id).in('id', batch).select('id')
      if (deleteError) {
        message = deleteError.message
        break
      }
      deletedIds.push(...(data ?? []).map((row) => row.id as string))
    }

    if (deletedIds.length > 0) {
      const removed = new Set(deletedIds)
      setExercises((current) => current.filter((exercise) => !removed.has(exercise.id)))
      setFallback(`exercises.${user.id}`, getFallback<Exercise>(`exercises.${user.id}`).filter((exercise) => !removed.has(exercise.id)))
    }
    if (!message && deletedIds.length !== requested.length) {
      message = 'Some exercises could not be deleted. Only exercises you own can be deleted.'
    }
    setError(message)
    return { deletedIds, error: message }
  }, [user, supabase])

  const deleteExercise = useCallback((id: string) => deleteExercises([id]), [deleteExercises])

  return {
    exercises,
    getExercise,
    saveExercise,
    deleteExercise,
    deleteExercises,
    getExerciseImages: getImages,
    saveExerciseImage: saveImage,
    deleteExerciseImage: deleteImage,
    isLoading,
    error,
  }
}

export type UseExercisesReturn = ReturnType<typeof useExercises>

