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

// Single card style (CU-1); today is distinguished by an accent ring, never a
// full accent fill, and stays legible for assigned and rest days (CU-4).
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
  // CU-4: subtle accent ring for today — same card base for every day
  const todayRing = isToday
    ? 'ring-1 ring-accent border-accent'
    : 'border-border-soft'

  if (isEmpty) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-16 p-16 bg-surface/50 border border-dashed ${todayRing} rounded-lg hover:border-accent transition-colors cursor-pointer group`}
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
            <span className="px-8 py-0.5 border border-border-soft text-muted font-label-caps text-label-caps rounded-full">
              Rest
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-muted group-hover:text-accent">
          add_circle
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-16 p-16 bg-surface border ${todayRing} rounded-lg hover:border-accent transition-colors cursor-pointer group`}
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
          <span className="px-8 py-0.5 bg-accent/15 text-accent text-[10px] font-bold rounded-full uppercase tracking-wider">
            {typeLabel}
          </span>
          <span className="font-data-sm text-data-sm text-muted">
            {duration > 0 ? `${Math.floor(duration / 60)} min` : ''}
          </span>
        </div>
      </div>
      <span className="material-symbols-outlined text-muted group-hover:text-accent">
        chevron_right
      </span>
    </button>
  )
}
