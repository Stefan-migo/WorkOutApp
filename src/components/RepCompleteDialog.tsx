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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-6">
        <h2 className="font-headline-md text-headline-md text-white">Complete Set</h2>

        {/* Reps input */}
        <div className="w-full flex flex-col gap-2">
          <label className="font-data-sm text-data-sm text-gray-400">
            ¿Cuántas reps hiciste?
          </label>
          <input
            type="number"
            min={0}
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white font-body-lg text-body-lg border border-white/20 focus:outline-none focus:border-white/50"
            aria-label="¿Cuántas reps hiciste?"
          />
        </div>

        {/* Weight input — optional */}
        {plannedWeight !== undefined && (
          <div className="w-full flex flex-col gap-2">
            <label className="font-data-sm text-data-sm text-gray-400">
              Peso (kg)
            </label>
            <input
              type="number"
              min={0}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white font-body-lg text-body-lg border border-white/20 focus:outline-none focus:border-white/50"
              aria-label="Peso (kg)"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="w-full flex gap-3 mt-2">
          <button
            onClick={onSkip}
            className="flex-1 px-6 py-3 rounded-full border border-white/20 text-white font-bold hover:bg-white/10 transition-colors"
            aria-label="Skip"
          >
            Skip
          </button>
          <button
            onClick={() => onConfirm(reps, plannedWeight !== undefined ? weight : undefined)}
            className="flex-1 px-6 py-3 rounded-full bg-white text-accent font-bold hover:bg-gray-200 transition-colors"
            aria-label="Confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
