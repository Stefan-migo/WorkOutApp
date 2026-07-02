'use client'

import { useState, useMemo } from 'react'
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
import type { DayAssignment } from '@/types/workout'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export default function CalendarPage() {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))
  const [modalDay, setModalDay] = useState<number | null>(null)
  const router = useRouter()

  const { weekPlans, getWeekPlan, saveWeekPlan } = useWeekPlans()
  const { templates, saveTemplate, deleteTemplate } = useProgramTemplates()
  const { workouts, getWorkout } = useWorkoutContext()
  const { sequences, getSequence } = useSequences()

  const weekPlan = useMemo(
    () => getWeekPlan(currentMonday),
    [currentMonday, weekPlans, getWeekPlan],
  )

  // -1 if viewing a different week
  const today = useMemo(() => {
    const now = new Date()
    const todayMon = getMonday(now)
    return todayMon === currentMonday ? getDayOfWeek(now) : -1
  }, [currentMonday])

  const todayAssignment = today >= 0 ? (weekPlan.days[today] ?? null) : null
  const todayWorkout = todayAssignment?.workoutId
    ? getWorkout(todayAssignment.workoutId)
    : undefined
  const todaySequence = todayAssignment?.sequenceId
    ? getSequence(todayAssignment.sequenceId)
    : undefined
  const todayTypeLabel = todayAssignment
    ? deriveTypeLabel(todayAssignment, todayWorkout, todaySequence)
    : ''

  const upcomingDays = useMemo(() => {
    const result: { index: number; assignment: DayAssignment }[] = []
    const isCurrentWeek = today >= 0
    // Collect assigned days after "today" (or all if another week)
    for (let i = isCurrentWeek ? today + 1 : 0; i < 7 && result.length < 3; i++) {
      const a = weekPlan.days[i]
      if (a) result.push({ index: i, assignment: a })
    }
    // Wrap from Monday if not enough
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
    const days = [...weekPlan.days] as typeof weekPlan.days
    days[dayIndex] = assignment
    saveWeekPlan({ ...weekPlan, days })
    setModalDay(null)
  }

  function handleClear(dayIndex: number) {
    const days = [...weekPlan.days] as typeof weekPlan.days
    days[dayIndex] = null
    saveWeekPlan({ ...weekPlan, days })
    setModalDay(null)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen p-margin-mobile md:p-margin-desktop max-w-6xl mx-auto gap-24">
      {/* Left: calendar grid */}
      <div className="flex-1 flex flex-col gap-24">
        {/* Week nav */}
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

        {/* Day rows + Focus panel */}
        <div className="flex flex-col lg:flex-row gap-24">
          {/* Day rows */}
          <div className="flex-1 flex flex-col gap-16">
            {DAY_NAMES.map((name, i) => {
              const d = new Date(currentMonday + 'T00:00:00')
              d.setDate(d.getDate() + i)
              const dayNum = d.getDate()
              const assignment = weekPlan.days[i] ?? null
              const isToday = today === i

              const workout = assignment?.workoutId
                ? getWorkout(assignment.workoutId)
                : undefined
              const sequence = assignment?.sequenceId
                ? getSequence(assignment.sequenceId)
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

          {/* Today's Focus panel */}
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

      {/* Right sidebar */}
      <aside className="w-full md:w-80 flex flex-col gap-16">
        <TemplatesPanel
          templates={templates}
          weekPlan={weekPlan}
          saveTemplate={saveTemplate}
          saveWeekPlan={saveWeekPlan}
          deleteTemplate={deleteTemplate}
        />
        <UpcomingList
          upcomingDays={upcomingDays}
          weekStart={currentMonday}
          workouts={workouts}
          sequences={sequences}
        />
      </aside>

      {/* Modal */}
      {modalDay !== null && (
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
