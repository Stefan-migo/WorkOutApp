'use client'

import { useState, useEffect, useRef } from 'react'
import type { Interval, Exercise } from '@/types/workout'

interface IntervalDetailSheetProps {
  interval: Interval
  onSave: (updated: Interval) => void
  onClose: () => void
  exercises?: Exercise[]
}

export function IntervalDetailSheet({ interval, onSave, onClose, exercises }: IntervalDetailSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState(interval.title)
  const [duration, setDuration] = useState(interval.duration)
  const [description, setDescription] = useState(interval.description ?? '')
  const [exerciseId, setExerciseId] = useState(interval.exerciseId ?? '')
  const [cycleCount, setCycleCount] = useState(interval.cycleCount ?? 1)
  const [setCount, setSetCount] = useState(interval.setCount ?? 1)
  const [restBetweenCycles, setRestBetweenCycles] = useState(interval.restBetweenCycles ?? 0)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  function handleSave() {
    onSave({
      ...interval,
      title,
      duration,
      description: description || undefined,
      exerciseId: exerciseId || undefined,
      cycleCount,
      setCount,
      restBetweenCycles,
    })
    dialogRef.current?.close()
  }

  function handleCancel() {
    dialogRef.current?.close()
  }

  // ponytail: native close event covers Escape, Cancel button, and backdrop click
  function handleDialogClose() {
    onClose()
  }

  // ponytail: CSS in <style> tag — no extra file, no CSS-in-JS lib
  return (
    <>
      <style>{`
        @keyframes interval-sheet-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .interval-sheet {
          animation: interval-sheet-slide-up 0.3s ease-out;
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
          background: var(--color-surface, #fff);
          max-height: 85vh;
          overflow-y: auto;
        }
        .interval-sheet::backdrop {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <dialog
        ref={dialogRef}
        className="interval-sheet"
        onClose={handleDialogClose}
      >
        <div className="p-6 flex flex-col gap-5">
          {/* ponytail: no drag handle — add only if users need to grab-and-drag */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{interval.type}</span>
          </div>

          {/* Title */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </label>

          {/* Duration */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant">Duration (seconds)</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(3600, Number(e.target.value))))}
              min={1}
              max={3600}
              className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm w-28 border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </label>

          {/* Exercise select — only for work type */}
          {interval.type === 'work' && exercises && exercises.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-on-surface-variant">Exercise</span>
              <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary"
              >
                <option value="">No exercise</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </label>
          )}

          {/* Description */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm border border-outline-variant resize-none focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </label>

          {/* Nesting section — shown when interval has children or non-default nesting values */}
          {(interval.children && interval.children.length > 0) &&
            <div className="border-t border-outline-variant pt-4 flex flex-col gap-4">
              <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Nesting</span>
              <div className="flex gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-on-surface-variant">Cycles</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCycleCount(Math.max(1, cycleCount - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-surface-container-low rounded-lg text-on-surface hover:bg-surface-container text-sm font-medium"
                      aria-label="Decrease cycle count"
                    >−</button>
                    <span className="w-8 text-center text-sm font-mono tabular-nums text-on-surface">{cycleCount}</span>
                    <button
                      onClick={() => setCycleCount(Math.min(99, cycleCount + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-surface-container-low rounded-lg text-on-surface hover:bg-surface-container text-sm font-medium"
                      aria-label="Increase cycle count"
                    >+</button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-on-surface-variant">Sets</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSetCount(Math.max(1, setCount - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-surface-container-low rounded-lg text-on-surface hover:bg-surface-container text-sm font-medium"
                      aria-label="Decrease set count"
                    >−</button>
                    <span className="w-8 text-center text-sm font-mono tabular-nums text-on-surface">{setCount}</span>
                    <button
                      onClick={() => setSetCount(Math.min(99, setCount + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-surface-container-low rounded-lg text-on-surface hover:bg-surface-container text-sm font-medium"
                      aria-label="Increase set count"
                    >+</button>
                  </div>
                </div>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-on-surface-variant">Rest between cycles (seconds)</span>
                <input
                  type="number"
                  value={restBetweenCycles}
                  onChange={(e) => setRestBetweenCycles(Math.max(0, Math.min(600, Number(e.target.value))))}
                  min={0}
                  max={600}
                  className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm w-28 border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </label>
            </div>
          }

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-surface-container-low text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-primary-container text-on-primary rounded-lg font-medium hover:opacity-90 transition-colors text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
