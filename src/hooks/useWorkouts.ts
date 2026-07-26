'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFallback, setFallback } from '@/lib/supabase/offline-fallback'
import { useAuth } from '@/context/AuthContext'
import type { Workout } from '@/types/workout'

function mapRowToWorkout(row: Record<string, unknown>): Workout {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    imageUrl: (row.image_url as string | null) ?? undefined,
    intervals: row.intervals as Workout['intervals'],
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }
}

function toInsertPayload(workout: Workout, userId: string) {
  return {
    id: workout.id,
    user_id: userId,
    title: workout.title,
    description: workout.description ?? null,
    image_url: workout.imageUrl ?? null,
    intervals: workout.intervals,
    updated_at: new Date().toISOString(),
  }
}

export function useWorkouts() {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkouts = useCallback(async () => {
    if (!user) {
      setWorkouts([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setWorkouts(getFallback<Workout>('workouts'))
    } else {
      const mapped = (data ?? []).map(mapRowToWorkout)
      setWorkouts(mapped)
      setFallback('workouts', mapped)
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  const getWorkout = useCallback(
    async (id: string): Promise<Workout | undefined> => {
      if (!user) return undefined
      const { data, error: fetchError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !data) return undefined
      return mapRowToWorkout(data as Record<string, unknown>)
    },
    [user, supabase],
  )

  const saveWorkout = useCallback(
    async (workout: Workout) => {
      if (!user) return
      setError(null)

      const { error: upsertError } = await supabase
        .from('workouts')
        .upsert(toInsertPayload(workout, user.id))

      if (upsertError) {
        setError(upsertError.message)
      } else {
        await fetchWorkouts()
      }
    },
    [user, supabase, fetchWorkouts],
  )

  const deleteWorkout = useCallback(
    async (id: string) => {
      if (!user) return
      setError(null)

      const { error: deleteError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        setError(deleteError.message)
      } else {
        await fetchWorkouts()
      }
    },
    [user, supabase, fetchWorkouts],
  )

  return { workouts, getWorkout, saveWorkout, deleteWorkout, isLoading, error }
}
