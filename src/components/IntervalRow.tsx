'use client'

import type { Interval } from '@/types/workout'
import { getExercise } from '@/data/exercises'

interface IntervalRowProps {
  interval: Interval
  index: number
  onChange: (index: number, interval: Interval) => void
  onRemove: (index: number) => void
  onMoveUp?: (index: number) => void
  onMoveDown?: (index: number) => void
  isFirst?: boolean
  isLast?: boolean
}

// ponytail: static color map, make configurable if custom interval types are added
const TYPE_COLORS: Record<string, string> = {
  prepare: 'bg-interval-prepare',
  work: 'bg-interval-work',
  rest: 'bg-interval-rest',
  cooldown: 'bg-interval-cooldown',
}

export function IntervalRow({ interval, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: IntervalRowProps) {
  const minutes = Math.floor(interval.duration / 60)
  const seconds = interval.duration % 60
  const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  // ponytail: inline exercise lookup, memoize if list grows
  const exerciseName =
    interval.type === 'work' && interval.exerciseId
      ? getExercise(interval.exerciseId)?.name
      : undefined

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border-soft">
      <span className={`w-3 h-3 rounded-full shrink-0 ${TYPE_COLORS[interval.type] ?? 'bg-muted'}`} />
      <span className="text-sm text-muted w-16 shrink-0 capitalize">{interval.type}</span>
      <input
        type="text"
        value={interval.title}
        onChange={(e) => onChange(index, { ...interval, title: e.target.value })}
        className="flex-1 bg-transparent text-fg border-b border-transparent hover:border-border focus:border-accent outline-none"
        aria-label={`Interval ${index + 1} title`}
      />
      <span className="font-mono text-fg-2 tabular-nums">{durationStr}</span>
      {exerciseName && (
        <span className="text-xs text-muted w-24 truncate shrink-0" title={exerciseName}>
          {exerciseName}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMoveUp?.(index)}
          disabled={isFirst}
          className="min-w-[28px] min-h-[18px] flex items-center justify-center text-muted hover:text-fg disabled:opacity-20 disabled:pointer-events-none text-xs leading-none"
          aria-label={`Move interval ${index + 1} up`}
        >
          ▲
        </button>
        <button
          onClick={() => onMoveDown?.(index)}
          disabled={isLast}
          className="min-w-[28px] min-h-[18px] flex items-center justify-center text-muted hover:text-fg disabled:opacity-20 disabled:pointer-events-none text-xs leading-none"
          aria-label={`Move interval ${index + 1} down`}
        >
          ▼
        </button>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted hover:text-danger text-lg"
        aria-label={`Remove interval ${index + 1}`}
      >
        ✕
      </button>
    </div>
  )
}
