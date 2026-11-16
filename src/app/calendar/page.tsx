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
  localDateKey,
  nextWeek,
  previousWeek,
} from '@/lib/calendar-utils'
import { formatDuration } from '@/lib/format'
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

  const { weekPlans, getWeekPlan, saveWeekPlan, error } = useWeekPlans()
  const { templates, saveTemplate, deleteTemplate } = useProgramTemplates()
  const { workouts } = useWorkoutContext()
  const { sequences } = useSequences()

  // der: load weekPlan for currentMonday (async getWeekPlan with auto-create)
  const [loadedPlan, setLoadedPlan] = useState<WeekPlan | undefined>(undefined)
  const weekPlan = loadedPlan?.startDate === currentMonday ? loadedPlan : undefined
  useEffect(() => {
    let current = true
    getWeekPlan(currentMonday).then((plan) => {
      if (current) setLoadedPlan(plan)
    })
    return () => { current = false }
  }, [currentMonday, getWeekPlan])

  // -1 if viewing a different week
  const today = useMemo(() => {
    const now = new Date()
    const todayMon = getMonday(now)
    return todayMon === currentMonday ? getDayOfWeek(now) : -1
  }, [currentMonday])

  const todayIso = useMemo(() => localDateKey(new Date()), [])

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
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextUp = deriveNextUp(weekPlan, currentMonday, tomorrow)
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
    // Duration: workout → sum of its intervals; sequence → sum of its
    // workouts' intervals × repeatCount (convention: sequences/new/page.tsx)
    const totalSec = workout
      ? workout.intervals.reduce((s, iv) => s + iv.duration, 0)
      : sequence
        ? sequence.workoutIds.reduce(
            (sum, id) =>
              sum +
              (workouts.find((w) => w.id === id)?.intervals.reduce(
                (s, iv) => s + iv.duration,
                0,
              ) ?? 0),
            0,
          ) * sequence.repeatCount
        : 0
    return title
      ? `${dayName}: ${title} · ${label} · ${formatDuration(totalSec)}`
      : null
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-24">
      <h1 className="text-4xl font-bold tracking-tight text-fg-2 sm:text-5xl">Calendar</h1>
      <CalendarHeader
        weekStart={currentMonday}
        onPrev={() => setCurrentMonday(previousWeek)}
        onNext={() => setCurrentMonday(nextWeek)}
        onToday={() => setCurrentMonday(getMonday(new Date()))}
        templates={templates}
        weekPlan={weekPlan}
        saveTemplate={saveTemplate}
        saveWeekPlan={saveWeekPlan}
        deleteTemplate={deleteTemplate}
      />

      {error && <p className="rounded-card border border-danger/40 bg-surface p-16 text-sm text-danger" role="alert">The calendar couldn’t sync. Try again in a moment.</p>}
      <div className="grid items-start gap-24 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-24">
          <TodaysFocus
            assignment={todayAssignment}
            workout={todayWorkout}
            sequence={todaySequence}
            typeLabel={todayTypeLabel}
            isCurrentWeek={today >= 0 && Boolean(weekPlan)}
            nextUpLabel={nextUpLabel}
            onStartWorkout={() => {
              if (todayWorkout) router.push(`/workouts/${todayWorkout.id}/play`)
              else if (todaySequence) router.push(`/sequences/${todaySequence.id}/play`)
            }}
          />
          <section className="flex flex-col gap-8" aria-labelledby="calendar-week-title">
            <h2 id="calendar-week-title" className="text-lg font-semibold text-fg-2">Week plan</h2>
            {!weekPlan && !error && <p role="status" className="text-muted">Loading week…</p>}
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
          </section>
        </div>

        {/* CU-1 zone 2: contextual sidebar — desktop shows the month overview
            directly; mobile collapses it into a <details> (CU-2). */}
        <aside className="flex w-full flex-col gap-16">
          <div className="hidden xl:block">
            <MonthOverview
              anchorMonday={currentMonday}
              currentMonday={currentMonday}
              matrix={monthMatrix}
              todayIso={todayIso}
              onSelectWeek={setCurrentMonday}
              onSelectDay={handleSelectDay}
            />
          </div>
          <details className="glass-card rounded-lg xl:hidden">
            <summary className="flex min-h-11 cursor-pointer items-center gap-8 rounded-lg px-16 text-label-caps text-muted">
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
