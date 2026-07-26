'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

export interface UseFavoritesReturn {
  favoriteIds: string[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (exerciseId: string) => Promise<void>
  addFavorite: (exerciseId: string) => Promise<void>
  removeFavorite: (exerciseId: string) => Promise<void>
  clearOrphans: (validIds: string[]) => void
  isLoading: boolean
  error: string | null
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('favorites')
      .select('exercise_id')
      .eq('user_id', user.id)

    if (fetchError) {
      setError(fetchError.message)
      setFavoriteIds([])
    } else {
      setFavoriteIds((data ?? []).map((row: Record<string, unknown>) => row.exercise_id as string))
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  // ponytail: sync check against local state — callers use this in useMemo/.filter()
  const isFavorite = useCallback(
    (id: string): boolean => favoriteIds.includes(id),
    [favoriteIds],
  )

  const toggleFavorite = useCallback(
    async (exerciseId: string) => {
      if (!user) return
      setError(null)

      const exists = favoriteIds.includes(exerciseId)

      if (exists) {
        setFavoriteIds((prev) => prev.filter((id) => id !== exerciseId))

        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('exercise_id', exerciseId)

        if (deleteError) {
          setError(deleteError.message)
          setFavoriteIds((prev) => [...prev, exerciseId])
        }
      } else {
        setFavoriteIds((prev) => [...prev, exerciseId])

        const { error: insertError } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, exercise_id: exerciseId })

        if (insertError) {
          setError(insertError.message)
          setFavoriteIds((prev) => prev.filter((id) => id !== exerciseId))
        }
      }
    },
    [user, supabase, favoriteIds],
  )

  const addFavorite = useCallback(
    async (exerciseId: string) => {
      if (!user) return
      setError(null)

      setFavoriteIds((prev) => (prev.includes(exerciseId) ? prev : [...prev, exerciseId]))

      const { error: upsertError } = await supabase
        .from('favorites')
        .upsert(
          { user_id: user.id, exercise_id: exerciseId },
          { onConflict: 'user_id, exercise_id', ignoreDuplicates: true },
        )

      if (upsertError) {
        setError(upsertError.message)
      }
    },
    [user, supabase],
  )

  const removeFavorite = useCallback(
    async (exerciseId: string) => {
      if (!user) return
      setError(null)

      setFavoriteIds((prev) => prev.filter((id) => id !== exerciseId))

      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)

      if (deleteError) {
        setError(deleteError.message)
        setFavoriteIds((prev) => [...prev, exerciseId])
      }
    },
    [user, supabase],
  )

  // ponytail: clearOrphans kept for caller compatibility — Supabase FK constraint ensures no orphans
  const clearOrphans = useCallback(
    (validIds: string[]) => {
      const orphans = favoriteIds.filter((id) => !validIds.includes(id))
      if (orphans.length === 0) return
      setFavoriteIds((prev) => prev.filter((id) => validIds.includes(id)))
    },
    [favoriteIds],
  )

  return { favoriteIds, isFavorite, toggleFavorite, addFavorite, removeFavorite, clearOrphans, isLoading, error }
}
