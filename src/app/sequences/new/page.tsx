'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSequences } from '@/hooks/useSequences'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { flattenWorkout } from '@/lib/interval-engine'
import type { Sequence, IntervalType } from '@/types/workout'

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

// ponytail: flat palette mapping for mini timeline bars
const TYPE_COLORS: Record<IntervalType, string> = {
  prepare: 'bg-segment-prepare',
  work: 'bg-segment-work',
  rest: 'bg-segment-rest',
  cooldown: 'bg-segment-cooldown',
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

  function moveUp(index: number) {
    if (index <= 0) return
    setSelectedIds((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    setSelectedIds((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
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

  // Mini timeline for a workout (first few interval segments)
  function MiniTimeline({ workoutId }: { workoutId: string }) {
    const w = workouts.find((x) => x.id === workoutId)
    if (!w) return null
    const flat = flattenWorkout(w)
    const total = flat.reduce((s, i) => s + i.duration, 0)
    // ponytail: show at most 5 segments in mini preview
    const segments = flat.slice(0, 5)
    return (
      <div className="hidden sm:flex w-32 h-6 bg-surface-container rounded-full overflow-hidden shrink-0">
        {segments.map((i) => (
          <div
            key={i.id}
            className={`h-full ${TYPE_COLORS[i.type] ?? 'bg-surface-tint'}`}
            style={{ width: `${Math.max(8, (i.duration / total) * 100)}%` }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen relative pb-24">
      <div className="flex-1 p-margin-mobile md:p-margin-desktop flex flex-col xl:flex-row gap-xl max-w-[1600px] mx-auto w-full">
        {/* Left Column: Sequence Metadata & List */}
        <div className="flex-1 flex flex-col gap-lg">
          {/* Glass Header Panel */}
          <div className="glass-card rounded-xl p-lg space-y-md">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-md border-b border-outline-variant/20 pb-md">
              <div className="flex-1 w-full">
                <label className="block font-label text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider" htmlFor="sequence-title">
                  Sequence Title
                </label>
                <input
                  id="sequence-title"
                  type="text"
                  value={title}
                  placeholder="e.g. Friday Full Body Burn"
                  className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-secondary focus:ring-0 px-0 font-headline text-headline-lg text-on-surface transition-colors pb-sm placeholder:text-outline/50 outline-none"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="shrink-0 text-right">
                <div className="font-label text-label-caps text-on-surface-variant mb-xs uppercase tracking-wider">Total Duration</div>
                <div className="font-mono text-display-timer-mobile md:text-display-timer tracking-tighter text-primary leading-none">
                  {formatDuration(totalDurationSec * repeatCount)}
                </div>
              </div>
            </div>

            <div>
              <label className="font-label text-label-caps text-on-surface-variant mb-xs block uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                placeholder="Optional description"
                rows={2}
                className="w-full bg-surface-container-low rounded-lg p-3 font-body text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-secondary resize-none"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Meta chips */}
            <div className="flex gap-sm flex-wrap">
              <span className="inline-flex items-center rounded-full bg-surface-variant px-sm py-xs font-data text-data-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary-container mr-xs" />
                {selectedIds.length} Workout{selectedIds.length !== 1 && 's'}
              </span>
              <span className="inline-flex items-center rounded-full bg-surface-variant px-sm py-xs font-data text-data-sm text-on-surface-variant gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary-container mr-xs" />
                {repeatCount}×
              </span>
              <label className="inline-flex items-center gap-1 font-data text-data-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-segment-work mr-xs" />
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={repeatCount}
                  className="w-12 bg-surface-container rounded px-1 py-0.5 text-center text-on-surface outline-none focus:ring-1 focus:ring-secondary"
                  onChange={(e) => setRepeatCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                />
                rounds ({selectedIds.length * repeatCount} total)
              </label>
            </div>
          </div>

          {/* Workout List */}
          <div className="flex-1 flex flex-col gap-sm" id="workout-sequence-list">
            {selectedIds.map((id, i) => {
              const w = workouts.find((x) => x.id === id)
              const woDuration = w ? flattenWorkout(w).reduce((s, x) => s + x.duration, 0) : 0
              return (
                <div
                  key={id}
                  className="group glass-card rounded-lg p-md flex items-center gap-md transition-all hover:border-primary-fixed relative"
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-surface-tint rounded-r-sm opacity-50 group-hover:opacity-100 transition-opacity" />

                  {/* Drag handle */}
                  <div className="text-outline-variant group-hover:text-primary transition-colors cursor-grab shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>

                  {/* Workout icon placeholder */}
                  <div className="w-12 h-10 rounded bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shrink-0 overflow-hidden relative">
                    <div className="w-full h-full opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #1e293b 5px, #1e293b 10px)' }} />
                    <svg className="w-5 h-5 absolute text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body text-body-lg font-bold text-on-surface truncate">
                      {w?.title ?? 'Unknown workout'}
                    </h3>
                    <p className="font-data text-data-sm text-on-surface-variant mt-xs">
                      {formatShort(woDuration)} · {w?.intervals.length ?? 0} interval{(w?.intervals.length ?? 0) !== 1 && 's'}
                    </p>
                  </div>

                  {/* Mini timeline */}
                  <MiniTimeline workoutId={id} />

                  {/* Reorder + Remove */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="p-1 rounded text-outline-variant hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === selectedIds.length - 1}
                      className="p-1 rounded text-outline-variant hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedIds((prev) => prev.filter((x) => x !== id))}
                      className="p-1 rounded text-outline-variant hover:text-error transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Add Workout Area */}
            <div className="mt-md border-2 border-dashed border-outline-variant/50 rounded-lg p-lg text-center hover:bg-surface-variant/30 hover:border-primary transition-colors cursor-pointer group">
              <div className="flex flex-col gap-md">
                {/* Search bar */}
                <div className="relative max-w-md mx-auto w-full">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    placeholder="Browse & Add Workouts..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container text-on-surface rounded-lg font-body text-body-md placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-secondary"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Results list */}
                {search.trim() && (
                  <div className="max-h-48 overflow-y-auto bg-surface rounded-lg border border-outline-variant/30 divide-y divide-outline-variant/10 text-left">
                    {filtered.length === 0 ? (
                      <p className="px-3 py-2 font-body text-body-md text-on-surface-variant">No workouts found</p>
                    ) : (
                      filtered.map((w) => (
                        <label
                          key={w.id}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-container transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSet.has(w.id)}
                            onChange={() => toggleWorkout(w.id)}
                            className="accent-secondary w-4 h-4"
                          />
                          <span className="flex-1 font-body text-body-md text-on-surface truncate">{w.title}</span>
                          <span className="font-data text-data-sm text-on-surface-variant shrink-0">
                            {formatShort(flattenWorkout(w).reduce((s, i) => s + i.duration, 0))}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}

                {/* Empty state CTA when no search */}
                {!search.trim() && (
                  <>
                    <svg className="w-10 h-10 mx-auto text-outline-variant group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="font-label text-label-caps text-on-surface-variant group-hover:text-primary uppercase tracking-wider block">
                      Browse &amp; Add Workouts
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary Sidebar (desktop) */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="glass-card rounded-xl p-lg sticky top-28">
            <h2 className="font-headline text-headline-md font-bold text-on-surface mb-lg">Sequence Profile</h2>
            <div className="space-y-md">
              {/* Mini Chart */}
              <div className="h-32 rounded-lg bg-surface-container border border-outline-variant/30 relative overflow-hidden flex items-end px-sm pb-sm gap-xs">
                {selectedIds.slice(0, 8).map((id, i) => {
                  const w = workouts.find((x) => x.id === id)
                  if (!w) return <div key={id} className="w-full h-1/4 bg-surface-tint rounded-t-sm opacity-60" />
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
                      <div className={`h-full rounded-t-sm ${i % 2 === 0 ? 'bg-primary-container' : 'bg-secondary-container'}`} />
                    </div>
                  )
                })}
                {selectedIds.length === 0 && (
                  <div className="w-full flex items-center justify-center h-full">
                    <span className="font-data text-data-sm text-on-surface-variant">No workouts</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-sm">
                <div className="bg-surface-variant p-sm rounded-lg">
                  <div className="font-label text-label-caps text-on-surface-variant uppercase tracking-wider mb-xs">Work Ratio</div>
                  <div className="font-data text-data-lg text-primary">{workRatio}%</div>
                </div>
                <div className="bg-surface-variant p-sm rounded-lg">
                  <div className="font-label text-label-caps text-on-surface-variant uppercase tracking-wider mb-xs">Rest Ratio</div>
                  <div className="font-data text-data-lg text-primary">{restRatio}%</div>
                </div>
              </div>

              {/* Estimated Strain */}
              <div className="pt-sm border-t border-outline-variant/20 mt-sm">
                <div className="flex justify-between items-center mb-xs">
                  <span className="font-label text-label-caps text-on-surface-variant uppercase">Estimated Strain</span>
                  <span className="font-data text-data-sm font-bold text-secondary-container">
                    {workRatio > 70 ? 'High' : workRatio > 40 ? 'Moderate' : 'Low'}
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-secondary-container h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, workRatio)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-outline-variant/30 p-margin-mobile md:p-margin-desktop flex justify-between items-center z-40">
        <button
          onClick={() => router.push('/sequences')}
          className="font-label text-label-caps text-on-surface-variant hover:text-error transition-colors px-lg py-sm uppercase tracking-wider"
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="bg-primary text-on-primary font-label text-label-caps px-xl py-md rounded-full hover:bg-primary-container disabled:bg-surface-container-high disabled:text-on-surface-variant transition-colors shadow-sm ambient-shadow uppercase tracking-wider flex items-center gap-sm"
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
