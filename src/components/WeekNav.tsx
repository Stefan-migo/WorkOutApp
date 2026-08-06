'use client'

import { formatWeekRange } from '@/lib/calendar-utils'

interface WeekNavProps {
  weekStart: string
  onPrev: () => void
  onNext: () => void
}

export function WeekNav({ weekStart, onPrev, onNext }: WeekNavProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-16">
        <button
          onClick={onPrev}
          className="p-xs rounded-full hover:bg-surface-warm transition-colors"
          aria-label="Previous week"
        >
          <span className="material-symbols-outlined text-muted">chevron_left</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-fg-2">
          {formatWeekRange(weekStart)}
        </h1>
        <button
          onClick={onNext}
          className="p-xs rounded-full hover:bg-surface-warm transition-colors"
          aria-label="Next week"
        >
          <span className="material-symbols-outlined text-muted">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
