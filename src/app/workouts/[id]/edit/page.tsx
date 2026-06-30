'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { IntervalRow } from '@/components/IntervalRow'
import { IntervalForm } from '@/components/IntervalForm'
import { TimelineStrip } from '@/components/TimelineStrip'
import { IntervalDetailSheet } from '@/components/IntervalDetailSheet'
import { flattenWorkout } from '@/lib/interval-engine'
import { getExercises } from '@/data/exercises'
import type { Interval, Exercise } from '@/types/workout'

export default function EditWorkoutPage() {
  const { getWorkout, saveWorkout } = useWorkoutContext()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const existing = getWorkout(params.id)

  // ponytail: local state copy, syncs once on mount — no effect needed since
  // existing is resolved synchronously from localStorage via context
  const [title, setTitle] = useState(existing?.title ?? '')
  const [intervals, setIntervals] = useState<Interval[]>(existing?.intervals ?? [])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const exercises = useMemo(() => getExercises(), [])

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

  if (!existing) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold text-fg">Workout not found</h1>
        <Link href="/workouts" className="text-accent hover:underline">
          &larr; Back to workouts
        </Link>
      </div>
    )
  }

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

  function handleUpdate() {
    if (!title.trim() || intervals.length === 0 || !existing) return
    saveWorkout({
      id: existing.id,
      title: title.trim(),
      description: existing.description,
      intervals,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    })
    router.push('/workouts')
  }

  const canSave = title.trim().length > 0 && intervals.length > 0

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={title}
          placeholder="Workout title"
          className="flex-1 text-2xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-accent outline-none text-fg placeholder:text-muted"
          onChange={(e) => { dirtyRef.current = true; setTitle(e.target.value) }}
        />
        <span className="font-mono text-muted text-sm tabular-nums shrink-0">
          {totalMin}:{String(totalSec).padStart(2, '0')}
        </span>
      </div>

      {intervals.length > 0 && (
        <TimelineStrip intervals={flat} onIntervalClick={handleTimelineClick} />
      )}

      {intervals.length === 0 ? (
        <p className="text-muted text-center py-12">Add intervals to build your workout</p>
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

      <IntervalForm onAdd={handleAdd} />

      <button
        onClick={handleUpdate}
        disabled={!canSave}
        className="w-full py-3 bg-accent hover:bg-accent disabled:bg-surface-alt text-accent-on disabled:text-muted rounded-lg font-medium transition-colors"
      >
        Update Workout
      </button>
    </div>
  )
}
