'use client'

import { formatTime } from '@/lib/format'

interface TimerDisplayProps {
  timeLeft: number
}

export function TimerDisplay({ timeLeft }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formatted = formatTime(timeLeft)
  // ponytail: hardcoded 10s threshold, make configurable if different thresholds per interval type are needed
  const isLow = timeLeft > 0 && timeLeft < 10

  return (
    <div
      className={`text-7xl font-timer font-bold tracking-wider tabular-nums ${isLow ? 'text-error animate-pulse' : 'text-white'}`}
      role="timer"
      aria-live="polite"
      aria-label={`${minutes} minutes ${seconds} seconds remaining`}
    >
      {formatted}
    </div>
  )
}
