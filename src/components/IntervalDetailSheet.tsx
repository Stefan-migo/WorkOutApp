'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { Interval, Exercise } from '@/types/workout'
import { ExercisePicker } from './ExercisePicker'

interface IntervalDetailSheetProps {
  interval: Interval
  onSave: (updated: Interval) => void
  onClose: () => void
  exercises?: Exercise[]
  onImageUpload?: (file: File) => Promise<string>
}

export function IntervalDetailSheet({ interval, onSave, onClose, exercises, onImageUpload }: IntervalDetailSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(interval.title)
  const [duration, setDuration] = useState(interval.duration)
  const [description, setDescription] = useState(interval.description ?? '')
  const [exerciseId, setExerciseId] = useState(interval.exerciseId ?? '')
  const [imageUrl, setImageUrl] = useState(interval.imageUrl ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  function handleSave() {
    onSave({
      ...interval,
      title,
      duration,
      description: description || undefined,
      exerciseId: exerciseId || undefined,
      imageUrl: imageUrl || undefined,
    })
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
  }

  // ponytail: CSS in <style> tag — no extra file, no CSS-in-JS lib
  return (
    <>
      <style>{`
        @keyframes interval-sheet-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .interval-sheet {
          animation: interval-sheet-slide-up 0.3s ease-out;
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          margin: 0;
          width: 100%;
          max-width: 32rem;
          border: none;
          padding: 0;
          border-radius: 12px 12px 0 0;
          background: var(--color-surface, #fff);
          max-height: 85vh;
          overflow-y: auto;
        }
        .interval-sheet::backdrop {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <dialog
        ref={dialogRef}
        className="interval-sheet"
        onClose={handleDialogClose}
      >
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{interval.type}</span>
          </div>

          {/* Title */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </label>

          {/* Duration */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant">Duration (seconds)</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(3600, Number(e.target.value))))}
              min={1}
              max={3600}
              className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm w-28 border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </label>

          {/* Exercise picker trigger — only for work type */}
          {interval.type === 'work' && exercises && exercises.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-on-surface-variant">Exercise</span>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm border border-outline-variant hover:bg-surface-container transition-colors text-left w-full flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              >
                {selectedExercise ? (
                  <>
                    <div className="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center shrink-0 overflow-hidden">
                      {selectedExercise.images?.[0] ? (
                        <img src={selectedExercise.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-4 h-4 text-outline-variant/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-sm">{selectedExercise.name}</span>
                  </>
                ) : (
                  <span className="text-on-surface-variant">Select exercise...</span>
                )}
              </button>
              {/* Mini preview when exercise is selected */}
              {selectedExercise && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                    {selectedExercise.category}
                  </span>
                  {(selectedExercise.primaryMuscles ?? selectedExercise.muscleGroups ?? []).slice(0, 2).map((m) => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] text-on-surface-variant">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </label>
          )}

          {/* Description */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm border border-outline-variant resize-none focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </label>

          {/* Image URL + upload */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-on-surface-variant">Image URL</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 bg-surface-container-low text-on-surface rounded-lg px-3 py-2.5 text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <button
                type="button"
                disabled={uploading || !onImageUpload}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2.5 rounded-lg bg-surface-container-low text-sm border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
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
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f && onImageUpload) {
                  setUploading(true)
                  try {
                    const url = await onImageUpload(f)
                    if (url) setImageUrl(url)
                  } catch { /* silent */ }
                  finally { setUploading(false) }
                }
                e.target.value = ''
              }}
            />
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-surface-container-low text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-primary-btn text-on-primary-btn rounded-lg font-medium hover:opacity-90 transition-colors text-sm"
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
