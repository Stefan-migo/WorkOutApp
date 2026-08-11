import { TimerRing } from '@/components/TimerRing'
import { TimerControls } from '@/components/TimerControls'
import { ProgressBar } from '@/components/ProgressBar'
import { RepCounter } from '@/components/RepCounter'
import type { IntervalType } from '@/types/workout'
import type { TimerStatus } from '@/hooks/useTimer'

// DD-3 (WB-3): strictly presentational — props in, callbacks out. No hooks,
// no page logic, no 'use client'. TimerDisplay is never composed (WB-3d).
// Full-bleed contract: the block owns the viewport (min-h-dvh). When
// `imageUrl` is provided, two aria-hidden absolute layers render behind the
// content — the exercise image (CSS background, exercises/page.tsx precedent)
// and a bg-token scrim that fades the image into the app background. Content
// is one centered column on all viewports: top context row (exercise name in
// timed mode only — RepCounter owns it in reps mode — plus the Set counter),
// centered timer/reps surface, and the total-progress row pinned at the
// bottom. Timer-era components' internal text (timer-muted) is NOT AA on the
// app background (3.82:1 < 4.5:1, verified slice A); this block's own labels
// use text-fg-2/70 (slice A precedent) and ProgressBar's label prop is
// omitted (out-of-scope internals — escalated).
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
  // full-bleed background
  imageUrl?: string
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
  imageUrl,
}: PlayScreenProps) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden">
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
            className="absolute inset-0 bg-linear-to-b from-bg/40 via-bg/50 to-bg/95"
          />
        </>
      )}

      <div className="relative z-10 flex min-h-dvh w-full max-w-2xl flex-col items-center mx-auto gap-12 py-24">
        {/* Top context row — Set counter always; name only in timed mode */}
        <div className="w-full flex items-center">
          {!isRepsMode && (
            <h2 className="font-label-caps text-label-caps text-fg-2/70">{exerciseName ?? label}</h2>
          )}
          <span className="ml-auto font-label-caps text-label-caps text-fg-2/70">
            Set {setIndex + 1} of {setCount}
          </span>
        </div>

        {/* Center — timer or reps surface */}
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-12">
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
        </div>

        {/* Bottom progress */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-8">
            <span className="font-data-sm text-data-sm text-fg-2/70">Total Progress</span>
            <span className="font-data-sm text-data-sm text-fg-2">{progressPercent}%</span>
          </div>
          <ProgressBar progress={totalProgress} dark />
        </div>
      </div>
    </div>
  )
}
