'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { ProgramTemplate } from '@/types/workout'

const STORAGE_KEY = 'workoutapp.programtemplates'

export function useProgramTemplates() {
  const [templates, setTemplates] = useLocalStorage<ProgramTemplate[]>(STORAGE_KEY, [])

  const saveTemplate = useCallback(
    (template: ProgramTemplate) => {
      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t.id === template.id)
        const updated = { ...template, updatedAt: Date.now() }
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [...prev, updated]
      })
    },
    [setTemplates],
  )

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    },
    [setTemplates],
  )

  return { templates, saveTemplate, deleteTemplate }
}
