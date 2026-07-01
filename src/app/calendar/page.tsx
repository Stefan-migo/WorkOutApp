'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWeekPlans } from '@/hooks/useWeekPlans'
import { useProgramTemplates } from '@/hooks/useProgramTemplates'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { getMonday, formatWeekRange, previousWeek, nextWeek, getDayOfWeek } from '@/lib/calendar-utils'
import DayAssignmentModal from '@/components/DayAssignmentModal'
import { formatDuration } from '@/lib/format'
import type { DayAssignment, ProgramTemplate, Workout, Sequence } from '@/types/workout'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

// ponytail: heuristic type label from available data — no category field on Workout/Sequence yet
function deriveTypeLabel(
  assignment: DayAssignment,
  workout?: Workout,
  sequence?: Sequence,
): string {
  if (assignment.workoutId && workout) {
    const hasNonWork = workout.intervals.some(
      (i): boolean => i.type !== undefined && i.type !== 'work',
    )
    return hasNonWork ? 'HIIT' : 'Strength'
  }
  if (assignment.sequenceId && sequence) {
    return sequence.workoutIds.length > 1 ? 'Circuit' : 'Strength'
  }
  return 'Training'
}

export default function CalendarPage() {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))
  const [modalDay, setModalDay] = useState<number | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [saveError, setSaveError] = useState('')
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

  function handleSaveTemplate() {
    const name = templateName.trim()
    if (!name) return
    // ponytail: naive duplicate check by title
    if (templates.some((t) => t.title.toLowerCase() === name.toLowerCase())) {
      setSaveError('A template with this title already exists.')
      return
    }
    const template: ProgramTemplate = {
      id: `template-${Date.now()}`,
      title: name,
      days: [...weekPlan.days],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveTemplate(template)
    setTemplateName('')
    setSaveError('')
  }

  function handleApplyTemplate(template: ProgramTemplate) {
    // ponytail: native confirm — no custom modal for one-off question
    if (
      !confirm(
        `Apply "${template.title}" to this week? This will overwrite all current day assignments.`,
      )
    )
      return
    const days = [...template.days] as typeof weekPlan.days
    saveWeekPlan({ ...weekPlan, days })
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen p-margin-mobile md:p-margin-desktop max-w-6xl mx-auto gap-24">
      {/* Left: calendar grid */}
      <div className="flex-1 flex flex-col gap-24">
        {/* Week nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-16">
            <button
              onClick={() => setCurrentMonday(previousWeek(currentMonday))}
              className="p-xs rounded-full hover:bg-surface-container transition-colors"
              aria-label="Previous week"
            >
              <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
            </button>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
              {formatWeekRange(currentMonday)}
            </h1>
            <button
              onClick={() => setCurrentMonday(nextWeek(currentMonday))}
              className="p-xs rounded-full hover:bg-surface-container transition-colors"
              aria-label="Next week"
            >
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        </div>

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
        {/* Templates — glass-card panel */}
        <div className="glass-card rounded-lg p-16 flex flex-col gap-16">
          <h2 className="font-label-caps text-label-caps text-primary tracking-wider">
            Templates
          </h2>
          <div className="flex flex-col gap-8">
            <input
              type="text"
              placeholder="Template name…"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value)
                setSaveError('')
              }}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant/50 text-body-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
            {saveError && (
              <p className="text-label-caps text-error">{saveError}</p>
            )}
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="w-full px-3 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps hover:bg-primary/90 disabled:opacity-40 transition-colors ambient-shadow"
            >
              Save current week
            </button>
          </div>
          <div className="flex flex-col gap-8 max-h-48 overflow-y-auto no-scrollbar">
            {templates.length === 0 && (
              <p className="text-body-md text-sm text-on-surface-variant">
                No templates saved yet.
              </p>
            )}
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-8 rounded-lg bg-surface-container-lowest border border-outline-variant/20"
              >
                <span className="text-body-md text-sm font-medium truncate text-on-surface">
                  {t.title}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleApplyTemplate(t)}
                    className="px-2 py-1 rounded bg-primary-container text-on-primary-container font-label-caps text-[10px] hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="px-2 py-1 rounded bg-error-container text-on-error-container font-label-caps text-[10px] hover:bg-error hover:text-on-error transition-colors"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming mini-list */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-16 flex flex-col gap-16">
          <h4 className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/20 pb-8">
            Upcoming
          </h4>
          {upcomingDays.length === 0 && (
            <p className="text-body-md text-sm text-on-surface-variant">
              No sessions scheduled.
            </p>
          )}
          {upcomingDays.map(({ index, assignment }) => {
            const d = new Date(currentMonday + 'T00:00:00')
            d.setDate(d.getDate() + index)
            const w = assignment.workoutId
              ? getWorkout(assignment.workoutId)
              : undefined
            const s = assignment.sequenceId
              ? getSequence(assignment.sequenceId)
              : undefined
            const title = w?.title ?? s?.title ?? '(deleted)'
            const label = deriveTypeLabel(assignment, w, s)
            const seconds = w
              ? w.intervals.reduce((sum, iv) => sum + iv.duration, 0)
              : 0
            return (
              <div key={index} className="flex gap-8 items-start">
                <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center flex-shrink-0 text-secondary-container font-data-lg text-data-lg font-bold">
                  {d.getDate()}
                </div>
                <div className="min-w-0">
                  <span className="block font-body-md text-body-md font-bold text-sm text-on-surface truncate">
                    {title}
                  </span>
                  <span className="block font-data-sm text-data-sm text-on-surface-variant mt-xs">
                    {label}
                    {seconds > 0 && ` \u2022 ${formatDuration(seconds)}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>


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

// --- Sub-components -------------------------------------------------------

function DayRow({
  dayName,
  dayNum,
  assignment,
  title,
  typeLabel,
  duration,
  isToday,
  isEmpty,
  onClick,
}: {
  dayName: string
  dayNum: number
  assignment: DayAssignment | null
  title?: string
  typeLabel: string
  duration: number
  isToday: boolean
  isEmpty: boolean
  onClick: () => void
}) {
  if (isToday && !isEmpty) {
    // Active day row — primary container styling
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-16 p-16 bg-primary-container border-2 border-primary rounded-lg shadow-lg"
      >
        <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary text-on-primary rounded-lg shrink-0">
          <span className="font-label-caps text-label-caps opacity-80">{dayName}</span>
          <span className="font-headline-md text-headline-md font-bold">{dayNum}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="font-body-md text-body-md font-bold text-on-primary truncate">
            {title}
          </h4>
          <div className="flex gap-xs mt-xs items-center">
            <span className="px-8 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-full uppercase tracking-wider">
              {typeLabel}
            </span>
            <span className="font-data-sm text-data-sm text-on-primary-container">
              {duration > 0 ? `${Math.floor(duration / 60)} min` : ''}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-primary">check_circle</span>
      </button>
    )
  }

  if (isEmpty) {
    // Empty day — dashed border, italic "Rest Day"
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-16 p-16 bg-surface-container-lowest/50 border border-dashed border-outline-variant/30 rounded-lg hover:border-primary transition-colors cursor-pointer group"
      >
        <div className="flex flex-col items-center justify-center w-16 h-16 bg-surface-container-low/50 rounded-lg shrink-0">
          <span className="font-label-caps text-label-caps text-on-surface-variant">{dayName}</span>
          <span className="font-headline-md text-headline-md font-bold text-on-surface-variant">
            {dayNum}
          </span>
        </div>
        <div className="flex-1 text-left">
          {assignment ? (
            <span className="text-on-surface-variant italic text-body-md">
              (deleted)
            </span>
          ) : (
            <span className="text-on-surface-variant italic text-body-md">
              Rest Day / Active Recovery
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">
          add_circle
        </span>
      </button>
    )
  }

  // Normal assigned day
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-16 p-16 bg-surface-container-lowest border border-outline-variant/20 rounded-lg hover:border-primary transition-colors cursor-pointer group"
    >
      <div className="flex flex-col items-center justify-center w-16 h-16 bg-surface-container-low rounded-lg shrink-0">
        <span className="font-label-caps text-label-caps text-on-surface-variant">{dayName}</span>
        <span className="font-headline-md text-headline-md font-bold text-on-surface">{dayNum}</span>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-body-md text-body-md font-bold text-on-surface truncate">
          {title}
        </h4>
        <div className="flex gap-xs mt-xs items-center">
          <span className="px-8 py-0.5 bg-primary-fixed-dim text-on-primary-fixed-variant text-[10px] font-bold rounded-full uppercase tracking-wider">
            {typeLabel}
          </span>
          <span className="font-data-sm text-data-sm text-on-surface-variant">
            {duration > 0 ? `${Math.floor(duration / 60)} min` : ''}
          </span>
        </div>
      </div>
      <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">
        chevron_right
      </span>
    </button>
  )
}

function TodaysFocus({
  assignment,
  workout,
  sequence,
  typeLabel,
  isCurrentWeek,
  onStartWorkout,
}: {
  assignment: DayAssignment | null
  workout?: Workout
  sequence?: Sequence
  typeLabel: string
  isCurrentWeek: boolean
  onStartWorkout: () => void
}) {
  const title = workout?.title ?? sequence?.title
  const totalSec = workout
    ? workout.intervals.reduce((s, i) => s + i.duration, 0)
    : 0

  if (!isCurrentWeek || !assignment || !title) {
    return (
      <div className="w-full lg:w-96 bg-surface-container-low rounded-lg p-24 flex flex-col gap-24 border border-outline-variant/20 self-start">
        <span className="font-label-caps text-label-caps text-primary font-bold">
          Today&apos;s Focus
        </span>
        <div className="flex flex-col items-center gap-8 py-24 text-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
            event_busy
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            No session scheduled for today.
          </p>
        </div>
      </div>
    )
  }

  const intervals = workout?.intervals ?? []

  return (
    <div className="w-full lg:w-96 bg-surface-container-low rounded-lg p-24 flex flex-col gap-24 border border-outline-variant/20 self-start">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-label-caps text-label-caps text-primary font-bold">
            Today&apos;s Focus
          </span>
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface mt-xs">
            {title}
          </h3>
        </div>
        <span className="px-16 py-xs bg-secondary-container text-on-secondary-container font-label-caps text-label-caps rounded-full">
          {typeLabel}
        </span>
      </div>
      <div className="flex flex-col gap-16">
        <div className="flex items-center gap-8 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">timer</span>
          <span className="font-data-sm text-data-sm">
            {totalSec > 0 ? `${Math.floor(totalSec / 60)} Minutes Total` : ''}
          </span>
        </div>
        {intervals.length > 0 && (
          <div className="flex flex-col gap-8">
            <h5 className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant/30 pb-xs">
              Exercise List
            </h5>
            <ul className="flex flex-col gap-xs">
              {intervals.map((iv, idx) => (
                <li
                  key={idx}
                  className="flex justify-between text-body-md text-sm"
                >
                  <span className="text-on-surface">{iv.title}</span>
                  <span className="font-data-sm text-data-sm text-on-surface-variant">
                    {formatDuration(iv.duration)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <button
        onClick={onStartWorkout}
        className="mt-auto w-full py-16 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps font-bold hover:bg-primary/90 transition-colors ambient-shadow flex items-center justify-center gap-8"
      >
        <span className="material-symbols-outlined">play_arrow</span>
        Start Workout
      </button>
    </div>
  )
}
