'use client'

import type { Exercise, ExerciseCategory } from '@/types/workout'

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

interface ExerciseFormDialogProps {
  onClose: () => void
  form: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>
  onFormChange: (f: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>) => void
  editingId: string | null
  muscleInput: string
  onMuscleInput: (v: string) => void
  equipmentInput: string
  onEquipmentInput: (v: string) => void
  onSave: (e: React.FormEvent) => void
  dialogRef: React.RefObject<HTMLDialogElement | null>
}

export function ExerciseFormDialog({
  onClose,
  form, onFormChange,
  editingId,
  muscleInput, onMuscleInput,
  equipmentInput, onEquipmentInput,
  onSave,
  dialogRef,
}: ExerciseFormDialogProps) {
  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl bg-surface border border-outline-variant/50 text-on-surface p-24 max-w-md w-full m-auto backdrop:bg-black/10 max-h-[85vh] overflow-y-auto"
      onClose={onClose}
    >
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <h3 className="font-headline text-headline-md font-semibold text-primary">
          {editingId ? 'Edit Exercise' : 'New Exercise'}
        </h3>

        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-on-surface-variant">Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            required
            className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Exercise name"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-on-surface-variant">Category</span>
          <select
            value={form.category}
            onChange={(e) => onFormChange({ ...form, category: e.target.value as ExerciseCategory })}
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
            onChange={(e) => onFormChange({ ...form, difficulty: (e.target.value || undefined) as Exercise['difficulty'] })}
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
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
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
            onChange={(e) => onMuscleInput(e.target.value)}
            className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Comma-separated: Chest, Triceps"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-on-surface-variant">Equipment</span>
          <input
            type="text"
            value={equipmentInput}
            onChange={(e) => onEquipmentInput(e.target.value)}
            className="bg-surface-container text-on-surface rounded-lg px-3 py-2 font-body text-body-md placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Comma-separated: Dumbbell, Barbell"
          />
        </label>

        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
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
  )
}
