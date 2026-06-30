'use client'

import type { Interval } from '@/types/workout'
import { useExercises } from '@/hooks/useExercises'

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

// ponytail: exhaustive maps so Tailwind v4 resolves all class strings
const SEGMENT_BORDER: Record<string, string> = {
  prepare: 'border-l-segment-prepare',
  work: 'border-l-segment-work',
  rest: 'border-l-segment-rest',
  cooldown: 'border-l-segment-cooldown',
}

const SEGMENT_BG10: Record<string, string> = {
  prepare: 'bg-segment-prepare/10',
  work: 'bg-segment-work/10',
  rest: 'bg-segment-rest/10',
  cooldown: 'bg-segment-cooldown/10',
}

const SEGMENT_TEXT: Record<string, string> = {
  prepare: 'text-segment-prepare',
  work: 'text-segment-work',
  rest: 'text-segment-rest',
  cooldown: 'text-segment-cooldown',
}

const TYPE_ICON: Record<string, string> = {
  prepare: 'self_improvement',
  work: 'directions_run',
  rest: 'pause_circle',
  cooldown: 'ac_unit',
}

export function IntervalRow({ interval, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: IntervalRowProps) {
  const { getExercise } = useExercises()
  const minutes = Math.floor(interval.duration / 60)
  const seconds = interval.duration % 60
  const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  // ponytail: inline exercise lookup, memoize if list grows
  const exerciseName =
    interval.type === 'work' && interval.exerciseId
      ? getExercise(interval.exerciseId)?.name
      : undefined

  return (
    <div className={`glass-card rounded-lg flex items-center group transition-all duration-200 border-l-4 ${SEGMENT_BORDER[interval.type] ?? 'border-l-segment-work'} pl-0 hover:shadow-md relative overflow-hidden`}>
      {/* Drag Handle */}
      <div className="px-sm py-md text-outline-variant cursor-grab flex items-center justify-center">
        <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
      </div>

      {/* Type Icon */}
      <div className={`p-sm ${SEGMENT_BG10[interval.type] ?? 'bg-segment-work/10'} ${SEGMENT_TEXT[interval.type] ?? 'text-segment-work'} rounded-md mr-md flex items-center justify-center`}>
        <span className="material-symbols-outlined text-[20px]">{TYPE_ICON[interval.type] ?? 'fitness_center'}</span>
      </div>

      {/* Title + Description */}
      <div className="flex-1 py-md">
        <input
          type="text"
          value={interval.title}
          onChange={(e) => onChange(index, { ...interval, title: e.target.value })}
          className="bg-transparent border-none p-0 font-body-md font-semibold text-on-surface w-full focus:ring-0 focus:outline-none placeholder-on-surface-variant/50"
          aria-label={`Interval ${index + 1} title`}
        />
        {exerciseName && (
          <p className="text-[11px] text-on-surface-variant font-body-md mt-xs">{exerciseName}</p>
        )}
      </div>

      {/* Duration + Actions */}
      <div className="px-md flex items-center gap-sm border-l border-outline-variant/30 py-md">
        <input
          type="text"
          value={durationStr}
          onChange={(e) => {
            // ponytail: parse MM:SS input, default to current duration on parse failure
            const parts = e.target.value.split(':')
            if (parts.length === 2) {
              const m = parseInt(parts[0], 10) || 0
              const s = parseInt(parts[1], 10) || 0
              onChange(index, { ...interval, duration: m * 60 + s })
            }
          }}
          className="bg-transparent border-none p-0 font-data-lg text-data-lg text-primary focus:ring-0 focus:outline-none w-20 text-center font-bold tracking-tight"
          aria-label={`Interval ${index + 1} duration`}
        />
        <div className="hidden group-hover:flex gap-xs items-center pl-sm">
          {/* Move Up */}
          <button
            onClick={() => onMoveUp?.(index)}
            disabled={isFirst}
            className="text-outline-variant hover:text-secondary transition-colors disabled:opacity-20 disabled:pointer-events-none"
            aria-label={`Move interval ${index + 1} up`}
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
          </button>
          {/* Move Down */}
          <button
            onClick={() => onMoveDown?.(index)}
            disabled={isLast}
            className="text-outline-variant hover:text-secondary transition-colors disabled:opacity-20 disabled:pointer-events-none"
            aria-label={`Move interval ${index + 1} down`}
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
          </button>
          {/* Remove */}
          <button
            onClick={() => onRemove(index)}
            className="text-outline-variant hover:text-error transition-colors"
            aria-label={`Remove interval ${index + 1}`}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
