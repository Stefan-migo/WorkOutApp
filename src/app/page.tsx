'use client'

import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSessions } from '@/hooks/useSessions'
import { useWeekPlans } from '@/hooks/useWeekPlans'
import { getMonday, formatWeekRange } from '@/lib/calendar-utils'
import { useMemo } from 'react'

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
    <div className="flex-1 flex flex-col gap-lg max-w-6xl mx-auto w-full">
      {/* Greeting + Date */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        {/* Hero Card: Today's Workout */}
        <div className="md:col-span-8 rounded-xl overflow-hidden glass-card relative min-h-[280px] flex flex-col justify-end p-lg group transition-transform duration-300 hover:-translate-y-1 ambient-shadow border-l-4 border-l-secondary-container">
          <div className="absolute inset-0 bg-cover bg-center opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23091426\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
          />
          <div className="relative z-10 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-lg">
            <div>
              <div className="flex gap-sm mb-sm">
                <span className="bg-surface-tint/10 text-primary-container px-sm py-1 rounded-full font-label text-[10px] tracking-wider border border-outline-variant/20 backdrop-blur-md">
                  {todayWorkout ? 'TODAY' : 'WELCOME'}
                </span>
                <span className="bg-surface-tint/10 text-primary-container px-sm py-1 rounded-full font-label text-[10px] tracking-wider border border-outline-variant/20 backdrop-blur-md">
                  {workouts.length} WORKOUT{workouts.length !== 1 && 'S'}
                </span>
              </div>
              <h3 className="font-headline text-headline-lg text-primary mb-xs tracking-tight">
                {todayWorkout?.title ?? 'Ready to train?'}
              </h3>
              <p className="font-body text-body-md text-on-surface-variant max-w-md">
                {todayWorkout
                  ? `${todayWorkout.intervals.length} intervals · ${Math.floor(
                      todayWorkout.intervals.reduce((s, i) => s + i.duration, 0) / 60
                    )} min`
                  : totalSessions > 0
                    ? `${totalSessions} session${totalSessions !== 1 && 's'} completed. Keep the momentum!`
                    : 'Create your first workout and start your journey.'}
              </p>
            </div>
            {todayWorkout && (
              <Link
                href={`/workouts/${todayWorkout.id}/play`}
                className="shrink-0 bg-primary-container text-on-primary rounded-full w-20 h-20 flex items-center justify-center ambient-shadow hover:bg-primary transition-all duration-300 hover:scale-105 active:scale-95 group/btn"
              >
                <span className="font-label text-label-caps font-bold tracking-widest group-hover/btn:hidden">START</span>
                <span className="material-symbols-outlined text-[32px] hidden group-hover/btn:block">play_arrow</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mini Calendar Widget */}
        <div className="md:col-span-4 rounded-xl glass-card p-lg flex flex-col justify-between min-h-[280px]">
          <div className="flex items-center justify-between mb-md">
            <h4 className="font-headline text-headline-md text-primary">This Week</h4>
          </div>
          <div className="grid grid-cols-7 gap-xs mb-auto">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={d} className="text-center font-label text-[10px] text-on-surface-variant mb-xs">
                {d}
              </div>
            ))}
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(monday)
              d.setDate(d.getDate() + i)
              const dayNum = d.getDate()
              const isToday = i === todayIndex
              const hasAssignment = weekPlan.days[i] !== null
              return (
                <div key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                  {isToday ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="font-mono text-data-sm text-on-primary font-bold">{dayNum}</span>
                    </div>
                  ) : (
                    <span className="font-mono text-data-sm text-on-surface-variant">{dayNum}</span>
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full ${hasAssignment ? 'bg-secondary-container' : 'bg-transparent'}`} />
                </div>
              )
            })}
          </div>
          <div className="mt-md pt-md border-t border-outline-variant/30 flex justify-between items-center">
            <div>
              <p className="font-mono text-data-lg text-primary">{assignedDays} / 5</p>
              <p className="font-label text-[10px] text-on-surface-variant">DAYS PLANNED</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-surface-container relative flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90 text-secondary-container" viewBox="0 0 36 36">
                <path
                  className="stroke-current"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeDasharray="100"
                  strokeDashoffset={100 - weekProgress}
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="font-mono text-data-sm text-primary">{weekProgress}%</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-lg">
          <Link
            href="/workouts/new"
            className="glass-card p-md rounded-xl flex items-center gap-md hover:bg-surface-variant/50 transition-colors duration-200 group border-l-4 border-l-transparent hover:border-l-primary"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">add_circle</span>
            </div>
            <div>
              <h5 className="font-headline text-body-md font-bold text-primary">Create Workout</h5>
              <p className="font-label text-[10px] text-on-surface-variant mt-1">CUSTOM ROUTINE</p>
            </div>
          </Link>
          <Link
            href="/exercises"
            className="glass-card p-md rounded-xl flex items-center gap-md hover:bg-surface-variant/50 transition-colors duration-200 group border-l-4 border-l-transparent hover:border-l-primary"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">search</span>
            </div>
            <div>
              <h5 className="font-headline text-body-md font-bold text-primary">Browse Exercises</h5>
              <p className="font-label text-[10px] text-on-surface-variant mt-1">LIBRARY &amp; FORMS</p>
            </div>
          </Link>
          <Link
            href="/calendar"
            className="glass-card p-md rounded-xl flex items-center gap-md hover:bg-surface-variant/50 transition-colors duration-200 group border-l-4 border-l-transparent hover:border-l-primary"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </div>
            <div>
              <h5 className="font-headline text-body-md font-bold text-primary">View Calendar</h5>
              <p className="font-label text-[10px] text-on-surface-variant mt-1">PLANNING &amp; HISTORY</p>
            </div>
          </Link>
        </div>

        {/* Up Next */}
        <div className="md:col-span-12">
          <h4 className="font-headline text-headline-md text-primary mb-md">Up Next</h4>
          <div className="glass-card rounded-xl p-md flex flex-col md:flex-row items-center justify-between gap-md border-l-4 border-l-primary-fixed-dim hover:bg-surface-variant/30 transition-colors">
            {totalSessions > 0 ? (
              <>
                <div className="flex items-center gap-lg w-full md:w-auto">
                  <div className="flex flex-col items-center justify-center bg-surface w-16 h-16 rounded-lg border border-outline-variant/30 shrink-0">
                    <span className="font-mono text-data-sm text-on-surface-variant">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </span>
                    <span className="font-mono text-data-lg text-primary font-bold">
                      {new Date().getDate()}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-headline text-body-lg font-bold text-primary">
                      {sessions.length > 0
                        ? `${totalSessions} Session${totalSessions !== 1 && 's'} Completed`
                        : 'No sessions yet'}
                    </h5>
                    <div className="flex items-center gap-sm mt-1">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">schedule</span>
                      <span className="font-mono text-data-sm text-on-surface-variant text-[12px]">
                        {thisWeekSessions} this week
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={sessions.length > 0 ? '/history' : '/workouts/new'}
                  className="w-full md:w-auto px-lg py-sm rounded-full border border-outline-variant text-primary font-label text-label-caps hover:bg-primary-container hover:text-on-primary transition-colors text-center"
                >
                  {sessions.length > 0 ? 'VIEW HISTORY' : 'CREATE FIRST'}
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-lg w-full md:w-auto">
                  <div className="flex flex-col items-center justify-center bg-surface w-16 h-16 rounded-lg border border-outline-variant/30 shrink-0">
                    <span className="material-symbols-outlined text-[28px] text-on-surface-variant">fitness_center</span>
                  </div>
                  <div>
                    <h5 className="font-headline text-body-lg font-bold text-primary">Get Started</h5>
                    <p className="font-body text-body-md text-on-surface-variant mt-1">
                      Create your first workout to start training
                    </p>
                  </div>
                </div>
                <Link
                  href="/workouts/new"
                  className="w-full md:w-auto px-lg py-sm rounded-full bg-primary-container text-on-primary font-label text-label-caps hover:bg-primary transition-colors text-center"
                >
                  CREATE WORKOUT
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
