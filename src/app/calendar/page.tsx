'use client'

import { useState, useMemo } from 'react'
import { useWeekPlans } from '@/hooks/useWeekPlans'
import { useProgramTemplates } from '@/hooks/useProgramTemplates'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useSequences } from '@/hooks/useSequences'
import { getMonday, formatWeekRange, previousWeek, nextWeek } from '@/lib/calendar-utils'
import DayAssignmentModal from '@/components/DayAssignmentModal'
import type { DayAssignment, ProgramTemplate } from '@/types/workout'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarPage() {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))
  const [modalDay, setModalDay] = useState<number | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [saveError, setSaveError] = useState('')

  const { weekPlans, getWeekPlan, saveWeekPlan } = useWeekPlans()
  const { templates, saveTemplate, deleteTemplate } = useProgramTemplates()
  const { workouts, getWorkout } = useWorkoutContext()
  const { sequences, getSequence } = useSequences()

  const weekPlan = useMemo(() => getWeekPlan(currentMonday), [currentMonday, weekPlans, getWeekPlan])

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
    if (!confirm(`Apply "${template.title}" to this week? This will overwrite all current day assignments.`)) return
    const days = [...template.days] as typeof weekPlan.days
    saveWeekPlan({ ...weekPlan, days })
  }

  const currentDay = modalDay
  const currentAssignment = currentDay !== null ? weekPlan.days[currentDay] : null

  return (
    <div className="flex flex-col lg:flex-row min-h-screen p-4 max-w-6xl mx-auto gap-4">
      {/* Calendar */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Week nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonday(previousWeek(currentMonday))}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
          >
            ◀
          </button>
          <h1 className="text-lg font-semibold">{formatWeekRange(currentMonday)}</h1>
          <button
            onClick={() => setCurrentMonday(nextWeek(currentMonday))}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
          >
            ▶
          </button>
        </div>

        {/* 7-column grid */}
        <div className="grid grid-cols-7 gap-2">
          {DAY_NAMES.map((name, i) => {
            const d = new Date(currentMonday + 'T00:00:00')
            d.setDate(d.getDate() + i)
            const dayNum = d.getDate()
            const assignment = weekPlan.days[i]

            return (
              <button
                key={i}
                onClick={() => setModalDay(i)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-500 transition-colors min-h-24 text-left"
              >
                <span className="text-xs text-zinc-400 font-medium">{name}</span>
                <span className="text-lg font-bold">{dayNum}</span>
                {assignment ? (
                  <DayCellContent
                    assignment={assignment}
                    getWorkout={getWorkout}
                    getSequence={getSequence}
                  />
                ) : (
                  <span className="text-xs text-zinc-500 mt-1">Rest</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Template sidebar */}
      <aside className="w-full lg:w-64 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-zinc-800 pt-4 lg:pt-0 lg:pl-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Templates</h2>

        {/* Save current week */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Template name…"
            value={templateName}
            onChange={(e) => { setTemplateName(e.target.value); setSaveError('') }}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {saveError && <p className="text-xs text-red-400">{saveError}</p>}
          <button
            onClick={handleSaveTemplate}
            disabled={!templateName.trim()}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-medium transition-colors"
          >
            Save current week as template
          </button>
        </div>

        {/* Template list */}
        <div className="flex flex-col gap-2">
          {templates.length === 0 && (
            <p className="text-sm text-zinc-500">No templates saved yet.</p>
          )}
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
            >
              <span className="text-sm font-medium truncate">{t.title}</span>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleApplyTemplate(t)}
                  className="px-2 py-1 rounded bg-green-700 hover:bg-green-600 text-xs transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="px-2 py-1 rounded bg-red-800 hover:bg-red-700 text-xs transition-colors"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Modal */}
      {modalDay !== null && (
        <DayAssignmentModal
          dayIndex={modalDay}
          currentAssignment={currentAssignment}
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

/** Renders the assigned workout/sequence name + duration, or "(deleted)" if stale reference. */
function DayCellContent({
  assignment,
  getWorkout,
  getSequence,
}: {
  assignment: DayAssignment
  getWorkout: (id: string) => { title: string; intervals: { duration: number }[] } | undefined
  getSequence: (id: string) => { title: string } | undefined
}) {
  if (assignment.workoutId) {
    const w = getWorkout(assignment.workoutId)
    if (!w) return <span className="text-xs text-zinc-500 mt-1 italic">(deleted)</span>
    const totalSec = w.intervals.reduce((s, i) => s + i.duration, 0)
    return (
      <>
        <span className="text-xs font-medium truncate w-full text-center">{w.title}</span>
        <span className="text-[10px] text-zinc-400">{formatDuration(totalSec)}</span>
      </>
    )
  }
  if (assignment.sequenceId) {
    const s = getSequence(assignment.sequenceId)
    if (!s) return <span className="text-xs text-zinc-500 mt-1 italic">(deleted)</span>
    // ponytail: sequence duration is computed at play time from its workouts — display title only
    return <span className="text-xs font-medium truncate w-full text-center">{s.title}</span>
  }
  return null
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
