'use client'

import { useMemo, useState, useEffect, useRef, useReducer } from 'react'
import { IntervalRow } from '@/components/IntervalRow'
import { TimelineStrip } from '@/components/TimelineStrip'
import { IntervalDetailSheet } from '@/components/IntervalDetailSheet'
import { useExercises } from '@/hooks/useExercises'
import { SEGMENT_BG, SEGMENT_TEXT, SEGMENT_DOT, TYPE_ICONS } from '@/lib/segment-styles'
import { workoutReducer } from '@/lib/workout-reducer'
import { createInterval } from '@/components/WorkoutBuilder'
import { detectCycles, isInCycle } from '@/lib/detect-cycles'
import type { Exercise, Interval, IntervalType, Workout } from '@/types/workout'

// ponytail: counter ID, upgrade to crypto.randomUUID if collisions become an issue
let nextId = 1
function generateId(): string {
  return `workout-${Date.now()}-${nextId++}`
}

const DEFAULT_INTERVALS: Interval[] = [
  { id: crypto.randomUUID(), type: 'prepare', title: 'Prepare', duration: 10 },
  { id: crypto.randomUUID(), type: 'cooldown', title: 'Cooldown', duration: 10 },
]

// ponytail: exhaustive map so Tailwind v4 resolves all class strings
const ADD_BLOCK_TYPES: IntervalType[] = ['prepare', 'work', 'rest', 'rest_between_cycles', 'cooldown']

const SEGMENT_CLASSES: Record<IntervalType, { bg: string; text: string; border: string; bg10: string }> = {
  prepare: { bg: SEGMENT_DOT.prepare, text: SEGMENT_TEXT.prepare, border: 'border-t-segment-prepare', bg10: SEGMENT_BG.prepare },
  work: { bg: SEGMENT_DOT.work, text: SEGMENT_TEXT.work, border: 'border-t-segment-work', bg10: SEGMENT_BG.work },
  rest: { bg: SEGMENT_DOT.rest, text: SEGMENT_TEXT.rest, border: 'border-t-segment-rest', bg10: SEGMENT_BG.rest },
  rest_between_cycles: { bg: SEGMENT_DOT.rest_between_cycles, text: SEGMENT_TEXT.rest_between_cycles, border: 'border-t-segment-rest', bg10: SEGMENT_BG.rest_between_cycles },
  cooldown: { bg: SEGMENT_DOT.cooldown, text: SEGMENT_TEXT.cooldown, border: 'border-t-segment-cooldown', bg10: SEGMENT_BG.cooldown },
}

// ---------------------------------------------------------------------------
// BulkApplyDialog
// ---------------------------------------------------------------------------
function BulkApplyDialog({
  type,
  changedFields,
  onApplyAll,
  onApplyOne,
}: {
  type: IntervalType
  changedFields: string[]
  onApplyAll: () => void
  onApplyOne: () => void
}) {
  const label = type.replace(/_/g, ' ')
  return (
    <>
      <style>{`
        @keyframes bulk-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .bulk-sheet {
          animation: bulk-slide-up 0.25s ease-out;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onApplyOne} />
      <div className="fixed inset-0 z-50 flex items-end justify-center pb-24">
        <div
          className="bulk-sheet bg-surface rounded-2xl shadow-xl border border-outline-variant/30 p-24 w-full max-w-md mx-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-12 mb-16">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-2">
              <span className="material-symbols-outlined text-accent text-[22px]">sync_alt</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-fg-2 font-bold mb-4">
                Apply to all {label}?
              </h3>
              <p className="font-body-md text-body-md text-muted">
                You changed <strong className="text-fg-2">{changedFields.join(', ')}</strong>. Do you want to apply this change to all <strong className="text-fg-2">{label}</strong> intervals?
              </p>
            </div>
          </div>
          <div className="flex gap-8">
            <button
              onClick={onApplyOne}
              className="flex-1 py-10 bg-surface border border-outline-variant text-fg-2 rounded-xl font-medium hover:bg-surface transition-colors"
            >
              Just this one
            </button>
            <button
              onClick={onApplyAll}
              className="flex-1 py-10 bg-accent hover:bg-accent-hover text-accent-on rounded-xl font-medium transition-colors"
            >
              Apply to all
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// WorkoutEditor
// ---------------------------------------------------------------------------
interface WorkoutEditorProps {
  existingWorkout?: Workout
  initialIntervals?: Interval[]
  onSave: (workout: Workout) => void
  onCancel?: () => void
}

export default function WorkoutEditor({ existingWorkout, initialIntervals, onSave, onCancel }: WorkoutEditorProps) {
  const { exercises, saveExerciseImage } = useExercises()
  const [title, setTitle] = useState(existingWorkout?.title ?? '')
  const [intervals, dispatch] = useReducer(
    workoutReducer,
    existingWorkout?.intervals ?? initialIntervals ?? DEFAULT_INTERVALS,
  )
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [originalInterval, setOriginalInterval] = useState<Interval | null>(null)

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

  const cycles = useMemo(() => detectCycles(intervals), [intervals])

  const totalDurationSec = intervals.reduce((s, i) => s + i.duration, 0)
  const totalMin = Math.floor(totalDurationSec / 60)
  const totalSec = totalDurationSec % 60

  function markDirty() { dirtyRef.current = true }

  function handleAdd(type: IntervalType) {
    markDirty()
    dispatch({ type: 'ADD_INTERVAL', interval: createInterval(type) })
  }

  function handleChange(index: number, interval: Interval) {
    markDirty()
    dispatch({ type: 'CHANGE_INTERVAL', index, interval })
  }

  function handleRemove(index: number) {
    markDirty()
    dispatch({ type: 'REMOVE_INTERVAL', index })
  }

  function handleMoveUp(index: number) {
    if (index <= 0) return
    markDirty()
    dispatch({ type: 'REORDER', fromIndex: index, toIndex: index - 1 })
  }

  function handleMoveDown(index: number) {
    if (index >= intervals.length - 1) return
    markDirty()
    dispatch({ type: 'REORDER', fromIndex: index, toIndex: index + 1 })
  }

  // ponytail: DragState — simple flat index only
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // ponytail: wheel scroll during HTML5 DnD — browser blocks scroll, so we handle it manually
  useEffect(() => {
    if (dragIndex === null) return
    function onWheel(e: WheelEvent) {
      window.scrollBy(0, e.deltaY)
      e.preventDefault()
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [dragIndex])

  function handleDragStart(i: number) { setDragIndex(i) }
  function handleDragOver(e: React.DragEvent, i: number) {
    if (dragIndex === null || dragIndex === i) return
    e.preventDefault()
    // Auto-scroll when near viewport edges (fixes HTML5 DnD scroll lock)
    const threshold = 60
    const cy = e.clientY
    if (cy < threshold) window.scrollBy(0, Math.max(cy - threshold, -12))
    else if (cy > window.innerHeight - threshold) window.scrollBy(0, Math.min(cy - (window.innerHeight - threshold), 12))
  }
  function handleDrop(i: number) {
    if (dragIndex === null || dragIndex === i) return
    markDirty()
    dispatch({ type: 'REORDER', fromIndex: dragIndex, toIndex: i })
    setDragIndex(null)
  }
  function handleDragEnd() { setDragIndex(null) }

  function handleTimelineClick(idx: number) {
    if (idx >= 0 && idx < intervals.length) {
      setOriginalInterval(intervals[idx]!)
      setEditingIndex(idx)
    }
  }

  function handleRowClick(idx: number) {
    setOriginalInterval(intervals[idx]!)
    setEditingIndex(idx)
  }

  // Bulk apply state
  const [bulkPrompt, setBulkPrompt] = useState<{
    type: IntervalType
    changes: Partial<Interval>
    changedFields: string[]
    index: number
  } | null>(null)

  function handleSheetSave(updated: Interval) {
    if (editingIndex === null) return
    markDirty()
    dispatch({ type: 'CHANGE_INTERVAL', index: editingIndex, interval: updated })
    setEditingIndex(null)

    // Detect changes for bulk apply
    if (originalInterval) {
      const changes: Partial<Interval> = {}
      const changedFields: string[] = []
      // ponytail: reps always checked so reps-mode changes bulk-apply; safe since undefined !== undefined is false
      for (const key of ['title', 'duration', 'description', 'imageUrl', 'reps'] as const) {
        if (updated[key] !== originalInterval[key]) {
          ;(changes as Record<string, unknown>)[key] = updated[key]
          changedFields.push(key)
        }
      }
      if (changedFields.length > 0) {
        // Check if there are other intervals of the same type
        const sameType = intervals.filter((_, i) => i !== editingIndex && intervals[i]?.type === updated.type)
        if (sameType.length > 0) {
          setBulkPrompt({ type: updated.type, changes, changedFields, index: editingIndex })
          return
        }
      }
    }
    setOriginalInterval(null)
  }

  function handleBulkApplyAll() {
    if (!bulkPrompt) return
    markDirty()
    for (let i = 0; i < intervals.length; i++) {
      if (i !== bulkPrompt.index && intervals[i]?.type === bulkPrompt.type) {
        dispatch({ type: 'CHANGE_INTERVAL', index: i, interval: { ...intervals[i]!, ...bulkPrompt.changes } })
      }
    }
    setBulkPrompt(null)
    setOriginalInterval(null)
  }

  function handleBulkApplyOne() {
    setBulkPrompt(null)
    setOriginalInterval(null)
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
      <div className="glass-card rounded-xl p-16 flex flex-col gap-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-24">
          <div className="w-full md:w-2/3">
            <label className="block font-label text-label-caps text-muted mb-xs uppercase tracking-wider">Workout Title</label>
            <input
              type="text"
              value={title}
              placeholder="Name your workout..."
              className="w-full bg-transparent border-0 border-b-2 border-outline-variant pb-xs font-headline text-headline-lg text-fg-2 focus:border-accent focus:ring-0 transition-colors px-0 outline-none placeholder:text-outline/50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              onChange={(e) => { markDirty(); setTitle(e.target.value) }}
            />
          </div>
          <div className="text-right w-full md:w-auto">
            <span className="block font-label text-label-caps text-muted mb-xs uppercase tracking-wider">Est. Duration</span>
            <div className="font-mono text-display-timer-mobile text-accent tracking-tighter">
              {totalMin}:{String(totalSec).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {intervals.length > 0 && (
        <TimelineStrip intervals={intervals} onIntervalClick={handleTimelineClick} />
      )}

      {intervals.length === 0 ? (
        <div className="glass-card rounded-xl p-24 flex flex-col items-center justify-center gap-16 text-center py-[64px] border-dashed border-2 border-outline-variant/30">
          <span className="material-symbols-outlined text-[40px] text-muted/40">playlist_add</span>
          <div>
            <p className="font-headline-md text-headline-md text-fg-2 font-bold">No intervals yet</p>
            <p className="font-body-md text-body-md text-muted mt-xs">Add blocks below to build your workout</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {intervals.map((interval, i) => {
            const cycle = isInCycle(i, cycles)
            const isFirstInCycle = cycle && i === cycle.startIdx
            return (
              <div key={interval.id} className="relative">
                {/* Cycle bracket indicator */}
                {cycle && (
                  <div
                    className={`absolute left-0 top-0 w-1 rounded-full bg-accent/40 ${isFirstInCycle ? 'h-full' : 'h-full'}`}
                    style={{ minHeight: isFirstInCycle ? '100%' : undefined }}
                  />
                )}

                {/* Cycle label at start */}
                {isFirstInCycle && (
                  <div className="flex items-center gap-2 mb-2 ml-4">
                    <span className="text-body-xs text-accent font-medium uppercase tracking-wider">
                      {cycle!.label}
                    </span>
                    <div className="h-px flex-1 bg-accent/20" />
                  </div>
                )}

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(i) } }}
                  className={cycle ? 'ml-4' : ''}
                >
                  <IntervalRow
                    interval={interval}
                    index={i}
                    onChange={handleChange}
                    onRemove={handleRemove}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isFirst={i === 0}
                    isLast={i === intervals.length - 1}
                    dragIndex={dragIndex}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Block grid — 5 types, no Cycle */}
      <div className="pt-24 border-t border-outline-variant/30 mt-32">
        <h3 className="font-label text-label-caps uppercase text-muted mb-16 text-center tracking-widest">Add Block</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-12">
          {ADD_BLOCK_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleAdd(type)}
              className={`glass-card p-12 rounded-xl flex flex-col items-center justify-center gap-6 hover:-translate-y-1 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${SEGMENT_CLASSES[type].border} group`}
            >
              <div className={`w-10 h-10 rounded-full ${SEGMENT_CLASSES[type].bg10} ${SEGMENT_CLASSES[type].text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined">{TYPE_ICONS[type]}</span>
              </div>
              <span className="font-label text-label-caps uppercase text-fg-2 font-semibold text-[10px] leading-tight text-center">{type.replace(/_/g, ' ')}</span>
            </button>
          ))}
        </div>
      </div>

      {editingIndex !== null && intervals[editingIndex] && (
        <IntervalDetailSheet
          interval={intervals[editingIndex]!}
          onSave={handleSheetSave}
          onClose={() => { setEditingIndex(null); setOriginalInterval(null) }}
          exercises={exercises}
          onImageUpload={(file) => saveExerciseImage(intervals[editingIndex]!.id, file)}
        />
      )}

      {/* Bulk apply dialog */}
      {bulkPrompt && (
        <BulkApplyDialog
          type={bulkPrompt.type}
          changedFields={bulkPrompt.changedFields}
          onApplyAll={handleBulkApplyAll}
          onApplyOne={handleBulkApplyOne}
        />
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-surface border border-outline-variant text-fg-2 rounded-lg font-medium transition-colors hover:bg-surface font-label text-label-caps uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Discard
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 py-3 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-muted text-accent-on rounded-lg font-medium transition-colors font-label text-label-caps uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          {existingWorkout ? 'Update Workout' : 'Save Workout'}
        </button>
      </div>
    </div>
  )
}

export function buildExerciseInterval(exercise: Exercise): Interval {
  return {
    id: crypto.randomUUID(),
    type: 'work',
    title: exercise.name,
    duration: 60,
    exerciseId: exercise.id,
  }
}
