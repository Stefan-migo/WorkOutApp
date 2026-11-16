'use client'

import type { TimerStatus } from '@/hooks/useTimer'

interface TimerControlsProps {
  status: TimerStatus
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  onRestart: () => void
  onPrevious?: () => void
  onAddTime?: (seconds: number) => void
  showAddTime?: boolean
}

export function TimerControls({ status, onPause, onResume, onSkip, onPrevious, onAddTime, showAddTime }: TimerControlsProps) {
  const isRunning = status === 'running'
  const canControlTimer = isRunning || status === 'paused'
  const sideControlClass = 'grid size-14 shrink-0 place-items-center rounded-full border border-timer-border text-timer-on transition-colors hover:bg-timer-on/10 focus-visible:focus-ring'

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        {onPrevious && (
          <button type="button" onClick={onPrevious} className={sideControlClass} aria-label="Previous interval">
            <span aria-hidden="true" className="material-symbols-outlined text-3xl">skip_previous</span>
          </button>
        )}
        {canControlTimer && (
          <>
            <button
              type="button"
              onClick={isRunning ? onPause : onResume}
              className="flex min-h-[64px] items-center justify-center gap-2 rounded-full bg-accent px-5 font-semibold text-accent-on transition-colors hover:bg-accent-hover focus-visible:focus-ring"
              aria-label={isRunning ? 'Pause' : 'Resume'}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">
                {isRunning ? 'pause' : 'play_arrow'}
              </span>
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <button type="button" onClick={onSkip} className={sideControlClass} aria-label="Skip interval">
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">skip_next</span>
            </button>
          </>
        )}
      </div>

      {/* Add time buttons — visible during rest intervals */}
      {showAddTime && onAddTime && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => onAddTime(10)}
            className="min-h-11 rounded-full border border-timer-border px-4 text-timer-on text-sm hover:bg-timer-on/10 transition-colors focus-visible:focus-ring"
            aria-label="Add 10 seconds"
          >
            +10s
          </button>
          <button
            type="button"
            onClick={() => onAddTime(20)}
            className="min-h-11 rounded-full border border-timer-border px-4 text-timer-on text-sm hover:bg-timer-on/10 transition-colors focus-visible:focus-ring"
            aria-label="Add 20 seconds"
          >
            +20s
          </button>
          <button
            type="button"
            onClick={() => onAddTime(30)}
            className="min-h-11 rounded-full border border-timer-border px-4 text-timer-on text-sm hover:bg-timer-on/10 transition-colors focus-visible:focus-ring"
            aria-label="Add 30 seconds"
          >
            +30s
          </button>
        </div>
      )}
    </div>
  )
}
