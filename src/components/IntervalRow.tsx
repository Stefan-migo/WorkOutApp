'use client'

import { ExerciseMedia } from '@/components/ExerciseMedia'
import { withExerciseMediaAccess } from '@/lib/exercise-media'
import { formatTime } from '@/lib/format'
import { SEGMENT_BG, SEGMENT_BORDER, SEGMENT_TEXT, TYPE_ICONS, TYPE_LABELS } from '@/lib/segment-styles'
import type { Exercise, Interval } from '@/types/workout'

interface IntervalRowProps {
  interval: Interval
  exercise?: Exercise
  index: number
  onEdit: () => void
  onRemove: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
  dragIndex: number | null
  onDragStart: (index: number) => void
  onDragOver: (event: React.DragEvent, index: number) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
}

export function IntervalRow({ interval, exercise, index, onEdit, onRemove, onMoveUp, onMoveDown, isFirst, isLast, dragIndex, onDragStart, onDragOver, onDrop, onDragEnd }: IntervalRowProps) {
  const type = TYPE_LABELS[interval.type]
  const title = interval.title.trim() || type
  const media = exercise?.images?.[0]
  const target = interval.mode !== 'timed' && interval.type === 'work' && interval.reps != null
    ? interval.weight ? `${interval.reps} reps · ${interval.weight} kg` : `${interval.reps} reps`
    : formatTime(interval.duration)
  const actionClass = 'min-h-[44px] rounded-lg px-8 text-left text-sm text-fg-2 hover:bg-surface-warm focus-visible:focus-ring disabled:opacity-40'

  return (
    <div
      onDragOver={(event) => onDragOver(event, index)}
      onDrop={(event) => { event.preventDefault(); onDrop(index) }}
      className={`rounded-xl border border-l-4 border-border-soft bg-surface ${SEGMENT_BORDER[interval.type]} ${dragIndex === index ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center">
        <span
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('text/plain', String(index))
            event.dataTransfer.effectAllowed = 'move'
            onDragStart(index)
          }}
          onDragEnd={onDragEnd}
          aria-hidden="true"
          className="material-symbols-outlined hidden cursor-grab select-none px-8 text-[20px] text-muted active:cursor-grabbing md:block"
        >
          drag_indicator
        </span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit interval ${index + 1}: ${title}`}
          className="flex min-h-[64px] min-w-0 flex-1 items-center gap-8 rounded-lg px-8 py-8 text-left hover:bg-surface-warm focus-visible:focus-ring sm:px-16"
        >
          <span className={`grid size-[36px] shrink-0 place-items-center overflow-hidden rounded-lg ${SEGMENT_BG[interval.type]} ${SEGMENT_TEXT[interval.type]}`}>
            {exercise && media ? <ExerciseMedia src={withExerciseMediaAccess(media, exercise.id)} alt="" loading="lazy" className="size-full object-contain" /> : (
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{TYPE_ICONS[interval.type]}</span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            {title.toLowerCase() !== type.toLowerCase() && <span className="block text-xs text-muted">{type}</span>}
            <span className="block break-words font-semibold leading-snug text-fg-2">{title}</span>
            {exercise && exercise.name !== title && <span className="block break-words text-xs text-muted">{exercise.name}</span>}
          </span>
          <span className="max-w-[32%] shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-fg-2 sm:text-sm">{target}</span>
          <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-[18px] text-accent">edit</span>
        </button>
        <details className="relative mr-8">
          <summary aria-label={`Actions for interval ${index + 1}: ${title}`} className="grid size-[44px] cursor-pointer list-none place-items-center rounded-lg text-muted hover:bg-surface-warm focus-visible:focus-ring [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">more_vert</span>
          </summary>
          <div className="absolute right-0 top-full z-10 grid w-[10rem] rounded-xl border border-border-soft bg-surface p-xs shadow-fab">
            <button type="button" className={actionClass} disabled={isFirst} onClick={(event) => { event.currentTarget.closest('details')!.open = false; onMoveUp(index) }}>Move up</button>
            <button type="button" className={actionClass} disabled={isLast} onClick={(event) => { event.currentTarget.closest('details')!.open = false; onMoveDown(index) }}>Move down</button>
            <button type="button" className={`${actionClass} text-danger`} onClick={() => onRemove(index)}>Remove block</button>
          </div>
        </details>
      </div>
    </div>
  )
}
