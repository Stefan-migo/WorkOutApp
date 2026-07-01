'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import type { DayAssignment, Workout, Sequence } from '@/types/workout'
import { formatDuration } from '@/lib/format'

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
      className="rounded-xl bg-surface border border-outline-variant/50 text-on-surface p-24 w-full max-w-md m-auto backdrop:bg-black/10 max-h-[85vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Assign Day {dayIndex + 1}
        </h2>

        {/* Radio: Workout / Sequence */}
        <fieldset className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-body-md text-sm">
            <input
              type="radio"
              name="mode"
              value="workout"
              checked={mode === 'workout'}
              onChange={() => { setMode('workout'); setSelectedId(''); setSearch('') }}
              className="accent-secondary"
            />
            Workout
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-body-md text-sm">
            <input
              type="radio"
              name="mode"
              value="sequence"
              checked={mode === 'sequence'}
              onChange={() => { setMode('sequence'); setSelectedId(''); setSearch('') }}
              className="accent-secondary"
            />
            Sequence
          </label>
        </fieldset>

        {/* Search */}
        <input
          type="text"
          placeholder={`Search ${mode}s\u2026`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/50 text-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
        />

        {/* Items list */}
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-body-md text-sm text-on-surface-variant py-2">
              No {mode}s{search ? ' matching search' : ' available'}.
            </p>
          )}
          {filtered.map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedId === item.id
                  ? 'bg-secondary-container/20 border border-secondary'
                  : 'hover:bg-surface-container-low border border-transparent'
              }`}
            >
              <input
                type="radio"
                name="selectedId"
                value={item.id}
                checked={selectedId === item.id}
                onChange={() => setSelectedId(item.id)}
                className="accent-secondary"
              />
              <div className="min-w-0">
                <div className="text-body-md text-sm font-medium text-on-surface truncate">
                  {item.title}
                </div>
                {'intervals' in item && (
                  <div className="text-data-sm text-xs text-on-surface-variant">
                    {formatDuration(item.intervals.reduce((s, i) => s + i.duration, 0))}
                  </div>
                )}
                {'workoutIds' in item && item.workoutIds && (
                  <div className="text-data-sm text-xs text-on-surface-variant">
                    {item.workoutIds.length} workout
                    {item.workoutIds.length !== 1 && 's'} &middot; x{item.repeatCount}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="font-label-caps text-label-caps text-on-surface-variant">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/50 text-body-md text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 rounded-lg text-sm bg-error-container text-on-error-container font-label-caps text-label-caps hover:bg-error hover:text-on-error transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm bg-surface-container-low text-on-surface font-label-caps text-label-caps hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedId}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-on-primary font-label-caps text-label-caps hover:bg-primary/90 disabled:opacity-40 transition-colors ambient-shadow"
            >
              Assign
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}


