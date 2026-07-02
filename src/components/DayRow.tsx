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
        className="flex items-center gap-16 p-16 bg-primary-container border-2 border-primary rounded-lg shadow-lg"
      >
        <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary text-on-primary rounded-lg shrink-0">
          <span className="font-label-caps text-label-caps opacity-80">{dayName}</span>
          <span className="font-headline-md text-headline-md font-bold">{dayNum}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="font-body-md text-body-md font-bold text-on-primary truncate">
            {title}
          </h4>
          <div className="flex gap-xs mt-xs items-center">
            <span className="px-8 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-full uppercase tracking-wider">
              {typeLabel}
            </span>
            <span className="font-data-sm text-data-sm text-on-primary-container">
              {duration > 0 ? `${Math.floor(duration / 60)} min` : ''}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-primary">check_circle</span>
      </button>
    )
  }

  if (isEmpty) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-16 p-16 bg-surface-container-lowest/50 border border-dashed border-outline-variant/30 rounded-lg hover:border-primary transition-colors cursor-pointer group"
      >
        <div className="flex flex-col items-center justify-center w-16 h-16 bg-surface-container-low/50 rounded-lg shrink-0">
          <span className="font-label-caps text-label-caps text-on-surface-variant">{dayName}</span>
          <span className="font-headline-md text-headline-md font-bold text-on-surface-variant">
            {dayNum}
          </span>
        </div>
        <div className="flex-1 text-left">
          {assignment ? (
            <span className="text-on-surface-variant italic text-body-md">
              (deleted)
            </span>
          ) : (
            <span className="text-on-surface-variant italic text-body-md">
              Rest Day / Active Recovery
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">
          add_circle
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-16 p-16 bg-surface-container-lowest border border-outline-variant/20 rounded-lg hover:border-primary transition-colors cursor-pointer group"
    >
      <div className="flex flex-col items-center justify-center w-16 h-16 bg-surface-container-low rounded-lg shrink-0">
        <span className="font-label-caps text-label-caps text-on-surface-variant">{dayName}</span>
        <span className="font-headline-md text-headline-md font-bold text-on-surface">{dayNum}</span>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-body-md text-body-md font-bold text-on-surface truncate">
          {title}
        </h4>
        <div className="flex gap-xs mt-xs items-center">
          <span className="px-8 py-0.5 bg-primary-fixed-dim text-on-primary-fixed-variant text-[10px] font-bold rounded-full uppercase tracking-wider">
            {typeLabel}
          </span>
          <span className="font-data-sm text-data-sm text-on-surface-variant">
            {duration > 0 ? `${Math.floor(duration / 60)} min` : ''}
          </span>
        </div>
      </div>
      <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">
        chevron_right
      </span>
    </button>
  )
}
