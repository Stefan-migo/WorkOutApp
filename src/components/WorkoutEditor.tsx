'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { IntervalRow } from '@/components/IntervalRow'
import { TimelineStrip } from '@/components/TimelineStrip'
import { IntervalDetailSheet } from '@/components/IntervalDetailSheet'
import { SEGMENT_BG, SEGMENT_TEXT, SEGMENT_DOT, TYPE_ICONS } from '@/lib/segment-styles'
import { flattenWorkout } from '@/lib/interval-engine'
import { useExercises } from '@/hooks/useExercises'
import type { Exercise, Interval, Workout } from '@/types/workout'

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

export function buildExerciseInterval(exercise: Exercise): Interval {
  return {
    id: intervalId(),
    type: 'work',
    title: exercise.name,
    duration: 60,
    exerciseId: exercise.id,
  }
}

// ponytail: exhaustive map so Tailwind v4 resolves all class strings
const SEGMENT_CLASSES: Record<AddBlockType, { bg: string; text: string; border: string; bg10: string }> = {
  prepare: { bg: SEGMENT_DOT.prepare, text: SEGMENT_TEXT.prepare, border: 'border-t-segment-prepare', bg10: SEGMENT_BG.prepare },
  work: { bg: SEGMENT_DOT.work, text: SEGMENT_TEXT.work, border: 'border-t-segment-work', bg10: SEGMENT_BG.work },
  rest: { bg: SEGMENT_DOT.rest, text: SEGMENT_TEXT.rest, border: 'border-t-segment-rest', bg10: SEGMENT_BG.rest },
  cooldown: { bg: SEGMENT_DOT.cooldown, text: SEGMENT_TEXT.cooldown, border: 'border-t-segment-cooldown', bg10: SEGMENT_BG.cooldown },
}

interface WorkoutEditorProps {
  existingWorkout?: Workout
  initialIntervals?: Interval[]
  onSave: (workout: Workout) => void
  onCancel?: () => void
}

export default function WorkoutEditor({ existingWorkout, initialIntervals, onSave, onCancel }: WorkoutEditorProps) {
  const [title, setTitle] = useState(existingWorkout?.title ?? '')
  const [intervals, setIntervals] = useState<Interval[]>(existingWorkout?.intervals ?? initialIntervals ?? DEFAULT_INTERVALS)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const { exercises } = useExercises()

  // ponytail: synthetic workout object for flatten; temp id/createdAt/updatedAt not persisted
  const flat = useMemo(
    () => flattenWorkout({ id: '', title: '', intervals, createdAt: 0, updatedAt: 0 }),
    [intervals],
  )

  // ponytail: dirty flag on user interaction, no deep compare
  const dirtyRef = useRef(false)

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
      ;[next[index - 1], next[index]] = [next[index]!, next[index - 1]!]
      return next
    })
  }

  function handleMoveDown(index: number) {
    dirtyRef.current = true
    setIntervals((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index]!, next[index + 1]!] = [next[index + 1]!, next[index]!]
      return next
    })
  }

  // ponytail: cycle bracket — CSS-only visual, no JS drag-to-group
  function handleCycleCountChange(parentIndex: number, count: number) {
    dirtyRef.current = true
    setIntervals((prev) => {
      const next = [...prev]
      const parent = next[parentIndex]!
      next[parentIndex] = { ...parent, cycleCount: count }
      return next
    })
  }

  function handleChildChange(parentIndex: number, childIndex: number, child: Interval) {
    dirtyRef.current = true
    setIntervals((prev) => {
      const next = [...prev]
      const parent = next[parentIndex]!
      if (!parent.children) return prev
      const children = [...parent.children] as Interval[]
      children[childIndex] = child
      next[parentIndex] = { ...parent, children }
      return next
    })
  }

  function handleRemoveChild(parentIndex: number, childIndex: number) {
    dirtyRef.current = true
    setIntervals((prev) => {
      const next = [...prev]
      const parent = next[parentIndex]!
      if (!parent.children) return prev
      const children = parent.children.filter((_, i) => i !== childIndex)
      next[parentIndex] = (children.length === 0
        ? { ...parent, children: undefined }
        : { ...parent, children }) as Interval
      return next
    })
  }

  function handleChildMoveUp(parentIndex: number, childIndex: number) {
    if (childIndex <= 0) return
    dirtyRef.current = true
    setIntervals((prev) => {
      const next = [...prev]
      const parent = next[parentIndex]!
      if (!parent.children) return prev
      const children = [...parent.children] as Interval[]
      ;[children[childIndex - 1]!, children[childIndex]!] = [children[childIndex]!, children[childIndex - 1]!]
      next[parentIndex] = { ...parent, children }
      return next
    })
  }

  function handleChildMoveDown(parentIndex: number, childIndex: number) {
    dirtyRef.current = true
    setIntervals((prev) => {
      const next = [...prev]
      const parent = next[parentIndex]!
      if (!parent.children || childIndex >= parent.children.length - 1) return prev
      const children = [...parent.children] as Interval[]
      ;[children[childIndex]!, children[childIndex + 1]!] = [children[childIndex + 1]!, children[childIndex]!]
      next[parentIndex] = { ...parent, children }
      return next
    })
  }

  // ponytail: wraps last 2 top-level intervals; no selection UI
  function handleWrapInCycle() {
    dirtyRef.current = true
    setIntervals((prev) => {
      if (prev.length < 2) return prev
      const lastTwo = prev.slice(-2)
      const cycle: Interval = {
        id: intervalId(),
        type: 'work',
        title: 'Block',
        duration: 0,
        children: lastTwo,
        cycleCount: 4,
      }
      return [...prev.slice(0, -2), cycle]
    })
  }

  // ponytail: click timeline block → open sheet for that original interval
  function handleTimelineClick(idx: number) {
    const fi = flat[idx]
    if (!fi || fi.isGenerated) return
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
    <div className="max-w-2xl mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col gap-6">
      <div className="glass-card rounded-xl p-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-24">
        <div className="w-full md:w-2/3">
          <label className="block font-label text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider">Workout Title</label>
          <input
            type="text"
            value={title}
            placeholder="Name your workout..."
            className="w-full bg-transparent border-0 border-b-2 border-outline-variant pb-xs font-headline text-headline-lg text-on-surface focus:border-secondary focus:ring-0 transition-colors px-0 outline-none placeholder:text-outline/50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            onChange={(e) => { dirtyRef.current = true; setTitle(e.target.value) }}
          />
        </div>
        <div className="text-right w-full md:w-auto">
          <span className="block font-label text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider">Est. Duration</span>
          <div className="font-mono text-display-timer-mobile text-primary tracking-tighter">
            {totalMin}:{String(totalSec).padStart(2, '0')}
          </div>
        </div>
      </div>

      {intervals.length > 0 && (
        <TimelineStrip intervals={flat} onIntervalClick={handleTimelineClick} />
      )}

      {intervals.length === 0 ? (
        <div className="glass-card rounded-xl p-24 flex flex-col items-center justify-center gap-16 text-center py-[64px] border-dashed border-2 border-outline-variant/30">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40">playlist_add</span>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface font-bold">No intervals yet</p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Add blocks below to build your workout</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {intervals.map((interval, i) => {
            if (interval.children?.length) {
              const childTotal = interval.children.reduce((s, ch) => s + ch.duration, 0)
              const childMin = Math.floor(childTotal / 60)
              const childSec = childTotal % 60
              return (
                <div key={interval.id} className="mt-24 relative">
                  {/* Cycle Bracket — CSS-only visual */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 border-l-2 border-y-2 border-outline-variant/40 rounded-l-lg z-0 pointer-events-none" />
                  {/* Cycle Header */}
                  <div className="flex justify-between items-center pl-8 pr-16 py-xs mb-8 relative z-10">
                    <div className="flex items-center gap-8">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">{interval.title} Cycle</span>
                      <span className="bg-surface-dim px-8 py-[2px] rounded text-label-caps font-data-sm text-on-surface font-bold">
                        Total: {childMin}:{String(childSec).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Repeats:</span>
                      <select
                        value={interval.cycleCount ?? 4}
                        onChange={(e) => handleCycleCountChange(i, Number(e.target.value))}
                        className="bg-surface border border-outline-variant/50 rounded px-2 py-1 text-data-sm font-data-sm text-primary font-bold focus:ring-secondary focus:border-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                      >
                        {[2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>x{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Children rendered indented inside the bracket */}
                  <div className="space-y-8 ml-8 relative z-10">
                    {interval.children.map((child, ci) => (
                      <IntervalRow
                        key={child.id}
                        interval={child}
                        index={ci}
                        onChange={(_idx, updated) => handleChildChange(i, ci, updated)}
                        onRemove={() => handleRemoveChild(i, ci)}
                        onMoveUp={() => handleChildMoveUp(i, ci)}
                        onMoveDown={() => handleChildMoveDown(i, ci)}
                        isFirst={ci === 0}
                        isLast={ci === interval.children!.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )
            }
            return (
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
            )
          })}
        </div>
      )}

      {editingIndex !== null && (
        <IntervalDetailSheet
          interval={intervals[editingIndex]!}
          onSave={handleSheetSave}
          onClose={() => setEditingIndex(null)}
          exercises={exercises}
        />
      )}

      {/* Add Block bento grid */}
      <div className="pt-24 border-t border-outline-variant/30 mt-32">
        <h3 className="font-label text-label-caps uppercase text-on-surface-variant mb-16 text-center tracking-widest">Add Block</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
          {(['prepare', 'work', 'rest', 'cooldown'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleAdd(createInterval(type))}
              className={`glass-card p-16 rounded-xl flex flex-col items-center justify-center gap-8 hover:-translate-y-1 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${SEGMENT_CLASSES[type].border} group`}
            >
              <div className={`w-10 h-10 rounded-full ${SEGMENT_CLASSES[type].bg10} ${SEGMENT_CLASSES[type].text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined">{TYPE_ICONS[type]}</span>
              </div>
              <span className="font-label text-label-caps uppercase text-on-surface font-semibold">{type}</span>
            </button>
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <button
            onClick={handleWrapInCycle}
            disabled={intervals.length < 2}
            className="flex items-center gap-8 px-24 py-8 rounded-lg bg-surface border border-outline-variant hover:border-primary hover:bg-surface-dim transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">data_object</span>
            <span className="font-label-caps text-label-caps uppercase font-bold text-primary">Wrap in Cycle</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-surface border border-outline-variant text-on-surface rounded-lg font-medium transition-colors hover:bg-surface-dim font-label text-label-caps uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Discard
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 py-3 bg-primary-container hover:bg-primary disabled:bg-surface-container-low disabled:text-on-surface-variant text-on-primary rounded-lg font-medium transition-colors font-label text-label-caps uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          {existingWorkout ? 'Update Workout' : 'Save Workout'}
        </button>
      </div>
    </div>
  )
}
