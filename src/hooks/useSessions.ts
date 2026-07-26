'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { Session } from '@/types/workout'

function mapRowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    type: row.type as Session['type'],
    sequenceId: (row.sequence_id as string | null) ?? undefined,
    workoutId: (row.workout_id as string | null) ?? undefined,
    startedAt: new Date(row.started_at as string).getTime(),
    completedAt: row.completed_at
      ? new Date(row.completed_at as string).getTime()
      : undefined,
    intervals: row.intervals as Session['intervals'],
  }
}

function toInsertPayload(session: Session, userId: string) {
  return {
    id: session.id,
    user_id: userId,
    type: session.type,
    workout_id: session.workoutId ?? null,
    sequence_id: session.sequenceId ?? null,
    started_at: new Date(session.startedAt).toISOString(),
    completed_at: session.completedAt
      ? new Date(session.completedAt).toISOString()
      : null,
    intervals: session.intervals,
  }
}

export function useSessions() {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setSessions([])
    } else {
      setSessions((data ?? []).map(mapRowToSession))
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // ponytail: append-only, no update/delete — add when MVP needs session editing
  const addSession = useCallback(
    async (session: Session) => {
      if (!user) return
      setError(null)

      const { error: insertError } = await supabase
        .from('sessions')
        .insert(toInsertPayload(session, user.id))

      if (insertError) {
        setError(insertError.message)
      } else {
        await fetchSessions()
      }
    },
    [user, supabase, fetchSessions],
  )

  return { sessions, addSession, isLoading, error }
}
