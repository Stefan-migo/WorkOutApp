'use client'

import type { Interval } from '@/types/workout'

interface IntervalRowProps {
  interval: Interval
  index: number
  onChange: (index: number, interval: Interval) => void
  onRemove: (index: number) => void
}

// ponytail: static color map, make configurable if custom interval types are added
const TYPE_COLORS: Record<string, string> = {
  prepare: 'bg-amber-500',
  work: 'bg-green-500',
  rest: 'bg-red-500',
  cooldown: 'bg-purple-500',
}

export function IntervalRow({ interval, index, onChange, onRemove }: IntervalRowProps) {
  const minutes = Math.floor(interval.duration / 60)
  const seconds = interval.duration % 60
  const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800">
      <span className={`w-3 h-3 rounded-full shrink-0 ${TYPE_COLORS[interval.type] ?? 'bg-zinc-500'}`} />
      <span className="text-sm text-zinc-400 w-16 shrink-0 capitalize">{interval.type}</span>
      <input
        type="text"
        value={interval.title}
        onChange={(e) => onChange(index, { ...interval, title: e.target.value })}
        className="flex-1 bg-transparent text-white border-b border-transparent hover:border-zinc-600 focus:border-blue-500 outline-none"
        aria-label={`Interval ${index + 1} title`}
      />
      <span className="font-mono text-zinc-300 tabular-nums">{durationStr}</span>
      <button
        onClick={() => onRemove(index)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-red-400 text-lg"
        aria-label={`Remove interval ${index + 1}`}
      >
        ✕
      </button>
    </div>
  )
}
