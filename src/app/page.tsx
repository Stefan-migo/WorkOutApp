'use client'

import { useEffect, useState } from 'react'
import HeroCard from '@/components/HeroCard'
import MiniCalendar from '@/components/MiniCalendar'
import QuickActions from '@/components/QuickActions'
import UpNextCard from '@/components/UpNextCard'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { useWeekPlans } from '@/hooks/useWeekPlans'
import { getDayOfWeek, getMonday } from '@/lib/calendar-utils'
import { formatDuration } from '@/lib/format'
import type { DayAssignment } from '@/types/workout'

export default function DashboardPage() {
  const { workouts, isLoading: workoutsLoading } = useWorkoutContext()
  const { sequences, isLoading: sequencesLoading } = useSequences()
  const { weekPlans, isLoading: plansLoading, error: plansError } = useWeekPlans()
  const [today, setToday] = useState<Date>()
  useEffect(() => { setToday(new Date()) }, [])
  if (!today) {
    return <div className="mx-auto w-full max-w-5xl"><HeroCard hasWorkouts={false} loading /></div>
  }

  const monday = getMonday(today)
  const todayIndex = getDayOfWeek(today)
  const days = weekPlans.find((plan) => plan.startDate === monday)?.days ?? []
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  function resolve(assignment?: DayAssignment | null) {
    const workout = workouts.find((item) => item.id === assignment?.workoutId)
    if (workout) {
      const duration = workout.intervals.reduce((sum, interval) => sum + interval.duration, 0)
      const details = workout.mode === 'reps'
        ? 'Rep-based workout'
        : [`${workout.intervals.length} intervals`, duration > 0 && formatDuration(duration)].filter(Boolean).join(' · ')
      return { title: workout.title, details, href: `/workouts/${workout.id}/play`, kind: 'workout' as const }
    }

    const sequence = sequences.find((item) => item.id === assignment?.sequenceId)
    if (sequence) {
      const count = sequence.workoutIds.length
      return {
        title: sequence.title,
        details: `${count} workout${count === 1 ? '' : 's'}${sequence.repeatCount > 1 ? ` × ${sequence.repeatCount}` : ''}`,
        href: `/sequences/${sequence.id}/play`,
        kind: 'sequence' as const,
      }
    }
  }

  const next = weekPlans
    .filter((plan) => plan.startDate >= monday)
    .sort((first, second) => first.startDate.localeCompare(second.startDate))
    .flatMap((plan) => plan.days.flatMap((assignment, dayIndex) => {
      if (plan.startDate === monday && dayIndex <= todayIndex) return []
      const session = resolve(assignment)
      if (!session) return []
      const date = new Date(plan.startDate + 'T00:00:00')
      date.setDate(date.getDate() + dayIndex)
      return [{ ...session, dayLabel: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }]
    }))[0]
  const training = resolve(days[todayIndex])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 sm:gap-24">
      <header className="flex items-end justify-between gap-3 border-b border-border-soft pb-3">
        <h1 className="text-4xl font-bold tracking-tight text-fg-2 sm:text-5xl">Today</h1>
        <p className="pb-1 text-right text-sm font-medium text-muted">{dateLabel}</p>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <HeroCard
          training={training}
          hasWorkouts={workouts.length > 0}
          loading={workoutsLoading || sequencesLoading || plansLoading}
          planUnavailable={Boolean(plansError && weekPlans.length === 0)}
        />
        <MiniCalendar monday={monday} todayIndex={todayIndex} weekPlanDays={days} />
      </div>

      <UpNextCard session={next} />
      <QuickActions />
    </div>
  )
}
