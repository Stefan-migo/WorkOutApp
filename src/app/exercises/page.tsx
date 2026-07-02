'use client'

import { useState, useRef, useMemo } from 'react'
import { useExercises } from '@/hooks/useExercises'
import { useWorkoutContext } from '@/context/WorkoutContext'
import { useRouter } from 'next/navigation'
import type { Exercise, ExerciseCategory } from '@/types/workout'
import { ExerciseSearchHeader } from '@/components/ExerciseSearchHeader'
import { ExerciseFormDialog } from '@/components/ExerciseFormDialog'
import { ExerciseDeleteDialog } from '@/components/ExerciseDeleteDialog'

// ponytail: flat list CRUD, no pagination, no drag-reorder — add when >50 exercises exist
const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']

const EMPTY_FORM: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  category: 'strength',
  description: '',
  muscleGroups: [],
  equipment: [],
  difficulty: undefined,
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  stretching: 'Stretching',
  mobility: 'Mobility',
  other: 'Other',
}

export default function ExercisesPage() {
  const { exercises, saveExercise, deleteExercise } = useExercises()
  const { workouts } = useWorkoutContext()
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const [muscleInput, setMuscleInput] = useState('')
  const [equipmentInput, setEquipmentInput] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null)

  // Derive unique filter options
  const allMuscleGroups = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((ex) => ex.muscleGroups?.forEach((mg) => set.add(mg)))
    return Array.from(set).sort()
  }, [exercises])

  const allEquipment = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((ex) => ex.equipment?.forEach((eq) => set.add(eq)))
    return Array.from(set).sort()
  }, [exercises])

  // Filter + search
  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const nameMatch = ex.name.toLowerCase().includes(q)
        const descMatch = ex.description?.toLowerCase().includes(q)
        const muscleMatch = ex.muscleGroups?.some((m) => m.toLowerCase().includes(q))
        const equipMatch = ex.equipment?.some((e) => e.toLowerCase().includes(q))
        if (!nameMatch && !descMatch && !muscleMatch && !equipMatch) return false
      }
      if (muscleFilter && !ex.muscleGroups?.includes(muscleFilter)) return false
      if (equipmentFilter && !ex.equipment?.includes(equipmentFilter)) return false
      return true
    })
  }, [exercises, search, muscleFilter, equipmentFilter])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<ExerciseCategory, Exercise[]>()
    for (const ex of filtered) {
      const list = map.get(ex.category) ?? []
      list.push(ex)
      map.set(ex.category, list)
    }
    return map
  }, [filtered])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setMuscleInput('')
    setEquipmentInput('')
    dialogRef.current?.showModal()
  }

  function openEdit(ex: Exercise) {
    setForm({
      name: ex.name,
      category: ex.category,
      description: ex.description ?? '',
      muscleGroups: ex.muscleGroups ?? [],
      equipment: ex.equipment ?? [],
      difficulty: ex.difficulty,
    })
    setMuscleInput((ex.muscleGroups ?? []).join(', '))
    setEquipmentInput((ex.equipment ?? []).join(', '))
    setEditingId(ex.id)
    dialogRef.current?.showModal()
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const groups = muscleInput.split(',').map((s) => s.trim()).filter(Boolean)
    const equip = equipmentInput.split(',').map((s) => s.trim()).filter(Boolean)
    const now = Date.now()
    const exercise: Exercise = {
      id: editingId || `exercise-${now}`,
      name: form.name.trim(),
      category: form.category,
      description: form.description?.trim() || undefined,
      muscleGroups: groups.length > 0 ? groups : undefined,
      equipment: equip.length > 0 ? equip : undefined,
      difficulty: form.difficulty || undefined,
      createdAt: editingId ? (exercises.find((e) => e.id === editingId)?.createdAt ?? now) : now,
      updatedAt: now,
    }
    saveExercise(exercise)
    dialogRef.current?.close()
  }

  function confirmDelete(id: string) {
    setDeleteTarget(id)
    deleteDialogRef.current?.showModal()
  }

  function handleDelete() {
    if (deleteTarget) {
      deleteExercise(deleteTarget)
      setDeleteTarget(null)
      deleteDialogRef.current?.close()
    }
  }

  function workoutRefCount(id: string): number {
    return workouts.filter((w) => w.intervals.some((i) => i.exerciseId === id)).length
  }

  const hasNoExercises = exercises.length === 0
  const hasNoResults = !hasNoExercises && filtered.length === 0

  return (
    <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col gap-32 pb-32">
      <ExerciseSearchHeader
        search={search}
        onSearchChange={setSearch}
        muscleFilter={muscleFilter}
        onMuscleFilter={setMuscleFilter}
        allMuscleGroups={allMuscleGroups}
        equipmentFilter={equipmentFilter}
        onEquipmentFilter={setEquipmentFilter}
        allEquipment={allEquipment}
        onCreate={openCreate}
      />

      {/* Empty states */}
      {hasNoExercises && (
        <div className="flex flex-col items-center justify-center gap-4 py-[64px] text-center">
          <p className="font-body text-body-md text-on-surface-variant">No exercises yet. Create your first one!</p>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Create Exercise
          </button>
        </div>
      )}

      {hasNoResults && !hasNoExercises && (
        <div className="flex flex-col items-center justify-center gap-4 py-[64px] text-center">
          <p className="font-body text-body-md text-on-surface-variant">No exercises match your filters.</p>
        </div>
      )}

      {/* Category sections */}
      {!hasNoExercises && !hasNoResults && (
        <div className="flex flex-col gap-32">
          {CATEGORIES.map((cat) => {
            const items = grouped.get(cat)
            if (!items || items.length === 0) return null
            return (
              <section key={cat} className="flex flex-col gap-16">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-8">
                  <h2 className="font-headline text-headline-md font-semibold text-primary">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="font-data text-data-sm text-on-surface-variant">
                    {items.length} {items.length === 1 ? 'Movement' : 'Movements'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {items.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden hover:shadow-[0_4px_20px_rgba(30,41,59,0.05)] transition-all duration-300 group flex flex-col"
                    >
                      {/* ponytail: SVG placeholder — replace with actual exercise images later */}
                      <div className="aspect-[4/3] bg-surface-container-lowest m-xs rounded-lg relative overflow-hidden flex items-center justify-center">
                        <svg className="w-12 h-12 text-outline-variant/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {ex.difficulty && (
                          <div className="absolute top-2 right-2 bg-surface/80 backdrop-blur px-2 py-1 rounded font-data text-data-sm text-primary font-bold shadow-sm">
                            {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                          </div>
                        )}
                      </div>
                      <div className="p-16 flex flex-col gap-8 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-body text-body-lg font-bold text-primary truncate">{ex.name}</h3>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(ex)}
                              className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDelete(ex.id)}
                              className="p-1 rounded text-on-surface-variant hover:text-error transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {ex.description && (
                          <p className="font-body text-body-md text-on-surface-variant line-clamp-2">{ex.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-auto pt-8">
                          {ex.muscleGroups?.slice(0, 3).map((mg) => (
                            <span key={mg} className="bg-surface-container px-2 py-1 rounded font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                              {mg.toUpperCase()}
                            </span>
                          ))}
                          {ex.equipment?.slice(0, 2).map((eq) => (
                            <span key={eq} className="bg-surface-container px-2 py-1 rounded font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                              {eq.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="px-16 pb-16 border-t border-outline-variant/10 pt-8 mt-auto">
                        <button
                          onClick={() => router.push(`/workouts/new?exerciseId=${ex.id}`)}
                          className="w-full py-2 border border-outline text-primary font-label text-label-caps rounded hover:bg-surface-container transition-colors flex justify-center items-center gap-xs focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                        >
                          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add to Workout
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <ExerciseFormDialog
        onClose={() => dialogRef.current?.close()}
        form={form}
        onFormChange={setForm}
        editingId={editingId}
        muscleInput={muscleInput}
        onMuscleInput={setMuscleInput}
        equipmentInput={equipmentInput}
        onEquipmentInput={setEquipmentInput}
        onSave={handleSave}
        dialogRef={dialogRef}
      />

      <ExerciseDeleteDialog
        onClose={() => deleteDialogRef.current?.close()}
        workoutRefCount={deleteTarget ? workoutRefCount(deleteTarget) : 0}
        onDelete={handleDelete}
        dialogRef={deleteDialogRef}
      />
    </div>
  )
}
