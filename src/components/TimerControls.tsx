'use client'

import type { TimerStatus } from '@/hooks/useTimer'

interface TimerControlsProps {
  status: TimerStatus
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  onRestart: () => void
}

// ponytail: text emoji icons, upgrade to inline SVG if theming/accessibility demands it
export function TimerControls({ status, onPause, onResume, onSkip, onRestart }: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {status === 'running' && (
        <button
          onClick={onPause}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-surface hover:bg-surface-alt border border-border text-fg text-xl"
          aria-label="Pause"
        >
          ⏸
        </button>
      )}
      {status === 'paused' && (
        <button
          onClick={onResume}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-accent hover:bg-accent text-accent-on text-xl"
          aria-label="Resume"
        >
          ▶
        </button>
      )}
      {(status === 'running' || status === 'paused') && (
        <button
          onClick={onSkip}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-surface hover:bg-surface-alt border border-border text-fg text-xl"
          aria-label="Skip to next interval"
        >
          ⏭
        </button>
      )}
      {(status === 'paused' || status === 'complete') && (
        <button
          onClick={onRestart}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-surface hover:bg-surface-alt border border-border text-fg text-xl"
          aria-label="Restart timer"
        >
          🔄
        </button>
      )}
    </div>
  )
}
