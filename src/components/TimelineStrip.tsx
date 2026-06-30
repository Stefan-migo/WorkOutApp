'use client'

import type { FlattenedInterval } from '@/lib/interval-engine'

interface TimelineStripProps {
  intervals: FlattenedInterval[]
  onIntervalClick?: (index: number) => void
}

// ponytail: exhaustive maps so Tailwind v4 resolves all class strings
const SEGMENT_BG: Record<string, string> = {
  prepare: 'bg-segment-prepare/80',
  work: 'bg-segment-work/80',
  rest: 'bg-segment-rest/80',
  cooldown: 'bg-segment-cooldown/80',
}

const LEGEND_COLORS: Record<string, string> = {
  prepare: 'bg-segment-prepare',
  work: 'bg-segment-work',
  rest: 'bg-segment-rest',
  cooldown: 'bg-segment-cooldown',
}

export function TimelineStrip({ intervals, onIntervalClick }: TimelineStripProps) {
  if (intervals.length === 0) return null

  const totalDuration = intervals.reduce((s, i) => s + i.duration, 0)
  if (totalDuration <= 0) return null

  const LEGEND_ITEMS = ['prepare', 'work', 'rest', 'cooldown'] as const

  return (
    <div className="space-y-sm">
      <div className="h-4 w-full bg-surface-dim rounded-full overflow-hidden flex shadow-inner">
        {intervals.map((interval, idx) => {
          const widthPct = (interval.duration / totalDuration) * 100

          return (
            <button
              key={`${interval.id}-${idx}`}
              onClick={() => onIntervalClick?.(idx)}
              style={{ width: `${Math.max(widthPct, 0.5)}%` }}
              className={`h-full ${SEGMENT_BG[interval.type] ?? 'bg-segment-work/80'} transition-opacity cursor-pointer hover:opacity-90 focus-visible:outline-2 focus-visible:outline-secondary focus-visible:outline-offset-1`}
              aria-label={`${interval.title} ${interval.duration}s`}
            />
          )
        })}
      </div>

      {/* Timeline Legend */}
      <div className="flex flex-wrap gap-md px-xs pt-xs">
        {LEGEND_ITEMS.map((type) => (
          <div key={type} className="flex items-center gap-xs">
            <div className={`w-3 h-3 rounded-sm ${LEGEND_COLORS[type]}`} />
            <span className="text-[10px] font-label-caps uppercase text-on-surface-variant">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
