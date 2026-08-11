import { TimerRing } from '@/components/TimerRing'
import { TimerControls } from '@/components/TimerControls'
import { ProgressBar } from '@/components/ProgressBar'
import { RepCounter } from '@/components/RepCounter'
import type { IntervalType } from '@/types/workout'
import type { TimerStatus } from '@/hooks/useTimer'

// PlayScreenSplit: split-layout sibling of PlayScreen (same DD-3 contract —
// strictly presentational, props in/callbacks out, no hooks, no 'use client',
// TimerDisplay never composed). With `imageUrl` the viewport splits in two:
// an image panel (mobile: 34dvh top band; lg: left half, full height) owning
// the context row (exercise name headline + Set counter) on its overlay, and
// a timer panel with a compact ring (mobileCompact) + controls + progress.
// Without `imageUrl` the flat PlayScreen structure renders verbatim.
interface PlayScreenSplitProps {
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
  // progress row
  progressVariant?: 'plain' | 'futuristic' | 'segmented'
  // split image panel
  imageUrl?: string
}

export function PlayScreenSplit({
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
  progressVariant,
  imageUrl,
}: PlayScreenSplitProps) {
  const centerSurface = isRepsMode ? (
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
        mobileCompact={!!imageUrl}
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
  )

  const progressRow = (
    <>
      <div className="flex justify-between items-center mb-8">
        <span className="font-data-sm text-data-sm text-fg-2/70">Total Progress</span>
        <span className="font-data-sm text-data-sm text-fg-2">{progressPercent}%</span>
      </div>
      <ProgressBar
        progress={totalProgress}
        dark
        variant={progressVariant}
      />
    </>
  )

  if (!imageUrl) {
    // Flat fallback — PlayScreen no-image structure verbatim.
    return (
      <div className="relative flex min-h-dvh w-full flex-col overflow-hidden">
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
            {centerSurface}
          </div>

          {/* Bottom progress */}
          <div className="w-full">{progressRow}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden lg:flex-row">
      {/* Image panel — owns the context row (name + Set counter) on its overlay */}
      <div className="relative h-[34dvh] w-full lg:h-dvh lg:w-1/2">
        {/* Exercise image — CSS background, decorative only */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        {/* Scrim — fades the image into the app background (bg token only) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-transparent via-bg/20 to-bg/90"
        />
        {/* Context overlay — name only in timed mode (RepCounter owns it in reps) */}
        <div className="absolute bottom-0 inset-x-0 flex items-end justify-between p-16 lg:p-24">
          {!isRepsMode && (
            <h2 className="font-headline-lg text-headline-lg text-fg-2">{exerciseName ?? label}</h2>
          )}
          <span className="ml-auto font-label-caps text-label-caps text-fg-2/70">
            Set {setIndex + 1} of {setCount}
          </span>
        </div>
      </div>

      {/* Timer panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-12 py-16 lg:w-1/2 lg:py-24">
        {centerSurface}

        {/* Bottom progress — no Set row here (it lives on the image overlay) */}
        <div className="w-full max-w-2xl px-16">{progressRow}</div>
      </div>
    </div>
  )
}
