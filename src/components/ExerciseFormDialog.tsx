'use client'

import { useState, useRef } from 'react'
import type { ExerciseCategory, ExerciseVisibility } from '@/types/workout'
import { isExerciseVideo, uploadExerciseMedia } from '@/lib/exercise-media'
import { useExerciseDemoDraft } from '@/hooks/useExerciseDemoDraft'
import { ExerciseCamera } from './ExerciseCamera'
import { ExerciseMedia } from './ExerciseMedia'
import { TagChips } from './TagChips'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'

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
  visibility?: ExerciseVisibility
  authorName?: string
}

interface ExerciseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: ExerciseFormData
  onFormChange: (f: ExerciseFormData) => void
  editingId: string | null
  onSave: (e: React.FormEvent, images?: string[]) => void | Promise<void>
  saveError?: string | null
  allMuscleGroups: string[]
  allEquipment: string[]
  onImageUpload?: (file: File) => Promise<string>
}

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
const FORCE_OPTIONS = ['push', 'pull', 'static'] as const
const MECHANIC_OPTIONS = ['compound', 'isolation'] as const

export function ExerciseFormDialog({
  open,
  onOpenChange,
  form, onFormChange,
  editingId,
  onSave,
  saveError,
  allMuscleGroups,
  allEquipment,
  onImageUpload,
}: ExerciseFormDialogProps) {
  const demonstration = useExerciseDemoDraft(open)
  const [validationError, setValidationError] = useState('')
  // ponytail: simple local state for each image URL input, not a full array manager
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (uploading || saving || demonstration.cameraOpen) return
    if (!form.name.trim()) {
      setValidationError('Name is required')
      return
    }
    if (form.visibility === 'community' && !form.authorName?.trim()) {
      setValidationError('Enter the author name to display in the community.')
      return
    }
    setValidationError('')
    setSaving(true)
    setUploadError('')
    try {
      const clipUrl = demonstration.file ? await demonstration.getMedia(uploadExerciseMedia) : undefined
      if (clipUrl) await onSave(e, [clipUrl, ...form.images])
      else await onSave(e)
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Could not save the exercise. Try again.')
    } finally {
      setSaving(false)
    }
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
    <Dialog
      open={open}
      onOpenChange={(next) => { if (!saving) onOpenChange(next) }}
      contained
      title={editingId ? 'Edit Exercise' : 'New Exercise'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="exercise-form">
        {/* Name */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-muted">Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            required
            className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md placeholder:text-muted outline-none focus:ring-2 focus:ring-accent"
            placeholder="Exercise name"
          />
          {validationError && (
            <span className="text-danger text-sm font-label text-label-caps">{validationError}</span>
          )}
        </label>

        <fieldset className="flex flex-col gap-2 rounded-control border border-border-soft p-3">
          <legend className="px-1 text-sm font-semibold text-fg-2">Visibility</legend>
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input type="radio" name="exercise-visibility" className="accent-accent" checked={form.visibility !== 'community'} onChange={() => update({ visibility: 'private' })} />
            Private
          </label>
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input type="radio" name="exercise-visibility" className="accent-accent" checked={form.visibility === 'community'} onChange={() => update({ visibility: 'community' })} />
            Share with the community
          </label>
          {form.visibility === 'community' && (
            <label className="flex flex-col gap-1 text-sm">
              Display name
              <input
                required
                maxLength={60}
                value={form.authorName ?? ''}
                onChange={(event) => update({ authorName: event.target.value })}
                className="min-h-11 rounded-control border border-border-soft bg-surface px-3"
              />
              <span className="text-xs text-muted">Signed-in members can view this exercise, including its demonstration.</span>
            </label>
          )}
        </fieldset>

        <section aria-label="Exercise demonstration" className="flex flex-col gap-2">
          {open && demonstration.cameraOpen ? (
            <ExerciseCamera onCapture={demonstration.capture} onCancel={() => demonstration.setCameraOpen(false)} />
          ) : (
            <>
              {demonstration.file && demonstration.preview && (
                <video
                  src={demonstration.preview}
                  aria-label="Recorded demonstration"
                  className="max-h-56 w-full rounded-control bg-surface-warm object-contain"
                  autoPlay muted loop playsInline
                />
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={saving || uploading} onClick={() => demonstration.setCameraOpen(true)}>
                  {demonstration.file ? 'Record again' : 'Record demonstration'}
                </Button>
                {demonstration.file && <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={demonstration.discard}>Discard recording</Button>}
              </div>
            </>
          )}
        </section>

        {/* Category */}
        <label className="flex flex-col gap-1">
          <span className="font-label text-label-caps text-muted">Category</span>
          <select
            value={form.category}
            onChange={(e) => update({ category: e.target.value as ExerciseCategory })}
            className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md outline-none focus:ring-2 focus:ring-accent"
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
            className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md outline-none focus:ring-2 focus:ring-accent"
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
            className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md placeholder:text-muted resize-none outline-none focus:ring-2 focus:ring-accent"
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
                className="flex-1 bg-surface text-fg-2 rounded-lg px-3 py-1.5 font-body text-body-md placeholder:text-muted outline-none focus:ring-2 focus:ring-accent"
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
                className="p-1 text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:focus-ring rounded"
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
                className="p-1 text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:focus-ring rounded"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  update({ instructions: form.instructions.filter((_, i) => i !== idx) })
                }}
                className="p-1 text-muted hover:text-danger transition-colors focus-visible:focus-ring rounded"
                aria-label={`Remove step ${idx + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update({ instructions: [...form.instructions, ''] })}
            className="self-start px-3 py-1 rounded-lg font-label text-label-caps text-accent hover:bg-surface-warm transition-colors focus-visible:focus-ring"
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
              className="flex-1 bg-surface text-fg-2 rounded-lg px-3 py-2 font-body text-body-md placeholder:text-muted outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="px-3 py-2 rounded-lg font-label text-label-caps bg-surface text-fg-2 hover:bg-surface-warm transition-colors focus-visible:focus-ring"
            >
              +
            </button>
            <button
              type="button"
              disabled={uploading || !onImageUpload}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg font-label text-label-caps bg-surface text-fg-2 hover:bg-surface-warm transition-colors disabled:opacity-30 focus-visible:focus-ring"
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
                    const imageUrl = await onImageUpload(f)
                    if (imageUrl) {
                      update({ images: [...form.images, imageUrl] })
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
            <p className="font-body text-body-md text-danger">{uploadError}</p>
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
                    className="text-accent/60 hover:text-accent transition-colors shrink-0 focus-visible:focus-ring rounded"
                    aria-label={isExerciseVideo(url) ? 'Remove demonstration' : 'Remove image'}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {saveError && <p role="alert" className="text-sm text-danger">{saveError}</p>}

        {/* Preview Card */}
        {(form.name || form.primaryMuscles.length > 0 || form.images.length > 0) && (
          <div className="border border-border-soft rounded-xl overflow-hidden bg-surface">
            {form.images[0] && (
              <div className="aspect-[4/3] bg-surface relative overflow-hidden">
                {/* ponytail: native img with loading lazy, no next/image complexity for dialog */}
                <ExerciseMedia
                  src={form.images[0]}
                  alt={form.name || 'Exercise preview'}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
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
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving || uploading || demonstration.cameraOpen}>
            {saving ? 'Saving…' : editingId ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
