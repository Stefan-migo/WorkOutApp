import { TimerRing } from '@/components/TimerRing'
import { TimerControls } from '@/components/TimerControls'
import { ProgressBar } from '@/components/ProgressBar'
import { RepCounter } from '@/components/RepCounter'
import type { IntervalType } from '@/types/workout'
import type { TimerStatus } from '@/hooks/useTimer'

const PHASE_NAMES: Record<IntervalType, string> = {
  prepare: 'Prepare',
  work: 'Work',
  rest: 'Rest',
  rest_between_cycles: 'Recovery',
  cooldown: 'Cool down',
}

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
  positionLabel?: string
  totalProgress: number
  progressPercent: number
  progressLabel?: string
  isRepsMode: boolean
  exerciseName?: string
  reps?: number
  weight?: number
  onComplete?: () => void
  // full-bleed background
  imageUrl?: string
  embedded?: boolean
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
  positionLabel = 'Set',
  totalProgress,
  progressPercent,
  progressLabel = 'Total progress',
  isRepsMode,
  exerciseName,
  reps,
  weight,
  onComplete,
  imageUrl,
  embedded = false,
}: PlayScreenProps) {
  return (
    <div className={`relative flex w-full flex-1 flex-col overflow-hidden ${embedded ? '' : 'min-h-dvh'}`}>
      {imageUrl && (
        <>
          {/* Exercise image — CSS background, decorative only */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          {/* Scrim — fades the image into the app background (bg token only) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-timer-bg/70 via-timer-bg/80 to-timer-bg/95"
          />
        </>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-margin-mobile py-6 md:gap-32 md:py-32">
        {/* Top context row — Set counter always; name only in timed mode */}
        <div className="w-full flex items-center">
          {!isRepsMode && (
            <h2 className="min-w-0 break-words font-headline text-body-lg font-semibold text-fg-2">{exerciseName ?? label}</h2>
          )}
          <span className="ml-auto shrink-0 pl-4 font-mono text-data-sm text-timer-muted">
            {positionLabel} {setIndex + 1} of {setCount}
          </span>
        </div>

        {/* Center — timer or reps surface */}
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 md:gap-32">
          {isRepsMode ? (
            <>
              <RepCounter
                exerciseName={exerciseName ?? label}
                reps={reps ?? 0}
                weight={weight}
                onComplete={onComplete ?? (() => {})}
              />
              {nextLabel && <p className="text-center text-data-sm text-timer-muted">{nextLabel}</p>}
            </>
          ) : (
            <>
              <TimerRing
                mobileCompact
                timeLeft={timeLeft}
                duration={duration}
                intervalType={intervalType}
                label={embedded ? PHASE_NAMES[intervalType] : label}
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
        </div>

        {/* Bottom progress */}
        <div className="relative w-full">
          <span className="absolute right-0 top-0 font-mono text-data-sm text-timer-on">{progressPercent}%</span>
          <ProgressBar progress={totalProgress} label={progressLabel} variant="plain" dark />
        </div>
      </div>
    </div>
  )
}
