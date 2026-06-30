'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { IntervalRow } from '@/components/IntervalRow'
import { IntervalForm } from '@/components/IntervalForm'
import type { Interval } from '@/types/workout'

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

export default function NewWorkoutPage() {
  const { saveWorkout } = useWorkoutContext()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [intervals, setIntervals] = useState<Interval[]>(DEFAULT_INTERVALS)

  // ponytail: dirty flag on user interaction, no deep compare
  const dirtyRef = useRef(false)
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

  const totalDuration = intervals.reduce((s, i) => s + i.duration, 0)
  const totalMin = Math.floor(totalDuration / 60)
  const totalSec = totalDuration % 60

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

  function handleSave() {
    if (!title.trim() || intervals.length === 0) return
    saveWorkout({
      id: generateId(),
      title: title.trim(),
      intervals,
      createdAt: Date.now(),
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
          className="flex-1 text-2xl font-bold bg-transparent border-b border-transparent hover:border-zinc-600 focus:border-blue-500 outline-none placeholder:text-zinc-600"
          onChange={(e) => { dirtyRef.current = true; setTitle(e.target.value) }}
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
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
      >
        Save Workout
      </button>
    </div>
  )
}
