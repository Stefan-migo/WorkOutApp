'use client'

import { useState, useEffect, useRef } from 'react'
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
  const dialogRef = useRef<HTMLDialogElement>(null)

  // ponytail: modal is conditionally mounted → fresh state per open, no sync effect needed
  const [durationStr, setDurationStr] = useState(formatTime(interval.actualDuration))
  const [completed, setCompleted] = useState(interval.completed)
  const [actualReps, setActualReps] = useState(interval.actualReps ?? 0)
  const [weight, setWeight] = useState(interval.weight ?? 0)
  const [note, setNote] = useState(interval.notes ?? '')

  const hasRepData =
    interval.actualReps != null || interval.plannedReps != null || interval.weight != null
  const showRepInputs = interval.type === 'work' && hasRepData

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

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
      <style>{`
        @keyframes interval-edit-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .interval-edit-sheet {
          animation: interval-edit-slide-up 0.3s ease-out;
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          margin: 0;
          width: 100%;
          max-width: 32rem;
          border: none;
          padding: 0;
          border-radius: 12px 12px 0 0;
          max-height: 85vh;
          overflow-y: auto;
        }
        .interval-edit-sheet::backdrop {
          background: color-mix(in srgb, var(--color-surface) 80%, transparent);
        }
      `}</style>
      <dialog
        ref={dialogRef}
        className="interval-edit-sheet bg-surface text-fg-2"
        onClose={onClose}
        onClick={handleBackdropClick}
      >
        <div className="p-6 flex flex-col gap-5">
          {/* Header — read-only title + type */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted font-medium uppercase tracking-wider">
              {typeLabel}
            </span>
            <h3 className="font-headline-md text-headline-md text-fg-2">{title}</h3>
          </div>

          {/* Actual duration (MM:SS) */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Actual duration (MM:SS)</span>
            <input
              type="text"
              value={durationStr}
              onChange={(e) => setDurationStr(e.target.value)}
              placeholder="MM:SS"
              inputMode="numeric"
              className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-sm w-32 border border-border focus:outline-none focus:ring-1 focus:ring-secondary"
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
              <label className="flex flex-col gap-1.5 flex-1">
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
                  className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-sm w-full border border-border focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </label>
              <label className="flex flex-col gap-1.5 flex-1">
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
                  className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-sm w-full border border-border focus:outline-none focus:ring-1 focus:ring-secondary"
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
              className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-sm border border-border resize-none focus:outline-none focus:ring-1 focus:ring-secondary placeholder:text-muted/50"
            />
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-surface text-fg-2 rounded-lg font-medium hover:bg-surface-warm transition-colors text-sm focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-accent text-accent-on rounded-lg font-label-caps text-label-caps hover:bg-accent/90 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              Save
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
