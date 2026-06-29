'use client'

import { useState } from 'react'
import type { IntervalType, Interval } from '@/types/workout'

interface IntervalFormProps {
  onAdd: (interval: Interval) => void
}

const INTERVAL_TYPES: IntervalType[] = ['prepare', 'work', 'rest', 'cooldown']

// ponytail: simple counter ID, upgrade to crypto.randomUUID if collisions become an issue
let nextId = 1
function generateId(): string {
  return `interval-${nextId++}`
}

export function IntervalForm({ onAdd }: IntervalFormProps) {
  const [type, setType] = useState<IntervalType>('work')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (duration < 5 || duration > 600) return

    onAdd({
      id: generateId(),
      type,
      title: title || type,
      duration,
    })

    setTitle('')
    setDuration(30)
    setType('work')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 p-4 rounded-lg bg-zinc-800">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as IntervalType)}
          className="bg-zinc-700 text-white rounded px-3 py-2 text-sm"
        >
          {INTERVAL_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type}
          className="bg-zinc-700 text-white rounded px-3 py-2 text-sm w-32 placeholder:text-zinc-500"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Duration (sec)</span>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Math.max(5, Math.min(600, Number(e.target.value))))}
          min={5}
          max={600}
          className="bg-zinc-700 text-white rounded px-3 py-2 text-sm w-20"
        />
      </label>
      <button
        type="submit"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded px-4 text-sm font-medium"
      >
        Add
      </button>
    </form>
  )
}
