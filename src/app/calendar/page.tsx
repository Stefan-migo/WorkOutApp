'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWeekPlans } from '@/hooks/useWeekPlans'
import { useProgramTemplates } from '@/hooks/useProgramTemplates'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { getMonday, getDayOfWeek, deriveTypeLabel } from '@/lib/calendar-utils'
import { WeekNav } from '@/components/WeekNav'
import { DayRow } from '@/components/DayRow'
import { TodaysFocus } from '@/components/TodaysFocus'
import { TemplatesPanel } from '@/components/TemplatesPanel'
import { UpcomingList } from '@/components/UpcomingList'
import DayAssignmentModal from '@/components/DayAssignmentModal'
import type { DayAssignment, WeekPlan } from '@/types/workout'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export default function CalendarPage() {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))
  const [modalDay, setModalDay] = useState<number | null>(null)
  const router = useRouter()

  const { getWeekPlan, saveWeekPlan } = useWeekPlans()
  const { templates, saveTemplate, deleteTemplate } = useProgramTemplates()
  const { workouts } = useWorkoutContext()
  const { sequences } = useSequences()

  // der: load weekPlan for currentMonday (async getWeekPlan with auto-create)
  const [weekPlan, setWeekPlan] = useState<WeekPlan | undefined>(undefined)
  useEffect(() => {
    getWeekPlan(currentMonday).then(setWeekPlan)
  }, [currentMonday, getWeekPlan])

  // -1 if viewing a different week
  const today = useMemo(() => {
    const now = new Date()
    const todayMon = getMonday(now)
    return todayMon === currentMonday ? getDayOfWeek(now) : -1
  }, [currentMonday])

  // ponytail: resolve from arrays (sync) — avoids async getWorkout/getSequence
  const todayAssignment = today >= 0 && weekPlan ? (weekPlan.days[today] ?? null) : null
  const todayWorkout = todayAssignment?.workoutId
    ? workouts.find((w) => w.id === todayAssignment.workoutId)
    : undefined
  const todaySequence = todayAssignment?.sequenceId
    ? sequences.find((sq) => sq.id === todayAssignment.sequenceId)
    : undefined
  const todayTypeLabel = todayAssignment
    ? deriveTypeLabel(todayAssignment, todayWorkout, todaySequence)
    : ''

  const upcomingDays = useMemo(() => {
    if (!weekPlan) return []
    const result: { index: number; assignment: DayAssignment }[] = []
    const isCurrentWeek = today >= 0
    for (let i = isCurrentWeek ? today + 1 : 0; i < 7 && result.length < 3; i++) {
      const a = weekPlan.days[i]
      if (a) result.push({ index: i, assignment: a })
    }
    if (result.length < 3 && isCurrentWeek) {
      for (let i = 0; i <= today && result.length < 3; i++) {
        const a = weekPlan.days[i]
        if (a && !result.some((r) => r.index === i))
          result.push({ index: i, assignment: a })
      }
    }
    return result
  }, [weekPlan, today])

  function handleAssign(dayIndex: number, assignment: DayAssignment) {
    if (!weekPlan) return
    const days = [...weekPlan.days] as typeof weekPlan.days
    days[dayIndex] = assignment
    saveWeekPlan({ ...weekPlan, days })
    setModalDay(null)
  }

  function handleClear(dayIndex: number) {
    if (!weekPlan) return
    const days = [...weekPlan.days] as typeof weekPlan.days
    days[dayIndex] = null
    saveWeekPlan({ ...weekPlan, days })
    setModalDay(null)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen p-margin-mobile md:p-margin-desktop max-w-6xl mx-auto gap-24">
      {/* Left: calendar grid */}
      <div className="flex-1 flex flex-col gap-24">
        <WeekNav
          weekStart={currentMonday}
          onPrev={() => setCurrentMonday((prev) => {
            const d = new Date(prev + 'T00:00:00')
            d.setDate(d.getDate() - 7)
            return d.toISOString().slice(0, 10)
          })}
          onNext={() => setCurrentMonday((prev) => {
            const d = new Date(prev + 'T00:00:00')
            d.setDate(d.getDate() + 7)
            return d.toISOString().slice(0, 10)
          })}
        />

        <div className="flex flex-col lg:flex-row gap-24">
          <div className="flex-1 flex flex-col gap-16">
            {DAY_NAMES.map((name, i) => {
              if (!weekPlan) return null
              const d = new Date(currentMonday + 'T00:00:00')
              d.setDate(d.getDate() + i)
              const dayNum = d.getDate()
              const assignment = weekPlan.days[i] ?? null
              const isToday = today === i
              const workout = assignment?.workoutId
                ? workouts.find((w) => w.id === assignment.workoutId)
                : undefined
              const sequence = assignment?.sequenceId
                ? sequences.find((sq) => sq.id === assignment.sequenceId)
                : undefined
              const isDeleted = assignment !== null && !workout && !sequence
              const title = isDeleted
                ? '(deleted)'
                : workout?.title ?? sequence?.title
              const typeLabel =
                assignment && !isDeleted
                  ? deriveTypeLabel(assignment, workout, sequence)
                  : ''
              const totalSec = workout
                ? workout.intervals.reduce((s, iv) => s + iv.duration, 0)
                : 0

              return (
                <DayRow
                  key={i}
                  dayName={name}
                  dayNum={dayNum}
                  assignment={assignment}
                  title={title}
                  typeLabel={typeLabel}
                  duration={totalSec}
                  isToday={isToday}
                  isEmpty={!assignment || isDeleted}
                  onClick={() => setModalDay(i)}
                />
              )
            })}
          </div>

          <TodaysFocus
            assignment={todayAssignment}
            workout={todayWorkout}
            sequence={todaySequence}
            typeLabel={todayTypeLabel}
            isCurrentWeek={today >= 0}
            onStartWorkout={() => {
              if (todayAssignment?.workoutId)
                router.push(`/workouts/${todayAssignment.workoutId}/play`)
              else if (todayAssignment?.sequenceId)
                router.push(`/sequences/${todayAssignment.sequenceId}/play`)
            }}
          />
        </div>
      </div>

      <aside className="w-full md:w-80 flex flex-col gap-16">
        {weekPlan && (
        <TemplatesPanel
          templates={templates}
          weekPlan={weekPlan}
          saveTemplate={saveTemplate}
          saveWeekPlan={saveWeekPlan}
          deleteTemplate={deleteTemplate}
        />
        )}
        <UpcomingList
          upcomingDays={upcomingDays}
          weekStart={currentMonday}
          workouts={workouts}
          sequences={sequences}
        />
      </aside>

      {modalDay !== null && weekPlan && (
        <DayAssignmentModal
          dayIndex={modalDay}
          currentAssignment={weekPlan.days[modalDay]}
          workouts={workouts}
          sequences={sequences}
          onAssign={handleAssign}
          onClear={handleClear}
          onClose={() => setModalDay(null)}
        />
      )}
    </div>
  )
}
