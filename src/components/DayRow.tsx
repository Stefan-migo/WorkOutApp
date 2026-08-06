'use client'

import type { DayAssignment } from '@/types/workout'

interface DayRowProps {
  dayName: string
  dayNum: number
  assignment: DayAssignment | null
  title?: string
  typeLabel: string
  duration: number
  isToday: boolean
  isEmpty: boolean
  onClick: () => void
}

export function DayRow({
  dayName,
  dayNum,
  assignment,
  title,
  typeLabel,
  duration,
  isToday,
  isEmpty,
  onClick,
}: DayRowProps) {
  if (isToday && !isEmpty) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-16 p-16 bg-accent border-2 border-primary rounded-lg shadow-lg"
      >
        <div className="flex flex-col items-center justify-center w-16 h-16 bg-accent text-accent-on rounded-lg shrink-0">
          <span className="font-label-caps text-label-caps opacity-80">{dayName}</span>
          <span className="font-headline-md text-headline-md font-bold">{dayNum}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="font-body-md text-body-md font-bold text-accent-on truncate">
            {title}
          </h4>
          <div className="flex gap-xs mt-xs items-center">
            <span className="px-8 py-0.5 bg-accent text-accent-on text-[10px] font-bold rounded-full uppercase tracking-wider">
              {typeLabel}
            </span>
            <span className="font-data-sm text-data-sm text-accent-on/70">
              {duration > 0 ? `${Math.floor(duration / 60)} min` : ''}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-accent-on">check_circle</span>
      </button>
    )
  }

  if (isEmpty) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-16 p-16 bg-surface/50 border border-dashed border-outline-variant/30 rounded-lg hover:border-primary transition-colors cursor-pointer group"
      >
        <div className="flex flex-col items-center justify-center w-16 h-16 bg-surface/50 rounded-lg shrink-0">
          <span className="font-label-caps text-label-caps text-muted">{dayName}</span>
          <span className="font-headline-md text-headline-md font-bold text-muted">
            {dayNum}
          </span>
        </div>
        <div className="flex-1 text-left">
          {assignment ? (
            <span className="text-muted italic text-body-md">
              (deleted)
            </span>
          ) : (
            <span className="text-muted italic text-body-md">
              Rest Day / Active Recovery
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-outline-variant group-hover:text-accent">
          add_circle
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-16 p-16 bg-surface border border-outline-variant/20 rounded-lg hover:border-primary transition-colors cursor-pointer group"
    >
      <div className="flex flex-col items-center justify-center w-16 h-16 bg-surface rounded-lg shrink-0">
        <span className="font-label-caps text-label-caps text-muted">{dayName}</span>
        <span className="font-headline-md text-headline-md font-bold text-fg-2">{dayNum}</span>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-body-md text-body-md font-bold text-fg-2 truncate">
          {title}
        </h4>
        <div className="flex gap-xs mt-xs items-center">
          <span className="px-8 py-0.5 bg-accent-fixed-dim text-fg-2-variant text-[10px] font-bold rounded-full uppercase tracking-wider">
            {typeLabel}
          </span>
          <span className="font-data-sm text-data-sm text-muted">
            {duration > 0 ? `${Math.floor(duration / 60)} min` : ''}
          </span>
        </div>
      </div>
      <span className="material-symbols-outlined text-outline-variant group-hover:text-accent">
        chevron_right
      </span>
    </button>
  )
}
