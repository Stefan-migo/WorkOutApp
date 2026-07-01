'use client'

import type { TimerStatus } from '@/hooks/useTimer'

interface TimerControlsProps {
  status: TimerStatus
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  onRestart: () => void
  onRewind?: () => void
}

// ponytail: 3-button layout, no restart UI — add dedicated restart button if users request it
export function TimerControls({ status, onPause, onResume, onSkip, onRewind }: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-lg">
      {/* Rewind 10s */}
      {onRewind && (
        <button
          onClick={onRewind}
          className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Rewind 10 seconds"
        >
          <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>replay_10</span>
        </button>
      )}

      {/* Play/Pause (center, 80px, white bg) */}
      {(status === 'running' || status === 'paused') && (
        <button
          onClick={status === 'running' ? onPause : onResume}
          className="w-20 h-20 rounded-full bg-white text-primary flex items-center justify-center hover:bg-gray-200 transition-colors shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
          aria-label={status === 'running' ? 'Pause' : 'Resume'}
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {status === 'running' ? 'pause' : 'play_arrow'}
          </span>
        </button>
      )}

      {/* Skip */}
      {(status === 'running' || status === 'paused') && (
        <button
          onClick={onSkip}
          className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Skip interval"
        >
          <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_next</span>
        </button>
      )}
    </div>
  )
}
