'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { canManageExercise, isSharedExercise } from '@/lib/exercise-ownership'
import { catalogMedia } from '@/lib/catalog-media'
import { ExerciseMedia } from '@/components/ExerciseMedia'
import { uploadExerciseMedia } from '@/lib/exercise-media'
import { useHiddenCatalogExercises } from '@/hooks/useHiddenCatalogExercises'
import { useExercises } from '@/hooks/useExercises'
import { useFavorites } from '@/hooks/useFavorites'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { ExerciseFormDialog } from '@/components/ExerciseFormDialog'
import { ExerciseDeleteDialog } from '@/components/ExerciseDeleteDialog'
import { AddToWorkoutModal } from '@/components/AddToWorkoutModal'
import type { Exercise } from '@/types/workout'
import type { ExerciseFormData } from '@/components/ExerciseFormDialog'
import type { ImageEntry } from '@/hooks/useIndexedDB'

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { hiddenIds, hide, restore } = useHiddenCatalogExercises()
  const [catalogError, setCatalogError] = useState('')
  const {
    exercises, isLoading, error, saveExercise, deleteExercise,
    getExerciseImages,
  } = useExercises()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { workouts } = useWorkoutContext()
  const [idbImages, setIdbImages] = useState<ImageEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ponytail: exercises already loaded into state array — use find, not async getExercise
  const exercise = useMemo(() => exercises.find((e) => e.id === params.id), [exercises, params.id])

  // MUST be before early returns — all hooks unconditional
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

  // Load IDB images on mount and when exercise changes
  useEffect(() => {
    if (exercise) {
      getExerciseImages(exercise.id).then(setIdbImages).catch(() => {})
    }
  }, [exercise, getExerciseImages])

  async function handleUpload(file: File) {
    if (!exercise) return
    setUploading(true)
    setUploadError('')
    try {
      const imageUrl = await uploadExerciseMedia(file)
      const saved = await saveExercise({ ...exercise, images: [...(exercise.images ?? []), imageUrl] })
      if (!saved) setUploadError('Could not save the image to the exercise.')
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const [form, setForm] = useState<ExerciseFormData | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center gap-4 py-[64px] text-center">
        <p className="font-headline text-headline-md font-semibold text-accent">Loading...</p>
      </div>
    )
  }

  if (error && !exercise) {
    return (
      <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center gap-4 py-[64px] text-center">
        <p className="font-headline text-headline-md font-semibold text-danger">{error}</p>
        <Link
          href="/exercises"
          className="px-6 py-3 bg-accent text-accent-on font-label text-label-caps rounded-lg hover:bg-accent-hover transition-colors focus-visible:focus-ring"
        >
          ← Back to exercises
        </Link>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center gap-4 py-[64px] text-center">
        <svg className="w-16 h-16 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <p className="font-headline text-headline-md font-semibold text-accent">Exercise not found</p>
        <Link
          href="/exercises"
          className="px-6 py-3 bg-accent text-accent-on font-label text-label-caps rounded-lg hover:bg-accent-hover transition-colors focus-visible:focus-ring"
        >
          ← Back to exercises
        </Link>
      </div>
    )
  }

  // ponytail: local alias for type narrowing after guard
  const ex: Exercise = exercise
  const canManage = canManageExercise(ex)
  const credit = ex.source === 'system' && isSharedExercise(ex) ? catalogMedia(ex.name) : undefined
  const hiddenFromLibrary = hiddenIds.includes(ex.id)
  const allImages = [...(ex.images ?? []), ...idbImages.map((image) => image.blobUrl)]

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
      visibility: ex.visibility,
      authorName: ex.authorName,
    }
    setForm(ed)
    setEditingId(ex.id)
  }

  async function handleSave(e: React.FormEvent, images = form?.images ?? []) {
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
      images: images.length > 0 ? images : undefined,
      force: form.force,
      mechanic: form.mechanic,
      difficulty: form.difficulty,
      source: ex.source,
      visibility: form.visibility,
      authorName: form.authorName,
      createdAt: ex.createdAt,
      updatedAt: now,
    }
    if (await saveExercise(updated)) setForm(null)
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const result = await deleteExercise(deleteTarget)
      if (!result.deletedIds.includes(deleteTarget)) {
        setDeleteError(result.error ?? 'Could not delete this exercise.')
        return
      }
      deleteDialogRef.current?.close()
      router.push('/exercises')
    } catch {
      setDeleteError('Could not delete this exercise.')
    } finally {
      setDeleting(false)
    }
  }

  function workoutRefCount(id: string): number {
    return workouts.filter((w) => w.intervals.some((i) => i.exerciseId === id)).length
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 sm:gap-24">
      {/* Back link */}
      <Link
        href="/exercises"
        className="text-muted hover:text-accent transition-colors font-body text-body-md w-fit"
      >
        ← Back to exercises
      </Link>

      <div className="flex items-center justify-between gap-16 border-b border-border-soft pb-16">
        <h1 className="font-headline text-headline-lg text-fg-2">{ex.name}</h1>
        <button
          onClick={() => toggleFavorite(ex.id)}
          className="size-11 flex shrink-0 items-center justify-center rounded-full bg-surface text-lg hover:bg-surface-warm transition-colors focus-visible:focus-ring"
          aria-pressed={isFavorite(ex.id)}
          aria-label={isFavorite(ex.id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite(ex.id) ? '★' : '☆'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowAssignModal(true)}
          className="min-h-11 rounded-control bg-accent px-3 text-sm font-semibold text-accent-on hover:bg-accent-hover focus-visible:focus-ring"
        >
          Assign to Workout
        </button>
        {canManage ? (
          <>
            <button onClick={openEdit} className="min-h-11 rounded-control border border-border-soft px-3 text-sm font-semibold focus-visible:focus-ring">Edit</button>
            <button
              onClick={() => {
                setDeleteError(null)
                setDeleteTarget(ex.id)
                deleteDialogRef.current?.showModal()
              }}
              className="min-h-11 rounded-control px-3 text-sm font-semibold text-danger hover:bg-danger/5 focus-visible:focus-ring"
            >
              Delete
            </button>
          </>
        ) : isSharedExercise(ex) && (
          <button
            onClick={() => {
              const saved = hiddenFromLibrary ? restore(ex.id) : hide([ex.id])
              setCatalogError(saved ? '' : 'Could not update your library in this browser.')
            }}
            className="min-h-11 rounded-control border border-border-soft px-3 text-sm font-semibold focus-visible:focus-ring"
          >
            {hiddenFromLibrary ? 'Restore to library' : 'Hide from library'}
          </button>
        )}
      </div>
      {ex.visibility === 'community' && ex.authorName && <p className="text-sm text-muted">Shared by {ex.authorName}</p>}
      {catalogError && <p role="alert" className="text-sm text-danger">{catalogError}</p>}
      {error && !deleteTarget && !form && <p role="alert" className="text-sm text-danger">{error}</p>}

      <div className="flex snap-x gap-3 overflow-x-auto">
        {allImages.length ? allImages.map((url, idx) => (
          <ExerciseMedia
            key={`${url}-${idx}`}
            src={url}
            alt={`${ex.name} image ${idx + 1}`}
            className="aspect-[4/3] w-full max-h-80 max-w-[600px] shrink-0 snap-start rounded-card bg-surface object-contain"
            loading="lazy"
          />
        )) : (
          <div className="flex min-h-14 w-full items-center gap-2 rounded-card bg-surface-warm px-3 text-sm text-muted">
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4zM4 16l4-4 4 4 3-3 5 5" />
            </svg>
            No exercise image
          </div>
        )}
      </div>
      {credit && allImages.some((url) => credit.images.includes(url)) && (
        <p className="text-xs text-muted">
          Exercise data by <a href={credit.source} className="underline">{credit.author}</a>
          {' · '}{credit.license}
        </p>
      )}
      {canManage && (
        <div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void handleUpload(file)
          }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="min-h-11 rounded-control border border-border-soft px-3 text-sm font-semibold focus-visible:focus-ring">
            {uploading ? 'Uploading…' : 'Upload image'}
          </button>
        </div>
      )}
      {uploadError && <p role="alert" className="text-danger">{uploadError}</p>}

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-full bg-surface text-fg-2 font-label-caps text-label-caps">
          {ex.category}
        </span>
        {ex.difficulty && (
          <span className="px-3 py-1 rounded-full bg-surface text-fg-2 font-label-caps text-label-caps">
            {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
          </span>
        )}
        {ex.force && (
          <span className="px-3 py-1 rounded-full bg-surface text-fg-2 font-label-caps text-label-caps">
            {ex.force}
          </span>
        )}
        {ex.mechanic && (
          <span className="px-3 py-1 rounded-full bg-surface text-fg-2 font-label-caps text-label-caps">
            {ex.mechanic}
          </span>
        )}
        <span className="px-3 py-1 rounded-full bg-accent/10 text-accent font-label-caps text-label-caps">
          {ex.visibility === 'community' ? 'Community' : canManage ? 'User created' : ex.source === 'free-exercise-db' ? 'free-exercise-db' : 'Shared catalog'}
        </span>
      </div>

      {/* Instructions */}
      {ex.instructions && ex.instructions.length > 0 && (
        <section className="flex flex-col gap-8">
          <h2 className="font-headline text-headline-sm font-semibold text-accent">Instructions</h2>
          <ol className="list-none flex flex-col gap-4" role="list">
            {ex.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-3 items-start" role="listitem">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent font-label-caps text-label-caps shrink-0">
                  {idx + 1}
                </span>
                <span className="font-body text-body-md text-fg-2 pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Primary Muscles */}
      {ex.primaryMuscles && ex.primaryMuscles.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="font-headline text-headline-sm font-semibold text-accent">Primary Muscles</h2>
          <div className="flex flex-wrap gap-2">
            {ex.primaryMuscles.map((m) => (
              <span
                key={m}
                className="px-3 py-1 rounded-full bg-surface text-fg-2 font-label-caps text-label-caps"
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
          <h2 className="font-headline text-headline-sm font-semibold text-accent">Secondary Muscles</h2>
          <div className="flex flex-wrap gap-2">
            {ex.secondaryMuscles.map((m) => (
              <span
                key={m}
                className="px-3 py-1 rounded-full bg-surface text-fg-2 font-label-caps text-label-caps"
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
          <h2 className="font-headline text-headline-sm font-semibold text-accent">Equipment</h2>
          <div className="flex flex-wrap gap-2">
            {ex.equipment.map((eq) => (
              <span
                key={eq}
                className="px-3 py-1 rounded-full bg-surface text-fg-2 font-label-caps text-label-caps"
              >
                {eq}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Dialogs */}
      {form && (
          <ExerciseFormDialog
            open={form !== null}
            onOpenChange={(o) => {
              if (!o) setForm(null)
            }}
            form={form}
            onFormChange={setForm}
            editingId={editingId}
            onSave={handleSave}
            saveError={error}
            allMuscleGroups={allMuscleGroups}
            allEquipment={allEquipment}
            onImageUpload={uploadExerciseMedia}
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
        deleting={deleting}
        error={deleteError}
      />

      {showAssignModal && (
        <AddToWorkoutModal
          exercise={ex}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  )
}
