'use client'

import { useState, useMemo, useEffect } from 'react'
import { useExercises } from '@/hooks/useExercises'
import { useFavorites } from '@/hooks/useFavorites'
import { useRouter } from 'next/navigation'
import type { Exercise } from '@/types/workout'
import { ExerciseLibrary } from '@/components/blocks/ExerciseLibrary'
import { ExerciseFormDialog } from '@/components/ExerciseFormDialog'
import { AddToWorkoutModal } from '@/components/AddToWorkoutModal'
import type { ExerciseFormData } from '@/components/ExerciseFormDialog'

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
  const { exercises, saveExercise, saveExerciseImage, getExerciseImages } = useExercises()
  const { favoriteIds, toggleFavorite, clearOrphans } = useFavorites()
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assigningExercise, setAssigningExercise] = useState<Exercise | null>(null)

  // ponytail: clearOrphans on every exercise list refresh to keep favorites clean
  useEffect(() => { clearOrphans(exercises.map((e) => e.id)) }, [exercises, clearOrphans])

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

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const now = Date.now()
    // ponytail: filter out ephemeral blob: URLs — only persist real URLs
    const persistentImages = form.images.filter((url) => !url.startsWith('blob:'))
    const exercise: Exercise = {
      id: editingId!,
      name: form.name.trim(),
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
    saveExercise(exercise)
    setFormOpen(false)
  }

  // ponytail: delete dialog removed from compact cards — add back via context menu or detail page

  return (
    <>
      <ExerciseLibrary
        exercises={exercises}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onCreate={openCreate}
        onOpenExercise={(id) => router.push(`/exercises/${id}`)}
        onAssignToWorkout={setAssigningExercise}
        externalImages={idbImageMap}
      />

      <ExerciseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        form={form}
        onFormChange={setForm}
        editingId={editingId}
        onSave={handleSave}
        allMuscleGroups={allMuscleGroups}
        allEquipment={allEquipment}
        onImageUpload={editingId ? (file) => saveExerciseImage(editingId, file) : undefined}
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
