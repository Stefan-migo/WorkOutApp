'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWeekPlans } from '@/hooks/useWeekPlans'
import { useProgramTemplates } from '@/hooks/useProgramTemplates'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import {
  getMonday,
  weekOfDate,
  getDayOfWeek,
  buildMonthMatrix,
  deriveNextUp,
  deriveTypeLabel,
} from '@/lib/calendar-utils'
import { CalendarHeader } from '@/components/CalendarHeader'
import { MonthOverview } from '@/components/MonthOverview'
import { DayRow } from '@/components/DayRow'
import { TodaysFocus } from '@/components/TodaysFocus'
import DayAssignmentModal from '@/components/DayAssignmentModal'
import type { DayAssignment, WeekPlan } from '@/types/workout'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export default function CalendarPage() {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))
  // Modal owns the plan it edits so a cross-week day click (CP-1) can open
  // immediately without waiting for the weekPlan state effect to catch up.
  const [modal, setModal] = useState<{ plan: WeekPlan; dayIndex: number } | null>(
    null,
  )
  const router = useRouter()

  const { weekPlans, getWeekPlan, saveWeekPlan } = useWeekPlans()
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

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // CU-3: month density from already-loaded weekPlans (no extra fetches/writes)
  const monthMatrix = useMemo(
    () => buildMonthMatrix(currentMonday, weekPlans),
    [currentMonday, weekPlans],
  )

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

  // CU-5: one-line next-up summary from pure helper
  const nextUpLabel = useMemo(() => {
    const nextUp = deriveNextUp(weekPlan, currentMonday, new Date())
    if (!nextUp) return null
    const workout = nextUp.assignment.workoutId
      ? workouts.find((w) => w.id === nextUp.assignment.workoutId)
      : undefined
    const sequence = nextUp.assignment.sequenceId
      ? sequences.find((sq) => sq.id === nextUp.assignment.sequenceId)
      : undefined
    const title = workout?.title ?? sequence?.title
    const label = deriveTypeLabel(nextUp.assignment, workout, sequence)
    const dayName = DAY_NAMES[nextUp.dayIndex]
    return title ? `${dayName}: ${title} · ${label}` : null
  }, [weekPlan, currentMonday, workouts, sequences])

  function handleAssign(plan: WeekPlan, dayIndex: number, assignment: DayAssignment) {
    const days = [...plan.days] as typeof plan.days
    days[dayIndex] = assignment
    saveWeekPlan({ ...plan, days })
    setModal(null)
  }

  function handleClear(plan: WeekPlan, dayIndex: number) {
    const days = [...plan.days] as typeof plan.days
    days[dayIndex] = null
    saveWeekPlan({ ...plan, days })
    setModal(null)
  }

  // CP-1 "Direct day assignment": open the modal by DATE — ensure that week's
  // plan is loaded, navigate if it's another week, then open via getDayOfWeek.
  async function handleSelectDay(dateIso: string) {
    const weekStart = weekOfDate(dateIso)
    const plan = await getWeekPlan(weekStart)
    if (!plan) return
    if (weekStart !== currentMonday) setCurrentMonday(weekStart)
    const dayIndex = getDayOfWeek(new Date(dateIso + 'T00:00:00'))
    setModal({ plan, dayIndex })
  }

  return (
    <div className="flex flex-col min-h-screen p-margin-mobile md:p-margin-desktop max-w-6xl mx-auto gap-24">
      <CalendarHeader
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
        onToday={() => setCurrentMonday(getMonday(new Date()))}
        templates={templates}
        weekPlan={weekPlan}
        saveTemplate={saveTemplate}
        saveWeekPlan={saveWeekPlan}
        deleteTemplate={deleteTemplate}
      />

      <div className="flex flex-col md:flex-row gap-24">
        {/* CU-1 zone 1: main week grid + today's focus */}
        <main className="flex-1 flex flex-col gap-24">
          <div className="flex flex-col lg:flex-row gap-16">
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
                    onClick={() => setModal({ plan: weekPlan, dayIndex: i })}
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
              nextUpLabel={nextUpLabel}
              onStartWorkout={() => {
                if (todayAssignment?.workoutId)
                  router.push(`/workouts/${todayAssignment.workoutId}/play`)
                else if (todayAssignment?.sequenceId)
                  router.push(`/sequences/${todayAssignment.sequenceId}/play`)
              }}
            />
          </div>
        </main>

        {/* CU-1 zone 2: contextual sidebar — desktop shows the month overview
            directly; mobile collapses it into a <details> (CU-2). */}
        <aside className="w-full md:w-80 flex flex-col gap-16">
          <div className="hidden md:block">
            <MonthOverview
              anchorMonday={currentMonday}
              currentMonday={currentMonday}
              matrix={monthMatrix}
              todayIso={todayIso}
              onSelectWeek={setCurrentMonday}
              onSelectDay={handleSelectDay}
            />
          </div>
          <details className="md:hidden glass-card rounded-lg">
            <summary className="flex items-center gap-8 px-16 py-8 cursor-pointer font-label-caps text-label-caps text-muted">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Month overview
            </summary>
            <MonthOverview
              anchorMonday={currentMonday}
              currentMonday={currentMonday}
              matrix={monthMatrix}
              todayIso={todayIso}
              onSelectWeek={setCurrentMonday}
              onSelectDay={handleSelectDay}
            />
          </details>
        </aside>
      </div>

      {modal && (
        <DayAssignmentModal
          dayIndex={modal.dayIndex}
          currentAssignment={modal.plan.days[modal.dayIndex]}
          workouts={workouts}
          sequences={sequences}
          onAssign={(dayIndex, assignment) =>
            handleAssign(modal.plan, dayIndex, assignment)
          }
          onClear={(dayIndex) => handleClear(modal.plan, dayIndex)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
