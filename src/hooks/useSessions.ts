'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { Session } from '@/types/workout'

const STORAGE_KEY = 'workoutapp.sessions'

export function useSessions() {
  const [sessions, setSessions] = useLocalStorage<Session[]>(STORAGE_KEY, [])

  // ponytail: append-only, no update/delete — add when MVP needs session editing
  const addSession = useCallback(
    (session: Session) => {
      setSessions((prev) => [session, ...prev])
    },
    [setSessions],
  )

  return { sessions, addSession }
}
