'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFallback, setFallback } from '@/lib/supabase/offline-fallback'
import { useAuth } from '@/context/AuthContext'
import type { Sequence } from '@/types/workout'

function mapRowToSequence(row: Record<string, unknown>): Sequence {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    workoutIds: (row.workout_ids as string[]) ?? [],
    repeatCount: (row.repeat_count as number) ?? 1,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }
}

function toInsertPayload(sequence: Sequence, userId: string) {
  return {
    id: sequence.id,
    user_id: userId,
    title: sequence.title,
    description: sequence.description ?? null,
    workout_ids: sequence.workoutIds,
    repeat_count: sequence.repeatCount,
    updated_at: new Date().toISOString(),
  }
}

export function useSequences() {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSequences = useCallback(async () => {
    if (!user) {
      setSequences([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('sequences')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setSequences(getFallback<Sequence>('sequences'))
    } else {
      const mapped = (data ?? []).map(mapRowToSequence)
      setSequences(mapped)
      setFallback('sequences', mapped)
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchSequences()
  }, [fetchSequences])

  const getSequence = useCallback(
    async (id: string): Promise<Sequence | undefined> => {
      if (!user) return undefined
      const { data, error: fetchError } = await supabase
        .from('sequences')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !data) return undefined
      return mapRowToSequence(data as Record<string, unknown>)
    },
    [user, supabase],
  )

  const saveSequence = useCallback(
    async (sequence: Sequence) => {
      if (!user) return
      setError(null)

      const { error: upsertError } = await supabase
        .from('sequences')
        .upsert(toInsertPayload(sequence, user.id))

      if (upsertError) {
        setError(upsertError.message)
      } else {
        await fetchSequences()
      }
    },
    [user, supabase, fetchSequences],
  )

  const deleteSequence = useCallback(
    async (id: string) => {
      if (!user) return
      setError(null)

      const { error: deleteError } = await supabase
        .from('sequences')
        .delete()
        .eq('id', id)

      if (deleteError) {
        setError(deleteError.message)
      } else {
        await fetchSequences()
      }
    },
    [user, supabase, fetchSequences],
  )

  return { sequences, getSequence, saveSequence, deleteSequence, isLoading, error }
}
