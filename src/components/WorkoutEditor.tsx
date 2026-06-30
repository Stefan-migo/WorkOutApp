'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { IntervalRow } from '@/components/IntervalRow'
import { TimelineStrip } from '@/components/TimelineStrip'
import { IntervalDetailSheet } from '@/components/IntervalDetailSheet'
import { flattenWorkout } from '@/lib/interval-engine'
import { useExercises } from '@/hooks/useExercises'
import type { Interval, Workout } from '@/types/workout'

// ponytail: counter ID, upgrade to crypto.randomUUID if collisions become an issue
let nextId = 1
function generateId(): string {
  return `workout-${Date.now()}-${nextId++}`
}

// ponytail: simple counter for interval IDs
let intervalIdCounter = 1
function intervalId(): string {
  return `int-${intervalIdCounter++}`
}

const DEFAULT_INTERVALS: Interval[] = [
  { id: intervalId(), type: 'prepare', title: 'Prepare', duration: 10 },
  { id: intervalId(), type: 'cooldown', title: 'Cooldown', duration: 10 },
]

type AddBlockType = 'prepare' | 'work' | 'rest' | 'cooldown'

const DEFAULT_DURATIONS: Record<AddBlockType, number> = {
  prepare: 180,
  work: 30,
  rest: 30,
  cooldown: 120,
}

export function createInterval(type: AddBlockType): Interval {
  return {
    id: intervalId(),
    type,
    title: type.charAt(0).toUpperCase() + type.slice(1),
    duration: DEFAULT_DURATIONS[type],
  }
}

// ponytail: exhaustive map so Tailwind v4 resolves all class strings
const SEGMENT_CLASSES: Record<AddBlockType, { bg: string; text: string; border: string; bg10: string }> = {
  prepare: { bg: 'bg-segment-prepare', text: 'text-segment-prepare', border: 'border-t-segment-prepare', bg10: 'bg-segment-prepare/10' },
  work: { bg: 'bg-segment-work', text: 'text-segment-work', border: 'border-t-segment-work', bg10: 'bg-segment-work/10' },
  rest: { bg: 'bg-segment-rest', text: 'text-segment-rest', border: 'border-t-segment-rest', bg10: 'bg-segment-rest/10' },
  cooldown: { bg: 'bg-segment-cooldown', text: 'text-segment-cooldown', border: 'border-t-segment-cooldown', bg10: 'bg-segment-cooldown/10' },
}

const TYPE_ICONS: Record<AddBlockType, string> = {
  prepare: 'self_improvement',
  work: 'directions_run',
  rest: 'pause_circle',
  cooldown: 'ac_unit',
}

interface WorkoutEditorProps {
  existingWorkout?: Workout
  onSave: (workout: Workout) => void
  onCancel?: () => void
}

export default function WorkoutEditor({ existingWorkout, onSave, onCancel }: WorkoutEditorProps) {
  const [title, setTitle] = useState(existingWorkout?.title ?? '')
  const [intervals, setIntervals] = useState<Interval[]>(existingWorkout?.intervals ?? DEFAULT_INTERVALS)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const { exercises } = useExercises()

  // ponytail: synthetic workout object for flatten; temp id/createdAt/updatedAt not persisted
  const flat = useMemo(
    () => flattenWorkout({ id: '', title: '', intervals, createdAt: 0, updatedAt: 0 }),
    [intervals],
  )

  // ponytail: dirty flag on user interaction, no deep compare
  const dirtyRef = useRef(false)
  // ponytail: markDirty is declared but currently unused; kept for future beforeunled check
  const markDirty = () => { dirtyRef.current = true }
  const hasChanges = dirtyRef.current

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ponytail: reuse flat for total to avoid double-flatten; equals totalDuration() result
  const totalDurationSec = flat.reduce((s, i) => s + i.duration, 0)
  const totalMin = Math.floor(totalDurationSec / 60)
  const totalSec = totalDurationSec % 60

  function handleAdd(interval: Interval) {
    dirtyRef.current = true
    setIntervals((prev) => [...prev, interval])
  }

  function handleChange(index: number, interval: Interval) {
    dirtyRef.current = true
    // ponytail: force prepare on first, cooldown on last — no UI to opt out
    const forcedType =
      index === 0 ? 'prepare' as const
      : index === intervals.length - 1 ? 'cooldown' as const
      : interval.type
    setIntervals((prev) => {
      const next = [...prev]
      next[index] = { ...interval, type: forcedType }
      return next
    })
  }

  function handleRemove(index: number) {
    dirtyRef.current = true
    setIntervals((prev) => prev.filter((_, i) => i !== index))
  }

  // ponytail: direct array swap, no drag & drop, no library
  function handleMoveUp(index: number) {
    if (index <= 0) return
    dirtyRef.current = true
    setIntervals((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function handleMoveDown(index: number) {
    dirtyRef.current = true
    setIntervals((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  // ponytail: click timeline block → open sheet for that original interval
  function handleTimelineClick(idx: number) {
    const fi = flat[idx]
    if (fi.isGenerated) return
    const origIdx = intervals.findIndex((i) => i.id === fi.id)
    if (origIdx >= 0) setEditingIndex(origIdx)
  }

  function handleSheetSave(updated: Interval) {
    if (editingIndex === null) return
    dirtyRef.current = true
    setIntervals((prev) => {
      const next = [...prev]
      next[editingIndex] = updated
      return next
    })
    setEditingIndex(null)
  }

  function handleSave() {
    if (!title.trim() || intervals.length === 0) return
    const workout: Workout = existingWorkout
      ? { ...existingWorkout, title: title.trim(), intervals, updatedAt: Date.now() }
      : { id: generateId(), title: title.trim(), intervals, createdAt: Date.now(), updatedAt: Date.now() }
    onSave(workout)
  }

  const canSave = title.trim().length > 0 && intervals.length > 0

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={title}
          placeholder="Workout title"
          className="flex-1 text-2xl font-bold bg-transparent border-b border-transparent hover:border-outline-variant focus:border-secondary outline-none text-on-surface placeholder:text-on-surface-variant"
          onChange={(e) => { dirtyRef.current = true; setTitle(e.target.value) }}
        />
        <span className="font-mono text-on-surface-variant text-sm tabular-nums shrink-0">
          {totalMin}:{String(totalSec).padStart(2, '0')}
        </span>
      </div>

      {intervals.length > 0 && (
        <TimelineStrip intervals={flat} onIntervalClick={handleTimelineClick} />
      )}

      {intervals.length === 0 ? (
        <p className="text-on-surface-variant text-center py-12">Add intervals to build your workout</p>
      ) : (
        <div className="flex flex-col gap-2">
          {intervals.map((interval, i) => (
            <IntervalRow
              key={interval.id}
              interval={interval}
              index={i}
              onChange={handleChange}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={i === 0}
              isLast={i === intervals.length - 1}
            />
          ))}
        </div>
      )}

      {editingIndex !== null && (
        <IntervalDetailSheet
          interval={intervals[editingIndex]}
          onSave={handleSheetSave}
          onClose={() => setEditingIndex(null)}
          exercises={exercises}
        />
      )}

      {/* Add Block bento grid */}
      <div className="pt-lg border-t border-outline-variant/30 mt-xl">
        <h3 className="font-label text-label-caps uppercase text-on-surface-variant mb-md text-center tracking-widest">Add Block</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {(['prepare', 'work', 'rest', 'cooldown'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleAdd(createInterval(type))}
              className={`glass-card p-md rounded-xl flex flex-col items-center justify-center gap-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 ${SEGMENT_CLASSES[type].border} group`}
            >
              <div className={`w-10 h-10 rounded-full ${SEGMENT_CLASSES[type].bg10} ${SEGMENT_CLASSES[type].text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined">{TYPE_ICONS[type]}</span>
              </div>
              <span className="font-label text-label-caps uppercase text-on-surface font-semibold">{type}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-3 bg-primary-container hover:bg-primary disabled:bg-surface-container-low disabled:text-on-surface-variant text-on-primary rounded-lg font-medium transition-colors"
      >
        {existingWorkout ? 'Update Workout' : 'Save Workout'}
      </button>
    </div>
  )
}
