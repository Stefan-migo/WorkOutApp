'use client'

import { useState, useRef } from 'react'
import { useExercises } from '@/hooks/useExercises'
import { useWorkoutContext } from '@/context/WorkoutContext'
import type { Exercise, ExerciseCategory } from '@/types/workout'

// ponytail: flat list CRUD, no pagination, no drag-reorder — add when >50 exercises exist
const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']

const EMPTY_FORM: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  category: 'strength',
  description: '',
  muscleGroups: [],
}

export default function ExercisesPage() {
  const { exercises, saveExercise, deleteExercise } = useExercises()
  const { workouts } = useWorkoutContext()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const [muscleInput, setMuscleInput] = useState('')

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setMuscleInput('')
    dialogRef.current?.showModal()
  }

  function openEdit(ex: Exercise) {
    setForm({
      name: ex.name,
      category: ex.category,
      description: ex.description ?? '',
      muscleGroups: ex.muscleGroups ?? [],
    })
    setMuscleInput((ex.muscleGroups ?? []).join(', '))
    setEditingId(ex.id)
    dialogRef.current?.showModal()
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const groups = muscleInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const now = Date.now()
    const exercise: Exercise = {
      id: editingId || `exercise-${now}`,
      name: form.name.trim(),
      category: form.category,
      description: form.description?.trim() || undefined,
      muscleGroups: groups.length > 0 ? groups : undefined,
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

  return (
    <div className="max-w-2xl mx-auto w-full p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercises</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          + New Exercise
        </button>
      </div>

      {exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16 text-center">
          <p className="text-zinc-400">No exercises yet. Create your first one!</p>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
          >
            Create Exercise
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {exercises.map((ex) => {
          const refCount = workoutRefCount(ex.id)
          return (
            <div
              key={ex.id}
              className="p-4 rounded-lg bg-zinc-800 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{ex.name}</h3>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium bg-zinc-700 text-zinc-400">
                    {ex.category}
                  </span>
                </div>
                {ex.description && (
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-1">{ex.description}</p>
                )}
                {ex.muscleGroups && ex.muscleGroups.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {ex.muscleGroups.map((mg) => (
                      <span
                        key={mg}
                        className="px-1.5 py-0.5 rounded text-[11px] bg-zinc-700/50 text-zinc-400"
                      >
                        {mg}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(ex)}
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDelete(ex.id)}
                  className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 rounded text-sm text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create/Edit dialog */}
      <dialog
        ref={dialogRef}
        className="bg-zinc-800 text-white rounded-xl p-6 max-w-md w-full backdrop:bg-black/60"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">{editingId ? 'Edit Exercise' : 'New Exercise'}</h3>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="bg-zinc-700 text-white rounded px-3 py-2 text-sm placeholder:text-zinc-500"
              placeholder="Exercise name"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExerciseCategory })}
              className="bg-zinc-700 text-white rounded px-3 py-2 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Description</span>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="bg-zinc-700 text-white rounded px-3 py-2 text-sm placeholder:text-zinc-500 resize-none"
              placeholder="Optional description"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Muscle Groups</span>
            <input
              type="text"
              value={muscleInput}
              onChange={(e) => setMuscleInput(e.target.value)}
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
              {editingId ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </dialog>

      {/* Delete confirmation dialog */}
      <dialog
        ref={deleteDialogRef}
        className="bg-zinc-800 text-white rounded-xl p-6 max-w-sm w-full backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Delete Exercise?</h3>
          {deleteTarget && workoutRefCount(deleteTarget) > 0 ? (
            <p className="text-sm text-amber-400">
              This exercise is used in {workoutRefCount(deleteTarget)} workout
              {workoutRefCount(deleteTarget) !== 1 && 's'}. Deleting it will not remove existing
              references, but the exercise name will no longer be shown.
            </p>
          ) : (
            <p className="text-sm text-zinc-400">
              This exercise is not referenced by any workout. Are you sure?
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => deleteDialogRef.current?.close()}
              className="px-4 py-2 rounded text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded text-sm font-medium bg-red-700 hover:bg-red-600 text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
