'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { ProgramTemplate } from '@/types/workout'

function mapRowToTemplate(row: Record<string, unknown>): ProgramTemplate {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    days: row.days as ProgramTemplate['days'],
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }
}

function toInsertPayload(template: ProgramTemplate, userId: string) {
  return {
    id: template.id,
    user_id: userId,
    title: template.title,
    description: template.description ?? null,
    days: template.days,
    updated_at: new Date().toISOString(),
  }
}

export function useProgramTemplates() {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [templates, setTemplates] = useState<ProgramTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('program_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setTemplates([])
    } else {
      setTemplates((data ?? []).map(mapRowToTemplate))
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const saveTemplate = useCallback(
    async (template: ProgramTemplate) => {
      if (!user) return
      setError(null)

      const { error: upsertError } = await supabase
        .from('program_templates')
        .upsert(toInsertPayload(template, user.id))

      if (upsertError) {
        setError(upsertError.message)
      } else {
        await fetchTemplates()
      }
    },
    [user, supabase, fetchTemplates],
  )

  const deleteTemplate = useCallback(
    async (id: string) => {
      if (!user) return
      setError(null)

      const { error: deleteError } = await supabase
        .from('program_templates')
        .delete()
        .eq('id', id)

      if (deleteError) {
        setError(deleteError.message)
      } else {
        await fetchTemplates()
      }
    },
    [user, supabase, fetchTemplates],
  )

  return { templates, saveTemplate, deleteTemplate, isLoading, error }
}
