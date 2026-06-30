'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { getMonday } from '@/lib/calendar-utils'
import type { WeekPlan, DayAssignment } from '@/types/workout'

const STORAGE_KEY = 'workoutapp.weekplans'

function emptyDays(): WeekPlan['days'] {
  return [null, null, null, null, null, null, null]
}

export function useWeekPlans() {
  const [weekPlans, setWeekPlans] = useLocalStorage<WeekPlan[]>(STORAGE_KEY, [])

  const getWeekPlan = useCallback(
    (date: string): WeekPlan => {
      const monday = date.length === 10 ? getMonday(new Date(date + 'T00:00:00')) : getMonday(new Date(date))
      const id = `week-${monday}`
      const existing = weekPlans.find((wp) => wp.id === id)
      if (existing) return existing

      // ponytail: auto-create on miss — avoids null-handling at every call site
      const newPlan: WeekPlan = {
        id,
        startDate: monday,
        days: emptyDays(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setWeekPlans((prev) => [...prev, newPlan])
      return newPlan
    },
    [weekPlans, setWeekPlans],
  )

  const saveWeekPlan = useCallback(
    (plan: WeekPlan) => {
      setWeekPlans((prev) => {
        const idx = prev.findIndex((wp) => wp.id === plan.id)
        const updated = { ...plan, updatedAt: Date.now() }
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [...prev, updated]
      })
    },
    [setWeekPlans],
  )

  const deleteWeekPlan = useCallback(
    (id: string) => {
      setWeekPlans((prev) => prev.filter((wp) => wp.id !== id))
    },
    [setWeekPlans],
  )

  return { weekPlans, getWeekPlan, saveWeekPlan, deleteWeekPlan }
}
