'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useExercises } from '@/hooks/useExercises'
import { useFavorites } from '@/hooks/useFavorites'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { ExerciseFormDialog } from '@/components/ExerciseFormDialog'
import { ExerciseDeleteDialog } from '@/components/ExerciseDeleteDialog'
import type { Exercise } from '@/types/workout'
import type { ExerciseFormData } from '@/components/ExerciseFormDialog'
import type { ImageEntry } from '@/hooks/useIndexedDB'

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const {
    exercises, isLoading, error, saveExercise, deleteExercise,
    getExerciseImages, saveExerciseImage,
  } = useExercises()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { workouts } = useWorkoutContext()
  const [idbImages, setIdbImages] = useState<ImageEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ponytail: exercises already loaded into state array — use find, not async getExercise
  const exercise = useMemo(() => exercises.find((e) => e.id === params.id), [exercises, params.id])

  // Load IDB images on mount and when exercise changes
  useEffect(() => {
    if (exercise) {
      getExerciseImages(exercise.id).then(setIdbImages).catch(() => {})
    }
  }, [exercise, getExerciseImages])

  async function handleUpload(file: File) {
    if (!exercise) return
    setUploading(true)
    try {
      await saveExerciseImage(exercise.id, file)
      const updated = await getExerciseImages(exercise.id)
      setIdbImages(updated)
    } catch {
      // ponytail: silent fail — user sees no change, try again
    } finally {
      setUploading(false)
    }
  }

  const [form, setForm] = useState<ExerciseFormData | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center gap-4 py-[64px] text-center">
        <p className="font-headline text-headline-md font-semibold text-primary">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center gap-4 py-[64px] text-center">
        <p className="font-headline text-headline-md font-semibold text-error">{error}</p>
        <Link
          href="/exercises"
          className="px-6 py-3 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          ← Back to exercises
        </Link>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center gap-4 py-[64px] text-center">
        <svg className="w-16 h-16 text-outline-variant/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <p className="font-headline text-headline-md font-semibold text-primary">Exercise not found</p>
        <Link
          href="/exercises"
          className="px-6 py-3 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          ← Back to exercises
        </Link>
      </div>
    )
  }

  // ponytail: local alias for type narrowing after guard
  const ex: Exercise = exercise

  function openEdit() {
    const ed: ExerciseFormData = {
      name: ex.name,
      category: ex.category,
      description: ex.description ?? '',
      primaryMuscles: ex.primaryMuscles ?? ex.muscleGroups ?? [],
      secondaryMuscles: ex.secondaryMuscles ?? [],
      equipment: ex.equipment ?? [],
      difficulty: ex.difficulty,
      force: ex.force,
      mechanic: ex.mechanic,
      instructions: ex.instructions ?? [],
      images: ex.images ?? [],
    }
    setForm(ed)
    setEditingId(ex.id)
    dialogRef.current?.showModal()
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !form.name.trim()) return
    const now = Date.now()
    const updated: Exercise = {
      id: ex.id,
      name: form.name.trim(),
      category: form.category,
      description: form.description?.trim() || undefined,
      primaryMuscles: form.primaryMuscles.length > 0 ? form.primaryMuscles : undefined,
      secondaryMuscles: form.secondaryMuscles.length > 0 ? form.secondaryMuscles : undefined,
      equipment: form.equipment.length > 0 ? form.equipment : undefined,
      instructions: form.instructions.length > 0 ? form.instructions : undefined,
      images: form.images.length > 0 ? form.images : undefined,
      force: form.force,
      mechanic: form.mechanic,
      difficulty: form.difficulty,
      source: ex.source,
      createdAt: ex.createdAt,
      updatedAt: now,
    }
    saveExercise(updated)
    dialogRef.current?.close()
    setForm(null)
  }

  function handleDelete() {
    if (deleteTarget) {
      deleteExercise(deleteTarget)
      setDeleteTarget(null)
      deleteDialogRef.current?.close()
      router.push('/exercises')
    }
  }

  function workoutRefCount(id: string): number {
    return workouts.filter((w) => w.intervals.some((i) => i.exerciseId === id)).length
  }

  const allMuscleGroups = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((ex) => {
      ex.primaryMuscles?.forEach((m) => set.add(m))
      ex.secondaryMuscles?.forEach((m) => set.add(m))
      ex.muscleGroups?.forEach((m) => set.add(m))
    })
    return Array.from(set).sort()
  }, [exercises])

  const allEquipment = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((ex) => ex.equipment?.forEach((eq) => set.add(eq)))
    return Array.from(set).sort()
  }, [exercises])

  return (
    <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col gap-24 pb-32">
      {/* Back link */}
      <Link
        href="/exercises"
        className="text-on-surface-variant hover:text-primary transition-colors font-body text-body-md w-fit"
      >
        ← Back to exercises
      </Link>

      {/* Image gallery — ponytail: CSS scroll snap, no JS carousel lib */}
      {(() => {
        const allImages = [
          ...(ex.images ?? []),
          ...idbImages.map((e) => e.blobUrl),
        ]
        return allImages.length > 0 ? (
          <div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-thin pb-4">
              {allImages.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="snap-start shrink-0 w-full max-w-[600px] aspect-[4/3] bg-surface-container-lowest rounded-xl overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`${ex.name} image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f)
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg font-label text-label-caps bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              >
                {uploading ? 'Uploading...' : '+ Upload Image'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="aspect-[4/3] bg-surface-container-lowest rounded-xl flex items-center justify-center max-w-[600px]">
              <svg className="w-16 h-16 text-outline-variant/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f)
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg font-label text-label-caps bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              >
                {uploading ? 'Uploading...' : '+ Upload Image'}
              </button>
            </div>
          </div>
        )
      })()}

      {/* Name + star toggle */}
      <div className="flex items-center gap-3">
        <h1 className="font-headline text-headline-lg font-bold text-primary">{ex.name}</h1>
        <button
          onClick={() => toggleFavorite(ex.id)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container text-lg hover:bg-surface-container-high transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          aria-label={isFavorite(ex.id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite(ex.id) ? '★' : '☆'}
        </button>
      </div>

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-caps text-label-caps">
          {ex.category}
        </span>
        {ex.difficulty && (
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-caps text-label-caps">
            {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
          </span>
        )}
        {ex.force && (
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-caps text-label-caps">
            {ex.force}
          </span>
        )}
        {ex.mechanic && (
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-caps text-label-caps">
            {ex.mechanic}
          </span>
        )}
        <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary font-label-caps text-label-caps">
          {ex.source === 'free-exercise-db' ? 'free-exercise-db' : 'User created'}
        </span>
      </div>

      {/* Instructions */}
      {ex.instructions && ex.instructions.length > 0 && (
        <section className="flex flex-col gap-8">
          <h2 className="font-headline text-headline-sm font-semibold text-primary">Instructions</h2>
          <ol className="list-none flex flex-col gap-4" role="list">
            {ex.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-3 items-start" role="listitem">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-label-caps text-label-caps shrink-0">
                  {idx + 1}
                </span>
                <span className="font-body text-body-md text-on-surface pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Primary Muscles */}
      {ex.primaryMuscles && ex.primaryMuscles.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="font-headline text-headline-sm font-semibold text-primary">Primary Muscles</h2>
          <div className="flex flex-wrap gap-2">
            {ex.primaryMuscles.map((m) => (
              <span
                key={m}
                className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-caps text-label-caps"
              >
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Secondary Muscles */}
      {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="font-headline text-headline-sm font-semibold text-primary">Secondary Muscles</h2>
          <div className="flex flex-wrap gap-2">
            {ex.secondaryMuscles.map((m) => (
              <span
                key={m}
                className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-caps text-label-caps"
              >
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Equipment */}
      {ex.equipment && ex.equipment.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="font-headline text-headline-sm font-semibold text-primary">Equipment</h2>
          <div className="flex flex-wrap gap-2">
            {ex.equipment.map((eq) => (
              <span
                key={eq}
                className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-caps text-label-caps"
              >
                {eq}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 pt-8 border-t border-outline-variant/20">
        <button
          onClick={openEdit}
          className="px-6 py-3 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          Edit
        </button>
        <button
          onClick={() => {
            setDeleteTarget(ex.id)
            deleteDialogRef.current?.showModal()
          }}
          className="px-6 py-3 bg-error text-on-error font-label text-label-caps rounded-lg hover:bg-error-container hover:text-on-error-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          Delete
        </button>
        <button
          onClick={() => router.push(`/workouts/new?exerciseId=${ex.id}`)}
          className="px-6 py-3 border border-outline text-primary font-label text-label-caps rounded-lg hover:bg-surface-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          Add to Workout
        </button>
      </div>

      {/* Dialogs */}
      {form && (
          <ExerciseFormDialog
            onClose={() => {
              dialogRef.current?.close()
              setForm(null)
            }}
            form={form}
            onFormChange={setForm}
            editingId={editingId}
            onSave={handleSave}
            dialogRef={dialogRef}
            allMuscleGroups={allMuscleGroups}
            allEquipment={allEquipment}
            onImageUpload={(file) => saveExerciseImage(exercise.id, file)}
          />
      )}

      <ExerciseDeleteDialog
        onClose={() => {
          deleteDialogRef.current?.close()
          setDeleteTarget(null)
        }}
        workoutRefCount={deleteTarget ? workoutRefCount(deleteTarget) : 0}
        onDelete={handleDelete}
        dialogRef={deleteDialogRef}
        exerciseName={ex.name}
      />
    </div>
  )
}
