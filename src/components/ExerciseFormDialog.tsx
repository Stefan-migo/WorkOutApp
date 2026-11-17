'use client'

import { useId, useRef, useState } from 'react'
import type { ExerciseCategory, ExerciseVisibility } from '@/types/workout'
import { uploadExerciseMedia } from '@/lib/exercise-media'
import { useExerciseDemoDraft } from '@/hooks/useExerciseDemoDraft'
import { ExerciseFormDetails, EXERCISE_FIELD } from './ExerciseFormDetails'
import { ExerciseFormMedia } from './ExerciseFormMedia'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import styles from './ExerciseFormDialog.module.css'

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

export function ExerciseFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  editingId,
  onSave,
  saveError,
  allMuscleGroups,
  allEquipment,
  onImageUpload,
}: ExerciseFormDialogProps) {
  const demonstration = useExerciseDemoDraft(open)
  const fieldId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const authorRef = useRef<HTMLInputElement>(null)
  const [invalidField, setInvalidField] = useState<'name' | 'author' | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const busy = saving || uploading
  const shared = form.visibility === 'community'

  function close() {
    if (busy) return
    setInvalidField(null)
    setSubmitError('')
    onOpenChange(false)
  }

  function update(changes: Partial<ExerciseFormData>) {
    if ((invalidField === 'name' && changes.name?.trim())
      || (invalidField === 'author' && (changes.authorName?.trim() || changes.visibility === 'private'))) {
      setInvalidField(null)
    }
    onFormChange({ ...form, ...changes })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || demonstration.cameraOpen) return
    if (!form.name.trim()) {
      setInvalidField('name')
      nameRef.current?.focus()
      return
    }
    if (shared && !form.authorName?.trim()) {
      setInvalidField('author')
      authorRef.current?.focus()
      return
    }

    setInvalidField(null)
    setSaving(true)
    setSubmitError('')
    try {
      const clipUrl = demonstration.file ? await demonstration.getMedia(uploadExerciseMedia) : undefined
      await onSave(event, clipUrl ? [clipUrl, ...form.images] : undefined)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save the exercise. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close} title={editingId ? 'Edit Exercise' : 'New Exercise'} showCloseButton className={styles.dialog}>
      {open && (
        <form onSubmit={handleSubmit} noValidate data-testid="exercise-form">
          <fieldset disabled={busy} className="grid min-w-0 gap-16 px-16 py-16 sm:px-24">
            <legend className="sr-only">Exercise form</legend>
            <div className="grid gap-8 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <label className="grid content-start gap-xs text-sm font-semibold">
                Name
                <input
                  ref={nameRef}
                  type="text"
                  value={form.name}
                  onChange={(event) => update({ name: event.target.value })}
                  required
                  aria-invalid={invalidField === 'name'}
                  aria-describedby={invalidField === 'name' ? `${fieldId}-name` : undefined}
                  placeholder="Exercise name"
                  className={EXERCISE_FIELD}
                />
                {invalidField === 'name' && <span id={`${fieldId}-name`} role="alert" className="text-sm font-normal text-danger">Name is required</span>}
              </label>
              <label className="grid content-start gap-xs text-sm font-semibold">
                Category
                <select value={form.category} onChange={(event) => update({ category: event.target.value as ExerciseCategory })} className={EXERCISE_FIELD}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category[0]!.toUpperCase() + category.slice(1)}</option>)}
                </select>
              </label>
            </div>

            <fieldset className="grid min-w-0 gap-8">
              <legend className="mb-8 text-sm font-semibold">Who can see this exercise?</legend>
              <div className="grid grid-cols-2 gap-8">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-8 rounded-lg border border-border-soft px-8 text-sm font-semibold has-[:checked]:border-accent has-[:checked]:bg-accent/10 sm:px-16">
                  <input type="radio" name="exercise-visibility" className="accent-accent" checked={!shared} onChange={() => update({ visibility: 'private' })} />
                  Private
                </label>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-8 rounded-lg border border-border-soft px-8 text-sm font-semibold has-[:checked]:border-accent has-[:checked]:bg-accent/10 sm:px-16">
                  <input type="radio" name="exercise-visibility" className="accent-accent" checked={shared} onChange={() => update({ visibility: 'community' })} />
                  Community
                </label>
              </div>
              {shared ? (
                <>
                  <p className="text-sm text-muted">Signed-in members can view this exercise and its demonstration.</p>
                  <label className="grid gap-xs text-sm font-semibold">
                    Display name
                    <input
                      ref={authorRef}
                      required
                      maxLength={60}
                      value={form.authorName ?? ''}
                      onChange={(event) => update({ authorName: event.target.value })}
                      aria-invalid={invalidField === 'author'}
                      aria-describedby={invalidField === 'author' ? `${fieldId}-author` : undefined}
                      className={EXERCISE_FIELD}
                    />
                  </label>
                  {invalidField === 'author' && <p id={`${fieldId}-author`} role="alert" className="text-sm text-danger">Enter the author name to display in the community.</p>}
                </>
              ) : <p className="text-sm text-muted">Only you can see this exercise.</p>}
            </fieldset>

            <ExerciseFormMedia
              demonstration={demonstration}
              images={form.images}
              onImagesChange={(images) => update({ images })}
              onImageUpload={onImageUpload}
              uploading={uploading}
              setUploading={setUploading}
              saving={saving}
            />

            <ExerciseFormDetails form={form} update={update} allMuscleGroups={allMuscleGroups} allEquipment={allEquipment} />
          </fieldset>

          <footer className={styles.footer}>
            {(submitError || saveError) && <p role="alert" className="mb-8 text-sm text-danger">{submitError || saveError}</p>}
            <div className="flex flex-wrap items-center justify-end gap-8">
              <Button variant="ghost" disabled={busy} onClick={close}>Cancel</Button>
              <Button type="submit" className="grow sm:grow-0" disabled={busy || demonstration.cameraOpen}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create exercise'}
              </Button>
            </div>
          </footer>
        </form>
      )}
    </Dialog>
  )
}
