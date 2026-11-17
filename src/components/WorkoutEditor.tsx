'use client'

import { formatDuration } from '@/lib/format'
import { PageHeading } from '@/components/ui/PageHeading'
import { Fragment, useMemo, useState, useEffect, useRef, useReducer, useId } from 'react'
import { IntervalApplyDialog, EDIT_FIELDS, type EditField } from '@/components/IntervalApplyDialog'
import { IntervalRow } from '@/components/IntervalRow'
import { TimelineStrip } from '@/components/TimelineStrip'
import { IntervalDetailSheet } from '@/components/IntervalDetailSheet'
import { getLocalIntervalImageReference, uploadExerciseMedia } from '@/lib/exercise-media'
import { useExercises } from '@/hooks/useExercises'
import { SEGMENT_BG, SEGMENT_TEXT, TYPE_ICONS, TYPE_LABELS } from '@/lib/segment-styles'
import { workoutReducer } from '@/lib/workout-reducer'
import { createInterval } from '@/components/WorkoutBuilder'
import { detectCycles, isInCycle, getMatchingWorkIndexes } from '@/lib/detect-cycles'
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

const ADD_BLOCK_TYPES: IntervalType[] = ['prepare', 'work', 'rest', 'rest_between_cycles', 'cooldown']

interface WorkoutEditorProps {
  existingWorkout?: Workout
  initialIntervals?: Interval[]
  onSave: (workout: Workout) => void | Promise<void>
  onCancel?: () => void
}

export default function WorkoutEditor({ existingWorkout, initialIntervals, onSave, onCancel }: WorkoutEditorProps) {
  const { exercises, getExerciseImages } = useExercises()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
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
  const exerciseById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises])
  const groups = intervals.reduce<{ cycle: ReturnType<typeof isInCycle>; indexes: number[] }[]>((result, _, index) => {
    const cycle = isInCycle(index, cycles)
    const previous = result.at(-1)
    if (previous && previous.cycle === cycle) previous.indexes.push(index)
    else result.push({ cycle, indexes: [index] })
    return result
  }, [])

  function markDirty() { dirtyRef.current = true }

  function handleAdd(type: IntervalType, index?: number) {
    markDirty()
    dispatch({ type: 'ADD_INTERVAL', interval: createInterval(type), index })
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

  // ponytail: DragState â€” simple flat index only
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // ponytail: wheel scroll during HTML5 DnD â€” browser blocks scroll, so we handle it manually
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

  function handleRowClick(idx: number) {
    setOriginalInterval(intervals[idx]!)
    setEditingIndex(idx)
  }

  // Bulk apply state
  const [bulkPrompt, setBulkPrompt] = useState<{
    type: IntervalType
    changes: Partial<Interval>
    changedFields: EditField[]
    index: number
    matchingIndexes: number[]
  } | null>(null)

  function handleSheetSave(updated: Interval) {
    if (editingIndex === null) return
    markDirty()
    dispatch({ type: 'CHANGE_INTERVAL', index: editingIndex, interval: updated })
    setEditingIndex(null)

    // Detect changes for bulk apply
    if (originalInterval) {
      const changes: Partial<Interval> = {}
      const changedFields: EditField[] = []
      // ponytail: reps always checked so reps-mode changes bulk-apply; safe since undefined !== undefined is false
      for (const key of EDIT_FIELDS) {
        const defaultValue = key === 'mode' ? existingWorkout?.mode ?? 'timed' : undefined
        if ((updated[key] ?? defaultValue) !== (originalInterval[key] ?? defaultValue)) {
          ;(changes as Record<string, unknown>)[key] = updated[key]
          changedFields.push(key)
        }
      }
      if (changedFields.length > 0) {
        // Check if there are other intervals of the same type
        if (intervals.some((interval, index) => index !== editingIndex && interval.type === updated.type)) {
          setBulkPrompt({ type: updated.type, changes, changedFields, index: editingIndex, matchingIndexes: getMatchingWorkIndexes(intervals, editingIndex) })
          return
        }
      }
    }
    setOriginalInterval(null)
  }

  function handleBulkApply(matchingOnly = false) {
    if (!bulkPrompt) return
    markDirty()
    for (let i = 0; i < intervals.length; i++) {
      if (matchingOnly ? bulkPrompt.matchingIndexes.includes(i) : i !== bulkPrompt.index && intervals[i]?.type === bulkPrompt.type) {
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

  async function handleSave() {
    if (saving || !title.trim() || intervals.length === 0) return
    const workout: Workout = existingWorkout
      ? { ...existingWorkout, title: title.trim(), intervals, updatedAt: Date.now() }
      : { id: generateId(), title: title.trim(), intervals, createdAt: Date.now(), updatedAt: Date.now() }
    setSaving(true)
    setSaveError('')
    try {
      await onSave(workout)
      dirtyRef.current = false
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save the workout. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const titleId = useId()
  const canSave = title.trim().length > 0 && intervals.length > 0

  function renderRow(index: number) {
    const interval = intervals[index]!
    return (
      <IntervalRow
        key={interval.id}
        interval={interval}
        exercise={exerciseById.get(interval.exerciseId ?? '')}
        index={index}
        onEdit={() => handleRowClick(index)}
        onRemove={handleRemove}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        isFirst={index === 0}
        isLast={index === intervals.length - 1}
        dragIndex={dragIndex}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-24">
      <PageHeading title={existingWorkout ? 'Edit workout' : 'New workout'} />
      <section aria-label="Workout overview" className="grid gap-16 rounded-2xl border border-border-soft bg-surface p-16">
        <label htmlFor={titleId} className="grid gap-xs text-sm font-semibold text-fg-2">
          Workout name
          <input
            id={titleId}
            type="text"
            value={title}
            placeholder="Name your workout..."
            className="w-full min-w-0 rounded-lg border border-border bg-surface-warm px-16 py-8 text-base text-fg-2 focus-visible:focus-ring"
            onChange={(event) => { markDirty(); setTitle(event.target.value) }}
          />
        </label>
        <div className="flex flex-wrap items-baseline gap-x-16 gap-y-xs text-sm text-muted">
          <span><strong className="font-mono text-base text-fg-2">{formatDuration(totalDurationSec)}</strong> estimated</span>
          <span>{intervals.length} {intervals.length === 1 ? 'block' : 'blocks'}</span>
          {cycles.length > 0 && <span>{cycles.length} {cycles.length === 1 ? 'cycle' : 'cycles'}</span>}
        </div>
        {intervals.length > 0 && <TimelineStrip intervals={intervals} onIntervalClick={handleRowClick} />}
      </section>

      <section aria-labelledby={`${titleId}-blocks`} className="grid gap-16">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <h2 id={`${titleId}-blocks`} className="text-xl font-semibold text-fg-2">Workout blocks</h2>
            {intervals.length > 0 && <p className="text-sm text-muted">Select a block to edit it. Use its menu to reorder or remove it.</p>}
          </div>
          <a href={`#${titleId}-add`} className="inline-flex min-h-[44px] items-center gap-xs rounded-lg border border-border-soft bg-surface px-16 text-sm font-semibold text-accent hover:bg-surface-warm focus-visible:focus-ring">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Add block
          </a>
        </div>
        {intervals.length === 0 && <p className="rounded-xl border border-dashed border-border-soft p-16 text-sm text-muted">No intervals yet. Choose a block type below to get started.</p>}
        {groups.map(({ cycle, indexes }, groupIndex) => (
          <Fragment key={intervals[indexes[0]!]!.id}>
            {cycle && groups[groupIndex - 1]?.cycle && (
              <button
                type="button"
                onClick={() => handleAdd('rest_between_cycles', cycle.startIdx)}
                className="flex min-h-[44px] items-center justify-center gap-8 rounded-lg border border-dashed border-border-soft px-8 text-sm font-semibold text-accent hover:bg-surface-warm focus-visible:focus-ring"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">add</span>
                Add rest between cycles
              </button>
            )}
            {cycle ? (
              <section aria-label={cycle.label} className="grid gap-8 rounded-2xl border border-border-soft bg-surface-warm p-8 sm:p-16">
                <header className="flex flex-wrap items-baseline justify-between gap-8 px-8 py-xs">
                  <h3 className="font-semibold text-fg-2">{cycle.label}</h3>
                  <span className="text-xs text-muted">{indexes.length} {indexes.length === 1 ? 'block' : 'blocks'}</span>
                </header>
                {indexes.map(renderRow)}
              </section>
            ) : (
              <div className="grid gap-8">{indexes.map(renderRow)}</div>
            )}
          </Fragment>
        ))}
      </section>

      <section id={`${titleId}-add`} tabIndex={-1} className="grid scroll-mt-16 gap-8 rounded-2xl border border-border-soft bg-surface p-16">
        <h2 className="text-lg font-semibold text-fg-2">Add a block</h2>
        <p className="text-sm text-muted">New blocks are added at the end of the workout.</p>
        <div className="flex flex-wrap gap-8">
          {ADD_BLOCK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAdd(type)}
              className="inline-flex min-h-[44px] items-center gap-8 rounded-lg border border-border-soft px-8 py-xs text-sm font-medium text-fg-2 hover:bg-surface-warm focus-visible:focus-ring"
            >
              <span aria-hidden="true" className={`material-symbols-outlined rounded-md p-xs text-[20px] ${SEGMENT_BG[type]} ${SEGMENT_TEXT[type]}`}>{TYPE_ICONS[type]}</span>
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </section>

      {editingIndex !== null && intervals[editingIndex] && (
        <IntervalDetailSheet
          interval={intervals[editingIndex]!}
          onSave={handleSheetSave}
          onClose={() => { setEditingIndex(null); setOriginalInterval(null) }}
          exercises={exercises}
          onImageUpload={uploadExerciseMedia}
          onSyncLocalImage={async () => {
            const interval = intervals[editingIndex]!
            const reference = getLocalIntervalImageReference(interval)
            const images = await getExerciseImages(reference?.owner ?? interval.id)
            const image = reference?.blobId
              ? images.find((item) => item.blobId === reference.blobId)
              : images.at(-1)
            if (!image) throw new Error('This image is unavailable in this browser. Attach the original file again.')
            const blob = await (await fetch(image.blobUrl)).blob()
            return uploadExerciseMedia(new File([blob], 'exercise-image', { type: blob.type }))
          }}
        />
      )}

      {/* Bulk apply dialog */}
      {bulkPrompt && (
        <IntervalApplyDialog
          type={bulkPrompt.type}
          changedFields={bulkPrompt.changedFields}
          allCount={intervals.filter((interval) => interval.type === bulkPrompt.type).length}
          matchingCount={bulkPrompt.matchingIndexes.length + 1}
          onApplyAll={() => handleBulkApply()}
          onApplyMatching={bulkPrompt.matchingIndexes.length ? () => handleBulkApply(true) : undefined}
          onApplyOne={handleBulkApplyOne}
        />
      )}

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 grid gap-8 rounded-xl border border-border-soft bg-surface p-8 shadow-fab md:bottom-8">
        {saveError && <p role="alert" className="px-8 text-sm text-danger">{saveError}</p>}
        <div className="flex justify-end gap-8">
          {onCancel && (
            <button
              disabled={saving}
              onClick={() => { if (!dirtyRef.current || window.confirm('Discard your unsaved workout changes?')) onCancel() }}
              className="min-h-[44px] rounded-lg px-16 text-sm font-medium text-fg-2 hover:bg-surface-warm focus-visible:focus-ring"
            >
              Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="min-h-[44px] rounded-lg bg-accent px-16 text-sm font-semibold text-accent-on hover:bg-accent-hover focus-visible:focus-ring disabled:opacity-50"
          >
            {saving ? 'Saving…' : existingWorkout ? 'Save changes' : 'Save workout'}
          </button>
        </div>
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
