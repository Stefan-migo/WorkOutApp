'use client'

import { formatTime } from '@/lib/format'
import { SEGMENT_COLORS } from '@/lib/segment-styles'
import type { IntervalType } from '@/types/workout'

interface TimerRingProps {
  timeLeft: number
  duration: number
  intervalType: IntervalType
  label: string
  nextLabel?: string
  isRepsMode?: boolean
  mobileCompact?: boolean
}

const CIRCUMFERENCE = 283

export function TimerRing({ timeLeft, duration, intervalType, label, nextLabel, isRepsMode, mobileCompact = false }: TimerRingProps) {
  // ponytail: reps mode shows label-only, no SVG ring or timer
  if (isRepsMode) {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="font-label-caps text-label-caps tracking-widest uppercase mb-sm text-timer-on">
          {label}
        </span>
        {nextLabel && (
          <span className="font-data-sm text-data-sm text-timer-muted mt-xs">{nextLabel}</span>
        )}
      </div>
    )
  }

  const ringColor = SEGMENT_COLORS[intervalType]
  const progress = duration > 0 ? timeLeft / duration : 0
  const offset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className={mobileCompact
      ? 'relative w-52 h-52 lg:w-96 lg:h-96 flex items-center justify-center'
      : 'relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center'
    }>
      <svg className="absolute inset-0 w-full h-full drop-shadow-2xl" viewBox="0 0 100 100">
        {/* Track — inline style: SVG presentation attrs don't resolve CSS vars */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          style={{ stroke: 'var(--color-timer-track)' }}
          strokeWidth="4"
        />
        {/* Glow halo — same geometry as progress, wider and faint; semantic segment color kept.
            CSS filter blur (not SVG <filter>): an SVG filter region on a CSS-transformed
            element renders a visible container boundary; CSS blur only touches the halo. */}
        <circle
          className="progress-ring__circle"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke={ringColor}
          strokeWidth="10"
          strokeDasharray="283"
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity="0.25"
          style={{ filter: 'blur(0.8px)' }}
        />
        {/* Progress — inline style: SVG presentation attrs can't resolve var()/color-mix (D2) */}
        <circle
          className="progress-ring__circle"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          style={{ stroke: ringColor }}
          strokeDasharray="283"
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <div className="z-10 flex flex-col items-center text-center">
        <span className="font-label-caps text-label-caps tracking-widest uppercase mb-sm" style={{ color: ringColor }}>
          {label}
        </span>
        <span className={mobileCompact
          ? 'font-display-timer-mobile text-display-timer-mobile lg:font-display-timer lg:text-display-timer text-timer-on tabular-nums'
          : 'font-display-timer-mobile text-display-timer-mobile md:font-display-timer md:text-display-timer text-timer-on tabular-nums'
        }>
          {formatTime(timeLeft)}
        </span>
        {nextLabel && (
          <span className="font-data-sm text-data-sm text-timer-muted mt-xs">{nextLabel}</span>
        )}
      </div>
    </div>
  )
}
