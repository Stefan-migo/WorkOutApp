'use client'

import { useState, useEffect } from 'react'
import { SEGMENT_BG, SEGMENT_BORDER, SEGMENT_TEXT, TYPE_ICONS } from '@/lib/segment-styles'
import type { Interval, CycleTemplate, IntervalType } from '@/types/workout'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BuilderItem = Interval | CycleTemplate

function isCycle(item: BuilderItem): item is CycleTemplate {
  return 'repeat' in item
}

// ---------------------------------------------------------------------------
// Pure helpers — exported for testing
// ---------------------------------------------------------------------------

/** Expand a CycleTemplate into flat Interval[] (work/rest pairs). */
export function expandCycle(cycle: CycleTemplate): Interval[] {
  const intervals: Interval[] = []
  for (let i = 0; i < cycle.repeat; i++) {
    // ponytail: spread reps/weight only when defined, keeps legacy intervals clean
    const repFields = cycle.workReps != null ? { reps: cycle.workReps } : {}
    const weightFields = cycle.workWeight != null ? { weight: cycle.workWeight } : {}
    intervals.push({
      id: crypto.randomUUID(),
      type: 'work',
      title: 'Work',
      duration: cycle.workDuration,
      cycleIndex: i,
      cycleId: cycle.id,
      cycleTitle: cycle.title,
      ...repFields,
      ...weightFields,
    })
    const isLast = i === cycle.repeat - 1
    if (!isLast || !cycle.skipLastRest) {
      intervals.push({
        id: crypto.randomUUID(),
        type: 'rest',
        title: 'Rest',
        duration: cycle.restDuration,
        cycleId: cycle.id,
        cycleTitle: cycle.title,
      })
    }
  }
  return intervals
}

/** Create a single Interval from a palette type with defaults. */
export function createInterval(type: IntervalType, title?: string, duration?: number): Interval {
  const TITLES: Record<IntervalType, string> = {
    prepare: 'Prepare',
    work: 'Work',
    rest: 'Rest',
    rest_between_cycles: 'Rest Between Cycles',
    cooldown: 'Cool Down',
  }
  const DURATIONS: Record<IntervalType, number> = {
    prepare: 15,
    work: 30,
    rest: 15,
    rest_between_cycles: 15,
    cooldown: 15,
  }
  return {
    id: crypto.randomUUID(),
    type,
    title: title ?? TITLES[type],
    duration: duration ?? DURATIONS[type],
  }
}

function createCycleTemplate(): CycleTemplate {
  return {
    id: crypto.randomUUID(),
    title: 'Cycle',
    repeat: 4,
    workDuration: 30,
    restDuration: 15,
    skipLastRest: true,
  }
}

// ---------------------------------------------------------------------------
// Default duration estimation
// ---------------------------------------------------------------------------
function totalEstimate(items: BuilderItem[]): number {
  let total = 0
  for (const item of items) {
    if (isCycle(item)) {
      const cycleRest = item.restDuration * (item.skipLastRest ? item.repeat - 1 : item.repeat)
      total += item.workDuration * item.repeat + cycleRest
    } else {
      total += item.duration
    }
  }
  return total
}

// ---------------------------------------------------------------------------
// Palette config
// ---------------------------------------------------------------------------
type PaletteBlock =
  | { kind: 'interval'; type: IntervalType; label: string; icon: string }
  | { kind: 'cycle'; label: string; icon: string }

const PALETTE: PaletteBlock[] = [
  { kind: 'interval', type: 'prepare', label: 'Prepare', icon: TYPE_ICONS.prepare },
  { kind: 'interval', type: 'work', label: 'Work', icon: TYPE_ICONS.work },
  { kind: 'interval', type: 'rest', label: 'Rest', icon: TYPE_ICONS.rest },
  { kind: 'interval', type: 'rest_between_cycles', label: 'Rest Between Cycles', icon: 'hourglass_bottom' },
  { kind: 'cycle', label: 'Cycle', icon: 'repeat' },
  { kind: 'interval', type: 'cooldown', label: 'Cool Down', icon: TYPE_ICONS.cooldown },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface WorkoutBuilderProps {
  onSave: (intervals: Interval[], title: string) => void
  onCancel?: () => void
}

export default function WorkoutBuilder({ onSave, onCancel }: WorkoutBuilderProps) {
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<BuilderItem[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // ponytail: wheel scroll during HTML5 DnD — browser blocks scroll, so we handle it manually
  useEffect(() => {
    if (dragIndex === null) return
    function onWheel(e: WheelEvent) {
      window.scrollBy(0, e.deltaY)
      e.preventDefault()
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [dragIndex])

  const totalSec = totalEstimate(items)
  const totalMin = Math.floor(totalSec / 60)
  const remainSec = totalSec % 60

  // ponytail: HTML5 DnD — zero deps, flat list only
  function handleDragStart(i: number) { setDragIndex(i) }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    // Auto-scroll when near viewport edges (fixes HTML5 DnD scroll lock)
    const threshold = 60
    const cy = e.clientY
    if (cy < threshold) window.scrollBy(0, Math.max(cy - threshold, -12))
    else if (cy > window.innerHeight - threshold) window.scrollBy(0, Math.min(cy - (window.innerHeight - threshold), 12))
  }
  function handleDrop(i: number) {
    if (dragIndex === null || dragIndex === i) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      if (!moved) return prev
      next.splice(i, 0, moved)
      return next
    })
    setDragIndex(null)
  }
  function handleDragEnd() { setDragIndex(null) }

  function addItem(type: IntervalType, customTitle?: string, customDuration?: number) {
    setItems((prev) => [...prev, createInterval(type, customTitle, customDuration)])
  }

  function addCycle() {
    setItems((prev) => [...prev, createCycleTemplate()])
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  function duplicateCycle(i: number) {
    setItems((prev) => {
      const item = prev[i]
      if (!item || !isCycle(item)) return prev
      const clone: CycleTemplate = { ...item, id: crypto.randomUUID() }
      const next = [...prev]
      next.splice(i + 1, 0, clone)
      return next
    })
  }

  function updateIntervalTitle(i: number, value: string) {
    setItems((prev) => {
      const next = [...prev]
      const item = next[i]
      if (!item || isCycle(item)) return prev
      next[i] = { ...item, title: value }
      return next
    })
  }

  function updateCycleField(i: number, field: keyof CycleTemplate, value: string | number | boolean) {
    setItems((prev) => {
      const next = [...prev]
      const item = next[i]
      if (!item || !isCycle(item)) return prev
      next[i] = { ...item, [field]: value }
      return next
    })
  }

  function handlePaletteClick(block: PaletteBlock) {
    if (block.kind === 'cycle') {
      addCycle()
    } else {
      addItem(block.type)
    }
  }

  function handleSave() {
    const flat: Interval[] = items.flatMap((item) =>
      isCycle(item) ? expandCycle(item) : [item],
    )
    onSave(flat, title)
  }

  const canSave = items.length > 0

  return (
    <div className="max-w-2xl mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col gap-6">
      {/* Title + Est. Duration */}
      <div className="glass-card rounded-xl p-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-24">
        <div className="w-full md:w-2/3">
          <label className="block font-label text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider">
            Workout Title
          </label>
          <input
            type="text"
            value={title}
            placeholder="Name your workout..."
            className="w-full bg-transparent border-0 border-b-2 border-outline-variant pb-xs font-headline text-headline-lg text-on-surface focus:border-secondary focus:ring-0 transition-colors px-0 outline-none placeholder:text-outline/50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="text-right w-full md:w-auto">
          <span className="block font-label text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider">
            Est. Duration
          </span>
          <div className="font-mono text-display-timer-mobile text-primary tracking-tighter">
            {totalMin}:{String(remainSec).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="glass-card rounded-xl p-24 flex flex-col items-center justify-center gap-16 text-center py-[64px] border-dashed border-2 border-outline-variant/30">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40">playlist_add</span>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface font-bold">No blocks yet</p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Tap a block type below to start building your workout
            </p>
          </div>
        </div>
      ) : (
        /* Items list */
        <div className="flex flex-col gap-8" role="list" aria-label="Workout blocks">
          {items.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
              role="listitem"
              className={`glass-card rounded-xl flex items-center group transition-all duration-200 pl-0 hover:shadow-md relative overflow-visible ${
                dragIndex === i ? 'opacity-40 ring-2 ring-secondary' : ''
              } ${!isCycle(item) ? `border-l-4 ${SEGMENT_BORDER[item.type]}` : 'border-l-4 border-l-secondary/60'}`}
            >
              {/* Drag handle */}
              <div
                className="px-5 py-10 text-outline-variant cursor-grab flex items-center justify-center active:cursor-grabbing self-stretch"
                aria-label="Drag to reorder"
                role="button"
              >
                <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
              </div>

              {isCycle(item) ? (
                /* ── Cycle Template card ── */
                <div className="flex-1 py-12 px-4 flex flex-col gap-8 relative">
                  {/* Top row: title + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <span className="material-symbols-outlined text-secondary text-[22px]">repeat</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateCycleField(i, 'title', e.target.value)}
                        className="bg-transparent border-0 border-b border-outline-variant/30 p-0 font-body-md font-semibold text-on-surface w-32 focus:border-secondary focus:ring-0 outline-none"
                        aria-label="Cycle name"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Duplicate */}
                      <button
                        onClick={() => duplicateCycle(i)}
                        className="text-outline-variant hover:text-secondary transition-colors p-4 rounded-lg hover:bg-surface-dim"
                        aria-label="Duplicate cycle"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => removeItem(i)}
                        className="text-outline-variant hover:text-error transition-colors p-4 rounded-lg hover:bg-surface-dim"
                        aria-label="Remove cycle"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Cycle controls grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-on-surface-variant/50 text-[9px] uppercase tracking-wider">Repeat</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(item.repeat)}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (!isNaN(v)) updateCycleField(i, 'repeat', Math.min(10, Math.max(1, v)))
                        }}
                        className="bg-transparent border-0 border-b border-outline-variant/30 p-0 w-full font-data-md text-data-md text-on-surface focus:border-secondary focus:ring-0 outline-none"
                        aria-label="Cycle repeat count"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-on-surface-variant/50 text-[9px] uppercase tracking-wider">Work</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(item.workDuration)}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (!isNaN(v)) updateCycleField(i, 'workDuration', Math.max(1, v))
                        }}
                        className="bg-transparent border-0 border-b border-outline-variant/30 p-0 w-full font-data-md text-data-md text-on-surface focus:border-secondary focus:ring-0 outline-none"
                        aria-label="Work duration seconds"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-on-surface-variant/50 text-[9px] uppercase tracking-wider">Rest</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(item.restDuration)}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (!isNaN(v)) updateCycleField(i, 'restDuration', Math.max(1, v))
                        }}
                        className="bg-transparent border-0 border-b border-outline-variant/30 p-0 w-full font-data-md text-data-md text-on-surface focus:border-secondary focus:ring-0 outline-none"
                        aria-label="Rest duration seconds"
                      />
                    </div>
                    <div className="flex items-center pt-4">
                      <label className="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.skipLastRest}
                          onChange={(e) => updateCycleField(i, 'skipLastRest', e.target.checked)}
                          className="w-3 h-3 accent-primary rounded"
                        />
                        <span className="text-[8px] leading-tight text-on-surface-variant/70">Skip last rest</span>
                      </label>
                    </div>
                  </div>

                  {/* Reps row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-on-surface-variant/50 text-[9px] uppercase tracking-wider">Work reps</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.workReps != null ? String(item.workReps) : ''}
                        onChange={(e) => {
                          const v = e.target.value ? parseInt(e.target.value, 10) : undefined
                          updateCycleField(i, 'workReps', v != null && !isNaN(v) ? Math.max(1, v) : undefined)
                        }}
                        className="bg-transparent border-0 border-b border-outline-variant/30 p-0 w-full font-data-md text-data-md text-on-surface focus:border-secondary focus:ring-0 outline-none"
                        aria-label="Work reps"
                        placeholder="—"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-caps text-label-caps text-on-surface-variant/50 text-[9px] uppercase tracking-wider">Work weight (kg)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.workWeight != null ? String(item.workWeight) : ''}
                        onChange={(e) => {
                          const v = e.target.value ? parseInt(e.target.value, 10) : undefined
                          updateCycleField(i, 'workWeight', v != null && !isNaN(v) ? Math.max(0, v) : undefined)
                        }}
                        className="bg-transparent border-0 border-b border-outline-variant/30 p-0 w-full font-data-md text-data-md text-on-surface focus:border-secondary focus:ring-0 outline-none"
                        aria-label="Work weight (kg)"
                        placeholder="—"
                      />
                    </div>
                  </div>

                  {/* Estimated total */}
                  <div className="text-right">
                    <span className="text-data-sm text-primary font-mono">
                      ~{Math.floor(
                        (item.workDuration * item.repeat +
                          item.restDuration * (item.skipLastRest ? item.repeat - 1 : item.repeat)) / 60,
                      )}:
                      {String(
                        (item.workDuration * item.repeat +
                          item.restDuration * (item.skipLastRest ? item.repeat - 1 : item.repeat)) % 60,
                      ).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              ) : (
                /* ── Interval item ── */
                <>
                  {/* Type icon */}
                  <div
                    className={`p-8 mx-4 my-12 ${SEGMENT_BG[item.type]} ${SEGMENT_TEXT[item.type]} rounded-md flex items-center justify-center`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{TYPE_ICONS[item.type]}</span>
                  </div>

                  {/* Title + Duration (inline editing) */}
                  <div className="flex-1 py-8 flex flex-col justify-center gap-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateIntervalTitle(i, e.target.value)}
                      className="bg-transparent border-none p-0 font-body-md font-semibold text-on-surface w-full focus:ring-0 focus:outline-none"
                      aria-label={`Interval ${i + 1} title`}
                    />
                    <input
                      type="text"
                      value={`${String(Math.floor(item.duration / 60)).padStart(2, '0')}:${String(item.duration % 60).padStart(2, '0')}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(':')
                        if (parts.length === 2) {
                          const m = parseInt(parts[0]!, 10) || 0
                          const s = parseInt(parts[1]!, 10) || 0
                          const clamped = Math.min(Math.max(m * 60 + s, 1), 3600)
                          setItems((prev) => {
                            const next = [...prev]
                            const item = next[i]
                            if (!item || isCycle(item)) return prev
                            next[i] = { ...item, duration: clamped }
                            return next
                          })
                        }
                      }}
                      className="bg-transparent border-none p-0 font-data-sm text-data-sm text-primary font-bold tracking-tight font-mono w-20 focus:ring-0 focus:outline-none focus:border-b focus:border-secondary"
                      aria-label={`Interval ${i + 1} duration`}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-8">
                    <button
                      onClick={() => {
                        const original = items[i]
                        if (!original || isCycle(original)) return
                        const clone: Interval = { ...original, id: crypto.randomUUID() }
                        setItems((prev) => {
                          const next = [...prev]
                          next.splice(i + 1, 0, clone)
                          return next
                        })
                      }}
                      className="text-outline-variant hover:text-secondary transition-colors p-4 rounded-lg hover:bg-surface-dim"
                      aria-label={`Duplicate interval ${i + 1}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-outline-variant hover:text-error transition-colors p-4 rounded-lg hover:bg-surface-dim"
                      aria-label={`Remove interval ${i + 1}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Block palette */}
      <div className="pt-20 border-t border-outline-variant/30 mt-8">
        <h3 className="font-label text-label-caps uppercase text-on-surface-variant mb-16 text-center tracking-widest">
          Add Block
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {PALETTE.map((block) => {
            if (block.kind === 'cycle') {
              return (
                <button
                  key="cycle"
                  onClick={() => handlePaletteClick(block)}
                  aria-label="Add Cycle"
                  className="glass-card p-8 rounded-xl flex flex-col items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none group border-t-2 border-t-secondary/50"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">repeat</span>
                  </div>
                  <span className="font-label text-label-caps uppercase text-on-surface font-semibold text-[10px] leading-tight text-center">
                    Cycle
                  </span>
                </button>
              )
            }
            const { type, label, icon } = block
            return (
              <button
                key={type}
                onClick={() => handlePaletteClick(block)}
                aria-label={`Add ${label}`}
                className={`glass-card p-8 rounded-xl flex flex-col items-center justify-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none group border-t-2 ${SEGMENT_BORDER[type].replace('border-l-', 'border-t-')}`}
              >
                <div
                  className={`w-9 h-9 rounded-full ${SEGMENT_BG[type]} ${SEGMENT_TEXT[type]} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <span className="font-label text-label-caps uppercase text-on-surface font-semibold text-[10px] leading-tight text-center">
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-surface border border-outline-variant text-on-surface rounded-lg font-medium transition-colors hover:bg-surface-dim font-label text-label-caps uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Discard
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 py-3 bg-primary-btn hover:bg-primary-btn-hover disabled:bg-surface-container-low disabled:text-on-surface-variant text-on-primary-btn rounded-lg font-medium transition-colors font-label text-label-caps uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          Build Workout
        </button>
      </div>

    </div>
  )
}
