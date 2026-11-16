'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getFallback, setFallback } from '@/lib/supabase/offline-fallback'
import { useAuth } from '@/context/AuthContext'
import type { Session } from '@/types/workout'

function mapRowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    type: row.type as Session['type'],
    ...(typeof row.title === 'string' ? { title: row.title } : {}),
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
    ...(session.type === 'free' ? { title: session.title } : {}),
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
    const fallbackKey = `sessions.${user.id}`

    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setSessions(getFallback<Session>(fallbackKey))
    } else {
      const mapped = (data ?? []).map(mapRowToSession)
      setSessions(mapped)
      setFallback(fallbackKey, mapped)
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const updateSession = useCallback(
    async (sessionId: string, updates: Partial<Session>) => {
      if (!user) return
      setError(null)

      const payload: Record<string, unknown> = {}
      if (updates.intervals) payload.intervals = updates.intervals
      if (updates.completedAt) payload.completed_at = new Date(updates.completedAt).toISOString()

      if (Object.keys(payload).length === 0) return

      const { error: updateError } = await supabase
        .from('sessions')
        .update(payload)
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (updateError) {
        setError(updateError.message)
      } else {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
        )
      }
    },
    [user, supabase],
  )

  const addSession = useCallback(
    async (session: Session) => {
      if (!user) {
        setError('Sign in to save your training session.')
        return false
      }
      setError(null)

      const table = supabase.from('sessions')
      const payload = toInsertPayload(session, user.id)
      const { error: insertError } = await (session.type === 'free'
        ? table.upsert(payload, { onConflict: 'id', ignoreDuplicates: true })
        : table.insert(payload))

      if (insertError) {
        setError(insertError.message)
        return false
      }
      await fetchSessions()
      return true
    },
    [user, supabase, fetchSessions],
  )

  return { sessions, addSession, updateSession, isLoading, error }
}
