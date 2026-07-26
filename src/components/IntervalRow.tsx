'use client'

import Link from 'next/link'
import { SEGMENT_BORDER, SEGMENT_BG, SEGMENT_TEXT, TYPE_ICONS } from '@/lib/segment-styles'
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
  dragIndex?: number | null
  onDragStart?: (i: number) => void
  onDragOver?: (e: React.DragEvent, i: number) => void
  onDrop?: (i: number) => void
  onDragEnd?: () => void
}

export function IntervalRow({ interval, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, dragIndex, onDragStart, onDragOver, onDrop, onDragEnd }: IntervalRowProps) {
  const { exercises } = useExercises()
  const minutes = Math.floor(interval.duration / 60)
  const seconds = interval.duration % 60
  const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  // ponytail: inline exercise lookup from loaded list, memoize if list grows
  const exercise =
    interval.type === 'work' && interval.exerciseId
      ? exercises.find((e) => e.id === interval.exerciseId)
      : undefined

  // ponytail: HTML5 DnD, zero deps. The cursor-grab handle initiates the drag.
  const isDragging = dragIndex === index

  return (
    <div
      draggable
      onDragStart={() => onDragStart?.(index)}
      onDragOver={(e) => onDragOver?.(e, index)}
      onDrop={() => onDrop?.(index)}
      onDragEnd={() => onDragEnd?.()}
      className={`glass-card rounded-lg flex items-center group transition-all duration-200 border-l-4 ${SEGMENT_BORDER[interval.type] ?? 'border-l-segment-work'} pl-0 hover:shadow-md relative overflow-hidden ${isDragging ? 'opacity-40 ring-2 ring-secondary' : ''}`}
    >
      {/* Drag handle */}
      <div className="px-8 py-16 text-outline-variant cursor-grab flex items-center justify-center active:cursor-grabbing" role="button" aria-label="Drag to reorder">
        <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
      </div>

      {/* Type Icon */}
      <div className={`p-8 ${SEGMENT_BG[interval.type] ?? 'bg-segment-work/10'} ${SEGMENT_TEXT[interval.type] ?? 'text-segment-work'} rounded-md mr-16 flex items-center justify-center`}>
        <span className="material-symbols-outlined text-[20px]">{TYPE_ICONS[interval.type] ?? 'fitness_center'}</span>
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
        {exercise && (
          <div className="flex items-center gap-8 mt-xs">
            {exercise.images?.[0] ? (
              <img
                src={exercise.images[0]}
                alt={exercise.name}
                className="w-8 h-8 rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-surface-dim flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">fitness_center</span>
              </div>
            )}
            <Link
              href={`/exercises/${interval.exerciseId}`}
              className="text-[11px] font-body-md text-secondary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {exercise.name}
            </Link>
            {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
              <div className="flex gap-4">
                {exercise.primaryMuscles.slice(0, 2).map((muscle) => (
                  <span
                    key={muscle}
                    className="text-[9px] px-4 py-1 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Duration + Actions */}
      <div className="px-16 flex items-center gap-8 border-l border-outline-variant/30 py-16">
        <input
          type="text"
          value={durationStr}
          onChange={(e) => {
            // ponytail: parse MM:SS input, default to current duration on parse failure
            const parts = e.target.value.split(':')
            if (parts.length === 2) {
              const m = parseInt(parts[0]!, 10) || 0
              const s = parseInt(parts[1]!, 10) || 0
              onChange(index, { ...interval, duration: m * 60 + s })
            }
          }}
          className="bg-transparent border-none p-0 font-data-lg text-data-lg text-primary focus:ring-0 focus:outline-none w-20 text-center font-bold tracking-tight"
          aria-label={`Interval ${index + 1} duration`}
        />
        <div className="hidden group-hover:flex gap-xs items-center pl-8">
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
