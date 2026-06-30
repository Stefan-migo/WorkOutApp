'use client'

import type { FlattenedInterval } from '@/lib/interval-engine'

interface TimelineStripProps {
  intervals: FlattenedInterval[]
  currentIndex?: number
  onIntervalClick?: (index: number) => void
}

// ponytail: static color map, uses existing Tailwind tokens from brand-spec
const TYPE_BG: Record<string, string> = {
  prepare: 'bg-interval-prepare',
  work: 'bg-interval-work',
  rest: 'bg-interval-rest',
  cooldown: 'bg-interval-cooldown',
}

export function TimelineStrip({ intervals, currentIndex, onIntervalClick }: TimelineStripProps) {
  if (intervals.length === 0) return null

  const totalDuration = intervals.reduce((s, i) => s + i.duration, 0)
  if (totalDuration <= 0) return null

  return (
    <div
      className="flex w-full overflow-x-auto gap-px rounded-lg min-h-[32px]"
      role="listbox"
      aria-label="Workout timeline"
    >
      {intervals.map((interval, idx) => {
        const widthPct = (interval.duration / totalDuration) * 100
        const isCurrent = idx === currentIndex

        return (
          <button
            key={`${interval.id}-${idx}`}
            onClick={() => onIntervalClick?.(idx)}
            role="option"
            aria-selected={isCurrent}
            aria-label={`${interval.title} ${interval.duration}s`}
            style={{ width: `${Math.max(widthPct, 0.5)}%` }}
            className={[
              'h-8 rounded-sm transition-all cursor-pointer shrink-0 relative',
              'hover:opacity-85 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1',
              TYPE_BG[interval.type] ?? 'bg-muted',
              isCurrent ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg z-10 opacity-100' : 'opacity-60',
              interval.depth > 0 && 'border-l-2 border-white/30',
            ].join(' ')}
          >
            {/* ponytail: depth indicator as left border stripe, no extra DOM nodes for depth */}
          </button>
        )
      })}
    </div>
  )
}
