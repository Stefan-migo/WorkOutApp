'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { IntervalRow } from '@/components/IntervalRow'
import { IntervalForm } from '@/components/IntervalForm'
import type { Interval } from '@/types/workout'

export default function EditWorkoutPage() {
  const { getWorkout, saveWorkout } = useWorkoutContext()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const existing = getWorkout(params.id)

  // ponytail: local state copy, syncs once on mount — no effect needed since
  // existing is resolved synchronously from localStorage via context
  const [title, setTitle] = useState(existing?.title ?? '')
  const [intervals, setIntervals] = useState<Interval[]>(existing?.intervals ?? [])

  if (!existing) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Workout not found</h1>
        <Link href="/workouts" className="text-blue-400 hover:underline">
          &larr; Back to workouts
        </Link>
      </div>
    )
  }

  const totalDuration = intervals.reduce((s, i) => s + i.duration, 0)
  const totalMin = Math.floor(totalDuration / 60)
  const totalSec = totalDuration % 60

  function handleAdd(interval: Interval) {
    setIntervals((prev) => [...prev, interval])
  }

  function handleChange(index: number, interval: Interval) {
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
    setIntervals((prev) => prev.filter((_, i) => i !== index))
  }

  // ponytail: direct array swap, no drag & drop, no library
  function handleMoveUp(index: number) {
    if (index <= 0) return
    setIntervals((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function handleMoveDown(index: number) {
    setIntervals((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
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
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Workout title"
          className="flex-1 text-2xl font-bold bg-transparent border-b border-transparent hover:border-zinc-600 focus:border-blue-500 outline-none placeholder:text-zinc-600"
        />
        <span className="font-mono text-zinc-400 text-sm tabular-nums shrink-0">
          {totalMin}:{String(totalSec).padStart(2, '0')}
        </span>
      </div>

      {intervals.length === 0 ? (
        <p className="text-zinc-500 text-center py-12">Add intervals to build your workout</p>
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

      <IntervalForm onAdd={handleAdd} />

      <button
        onClick={handleUpdate}
        disabled={!canSave}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
      >
        Update Workout
      </button>
    </div>
  )
}
