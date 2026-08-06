'use client'

import { useState } from 'react'

interface RepCompleteDialogProps {
  plannedReps: number
  plannedWeight?: number
  onConfirm: (actualReps: number, weight?: number) => void
  onSkip: () => void
}

// ponytail: simple modal with inputs and confirm/skip. No animation library.
export function RepCompleteDialog({ plannedReps, plannedWeight, onConfirm, onSkip }: RepCompleteDialogProps) {
  const [reps, setReps] = useState(plannedReps)
  const [weight, setWeight] = useState(plannedWeight ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80">
      <div className="bg-timer-surface rounded-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-6">
        <h2 className="font-headline-md text-headline-md text-timer-on">Complete Set</h2>

        {/* Reps input */}
        <div className="w-full flex flex-col gap-2">
          <label className="font-data-sm text-data-sm text-timer-muted">
            How many reps did you complete?
          </label>
          <input
            type="number"
            min={0}
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-lg bg-timer-on/10 text-timer-on font-body-lg text-body-lg border border-timer-border focus:outline-none focus:border-timer-border"
            aria-label="How many reps did you complete?"
          />
        </div>

        {/* Weight input — optional */}
        {plannedWeight !== undefined && (
          <div className="w-full flex flex-col gap-2">
            <label className="font-data-sm text-data-sm text-timer-muted">
              Weight (kg)
            </label>
            <input
              type="number"
              min={0}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-timer-on/10 text-timer-on font-body-lg text-body-lg border border-timer-border focus:outline-none focus:border-timer-border"
              aria-label="Weight (kg)"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="w-full flex gap-3 mt-2">
          <button
            onClick={onSkip}
            className="flex-1 px-6 py-3 rounded-full border border-timer-border text-timer-on font-bold hover:bg-timer-on/10 transition-colors"
            aria-label="Skip"
          >
            Skip
          </button>
          <button
            onClick={() => onConfirm(reps, plannedWeight !== undefined ? weight : undefined)}
            className="flex-1 px-6 py-3 rounded-full bg-timer-on text-accent font-bold hover:bg-timer-on/80 transition-colors"
            aria-label="Confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
