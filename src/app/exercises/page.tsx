'use client'

import { useState, useRef, useMemo } from 'react'
import { useExercises } from '@/hooks/useExercises'
import { useWorkoutContext } from '@/context/WorkoutContext'
import type { Exercise, ExerciseCategory } from '@/types/workout'

// ponytail: flat list CRUD, no pagination, no drag-reorder — add when >50 exercises exist
import { useRouter } from 'next/navigation'
const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']

const EMPTY_FORM: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  category: 'strength',
  description: '',
  muscleGroups: [],
  equipment: [],
  difficulty: undefined,
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  stretching: 'Stretching',
  mobility: 'Mobility',
  other: 'Other',
}

export default function ExercisesPage() {
  const { exercises, saveExercise, deleteExercise } = useExercises()
  const { workouts } = useWorkoutContext()
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const [muscleInput, setMuscleInput] = useState('')
  const [equipmentInput, setEquipmentInput] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null)

  // Derive unique filter options
  const allMuscleGroups = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((ex) => ex.muscleGroups?.forEach((mg) => set.add(mg)))
    return Array.from(set).sort()
  }, [exercises])

  const allEquipment = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((ex) => ex.equipment?.forEach((eq) => set.add(eq)))
    return Array.from(set).sort()
  }, [exercises])

  // Filter + search
  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const nameMatch = ex.name.toLowerCase().includes(q)
        const descMatch = ex.description?.toLowerCase().includes(q)
        const muscleMatch = ex.muscleGroups?.some((m) => m.toLowerCase().includes(q))
        const equipMatch = ex.equipment?.some((e) => e.toLowerCase().includes(q))
        if (!nameMatch && !descMatch && !muscleMatch && !equipMatch) return false
      }
      if (muscleFilter && !ex.muscleGroups?.includes(muscleFilter)) return false
      if (equipmentFilter && !ex.equipment?.includes(equipmentFilter)) return false
      return true
    })
  }, [exercises, search, muscleFilter, equipmentFilter])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<ExerciseCategory, Exercise[]>()
    for (const ex of filtered) {
      const list = map.get(ex.category) ?? []
      list.push(ex)
      map.set(ex.category, list)
    }
    return map
  }, [filtered])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setMuscleInput('')
    setEquipmentInput('')
    dialogRef.current?.showModal()
  }

  function openEdit(ex: Exercise) {
    setForm({
      name: ex.name,
      category: ex.category,
      description: ex.description ?? '',
      muscleGroups: ex.muscleGroups ?? [],
      equipment: ex.equipment ?? [],
      difficulty: ex.difficulty,
    })
    setMuscleInput((ex.muscleGroups ?? []).join(', '))
    setEquipmentInput((ex.equipment ?? []).join(', '))
    setEditingId(ex.id)
    dialogRef.current?.showModal()
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const groups = muscleInput.split(',').map((s) => s.trim()).filter(Boolean)
    const equip = equipmentInput.split(',').map((s) => s.trim()).filter(Boolean)
    const now = Date.now()
    const exercise: Exercise = {
      id: editingId || `exercise-${now}`,
      name: form.name.trim(),
      category: form.category,
      description: form.description?.trim() || undefined,
      muscleGroups: groups.length > 0 ? groups : undefined,
      equipment: equip.length > 0 ? equip : undefined,
      difficulty: form.difficulty || undefined,
      createdAt: editingId ? (exercises.find((e) => e.id === editingId)?.createdAt ?? now) : now,
      updatedAt: now,
    }
    saveExercise(exercise)
    dialogRef.current?.close()
  }

  function confirmDelete(id: string) {
    setDeleteTarget(id)
    deleteDialogRef.current?.showModal()
  }

  function handleDelete() {
    if (deleteTarget) {
      deleteExercise(deleteTarget)
      setDeleteTarget(null)
      deleteDialogRef.current?.close()
    }
  }

  function workoutRefCount(id: string): number {
    return workouts.filter((w) => w.intervals.some((i) => i.exerciseId === id)).length
  }

  const hasNoExercises = exercises.length === 0
  const hasNoResults = !hasNoExercises && filtered.length === 0

  return (
    <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col gap-32 pb-32">
      {/* Header Bento */}
      <section className="bg-surface rounded-xl p-24 border border-outline-variant/30 flex flex-col gap-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div className="flex flex-col gap-xs z-10">
          <h1 className="font-headline text-headline-lg font-bold text-primary">Exercise Library</h1>
          <p className="font-body text-body-md text-on-surface-variant">
            Master your movements. Search, filter, and build your ultimate protocol.
          </p>
        </div>
        <div className="flex flex-col gap-16 z-10">
          {/* Search */}
          <div className="relative w-full max-w-2xl">
            <span className="material-symbols-outlined absolute left-0 bottom-3 text-[48px] text-on-surface-variant">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-0 border-b-2 border-outline-variant/50 pl-10 py-3 font-data text-data-lg text-primary placeholder:text-on-surface-variant focus:ring-0 focus:border-secondary transition-colors outline-none"
              placeholder="Search by name, muscle, or equipment..."
            />
          </div>
          {/* Filter chips */}
          <div className="flex flex-wrap gap-x-24 gap-y-16 mt-8">
            <div className="flex flex-col gap-8">
              <span className="font-label text-label-caps text-on-surface-variant uppercase tracking-widest">Muscle Group</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMuscleFilter(null)}
                  className={`px-3 py-1.5 rounded-full font-label text-label-caps transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                    muscleFilter === null
                      ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20'
                      : 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  All
                </button>
                {allMuscleGroups.map((mg) => (
                  <button
                    key={mg}
                    onClick={() => setMuscleFilter(mg === muscleFilter ? null : mg)}
                    className={`px-3 py-1.5 rounded-full font-label text-label-caps transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                      muscleFilter === mg
                        ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20'
                        : 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    {mg}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-8">
              <span className="font-label text-label-caps text-on-surface-variant uppercase tracking-widest">Equipment</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEquipmentFilter(null)}
                  className={`px-3 py-1.5 rounded-full font-label text-label-caps transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                    equipmentFilter === null
                      ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20'
                      : 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  All
                </button>
                {allEquipment.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setEquipmentFilter(eq === equipmentFilter ? null : eq)}
                    className={`px-3 py-1.5 rounded-full font-label text-label-caps transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                      equipmentFilter === eq
                        ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20'
                        : 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="self-start px-4 py-2 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            + New Exercise
          </button>
        </div>
      </section>

      {/* Empty states */}
      {hasNoExercises && (
        <div className="flex flex-col items-center justify-center gap-4 py-[64px] text-center">
          <p className="font-body text-body-md text-on-surface-variant">No exercises yet. Create your first one!</p>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Create Exercise
          </button>
        </div>
      )}

      {hasNoResults && !hasNoExercises && (
        <div className="flex flex-col items-center justify-center gap-4 py-[64px] text-center">
          <p className="font-body text-body-md text-on-surface-variant">No exercises match your filters.</p>
        </div>
      )}

      {/* Category sections */}
      {!hasNoExercises && !hasNoResults && (
        <div className="flex flex-col gap-32">
          {CATEGORIES.map((cat) => {
            const items = grouped.get(cat)
            if (!items || items.length === 0) return null
            return (
              <section key={cat} className="flex flex-col gap-16">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-8">
                  <h2 className="font-headline text-headline-md font-semibold text-primary">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="font-data text-data-sm text-on-surface-variant">
                    {items.length} {items.length === 1 ? 'Movement' : 'Movements'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {items.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden hover:shadow-[0_4px_20px_rgba(30,41,59,0.05)] transition-all duration-300 group flex flex-col"
                    >
                      {/* Image area */}
                      <div className="aspect-[4/3] bg-surface-container-lowest m-xs rounded-lg relative overflow-hidden flex items-center justify-center">
                        {/* Placeholder exercise icon */}
                        <svg className="w-12 h-12 text-outline-variant/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {/* Difficulty badge */}
                        {ex.difficulty && (
                          <div className="absolute top-2 right-2 bg-surface/80 backdrop-blur px-2 py-1 rounded font-data text-data-sm text-primary font-bold shadow-sm">
                            {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="p-16 flex flex-col gap-8 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-body text-body-lg font-bold text-primary truncate">{ex.name}</h3>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(ex)}
                              className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDelete(ex.id)}
                              className="p-1 rounded text-on-surface-variant hover:text-error transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {ex.description && (
                          <p className="font-body text-body-md text-on-surface-variant line-clamp-2">{ex.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-auto pt-8">
                          {ex.muscleGroups?.slice(0, 3).map((mg) => (
                            <span key={mg} className="bg-surface-container px-2 py-1 rounded font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                              {mg.toUpperCase()}
                            </span>
                          ))}
                          {ex.equipment?.slice(0, 2).map((eq) => (
                            <span key={eq} className="bg-surface-container px-2 py-1 rounded font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                              {eq.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Bottom CTA */}
                      <div className="px-16 pb-16 border-t border-outline-variant/10 pt-8 mt-auto">
                        <button
                          onClick={() => router.push(`/workouts/new?exerciseId=${ex.id}`)}
                          className="w-full py-2 border border-outline text-primary font-label text-label-caps rounded hover:bg-surface-container transition-colors flex justify-center items-center gap-xs focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                        >
                          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add to Workout
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Create/Edit dialog */}
      <dialog
        ref={dialogRef}
        className="rounded-xl bg-surface border border-outline-variant/50 text-on-surface p-24 max-w-md w-full m-auto backdrop:bg-black/10 max-h-[85vh] overflow-y-auto"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <h3 className="font-headline text-headline-md font-semibold text-primary">
            {editingId ? 'Edit Exercise' : 'New Exercise'}
          </h3>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-caps text-on-surface-variant">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Exercise name"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-caps text-on-surface-variant">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExerciseCategory })}
              className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md outline-none focus:ring-2 focus:ring-secondary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-caps text-on-surface-variant">Difficulty</span>
            <select
              value={form.difficulty ?? ''}
              onChange={(e) => setForm({ ...form, difficulty: (e.target.value || undefined) as Exercise['difficulty'] })}
              className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Any</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-caps text-on-surface-variant">Description</span>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md placeholder:text-on-surface-variant resize-none outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Optional description"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-caps text-on-surface-variant">Muscle Groups</span>
            <input
              type="text"
              value={muscleInput}
              onChange={(e) => setMuscleInput(e.target.value)}
              className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Comma-separated: Chest, Triceps"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-caps text-on-surface-variant">Equipment</span>
            <input
              type="text"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-secondary"
              placeholder="Comma-separated: Dumbbell, Barbell"
            />
          </label>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-4 py-2 rounded-lg font-label text-label-caps text-on-surface-variant hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-label text-label-caps bg-primary text-on-primary hover:bg-primary-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              {editingId ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </dialog>

      {/* Delete confirmation dialog */}
      <dialog
        ref={deleteDialogRef}
        className="rounded-xl bg-surface border border-outline-variant/50 text-on-surface p-24 max-w-sm w-full m-auto backdrop:bg-black/10"
      >
        <div className="flex flex-col gap-4">
          <h3 className="font-headline text-headline-md font-semibold text-primary">Delete Exercise?</h3>
          {deleteTarget && workoutRefCount(deleteTarget) > 0 ? (
            <p className="font-body text-body-md text-secondary">
              This exercise is used in {workoutRefCount(deleteTarget)} workout
              {workoutRefCount(deleteTarget) !== 1 && 's'}. Deleting it will not remove existing
              references, but the exercise name will no longer be shown.
            </p>
          ) : (
            <p className="font-body text-body-md text-on-surface-variant">
              This exercise is not referenced by any workout. Are you sure?
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => deleteDialogRef.current?.close()}
              className="px-4 py-2 rounded-lg font-label text-label-caps text-on-surface-variant hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg font-label text-label-caps bg-error text-on-error hover:bg-error-container hover:text-on-error-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              Delete
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
