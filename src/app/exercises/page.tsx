'use client'

import { useState, useMemo, useEffect } from 'react'
import { uploadExerciseMedia } from '@/lib/exercise-media'
import { canManageExercise, isSharedExercise } from '@/lib/exercise-ownership'
import { useHiddenCatalogExercises } from '@/hooks/useHiddenCatalogExercises'
import { useExercises } from '@/hooks/useExercises'
import { useFavorites } from '@/hooks/useFavorites'
import { useRouter } from 'next/navigation'
import type { Exercise } from '@/types/workout'
import { ExerciseLibrary } from '@/components/blocks/ExerciseLibrary'
import { ExerciseFormDialog } from '@/components/ExerciseFormDialog'
import { AddToWorkoutModal } from '@/components/AddToWorkoutModal'
import type { ExerciseFormData } from '@/components/ExerciseFormDialog'

const OPEN_SOURCE_PREFERENCE = 'show-open-source-exercises'

const EMPTY_FORM: ExerciseFormData = {
  name: '',
  category: 'strength',
  primaryMuscles: [],
  secondaryMuscles: [],
  equipment: [],
  instructions: [],
  images: [],
}

export default function ExercisesPage() {
  const { exercises, saveExercise, deleteExercises, getExerciseImages, isLoading, error } = useExercises()
  const { favoriteIds, toggleFavorite, clearOrphans } = useFavorites()
  const router = useRouter()
  const { hiddenIds, hide, restoreAll } = useHiddenCatalogExercises()
  const [catalogError, setCatalogError] = useState('')
  const [view, setView] = useState<'all' | 'mine' | 'community'>('all')
  const [showOpenSource, setShowOpenSource] = useState(true)
  useEffect(() => {
    try {
      setShowOpenSource(window.localStorage.getItem(OPEN_SOURCE_PREFERENCE) !== 'false')
    } catch {
      // The toggle still works for this visit when browser storage is unavailable.
    }
  }, [])
  const visibleExercises = useMemo(() =>
    exercises.filter((exercise) => {
      if (view === 'mine') return canManageExercise(exercise)
      if (view === 'community') return exercise.visibility === 'community'
      return !isSharedExercise(exercise) || (showOpenSource && !hiddenIds.includes(exercise.id))
    }),
  [exercises, showOpenSource, hiddenIds, view])
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assigningExercise, setAssigningExercise] = useState<Exercise | null>(null)

  // ponytail: clearOrphans on every exercise list refresh to keep favorites clean
  useEffect(() => {
    if (!isLoading && !error) clearOrphans(exercises.map((exercise) => exercise.id))
  }, [exercises, clearOrphans, isLoading, error])

  // Derive unique filter options (shared with the form dialog's autocomplete)
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

  // ponytail: only query IDB for exercises WITHOUT an external image — saves 800+ IDB calls
  const [idbImageMap, setIdbImageMap] = useState<Record<string, string>>({})
  useEffect(() => {
    const candidates = exercises.filter((e) => !e.images?.[0])
    if (candidates.length === 0) { setIdbImageMap({}); return }
    Promise.all(candidates.map(async (ex) => {
      const entries = await getExerciseImages(ex.id).catch(() => [] as { blobUrl: string }[])
      return entries.length > 0 ? [ex.id, entries[0]!.blobUrl] as const : null
    })).then((results) => {
      const map: Record<string, string> = {}
      for (const r of results) { if (r) map[r[0]] = r[1] }
      setIdbImageMap(map)
    })
  }, [exercises, getExerciseImages])

  function openCreate() {
    // ponytail: generate ID upfront so uploads can store under the correct key
    const newId = crypto.randomUUID()
    setForm(EMPTY_FORM)
    setEditingId(newId)
    setFormOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const now = Date.now()
    // ponytail: filter out ephemeral blob: URLs — only persist real URLs
    const persistentImages = form.images.filter((url) => !url.startsWith('blob:'))
    const exercise: Exercise = {
      id: editingId!,
      name: form.name.trim(),
      visibility: form.visibility,
      authorName: form.authorName,
      category: form.category,
      description: form.description?.trim() || undefined,
      primaryMuscles: form.primaryMuscles.length > 0 ? form.primaryMuscles : undefined,
      secondaryMuscles: form.secondaryMuscles.length > 0 ? form.secondaryMuscles : undefined,
      equipment: form.equipment.length > 0 ? form.equipment : undefined,
      instructions: form.instructions.length > 0 ? form.instructions : undefined,
      images: persistentImages.length > 0 ? persistentImages : undefined,
      force: form.force,
      mechanic: form.mechanic,
      difficulty: form.difficulty,
      createdAt: exercises.find((e) => e.id === editingId)?.createdAt ?? now,
      updatedAt: now,
    }
    if (await saveExercise(exercise)) setFormOpen(false)
  }

  // ponytail: delete dialog removed from compact cards — add back via context menu or detail page

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="flex min-h-10 w-fit cursor-pointer items-center gap-2 text-sm text-fg-2">
          <input
            type="checkbox"
            role="switch"
            checked={showOpenSource}
            className="accent-accent"
            onChange={(event) => {
              const checked = event.target.checked
              setShowOpenSource(checked)
              try {
                window.localStorage.setItem(OPEN_SOURCE_PREFERENCE, String(checked))
              } catch {
                // Keep the in-memory selection.
              }
            }}
          />
          Show open-source exercises
        </label>
        {hiddenIds.length > 0 && (
          <button type="button" className="min-h-10 text-sm font-semibold text-accent" onClick={() => setCatalogError(restoreAll() ? '' : 'Could not restore hidden exercises in this browser.')}>
            Restore hidden ({hiddenIds.length})
          </button>
        )}
        {catalogError && <p role="alert" className="w-full text-sm text-danger">{catalogError}</p>}
      </div>
      <div role="group" aria-label="Exercise library view" className="mb-3 grid grid-cols-3 gap-1 rounded-control bg-surface-warm p-1">
        {([{ key: 'all', text: 'All exercises' }, { key: 'mine', text: 'My exercises' }, { key: 'community', text: 'Community' }] as const).map(({ key, text }) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => setView(key)}
            className={`grid min-h-11 min-w-0 place-items-center rounded-control px-1.5 py-2 text-center text-sm font-semibold leading-tight focus-visible:focus-ring ${view === key ? 'bg-accent text-accent-on' : 'text-fg-2'}`}
          >
            {text}
          </button>
        ))}
      </div>
      <ExerciseLibrary
        key={view}
        emptyLabel={view === 'community' ? 'No community exercises yet' : undefined}
        exercises={visibleExercises}
        isLoading={isLoading}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onCreate={openCreate}
        onOpenExercise={(id) => router.push(`/exercises/${id}`)}
        onAssignToWorkout={setAssigningExercise}
        externalImages={idbImageMap}
        onDeleteExercises={deleteExercises}
        onHideExercises={hide}
      />

      <ExerciseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        form={form}
        onFormChange={setForm}
        editingId={null}
        onSave={handleSave}
        saveError={formOpen ? error : null}
        allMuscleGroups={allMuscleGroups}
        allEquipment={allEquipment}
        onImageUpload={uploadExerciseMedia}
      />

      {assigningExercise && (
        <AddToWorkoutModal
          exercise={assigningExercise}
          onClose={() => setAssigningExercise(null)}
        />
      )}
    </>
  )
}
