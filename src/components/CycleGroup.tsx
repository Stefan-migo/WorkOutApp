import { IntervalRow } from '@/components/IntervalRow'
import type { Interval } from '@/types/workout'

interface CycleGroupProps {
  interval: Interval
  index: number
  onCycleCountChange: (index: number, count: number) => void
  onChildChange: (parentIndex: number, childIndex: number, child: Interval) => void
  onRemoveChild: (parentIndex: number, childIndex: number) => void
  onChildMoveUp: (parentIndex: number, childIndex: number) => void
  onChildMoveDown: (parentIndex: number, childIndex: number) => void
}

export default function CycleGroup({
  interval,
  index,
  onCycleCountChange,
  onChildChange,
  onRemoveChild,
  onChildMoveUp,
  onChildMoveDown,
}: CycleGroupProps) {
  const childTotal = (interval.children ?? []).reduce((s, ch) => s + ch.duration, 0)
  const childMin = Math.floor(childTotal / 60)
  const childSec = childTotal % 60

  return (
    <div className="mt-24 relative">
      {/* Cycle Bracket — CSS-only visual */}
      <div className="absolute left-0 top-0 bottom-0 w-8 border-l-2 border-y-2 border-outline-variant/40 rounded-l-lg z-0 pointer-events-none" />
      {/* Cycle Header */}
      <div className="flex justify-between items-center pl-8 pr-16 py-xs mb-8 relative z-10">
        <div className="flex items-center gap-8">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
            {interval.title} Cycle
          </span>
          <span className="bg-surface-dim px-8 py-[2px] rounded text-label-caps font-data-sm text-on-surface font-bold">
            Total: {childMin}:{String(childSec).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-xs">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Repeats:</span>
          <select
            value={interval.cycleCount ?? 4}
            onChange={(e) => onCycleCountChange(index, Number(e.target.value))}
            className="bg-surface border border-outline-variant/50 rounded px-2 py-1 text-data-sm font-data-sm text-primary font-bold focus:ring-secondary focus:border-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>x{n}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Children rendered indented inside the bracket */}
      <div className="space-y-8 ml-8 relative z-10">
        {(interval.children ?? []).map((child, ci) => (
          <IntervalRow
            key={child.id}
            interval={child}
            index={ci}
            onChange={(_idx, updated) => onChildChange(index, ci, updated)}
            onRemove={() => onRemoveChild(index, ci)}
            onMoveUp={() => onChildMoveUp(index, ci)}
            onMoveDown={() => onChildMoveDown(index, ci)}
            isFirst={ci === 0}
            isLast={ci === (interval.children?.length ?? 0) - 1}
          />
        ))}
      </div>
    </div>
  )
}
