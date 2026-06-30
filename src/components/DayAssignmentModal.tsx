'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import type { DayAssignment, Workout, Sequence } from '@/types/workout'

export interface DayAssignmentModalProps {
  dayIndex: number
  currentAssignment?: DayAssignment | null
  workouts: Workout[]
  sequences: Sequence[]
  onAssign: (dayIndex: number, assignment: DayAssignment) => void
  onClear: (dayIndex: number) => void
  onClose: () => void
}

// ponytail: native <dialog> — no modal lib, no portal, no focus-trap dep
export default function DayAssignmentModal({
  dayIndex,
  currentAssignment,
  workouts,
  sequences,
  onAssign,
  onClear,
  onClose,
}: DayAssignmentModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'workout' | 'sequence'>(
    currentAssignment?.workoutId ? 'workout' : 'sequence',
  )
  const [selectedId, setSelectedId] = useState(
    currentAssignment?.workoutId ?? currentAssignment?.sequenceId ?? '',
  )
  const [notes, setNotes] = useState(currentAssignment?.notes ?? '')
  const [search, setSearch] = useState('')

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    onAssign(dayIndex, {
      ...(mode === 'workout' ? { workoutId: selectedId } : { sequenceId: selectedId }),
      notes: notes || undefined,
    })
  }

  function handleClear() {
    onClear(dayIndex)
    onClose()
  }

  const items = mode === 'workout' ? workouts : sequences
  const filtered = search
    ? items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="rounded-xl bg-zinc-900 border border-zinc-700 text-white p-6 w-full max-w-md backdrop:bg-black/60"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Assign Day {dayIndex + 1}</h2>

        {/* Radio: Workout / Sequence */}
        <fieldset className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="workout"
              checked={mode === 'workout'}
              onChange={() => { setMode('workout'); setSelectedId(''); setSearch('') }}
              className="accent-blue-500"
            />
            Workout
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="sequence"
              checked={mode === 'sequence'}
              onChange={() => { setMode('sequence'); setSelectedId(''); setSearch('') }}
              className="accent-blue-500"
            />
            Sequence
          </label>
        </fieldset>

        {/* Search */}
        <input
          type="text"
          placeholder={`Search ${mode}s…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Items list */}
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-sm text-zinc-500 py-2">
              No {mode}s{search ? ' matching search' : ' available'}.
            </p>
          )}
          {filtered.map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedId === item.id
                  ? 'bg-blue-600/20 border border-blue-500'
                  : 'hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <input
                type="radio"
                name="selectedId"
                value={item.id}
                checked={selectedId === item.id}
                onChange={() => setSelectedId(item.id)}
                className="accent-blue-500"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{item.title}</div>
                {'intervals' in item && (
                  <div className="text-xs text-zinc-400">
                    {formatDuration(item.intervals.reduce((s, i) => s + i.duration, 0))}
                  </div>
                )}
                {'workoutIds' in item && item.workoutIds && (
                  <div className="text-xs text-zinc-400">
                    {item.workoutIds.length} workout{item.workoutIds.length !== 1 && 's'} &middot; x{item.repeatCount}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-xs text-zinc-400 uppercase tracking-wider">Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 rounded-lg text-sm bg-red-700 hover:bg-red-600 transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm bg-zinc-700 hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedId}
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
            >
              Assign
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
