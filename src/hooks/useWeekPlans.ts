'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { getMonday } from '@/lib/calendar-utils'
import type { WeekPlan } from '@/types/workout'

function mapRowToWeekPlan(row: Record<string, unknown>): WeekPlan {
  return {
    id: row.id as string,
    title: (row.title as string | null) ?? undefined,
    startDate: row.start_date as string,
    days: row.days as WeekPlan['days'],
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }
}

function emptyDays(): WeekPlan['days'] {
  return [null, null, null, null, null, null, null]
}

function toInsertPayload(plan: WeekPlan, userId: string) {
  return {
    id: plan.id,
    user_id: userId,
    title: plan.title ?? null,
    start_date: plan.startDate,
    days: plan.days,
    updated_at: new Date().toISOString(),
  }
}

export function useWeekPlans() {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeekPlans = useCallback(async () => {
    if (!user) {
      setWeekPlans([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('week_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setWeekPlans([])
    } else {
      setWeekPlans((data ?? []).map(mapRowToWeekPlan))
    }
    setIsLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchWeekPlans()
  }, [fetchWeekPlans])

  const getWeekPlan = useCallback(
    async (date: string): Promise<WeekPlan | undefined> => {
      if (!user) return undefined
      const monday =
        date.length === 10
          ? getMonday(new Date(date + 'T00:00:00'))
          : getMonday(new Date(date))
      const id = `week-${monday}`

      // Check local state first
      const local = weekPlans.find((wp) => wp.id === id)
      if (local) return local

      // Try to fetch from Supabase
      const { data, error: fetchError } = await supabase
        .from('week_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('start_date', monday)
        .maybeSingle()

      if (!fetchError && data) {
        const plan = mapRowToWeekPlan(data as Record<string, unknown>)
        setWeekPlans((prev) => [...prev, plan])
        return plan
      }

      // Auto-create on miss
      const newPlan: WeekPlan = {
        id,
        startDate: monday,
        days: emptyDays(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const { error: insertError } = await supabase
        .from('week_plans')
        .insert(toInsertPayload(newPlan, user.id))

      if (insertError) {
        setError(insertError.message)
        return undefined
      }

      setWeekPlans((prev) => [...prev, newPlan])
      return newPlan
    },
    [user, supabase, weekPlans],
  )

  const saveWeekPlan = useCallback(
    async (plan: WeekPlan) => {
      if (!user) return
      setError(null)

      const { error: upsertError } = await supabase
        .from('week_plans')
        .upsert(toInsertPayload(plan, user.id))

      if (upsertError) {
        setError(upsertError.message)
      } else {
        await fetchWeekPlans()
      }
    },
    [user, supabase, fetchWeekPlans],
  )

  const deleteWeekPlan = useCallback(
    async (id: string) => {
      if (!user) return
      setError(null)

      const { error: deleteError } = await supabase
        .from('week_plans')
        .delete()
        .eq('id', id)

      if (deleteError) {
        setError(deleteError.message)
      } else {
        await fetchWeekPlans()
      }
    },
    [user, supabase, fetchWeekPlans],
  )

  return { weekPlans, getWeekPlan, saveWeekPlan, deleteWeekPlan, isLoading, error }
}
