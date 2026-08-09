import { Button } from '@/components/ui'

interface RepCounterProps {
  exerciseName: string
  reps: number
  weight?: number
  onComplete: () => void
}

// ponytail: no timer, no auto-count. Manual "Complete" button. Add rep tracking if users want history mid-set.
// DD-2: legacy timer-alias white pill -> Button primary pill; token-only colors (text-fg-2/text-muted).
export function RepCounter({ exerciseName, reps, weight, onComplete }: RepCounterProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      {/* Exercise name */}
      <span className="font-headline-lg text-headline-lg text-fg-2 text-center">
        {exerciseName}
      </span>

      {/* Target reps in large display */}
      <span className="font-display-timer-mobile text-display-timer-mobile md:font-display-timer md:text-display-timer text-fg-2 tabular-nums">
        {reps}
        <span className="font-body-md text-body-md text-fg-2/70 ml-2">reps</span>
      </span>

      {/* Weight if provided */}
      {weight !== undefined && (
        <span className="font-body-lg text-body-lg text-fg-2/70">
          {weight} kg
        </span>
      )}

      {/* Complete button large and centered */}
      <Button
        variant="primary"
        pill
        size="lg"
        className="px-12"
        aria-label="Complete set"
        onClick={onComplete}
      >
        Complete
      </Button>
    </div>
  )
}
