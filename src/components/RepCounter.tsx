'use client'

interface RepCounterProps {
  exerciseName: string
  reps: number
  weight?: number
  onComplete: () => void
}

// ponytail: no timer, no auto-count. Manual "Complete" button. Add rep tracking if users want history mid-set.
export function RepCounter({ exerciseName, reps, weight, onComplete }: RepCounterProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      {/* Exercise name */}
      <span className="font-headline-lg text-headline-lg text-timer-on text-center">
        {exerciseName}
      </span>

      {/* Target reps in large display */}
      <span className="font-display-timer-mobile text-display-timer-mobile md:font-display-timer md:text-display-timer text-timer-on tabular-nums">
        {reps}
        <span className="font-body-md text-body-md text-timer-muted ml-2">reps</span>
      </span>

      {/* Weight if provided */}
      {weight !== undefined && (
        <span className="font-body-lg text-body-lg text-timer-muted">
          {weight} kg
        </span>
      )}

      {/* Complete button large and centered */}
      <button
        onClick={onComplete}
        className="px-16 py-6 bg-timer-on text-accent rounded-full text-xl font-bold hover:bg-timer-on/80 transition-colors mt-4"
        aria-label="Complete set"
      >
        Complete
      </button>
    </div>
  )
}
