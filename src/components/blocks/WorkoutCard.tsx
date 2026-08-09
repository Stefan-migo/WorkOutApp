'use client'

import { useState } from 'react'
import { Card, IconButton } from '@/components/ui'
import { formatDuration } from '@/lib/format'
import { SEGMENT_BG_80 } from '@/lib/segment-styles'
import type { IntervalType } from '@/types/workout'

interface WorkoutCardProps {
  workout: { id: string; title: string; intervals: { type: IntervalType; duration: number }[] }
  onOpen: () => void
  onPlay: () => void
  onEdit: () => void
  onPreview: () => void
  onDelete: () => void
}

function totalSeconds(intervals: { duration: number }[]) {
  return intervals.reduce((s, i) => s + i.duration, 0)
}

// Folded-in strip (page L15-29 verbatim): null when total is 0.
function TimelinePreview({ intervals }: { intervals: { type: IntervalType; duration: number }[] }) {
  const total = totalSeconds(intervals)
  if (total === 0) return null
  return (
    <div className="h-2 w-full bg-surface rounded-full overflow-hidden flex">
      {intervals.map((i, idx) => (
        <div
          key={idx}
          className={`h-full ${SEGMENT_BG_80[i.type]}`}
          style={{ width: `${(i.duration / total) * 100}%` }}
        />
      ))}
    </div>
  )
}

// DD-1: the Card's role="button" contract (page test locator) is satisfied
// while Play + ⋮ menu render as DOM SIBLINGS of the Card inside a relative
// wrapper — axe nested-interactive passes with zero stopPropagation.
export function WorkoutCard({ workout, onOpen, onPlay, onEdit, onPreview, onDelete }: WorkoutCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const total = totalSeconds(workout.intervals)
  const count = workout.intervals.length

  const menuAction = (action: () => void) => () => {
    setMenuOpen(false)
    action()
  }

  return (
    <div className="relative">
      <Card
        interactive
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onOpen()
        }}
        className="p-16 flex flex-col gap-4"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-headline-md text-headline-md font-bold text-fg-2 mb-1">{workout.title}</h3>
            <p className="font-data-sm text-data-sm text-muted flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              {formatDuration(total)}
              <span className="w-1 h-1 rounded-full bg-border-soft/50" />
              {count} interval{count !== 1 && 's'}
            </p>
          </div>
        </div>
        <TimelinePreview intervals={workout.intervals} />
      </Card>

      {/* Play — always visible, sibling of the Card (DD-1) */}
      <IconButton
        variant="primary"
        size="sm"
        aria-label={`Play ${workout.title}`}
        onClick={onPlay}
        className="absolute bottom-4 right-4 shadow-fab"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          play_arrow
        </span>
      </IconButton>

      {/* ⋮ overflow menu — sibling of the Card (DD-1, DD-7) */}
      <div className="absolute top-4 right-4 z-40">
        <IconButton
          variant="ghost"
          aria-label="Workout options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </IconButton>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 bg-surface border border-border-soft rounded-xl shadow-lg py-4 min-w-[180px] overflow-hidden">
            <button
              onClick={menuAction(onPlay)}
              className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-accent hover:bg-accent/5 transition-colors text-left font-semibold"
            >
              <span className="material-symbols-outlined text-[18px] text-accent">play_arrow</span>
              Play
            </button>
            <div className="border-t border-border-soft my-4" />
            <button
              onClick={menuAction(onEdit)}
              className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-fg-2 hover:bg-surface transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px] text-muted">edit</span>
              Edit
            </button>
            <button
              onClick={menuAction(onPreview)}
              className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-fg-2 hover:bg-surface transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px] text-muted">visibility</span>
              Preview
            </button>
            <div className="border-t border-border-soft my-4" />
            <button
              onClick={menuAction(onDelete)}
              className="w-full flex items-center gap-8 px-16 py-8 text-body-md text-danger hover:bg-danger/5 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
