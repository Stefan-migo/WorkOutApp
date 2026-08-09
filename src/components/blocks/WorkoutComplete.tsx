import { Button } from '@/components/ui'

// DD-4 (WB-4): presentational completion screen. Summary uses text-fg-2/70
// (slice A precedent) — text-muted fails AA on the app bg (3.82:1 < 4.5:1).
interface WorkoutCompleteProps {
  title?: string
  intervals: number
  totalTimeMinutes: number
  onPlayAgain: () => void
  onBackHome: () => void
}

export function WorkoutComplete({
  title = 'Workout Complete!',
  intervals,
  totalTimeMinutes,
  onPlayAgain,
  onBackHome,
}: WorkoutCompleteProps) {
  return (
    <div className="flex flex-col items-center gap-4 mt-12 text-center">
      <h1 className="font-headline-lg text-headline-lg text-fg-2">{title}</h1>
      <p className="font-body-md text-body-md text-fg-2/70">
        {intervals} interval{intervals !== 1 && 's'} completed
      </p>
      <p className="font-body-md text-body-md text-fg-2/70">Total time: {totalTimeMinutes} min</p>
      <div className="flex gap-4 mt-8">
        <Button variant="primary" onClick={onPlayAgain}>
          Play Again
        </Button>
        <Button variant="ghost" onClick={onBackHome}>
          Back Home
        </Button>
      </div>
    </div>
  )
}
