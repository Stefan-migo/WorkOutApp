'use client'

import { useState, useRef, useId } from 'react'
import type { Exercise, ExerciseCategory } from '@/types/workout'

interface ExercisePickerProps {
  exercises: Exercise[]
  value: string
  onChange: (id: string) => void
  onQuickCreate: (exercise: Exercise) => void
}

const ALL_CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']

// ponytail: simple counter ID for quick-create, collisions unlikely with seeded UUIDs
let quickId = Date.now()
function genId(): string {
  return `exercise-${quickId++}`
}

export function ExercisePicker({ exercises, value, onChange, onQuickCreate }: ExercisePickerProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formId = useId()

  // Quick-create form state
  const [qcName, setQcName] = useState('')
  const [qcCategory, setQcCategory] = useState<ExerciseCategory>('strength')
  const [qcMuscleGroups, setQcMuscleGroups] = useState('')

  const filtered = exercises.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!qcName.trim()) return
    const groups = qcMuscleGroups
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const exercise: Exercise = {
      id: genId(),
      name: qcName.trim(),
      category: qcCategory,
      muscleGroups: groups.length > 0 ? groups : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    onQuickCreate(exercise)
    onChange(exercise.id)
    setQcName('')
    setQcCategory('strength')
    setQcMuscleGroups('')
    dialogRef.current?.close()
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Search + Add button row */}
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-zinc-700 text-white rounded px-3 py-2 text-sm placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded text-lg font-bold"
          aria-label="Quick-create exercise"
        >
          +
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setCategoryFilter(null)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            categoryFilter === null ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:text-white'
          }`}
        >
          All
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${
              categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-500 py-4 text-center">
            {search || categoryFilter ? 'No exercises match your filters.' : 'No exercises yet. Add one!'}
          </p>
        )}
        {filtered.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onChange(ex.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded text-left text-sm transition-colors ${
              value === ex.id
                ? 'bg-blue-600/20 text-blue-300 border border-blue-600/40'
                : 'text-zinc-300 hover:bg-zinc-700 border border-transparent'
            }`}
          >
            <span className="flex-1 truncate">{ex.name}</span>
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">{ex.category}</span>
          </button>
        ))}
      </div>

      {/* Quick-create dialog */}
      <dialog
        ref={dialogRef}
        className="bg-zinc-800 text-white rounded-xl p-6 max-w-sm w-full backdrop:bg-black/60"
      >
        <form onSubmit={handleQuickCreate} className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Quick Create Exercise</h3>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Name</span>
            <input
              type="text"
              value={qcName}
              onChange={(e) => setQcName(e.target.value)}
              required
              className="bg-zinc-700 text-white rounded px-3 py-2 text-sm placeholder:text-zinc-500"
              placeholder="e.g. Push-ups"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Category</span>
            <select
              value={qcCategory}
              onChange={(e) => setQcCategory(e.target.value as ExerciseCategory)}
              className="bg-zinc-700 text-white rounded px-3 py-2 text-sm"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Muscle Groups</span>
            <input
              type="text"
              value={qcMuscleGroups}
              onChange={(e) => setQcMuscleGroups(e.target.value)}
              className="bg-zinc-700 text-white rounded px-3 py-2 text-sm placeholder:text-zinc-500"
              placeholder="Comma-separated: Chest, Triceps"
            />
          </label>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-4 py-2 rounded text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
