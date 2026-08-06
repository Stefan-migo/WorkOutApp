'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSequences } from '@/hooks/useSequences'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { flattenWorkout } from '@/lib/interval-engine'
import type { Sequence } from '@/types/workout'

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatShort(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}



export default function NewSequencePage() {
  const { saveSequence } = useSequences()
  const { workouts } = useWorkoutContext()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [repeatCount, setRepeatCount] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // ponytail: filtered list on search input, no debounce needed at this scale
  const filtered = useMemo(
    () =>
      search.trim()
        ? workouts.filter((w) =>
            w.title.toLowerCase().includes(search.toLowerCase()),
          )
        : workouts,
    [workouts, search],
  )

  const totalDurationSec = useMemo(
    () =>
      selectedIds.reduce((sum, id) => {
        const w = workouts.find((x) => x.id === id)
        if (!w) return sum
        return sum + flattenWorkout(w).reduce((s, i) => s + i.duration, 0)
      }, 0),
    [selectedIds, workouts],
  )

  // Work/Rest ratio for sidebar
  const { workSec, restSec } = useMemo(() => {
    let w = 0; let r = 0
    for (const id of selectedIds) {
      const wo = workouts.find((x) => x.id === id)
      if (!wo) continue
      for (const i of flattenWorkout(wo)) {
        if (i.type === 'work' || i.type === 'prepare' || i.type === 'cooldown') w += i.duration
        else r += i.duration
      }
    }
    return { workSec: w, restSec: r }
  }, [selectedIds, workouts])

  const totalSec = workSec + restSec
  const workRatio = totalSec > 0 ? Math.round((workSec / totalSec) * 100) : 0
  const restRatio = totalSec > 0 ? Math.round((restSec / totalSec) * 100) : 0

  // ponytail: Set for O(1) lookups
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function toggleWorkout(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      // ponytail: no dupe check needed — toggle prevents adding the same ID twice
      return [...prev, id]
    })
  }

  // HTML5 DnD — matches pattern from WorkoutBuilder
  function handleDragStart(i: number) {
    setDragIndex(i)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(i: number) {
    if (dragIndex === null || dragIndex === i) return
    setSelectedIds((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(i, 0, moved!)
      return next
    })
    setDragIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
  }

  function handleSave() {
    if (!title.trim() || selectedIds.length === 0) return
    // ponytail: dedupe in case of edge-toggling, though toggleWorkout prevents it
    const uniqueIds = [...new Set(selectedIds)]
    const seq: Sequence = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      workoutIds: uniqueIds,
      repeatCount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveSequence(seq)
    router.push(`/sequences/${seq.id}/play`)
  }

  const canSave = title.trim().length > 0 && selectedIds.length > 0

  // Compact interval stats badge — replaces MiniTimeline
  function IntervalBadge({ workoutId }: { workoutId: string }) {
    const w = workouts.find((x) => x.id === workoutId)
    if (!w) return null
    const flat = flattenWorkout(w)
    const count = flat.length
    const work = flat.filter((i) => i.type === 'work').length
    const rest = flat.filter((i) => i.type === 'rest' || i.type === 'rest_between_cycles').length
    return (
      <span className="hidden sm:inline-flex items-center gap-8 font-data text-data-sm text-muted shrink-0 bg-surface/60 rounded-full px-12 py-4 border border-border-soft">
        <span>{count} int</span>
        <span className="flex items-center gap-4">
          <span className="w-2 h-2 rounded-full bg-segment-work" />
          {work}
        </span>
        <span className="flex items-center gap-4">
          <span className="w-2 h-2 rounded-full bg-segment-rest" />
          {rest}
        </span>
      </span>
    )
  }

  return (
    <div className="flex flex-col min-h-screen relative pb-[100px]">
      <div className="flex-1 p-margin-mobile md:p-margin-desktop flex flex-col xl:flex-row gap-[48px] max-w-[1600px] mx-auto w-full">
        {/* Left Column: Sequence Metadata & List */}
        <div className="flex-1 flex flex-col gap-32">
          {/* Glass Header Panel */}
          <div className="glass-card rounded-xl p-32 space-y-24">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-md border-b border-border-soft pb-md">
              <div className="flex-1 w-full">
                <label className="block font-label text-label-caps text-muted mb-xs uppercase tracking-wider" htmlFor="sequence-title">
                  Sequence Title
                </label>
                <input
                  id="sequence-title"
                  type="text"
                  value={title}
                  placeholder="e.g. Friday Full Body Burn"
                  className="w-full bg-transparent border-0 border-b-2 border-border focus:border-accent focus:ring-0 px-0 font-headline text-headline-lg text-fg-2 transition-colors pb-8 placeholder:text-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="shrink-0 text-right">
                <div className="font-label text-label-caps text-muted mb-xs uppercase tracking-wider">Total Duration</div>
                <div className="font-mono text-display-timer-mobile md:text-display-timer tracking-tighter text-accent leading-none">
                  {formatDuration(totalDurationSec * repeatCount)}
                </div>
              </div>
            </div>

            <div>
              <label className="font-label text-label-caps text-muted mb-xs block uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                placeholder="Optional description"
                rows={2}
                className="w-full bg-surface rounded-lg p-3 font-body text-body-md text-fg-2 placeholder:text-muted outline-none focus:ring-2 focus:ring-secondary resize-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Meta chips */}
            <div className="flex gap-24 flex-wrap items-center">
              <span className="inline-flex items-center gap-8 rounded-full bg-surface px-16 py-8 font-data text-data-sm text-muted">
                <span className="w-2 h-2 rounded-full bg-accent" />
                {selectedIds.length} Workout{selectedIds.length !== 1 && 's'}
              </span>
              <span className="inline-flex items-center gap-8 rounded-full bg-surface px-16 py-8 font-data text-data-sm text-muted">
                <span className="w-2 h-2 rounded-full bg-accent" />
                {repeatCount} cycle{repeatCount !== 1 && 's'}
              </span>
              <label className="inline-flex items-center gap-8 font-data text-data-sm text-muted bg-surface/40 rounded-full px-16 py-8 border border-border-soft">
                <span className="w-2 h-2 rounded-full bg-segment-work" />
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={repeatCount}
                  className="w-[36px] bg-surface rounded text-center text-data-sm leading-none text-fg-2 outline-none focus:ring-1 focus:ring-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  onChange={(e) => setRepeatCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                />
                <span>cycles ({selectedIds.length * repeatCount} total workouts)</span>
              </label>
            </div>
          </div>

          {/* Workout List */}
          <div className="flex-1 flex flex-col gap-24" id="workout-sequence-list">
            {selectedIds.map((id, i) => {
              const w = workouts.find((x) => x.id === id)
              const woDuration = w ? flattenWorkout(w).reduce((s, x) => s + x.duration, 0) : 0
              const isDragging = dragIndex === i
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={handleDragEnd}
                  className={`group glass-card rounded-lg p-24 flex items-center gap-16 transition-all hover:border-accent relative border-l-4 border-l-border ${isDragging ? 'opacity-40 ring-2 ring-secondary' : ''}`}
                >
                  {/* Drag handle */}
                  <div className="text-muted/40 group-hover:text-accent transition-colors cursor-grab shrink-0">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>

                  {/* Workout icon placeholder */}
                  <div className="w-12 h-10 rounded bg-surface border border-border-soft flex items-center justify-center shrink-0 overflow-hidden relative">
                    <div className="w-full h-full opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #1e293b 5px, #1e293b 10px)' }} />
                    <svg className="w-5 h-5 absolute text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body text-body-lg font-bold text-fg-2 truncate">
                      {w?.title ?? 'Unknown workout'}
                    </h3>
                    <p className="font-data text-data-sm text-muted mt-xs">
                      {formatShort(woDuration)}
                    </p>
                  </div>

                  {/* Interval stats badge */}
                  <IntervalBadge workoutId={id} />

                  {/* Remove */}
                  <button
                    onClick={() => setSelectedIds((prev) => prev.filter((x) => x !== id))}
                    className="p-8 rounded-lg text-muted hover:text-error hover:bg-error/5 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                    title="Remove workout"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}

            {/* Add Workout Area */}
            <div className="mt-16 border-2 border-dashed border-border/50 rounded-lg p-24 text-center hover:bg-surface/30 hover:border-accent transition-colors group">
              <div className="flex flex-col gap-16">
                {/* Search bar */}
                <div className="relative max-w-md mx-auto w-full">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    placeholder="Browse & Add Workouts..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface text-fg-2 rounded-lg font-body text-body-md placeholder:text-muted outline-none focus:ring-2 focus:ring-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Results list: show all workouts when no search, filtered when typing */}
                <div className="max-h-48 overflow-y-auto bg-surface rounded-lg border border-border-soft divide-y divide-outline-variant/10 text-left">
                  {workouts.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <svg className="w-10 h-10 mx-auto text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span className="font-label text-label-caps text-muted uppercase tracking-wider block mt-8">
                        Browse &amp; Add Workouts
                      </span>
                    </div>
                  ) : filtered.length === 0 ? (
                    <p className="px-3 py-2 font-body text-body-md text-muted">No workouts match &quot;{search}&quot;</p>
                  ) : (
                    filtered.map((w) => (
                      <label
                        key={w.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-warm transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSet.has(w.id)}
                          onChange={() => toggleWorkout(w.id)}
                          className="accent-accent w-4 h-4 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                        />
                        <span className="flex-1 font-body text-body-md text-fg-2 truncate">{w.title}</span>
                        <span className="font-data text-data-sm text-muted shrink-0">
                          {formatShort(flattenWorkout(w).reduce((s, i) => s + i.duration, 0))}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary Sidebar (desktop) */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="glass-card rounded-xl p-24 sticky top-28">
            <h2 className="font-headline text-headline-md font-bold text-fg-2 mb-24">Sequence Profile</h2>
            <div className="space-y-16">
              {/* Mini Chart */}
              <div className="h-32 rounded-lg bg-surface border border-border-soft relative overflow-hidden flex items-end px-8 pb-8 gap-xs">
                {selectedIds.slice(0, 8).map((id, i) => {
                  const w = workouts.find((x) => x.id === id)
                  if (!w) return <div key={id} className="w-full h-1/4 bg-surface rounded-t-sm opacity-60" />
                  const flat = flattenWorkout(w)
                  const total = flat.reduce((s, x) => s + x.duration, 0)
                  const workPct = total > 0 ? flat.filter((x) => x.type === 'work').reduce((s, x) => s + x.duration, 0) / total : 0.5
                  // Height maps to intensity; use work ratio as proxy
                  const height = Math.max(15, Math.min(100, Math.round(workPct * 100)))
                  return (
                    <div
                      key={id}
                      className="w-full rounded-t-sm transition-all"
                      style={{ height: `${height}%` }}
                      title={w.title}
                    >
                      <div className={`h-full rounded-t-sm ${i % 2 === 0 ? 'bg-accent' : 'bg-accent'}`} />
                    </div>
                  )
                })}
                {selectedIds.length === 0 && (
                  <div className="w-full flex items-center justify-center h-full">
                    <span className="font-data text-data-sm text-muted">No workouts</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-16">
                <div className="bg-surface p-16 rounded-lg">
                  <div className="font-label text-label-caps text-muted uppercase tracking-wider mb-xs">Work Ratio</div>
                  <div className="font-data text-data-lg text-accent">{workRatio}%</div>
                </div>
                <div className="bg-surface p-16 rounded-lg">
                  <div className="font-label text-label-caps text-muted uppercase tracking-wider mb-xs">Rest Ratio</div>
                  <div className="font-data text-data-lg text-accent">{restRatio}%</div>
                </div>
              </div>

              {/* Estimated Strain */}
              <div className="pt-8 border-t border-border-soft mt-8">
                <div className="flex justify-between items-center mb-xs">
                  <span className="font-label text-label-caps text-muted uppercase">Estimated Strain</span>
                  <span className="font-data text-data-sm font-bold text-accent-container">
                    {workRatio > 70 ? 'High' : workRatio > 40 ? 'Moderate' : 'Low'}
                  </span>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, workRatio)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border-soft p-margin-mobile md:p-margin-desktop flex justify-between items-center z-40">
        <button
          onClick={() => router.push('/sequences')}
          className="font-label text-label-caps text-muted hover:text-error transition-colors px-24 py-8 uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="bg-accent text-accent-on font-label text-label-caps px-32 py-16 rounded-full hover:bg-accent-hover disabled:bg-surface disabled:text-muted transition-colors shadow-sm ambient-shadow uppercase tracking-wider flex items-center gap-8 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Sequence
        </button>
      </div>
    </div>
  )
}
