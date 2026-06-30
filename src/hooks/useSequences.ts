'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { Sequence } from '@/types/workout'

const STORAGE_KEY = 'workoutapp.sequences'

export function useSequences() {
  const [sequences, setSequences] = useLocalStorage<Sequence[]>(STORAGE_KEY, [])

  const getSequence = useCallback(
    (id: string): Sequence | undefined => {
      return sequences.find((s) => s.id === id)
    },
    [sequences],
  )

  const saveSequence = useCallback(
    (sequence: Sequence) => {
      setSequences((prev) => {
        const idx = prev.findIndex((s) => s.id === sequence.id)
        const updated = { ...sequence, updatedAt: Date.now() }
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [...prev, updated]
      })
    },
    [setSequences],
  )

  const deleteSequence = useCallback(
    (id: string) => {
      setSequences((prev) => prev.filter((s) => s.id !== id))
    },
    [setSequences],
  )

  return { sequences, getSequence, saveSequence, deleteSequence }
}
