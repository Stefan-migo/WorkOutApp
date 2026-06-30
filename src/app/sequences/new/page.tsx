'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSequences } from '@/hooks/useSequences'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { flattenWorkout } from '@/lib/interval-engine'
import type { Sequence } from '@/types/workout'

function formatDuration(totalSeconds: number) {
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

  // ponytail: Set for O(1) lookups, rebuilt on each render — fine for < 100 workouts
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

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={title}
          placeholder="Sequence title"
          className="flex-1 text-2xl font-bold bg-transparent border-b border-transparent hover:border-border focus:border-accent outline-none text-fg placeholder:text-muted"
          onChange={(e) => setTitle(e.target.value)}
        />
        <span className="font-mono text-muted text-sm tabular-nums shrink-0">
          {formatDuration(totalDurationSec)}
        </span>
      </div>

      <div>
        <label className="text-sm text-muted block mb-1">Description</label>
        <textarea
          value={description}
          placeholder="Optional description"
          rows={2}
          className="w-full bg-surface border border-border rounded-lg p-3 text-fg placeholder:text-muted outline-none focus:border-accent resize-none"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-muted block mb-1">
          Repeat count ({repeatCount}× ={' '}
          {selectedIds.length * repeatCount} round
          {selectedIds.length * repeatCount !== 1 && 's'})
        </label>
        <input
          type="number"
          min={1}
          max={99}
          value={repeatCount}
          className="w-20 bg-surface border border-border rounded-lg p-2 text-fg text-center outline-none focus:border-accent"
          onChange={(e) =>
            setRepeatCount(
              Math.max(1, Math.min(99, parseInt(e.target.value) || 1)),
            )
          }
        />
      </div>

      <div>
        <label className="text-sm text-muted block mb-1">
          Select workouts ({selectedIds.length} selected)
        </label>
        <input
          type="text"
          value={search}
          placeholder="Search workouts..."
          className="w-full bg-surface border border-border rounded-lg p-2 text-fg placeholder:text-muted outline-none focus:border-accent mb-2"
          onChange={(e) => setSearch(e.target.value)}
        />
        {filtered.length === 0 ? (
          <p className="text-muted text-sm py-2">No workouts found</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-surface divide-y divide-border-soft">
            {filtered.map((w) => (
              <label
                key={w.id}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-alt transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(w.id)}
                  onChange={() => toggleWorkout(w.id)}
                  className="accent-accent"
                />
                <span className="text-fg text-sm">{w.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div>
          <label className="text-sm text-muted block mb-1">Order</label>
          <div className="flex flex-col gap-1">
            {selectedIds.map((id, i) => {
              const w = workouts.find((x) => x.id === id)
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-soft rounded-lg"
                >
                  <span className="text-xs text-muted w-5">{i + 1}.</span>
                  <span className="flex-1 text-fg text-sm truncate">
                    {w?.title ?? 'Unknown workout'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="px-2 py-1 text-xs bg-surface border border-border rounded text-fg hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === selectedIds.length - 1}
                      className="px-2 py-1 text-xs bg-surface border border-border rounded text-fg hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() =>
                        setSelectedIds((prev) =>
                          prev.filter((x) => x !== id),
                        )
                      }
                      className="px-2 py-1 text-xs bg-surface border border-border rounded text-status-warning hover:bg-surface-alt transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/sequences')}
          className="flex-1 py-3 bg-surface border border-border text-fg rounded-lg font-medium transition-colors hover:bg-surface-alt"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 py-3 bg-accent hover:bg-accent disabled:bg-surface-alt disabled:text-muted text-accent-on rounded-lg font-medium transition-colors"
        >
          Save Sequence
        </button>
      </div>
    </div>
  )
}
