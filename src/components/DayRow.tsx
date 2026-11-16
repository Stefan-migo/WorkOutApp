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
        className={`flex items-center gap-16 p-16 bg-surface/50 border border-dashed ${todayRing} rounded-card hover:border-accent hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:focus-ring cursor-pointer group`}
      >
        <div className="flex flex-col items-center justify-center w-12 h-12 bg-surface/50 rounded-card shrink-0">
          <span className="text-label-caps text-muted">{dayName}</span>
          <span className="text-data-lg font-bold text-muted">
            {dayNum}
          </span>
        </div>
        <div className="flex-1 text-left">
          {assignment ? (
            <span className="text-sm text-muted">
              Replace unavailable session
            </span>
          ) : (
            <span className="text-sm font-medium text-muted">
              Assign a session
            </span>
          )}
        </div>
        <span aria-hidden="true" className="material-symbols-outlined text-muted group-hover:text-accent">
          add_circle
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-16 p-16 bg-surface border ${todayRing} rounded-card hover:border-accent hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:focus-ring cursor-pointer group`}
    >
      <div className="flex flex-col items-center justify-center w-12 h-12 bg-surface rounded-card shrink-0">
        <span className="text-label-caps text-muted">{dayName}</span>
        <span className="text-data-lg font-bold text-fg-2">{dayNum}</span>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <span className="block break-words text-body-md font-bold text-fg-2">
          {title}
        </span>
        <div className="mt-xs flex flex-wrap items-center gap-xs">
          <span className="px-8 py-0.5 bg-accent/15 text-accent text-label-caps font-bold uppercase tracking-wider rounded-pill">
            {typeLabel}
          </span>
          <span className="text-data-sm text-muted">
            {duration >= 60 ? `${Math.round(duration / 60)} min` : duration > 0 ? `${duration} sec` : ''}
          </span>
        </div>
      </div>
      <span aria-hidden="true" className="material-symbols-outlined text-muted group-hover:text-accent">
        chevron_right
      </span>
    </button>
  )
}
