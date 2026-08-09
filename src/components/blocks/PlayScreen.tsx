import { TimerRing } from '@/components/TimerRing'
import { TimerControls } from '@/components/TimerControls'
import { ProgressBar } from '@/components/ProgressBar'
import { RepCounter } from '@/components/RepCounter'
import type { IntervalType } from '@/types/workout'
import type { TimerStatus } from '@/hooks/useTimer'

// DD-3 (WB-3): strictly presentational — props in, callbacks out. No hooks,
// no page logic, no 'use client'. TimerDisplay is never composed (WB-3d).
// Timer-era components' internal text (timer-muted) is NOT AA on the app
// background (3.82:1 < 4.5:1, verified slice A); this block's own labels use
// text-fg-2/70 (slice A precedent) and ProgressBar's label prop is omitted
// (out-of-scope internals — escalated).
interface PlayScreenProps {
  // TimerRing
  timeLeft: number
  duration: number
  intervalType: IntervalType
  label: string
  nextLabel?: string
  // TimerControls
  status: TimerStatus
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  onRestart: () => void
  onPrevious?: () => void
  onAddTime?: (seconds: number) => void
  showAddTime?: boolean
  // progress row + reps branch
  setIndex: number
  setCount: number
  totalProgress: number
  progressPercent: number
  isRepsMode: boolean
  exerciseName?: string
  reps?: number
  weight?: number
  onComplete?: () => void
}

export function PlayScreen({
  timeLeft,
  duration,
  intervalType,
  label,
  nextLabel,
  status,
  onPause,
  onResume,
  onSkip,
  onRestart,
  onPrevious,
  onAddTime,
  showAddTime,
  setIndex,
  setCount,
  totalProgress,
  progressPercent,
  isRepsMode,
  exerciseName,
  reps,
  weight,
  onComplete,
}: PlayScreenProps) {
  return (
    // Layout mirrors the play page L287-370: 2-col on lg, left title-only
    // panel (ExercisePanel deferred to page wiring), right timer surfaces.
    <div className="flex flex-col lg:flex-row gap-24 w-full max-w-6xl mx-auto items-start">
      {/* Left column — title-only panel */}
      <div className="w-full lg:w-1/2 flex justify-center lg:sticky lg:top-24">
        <h2 className="font-headline-lg text-headline-lg text-fg-2 text-center">{label}</h2>
      </div>

      {/* Right column — timer + controls + progress */}
      <div className="w-full lg:w-1/2 flex flex-col items-center gap-12">
        {isRepsMode ? (
          <RepCounter
            exerciseName={exerciseName ?? label}
            reps={reps ?? 0}
            weight={weight}
            onComplete={onComplete ?? (() => {})}
          />
        ) : (
          <>
            <TimerRing
              timeLeft={timeLeft}
              duration={duration}
              intervalType={intervalType}
              label={label}
              nextLabel={nextLabel}
            />
            <TimerControls
              status={status}
              onPause={onPause}
              onResume={onResume}
              onSkip={onSkip}
              onRestart={onRestart}
              onPrevious={onPrevious}
              onAddTime={onAddTime}
              showAddTime={showAddTime}
            />
          </>
        )}

        {/* Progress row */}
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-8">
            <span className="font-data-sm text-data-sm text-fg-2/70">Total Progress</span>
            <span className="font-data-sm text-data-sm text-fg-2">{progressPercent}%</span>
          </div>
          <ProgressBar progress={totalProgress} dark />
          <div className="flex justify-between w-full font-label-caps text-label-caps text-fg-2/70 mt-8">
            <span>
              Set {setIndex + 1} of {setCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
