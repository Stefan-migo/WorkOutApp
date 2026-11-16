'use client'

import { useState, useId } from 'react'
import { useIntervalDialog } from '@/hooks/useIntervalDialog'
import { formatTime } from '@/lib/format'
import { parseDurationInput } from '@/lib/session-intervals'
import type { CompletedInterval } from '@/types/workout'

interface IntervalEditModalProps {
  interval: CompletedInterval
  /** Read-only header title (already resolved for display, e.g. "Work 1") */
  title: string
  /** Read-only type label, e.g. "Effort" */
  typeLabel: string
  onSave: (patch: Partial<CompletedInterval>) => void
  onClose: () => void
}

export function IntervalEditModal({ interval, title, typeLabel, onSave, onClose }: IntervalEditModalProps) {
  const dialogRef = useIntervalDialog()
  const headingId = useId()

  // ponytail: modal is conditionally mounted → fresh state per open, no sync effect needed
  const [durationStr, setDurationStr] = useState(formatTime(interval.actualDuration))
  const [completed, setCompleted] = useState(interval.completed)
  const [actualReps, setActualReps] = useState(interval.actualReps ?? 0)
  const [weight, setWeight] = useState(interval.weight ?? 0)
  const [note, setNote] = useState(interval.notes ?? '')

  const hasRepData =
    interval.actualReps != null || interval.plannedReps != null || interval.weight != null
  const showRepInputs = interval.type === 'work' && hasRepData

  // ponytail: native close event covers Escape and Cancel; backdrop click handled on the dialog
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) dialogRef.current?.close()
  }

  function handleSave() {
    // ponytail: keep original duration when MM:SS parse fails (mirrors IntervalRow default)
    const parsed = parseDurationInput(durationStr)
    onSave({
      actualDuration: parsed ?? interval.actualDuration,
      completed,
      ...(showRepInputs
        ? { actualReps: actualReps || undefined, weight: weight > 0 ? weight : undefined }
        : {}),
      notes: note.trim() || undefined,
    })
  }

  function handleCancel() {
    dialogRef.current?.close()
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className="interval-sheet"
        aria-labelledby={headingId}
        onClose={onClose}
        onClick={handleBackdropClick}
      >
        <div className="interval-sheet-content">
          {/* Header — read-only title + type */}
          <div className="interval-sheet-heading">
            <span className="text-xs text-muted font-medium uppercase tracking-wider">
              {typeLabel}
            </span>
            <h2 id={headingId} className="break-words text-xl font-semibold">{title}</h2>
          </div>

          {/* Actual duration (MM:SS) */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Actual duration (MM:SS)</span>
            <input
              type="text"
              value={durationStr}
              onChange={(e) => setDurationStr(e.target.value)}
              placeholder="MM:SS"
              className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base w-32 border border-border focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>

          {/* Completed toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-fg-2">Completed</span>
          </label>

          {/* Reps + weight — only for work intervals with rep data */}
          {showRepInputs && (
            <div className="flex gap-3">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-xs text-muted">Actual reps</span>
                <input
                  type="number"
                  value={actualReps || ''}
                  onChange={(e) =>
                    setActualReps(e.target.value ? Math.max(0, Math.min(999, Number(e.target.value))) : 0)
                  }
                  min={0}
                  max={999}
                  placeholder="0"
                  className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base w-full border border-border focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-xs text-muted">Weight (kg)</span>
                <input
                  type="number"
                  value={weight || ''}
                  onChange={(e) =>
                    setWeight(e.target.value ? Math.max(0, Math.min(9999, Number(e.target.value))) : 0)
                  }
                  min={0}
                  max={9999}
                  placeholder="0"
                  className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base w-full border border-border focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
            </div>
          )}

          {/* Note */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Notes</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add notes about this interval (weight, fatigue, etc.)"
              className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base border border-border resize-none focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/50"
            />
          </label>

          {/* Actions */}
          <div className="interval-sheet-actions">
            <button
              onClick={handleCancel}
              autoFocus
              className="flex-1 py-3 bg-surface text-fg-2 rounded-lg font-medium hover:bg-surface-warm transition-colors text-sm focus-visible:focus-ring"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-accent text-accent-on rounded-lg font-label-caps text-label-caps hover:bg-accent/90 transition-colors text-sm focus-visible:focus-ring"
            >
              Save
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
