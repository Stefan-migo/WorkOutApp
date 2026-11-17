'use client'

import { useState, useRef, useId, useMemo } from 'react'
import { isCloudExerciseMedia } from '@/lib/exercise-media'
import { useIntervalDialog } from '@/hooks/useIntervalDialog'
import styles from './IntervalDialog.module.css'
import { snapshotExerciseDescription } from '@/lib/exercise-ownership'
import type { Interval, Exercise, WorkoutMode } from '@/types/workout'
import { ExercisePicker } from './ExercisePicker'

interface IntervalDetailSheetProps {
  interval: Interval
  onSave: (updated: Interval) => void
  onClose: () => void
  exercises?: Exercise[]
  onImageUpload?: (file: File) => Promise<string>
  onSyncLocalImage?: () => Promise<string>
}

export function IntervalDetailSheet({ interval, onSave, onClose, exercises, onImageUpload, onSyncLocalImage }: IntervalDetailSheetProps) {
  const dialogRef = useIntervalDialog()
  const headingId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(interval.title)
  const [duration, setDuration] = useState(interval.duration)
  const [description, setDescription] = useState(interval.description ?? '')
  const [exerciseId, setExerciseId] = useState(interval.exerciseId ?? '')
  const [imageUrl, setImageUrl] = useState(interval.imageUrl ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const hasLocalImage = imageUrl.startsWith('local-image:') || imageUrl.startsWith('blob:')
  const hasCloudImage = isCloudExerciseMedia(imageUrl)

  async function attachImage(upload: () => Promise<string>) {
    setUploading(true)
    setUploadError('')
    try {
      setImageUrl(await upload())
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not attach image.')
    } finally {
      setUploading(false)
    }
  }
  const [reps, setReps] = useState(interval.reps ?? 0)
  const [weight, setWeight] = useState(interval.weight ?? 0)
  const [editMode, setEditMode] = useState<WorkoutMode>(interval.mode ?? 'timed')

  // ponytail: per-interval mode; rest/prepare/cooldown always stay timed
  const showRepsInput = editMode === 'reps' && interval.type === 'work'

  function handleSave() {
    const payload: Interval = {
      ...interval,
      title,
      description: description || undefined,
      exerciseId: exerciseId || undefined,
      imageUrl: imageUrl || undefined,
    }
    if (showRepsInput) {
      payload.mode = 'reps'
      payload.reps = Math.max(1, reps)
      payload.weight = weight > 0 ? weight : undefined
      // Keep the interval's duration even in reps mode (used as fallback timing)
      payload.duration = interval.duration
    } else {
      payload.duration = duration
      // Only work intervals carry a mode; non-work (rest/prepare/cooldown) preserve theirs via ...interval
      if (interval.type === 'work') payload.mode = 'timed'
    }
    onSave(payload)
    dialogRef.current?.close()
  }

  function handleCancel() {
    dialogRef.current?.close()
  }

  // Selected exercise object for mini preview
  const selectedExercise = useMemo(
    () => (exerciseId && exercises ? exercises.find((ex) => ex.id === exerciseId) : undefined),
    [exerciseId, exercises],
  )

  // ponytail: native close event covers Escape, Cancel button, and backdrop click
  function handleDialogClose() {
    onClose()
  }

  function handlePickerSelect(exercise: Exercise) {
    setExerciseId(exercise.id)
    if (!description && exercise.visibility === 'community') {
      setDescription(snapshotExerciseDescription(exercise) ?? '')
    }
    // Auto-name the interval to the exercise name if title is still the default "Work"
    if (title === 'Work') setTitle(exercise.name)
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        className={styles.sheet}
        aria-labelledby={headingId}
        onClose={handleDialogClose}
      >
        <div className={styles.content}>
          <div className={`${styles.heading} flex items-center justify-between gap-3`}>
            <div>
              <span className="text-xs text-muted font-medium uppercase tracking-wider">{interval.type}</span>
              <h2 id={headingId} className="text-xl font-semibold">Edit interval</h2>
            </div>
            <button
              type="button"
              ref={(button) => { button?.setAttribute('autofocus', '') }}
              onPointerDown={(event) => event.preventDefault()}
              onClick={(event) => {
                const field = document.activeElement
                if (field instanceof HTMLElement && field !== event.currentTarget && dialogRef.current?.contains(field)) {
                  field.blur()
                }
                event.currentTarget.focus({ preventScroll: true })
              }}
              className="min-h-11 shrink-0 rounded-lg px-2 text-xs text-accent focus-visible:focus-ring"
            >
              Hide keyboard
            </button>
          </div>

          {/* Title */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base border border-border focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>

          {/* Mode toggle — work intervals only; rest/prepare/cooldown are always timed */}
          {interval.type === 'work' && (
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-muted text-[9px] uppercase tracking-wider">Mode</span>
              <button
                type="button"
                onClick={() => setEditMode('timed')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                  editMode !== 'reps'
                    ? 'bg-accent text-accent-on'
                    : 'bg-surface text-muted'
                }`}
              >
                Timed
              </button>
              <button
                type="button"
                onClick={() => setEditMode('reps')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                  editMode === 'reps'
                    ? 'bg-accent text-accent-on'
                    : 'bg-surface text-muted'
                }`}
              >
                Reps
              </button>
            </div>
          )}

          {/* Duration / Reps */}
          {showRepsInput ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Reps</span>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(Math.max(1, Math.min(999, Number(e.target.value))))}
                  min={1}
                  max={999}
                  className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base w-28 border border-border focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Weight (kg)</span>
                <input
                  type="number"
                  value={weight || ''}
                  onChange={(e) => setWeight(e.target.value ? Math.max(0, Math.min(9999, Number(e.target.value))) : 0)}
                  min={0}
                  max={9999}
                  placeholder="0"
                  className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base w-28 border border-border focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
            </>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Duration (seconds)</span>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Math.min(3600, Number(e.target.value))))}
                min={1}
                max={3600}
                className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base w-28 border border-border focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </label>
          )}

          {/* Exercise picker trigger — only for work type */}
          {interval.type === 'work' && exercises && exercises.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Exercise</span>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base border border-border hover:bg-surface-warm transition-colors text-left w-full flex items-center gap-3 focus-visible:focus-ring"
              >
                {selectedExercise ? (
                  <>
                    <div className="w-8 h-8 rounded bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                      {selectedExercise.images?.[0] ? (
                        <img src={selectedExercise.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-4 h-4 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-sm">{selectedExercise.name}</span>
                  </>
                ) : (
                  <span className="text-muted">Select exercise...</span>
                )}
              </button>
              {/* Mini preview when exercise is selected */}
              {selectedExercise && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-surface text-[10px] text-muted font-medium uppercase tracking-wider">
                    {selectedExercise.category}
                  </span>
                  {(selectedExercise.primaryMuscles ?? selectedExercise.muscleGroups ?? []).slice(0, 2).map((m) => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-surface text-[10px] text-muted">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </label>
          )}

          {/* Description */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base border border-border resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>

          {/* Image URL + upload */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Image URL</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={hasLocalImage || hasCloudImage ? '' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={hasCloudImage ? "Cloud image attached" : hasLocalImage ? "Local image attached" : "https://example.com/image.jpg"}
                className="min-w-0 flex-1 bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-base border border-border focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                disabled={uploading || !onImageUpload}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2.5 rounded-lg bg-surface text-sm border border-border hover:bg-surface-warm transition-colors disabled:opacity-30 focus-visible:focus-ring"
                title="Upload image file"
              >
                {uploading ? '...' : '📁'}
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file && onImageUpload) void attachImage(() => onImageUpload(file))
              }}
            />
          </label>
          {(hasLocalImage || hasCloudImage) && (
            <div className="flex flex-wrap gap-3 text-sm text-accent">
              <button type="button" disabled={uploading} onClick={() => setImageUrl('')}>Remove image</button>
              {hasLocalImage && onSyncLocalImage && (
                <button type="button" disabled={uploading} onClick={() => void attachImage(onSyncLocalImage)}>
                  Upload local image to cloud
                </button>
              )}
            </div>
          )}
          {uploadError && <p role="alert" className="text-sm text-fg-2">{uploadError}</p>}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-surface text-fg-2 rounded-lg font-medium hover:bg-surface-warm transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={uploading}
              className="flex-1 py-3 bg-accent text-accent-on rounded-lg font-medium hover:opacity-90 transition-colors text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </dialog>

      {/* Exercise Picker dialog — only render when open */}
      {pickerOpen && (
        <ExercisePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handlePickerSelect}
          exercises={exercises ?? []}
          selectedId={exerciseId}
        />
      )}
    </>
  )
}
