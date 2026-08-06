'use client'

import { useState, useRef } from 'react'
import type { ExerciseCategory } from '@/types/workout'
import { TagChips } from './TagChips'

export interface ExerciseFormData {
  name: string
  category: ExerciseCategory
  description?: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  force?: 'push' | 'pull' | 'static'
  mechanic?: 'compound' | 'isolation'
  instructions: string[]
  images: string[]
}

interface ExerciseFormDialogProps {
  onClose: () => void
  form: ExerciseFormData
  onFormChange: (f: ExerciseFormData) => void
  editingId: string | null
  onSave: (e: React.FormEvent) => void
  dialogRef: React.RefObject<HTMLDialogElement | null>
  allMuscleGroups: string[]
  allEquipment: string[]
  onImageUpload?: (file: File) => Promise<string>
}

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
const FORCE_OPTIONS = ['push', 'pull', 'static'] as const
const MECHANIC_OPTIONS = ['compound', 'isolation'] as const

export function ExerciseFormDialog({
  onClose,
  form, onFormChange,
  editingId,
  onSave,
  dialogRef,
  allMuscleGroups,
  allEquipment,
  onImageUpload,
}: ExerciseFormDialogProps) {
  const [validationError, setValidationError] = useState('')
  // ponytail: simple local state for each image URL input, not a full array manager
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setValidationError('Name is required')
      return
    }
    setValidationError('')
    onSave(e)
  }

  function update(changes: Partial<ExerciseFormData>) {
    onFormChange({ ...form, ...changes })
  }

  function addImageUrl() {
    const url = imageUrlInput.trim()
    if (url && !form.images.includes(url)) {
      update({ images: [...form.images, url] })
    }
    setImageUrlInput('')
  }

  function removeImage(url: string) {
    update({ images: form.images.filter((i) => i !== url) })
  }

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl bg-surface border border-border/50 text-fg-2 p-24 max-w-lg w-full m-auto backdrop:bg-surface/80 max-h-[85vh] overflow-y-auto"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="exercise-form">
        <h3 className="font-headline text-headline-md font-semibold text-accent">
          {editingId ? 'Edit Exercise' : 'New Exercise'}
        </h3>

        {/* Name */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-muted">Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            required
            className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md placeholder:text-muted outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Exercise name"
          />
          {validationError && (
            <span className="text-error text-sm font-label text-label-caps">{validationError}</span>
          )}
        </label>

        {/* Category */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-muted">Category</span>
          <select
            value={form.category}
            onChange={(e) => update({ category: e.target.value as ExerciseCategory })}
            className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md outline-none focus:ring-2 focus:ring-secondary"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat}
              </option>
            ))}
          </select>
        </label>

        {/* Force */}
        <fieldset className="flex flex-col gap-1 border-none p-0 m-0">
          <legend className="font-label text-label-caps text-muted mb-1">Force</legend>
          <div className="flex gap-3">
            {FORCE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="force"
                  value={opt}
                  checked={form.force === opt}
                  onChange={() => update({ force: opt })}
                  className="accent-accent"
                />
                <span className="font-body text-body-md capitalize text-fg-2">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Mechanic */}
        <fieldset className="flex flex-col gap-1 border-none p-0 m-0">
          <legend className="font-label text-label-caps text-muted mb-1">Mechanic</legend>
          <div className="flex gap-3">
            {MECHANIC_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mechanic"
                  value={opt}
                  checked={form.mechanic === opt}
                  onChange={() => update({ mechanic: opt })}
                  className="accent-accent"
                />
                <span className="font-body text-body-md capitalize text-fg-2">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Difficulty */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-muted">Difficulty</span>
          <select
            value={form.difficulty ?? ''}
            onChange={(e) => update({ difficulty: (e.target.value || undefined) as ExerciseFormData['difficulty'] })}
            className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="">Any</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d} className="capitalize">
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {/* Primary Muscles */}
        <TagChips
          tags={form.primaryMuscles}
          onAdd={(tag) => update({ primaryMuscles: [...form.primaryMuscles, tag] })}
          onRemove={(tag) => update({ primaryMuscles: form.primaryMuscles.filter((t) => t !== tag) })}
          suggestions={allMuscleGroups}
          placeholder="Type to search..."
          label="Primary Muscles"
        />

        {/* Secondary Muscles */}
        <TagChips
          tags={form.secondaryMuscles}
          onAdd={(tag) => update({ secondaryMuscles: [...form.secondaryMuscles, tag] })}
          onRemove={(tag) => update({ secondaryMuscles: form.secondaryMuscles.filter((t) => t !== tag) })}
          suggestions={allMuscleGroups}
          placeholder="Type to search..."
          label="Secondary Muscles"
        />

        {/* Equipment */}
        <TagChips
          tags={form.equipment}
          onAdd={(tag) => update({ equipment: [...form.equipment, tag] })}
          onRemove={(tag) => update({ equipment: form.equipment.filter((t) => t !== tag) })}
          suggestions={allEquipment}
          placeholder="Type to search..."
          label="Equipment"
        />

        {/* Description */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-muted">Description</span>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => update({ description: e.target.value })}
            rows={3}
            className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md placeholder:text-muted resize-none outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Optional description"
          />
        </label>

        {/* Instructions — Step Editor */}
        <div data-testid="instructions-section" className="flex flex-col gap-2">
          <span className="font-label text-label-caps text-muted">Instructions</span>
          {form.instructions.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-muted font-body text-body-md w-5 shrink-0 text-right">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={step}
                onChange={(e) => {
                  const next = [...form.instructions]
                  next[idx] = e.target.value
                  update({ instructions: next })
                }}
                className="flex-1 bg-surface text-fg-2 rounded-lg px-3 py-1.5 font-body text-body-md placeholder:text-muted outline-none focus:ring-2 focus:ring-secondary"
                placeholder={`Step ${idx + 1} description`}
              />
              <button
                type="button"
                onClick={() => {
                  const next = [...form.instructions]
                  if (idx > 0) {
                    [next[idx - 1]!, next[idx]!] = [next[idx]!, next[idx - 1]!]
                    update({ instructions: next })
                  }
                }}
                disabled={idx === 0}
                className="p-1 text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = [...form.instructions]
                  if (idx < next.length - 1) {
                    [next[idx]!, next[idx + 1]!] = [next[idx + 1]!, next[idx]!]
                    update({ instructions: next })
                  }
                }}
                disabled={idx === form.instructions.length - 1}
                className="p-1 text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  update({ instructions: form.instructions.filter((_, i) => i !== idx) })
                }}
                className="p-1 text-muted hover:text-error transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded"
                aria-label={`Remove step ${idx + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update({ instructions: [...form.instructions, ''] })}
            className="self-start px-3 py-1 rounded-lg font-label text-label-caps text-accent hover:bg-surface-warm transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            + Add Step
          </button>
        </div>

        {/* Image URLs */}
        <div className="flex flex-col gap-2">
          <span className="font-label text-label-caps text-muted">Image URLs</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md placeholder:text-muted outline-none focus:ring-2 focus:ring-secondary"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="px-3 py-2 rounded-lg font-label text-label-caps bg-surface text-fg-2 hover:bg-surface-warm transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              +
            </button>
            <button
              type="button"
              disabled={uploading || !onImageUpload}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg font-label text-label-caps bg-surface text-fg-2 hover:bg-surface-warm transition-colors disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              title={!onImageUpload ? 'Image upload not available' : 'Upload image file'}
            >
              {uploading ? '...' : '📁'}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f && onImageUpload) {
                  setUploading(true)
                  setUploadError('')
                  try {
                    const blobUrl = await onImageUpload(f)
                    if (blobUrl) {
                      update({ images: [...form.images, blobUrl] })
                    }
                  } catch (err) {
                    setUploadError(err instanceof Error ? err.message : 'Upload failed')
                  } finally {
                    setUploading(false)
                  }
                }
                e.target.value = ''
              }}
            />
          </div>
          {uploadError && (
            <p className="font-body text-body-md text-error">{uploadError}</p>
          )}
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.images.map((url) => (
                <span
                  key={url}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded text-sm max-w-full"
                >
                  {url.startsWith('blob:') ? (
                    <img src={url} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">image</span>
                  )}
                  <span className="truncate max-w-[120px]">{url.replace(/^blob:/, '').slice(0, 20)}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="text-accent/60 hover:text-accent transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded"
                    aria-label={`Remove image`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Preview Card */}
        {(form.name || form.primaryMuscles.length > 0 || form.images.length > 0) && (
          <div className="border border-border-soft rounded-xl overflow-hidden bg-surface">
            {form.images[0] && (
              <div className="aspect-[4/3] bg-surface relative overflow-hidden">
                {/* ponytail: native img with loading lazy, no next/image complexity for dialog */}
                <img
                  src={form.images[0]}
                  alt={form.name || 'Exercise preview'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
            <div className="p-12 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <h4 className="font-body text-body-lg font-bold text-accent">
                  {form.name || 'Exercise Name'}
                </h4>
                <span className="font-data text-data-sm text-muted">◎{form.category}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...form.primaryMuscles, ...form.secondaryMuscles].map((m) => (
                  <span
                    key={m}
                    className="bg-surface px-2 py-0.5 rounded font-label-caps text-label-caps text-muted tracking-wider"
                  >
                    {m.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-label text-label-caps text-muted hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg font-label text-label-caps bg-accent text-accent-on hover:bg-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            {editingId ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
