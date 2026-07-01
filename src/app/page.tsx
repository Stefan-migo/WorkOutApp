'use client'

import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSessions } from '@/hooks/useSessions'
import { useWeekPlans } from '@/hooks/useWeekPlans'
import { getMonday } from '@/lib/calendar-utils'
import { useMemo } from 'react'
import HeroCard from '@/components/HeroCard'
import MiniCalendar from '@/components/MiniCalendar'
import QuickActions from '@/components/QuickActions'
import UpNextCard from '@/components/UpNextCard'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default function DashboardPage() {
  const { workouts } = useWorkoutContext()
  const { sessions } = useSessions()
  const { getWeekPlan } = useWeekPlans()
  const monday = useMemo(() => getMonday(new Date()), [])
  const weekPlan = useMemo(() => getWeekPlan(monday), [monday, getWeekPlan])

  const totalSessions = sessions.length
  const thisWeekSessions = sessions.filter((s) => {
    const d = new Date(s.startedAt)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const mon = new Date(d.setDate(diff))
    return mon.toISOString().slice(0, 10) === monday
  }).length

  const assignedDays = weekPlan.days.filter((d) => d !== null).length
  const weekProgress = Math.round((assignedDays / 5) * 100)

  // ponytail: first workout as "today's focus" — naive, pick by day of week
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1
  const todayAssignment = weekPlan.days[todayIndex]
  const todayWorkout =
    todayAssignment?.workoutId
      ? workouts.find((w) => w.id === todayAssignment.workoutId)
      : null

  return (
    <div className="flex-1 flex flex-col gap-24 max-w-6xl mx-auto w-full">
      {/* Greeting + Date */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="font-headline text-headline-lg text-on-surface tracking-tight">
            {getGreeting()}.
          </h2>
          <p className="font-body text-body-md text-on-surface-variant mt-xs">
            Stay focused. Stay disciplined.
          </p>
        </div>
        <p className="font-mono text-data-lg text-primary tracking-tight">{formatDate()}</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-24">
        <HeroCard
          todayWorkout={todayWorkout}
          workoutCount={workouts.length}
          totalSessions={totalSessions}
        />
        <MiniCalendar
          monday={monday}
          todayIndex={todayIndex}
          weekPlanDays={weekPlan.days}
          assignedDays={assignedDays}
          weekProgress={weekProgress}
        />
        <QuickActions />
        <UpNextCard totalSessions={totalSessions} thisWeekSessions={thisWeekSessions} />
      </div>
    </div>
  )
}
