'use client'

import { useState, useRef, useEffect, useId, type FormEvent } from 'react'
import type { DayAssignment, Workout, Sequence } from '@/types/workout'
import { formatDuration } from '@/lib/format'
import { Button } from '@/components/ui/Button'

export interface DayAssignmentModalProps {
  dayIndex: number
  currentAssignment?: DayAssignment | null
  workouts: Workout[]
  sequences: Sequence[]
  onAssign: (dayIndex: number, assignment: DayAssignment) => void
  onClear: (dayIndex: number) => void
  onClose: () => void
}

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
  const id = useId()
  const [mode, setMode] = useState<'workout' | 'sequence'>(
    currentAssignment?.sequenceId && !currentAssignment.workoutId ? 'sequence' : 'workout',
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
      aria-labelledby={`${id}-title`}
      className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-dialog border border-border bg-surface p-24 text-fg-2 backdrop:bg-fg/40"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 id={`${id}-title`} className="text-headline-md text-fg-2">
          Assign {DAY_LABELS[dayIndex] ?? 'a session'}
        </h2>

        {/* Radio: Workout / Sequence */}
        <fieldset className="flex gap-4">
          <legend className="sr-only">Session type</legend>
          <label className="flex items-center gap-2 cursor-pointer text-body-md text-sm">
            <input
              type="radio"
              name="mode"
              value="workout"
              checked={mode === 'workout'}
              onChange={() => { setMode('workout'); setSelectedId(''); setSearch('') }}
              className="accent-accent"
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
              className="accent-accent"
            />
            Sequence
          </label>
        </fieldset>

        {/* Search */}
        <input
          type="search"
          aria-label={`Search ${mode}s`}
          placeholder={`Search ${mode}s\u2026`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-card bg-surface border border-border/50 text-body-md text-sm text-fg-2 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
        />

        {/* Items list */}
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-body-md text-sm text-muted py-2">
              No {mode}s{search ? ' matching search' : ' available'}.
            </p>
          )}
          {filtered.map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-card cursor-pointer transition-colors focus-within:focus-ring ${
                selectedId === item.id
                  ? 'bg-accent/20 border border-accent'
                  : 'hover:bg-surface-warm border border-transparent'
              }`}
            >
              <input
                type="radio"
                name="selectedId"
                value={item.id}
                checked={selectedId === item.id}
                onChange={() => setSelectedId(item.id)}
                className="accent-accent"
              />
              <div className="min-w-0">
                <div className="text-body-md text-sm font-medium text-fg-2 truncate">
                  {item.title}
                </div>
                {'intervals' in item && (
                  <div className="text-data-sm text-xs text-muted">
                    {formatDuration(item.intervals.reduce((s, i) => s + i.duration, 0))}
                  </div>
                )}
                {'workoutIds' in item && item.workoutIds && (
                  <div className="text-data-sm text-xs text-muted">
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
          <label htmlFor={`${id}-notes`} className="text-label-caps text-muted">
            Notes (optional)
          </label>
          <textarea
            id={`${id}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-card bg-surface border border-border/50 text-body-md text-sm text-fg-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={!currentAssignment}
            onClick={handleClear}
          >
            Clear
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              elevated
              disabled={!selectedId}
            >
              Assign
            </Button>
          </div>
        </div>
      </form>
    </dialog>
  )
}


