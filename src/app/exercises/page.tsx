'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useExercises } from '@/hooks/useExercises'
import { useFavorites } from '@/hooks/useFavorites'
import { useRouter } from 'next/navigation'
import type { Exercise, ExerciseCategory } from '@/types/workout'
import { ExerciseSearchHeader } from '@/components/ExerciseSearchHeader'
import { ExerciseFormDialog } from '@/components/ExerciseFormDialog'
import { AddToWorkoutModal } from '@/components/AddToWorkoutModal'
import type { ExerciseFormData } from '@/components/ExerciseFormDialog'

// ponytail: flat list CRUD, no pagination, no drag-reorder — add when >50 exercises exist
const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']

const EMPTY_FORM: ExerciseFormData = {
  name: '',
  category: 'strength',
  primaryMuscles: [],
  secondaryMuscles: [],
  equipment: [],
  instructions: [],
  images: [],
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  stretching: 'Stretching',
  mobility: 'Mobility',
  plyometrics: 'Plyometrics',
  strongman: 'Strongman',
  powerlifting: 'Powerlifting',
  other: 'Other',
}

export default function ExercisesPage() {
  const { exercises, saveExercise, saveExerciseImage, getExerciseImages } = useExercises()
  const { favoriteIds, isFavorite, toggleFavorite, clearOrphans } = useFavorites()
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [favoritesFilter, setFavoritesFilter] = useState(false)
  const [assigningExercise, setAssigningExercise] = useState<Exercise | null>(null)

  // ponytail: clearOrphans on every exercise list refresh to keep favorites clean
  useEffect(() => { clearOrphans(exercises.map((e) => e.id)) }, [exercises, clearOrphans])

  // Filters
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null)
  const [forceFilter, setForceFilter] = useState<string | null>(null)
  const [mechanicFilter, setMechanicFilter] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  // Derive unique filter options
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

  // Filter + search
  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const nameMatch = ex.name.toLowerCase().includes(q)
        const descMatch = ex.description?.toLowerCase().includes(q)
        const muscleMatch = [...(ex.primaryMuscles ?? ex.muscleGroups ?? []), ...(ex.secondaryMuscles ?? [])].some((m) => m.toLowerCase().includes(q))
        const equipMatch = ex.equipment?.some((e) => e.toLowerCase().includes(q))
        if (!nameMatch && !descMatch && !muscleMatch && !equipMatch) return false
      }
      if (muscleFilter) {
        const muscles = [...(ex.primaryMuscles ?? ex.muscleGroups ?? []), ...(ex.secondaryMuscles ?? [])]
        if (!muscles.includes(muscleFilter)) return false
      }
      if (equipmentFilter && !ex.equipment?.includes(equipmentFilter)) return false
      if (forceFilter && ex.force !== forceFilter) return false
      if (mechanicFilter && ex.mechanic !== mechanicFilter) return false
      if (difficultyFilter && ex.difficulty !== difficultyFilter) return false
      if (categoryFilter && ex.category !== categoryFilter) return false
      if (favoritesFilter && !isFavorite(ex.id)) return false
      return true
    })
  }, [exercises, search, muscleFilter, equipmentFilter, forceFilter, mechanicFilter, difficultyFilter, categoryFilter, favoritesFilter, isFavorite])

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

  // ponytail: only query IDB for exercises WITHOUT an external image — saves 800+ IDB calls
  const [idbImageMap, setIdbImageMap] = useState<Record<string, string>>({})
  useEffect(() => {
    const candidates = (filtered.length > 0 ? filtered : exercises).filter((e) => !e.images?.[0])
    if (candidates.length === 0) { setIdbImageMap({}); return }
    Promise.all(candidates.map(async (ex) => {
      const entries = await getExerciseImages(ex.id).catch(() => [] as { blobUrl: string }[])
      return entries.length > 0 ? [ex.id, entries[0]!.blobUrl] as const : null
    })).then((results) => {
      const map: Record<string, string> = {}
      for (const r of results) { if (r) map[r[0]] = r[1] }
      setIdbImageMap(map)
    })
  }, [filtered, exercises, getExerciseImages])

  function openCreate() {
    // ponytail: generate ID upfront so uploads can store under the correct key
    const newId = crypto.randomUUID()
    setForm(EMPTY_FORM)
    setEditingId(newId)
    dialogRef.current?.showModal()
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
    dialogRef.current?.close()
  }

  // ponytail: delete dialog removed from compact cards — add back via context menu or detail page

  const hasNoExercises = exercises.length === 0
  const hasNoResults = !hasNoExercises && filtered.length === 0
  const isFavoritesEmpty = favoritesFilter && favoriteIds.length === 0

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
        forceFilter={forceFilter}
        onForceFilter={setForceFilter}
        mechanicFilter={mechanicFilter}
        onMechanicFilter={setMechanicFilter}
        difficultyFilter={difficultyFilter}
        onDifficultyFilter={setDifficultyFilter}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        favoritesFilter={favoritesFilter}
        onFavoritesFilterChange={setFavoritesFilter}
      />

      {/* Empty states */}
      {hasNoExercises && (
        <div className="flex flex-col items-center justify-center gap-4 py-[64px] text-center">
          <p className="font-body text-body-md text-muted">No exercises yet. Create your first one!</p>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-accent text-accent-on font-label text-label-caps rounded-lg hover:bg-accent-hover transition-colors focus-visible:focus-ring"
          >
            Create Exercise
          </button>
        </div>
      )}

      {hasNoResults && !hasNoExercises && (
        <div className="flex flex-col items-center justify-center gap-4 py-[64px] text-center">
          <p className="font-body text-body-md text-muted">
            {isFavoritesEmpty
              ? 'No favorites yet — star exercises to add them'
              : 'No exercises match your filters.'}
          </p>
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
                <div className="flex items-center justify-between border-b border-border-soft pb-8">
                  <h2 className="font-headline text-headline-md font-semibold text-accent">
                    {CATEGORY_LABELS[cat]} ({items.length})
                  </h2>
                  {items.length > 20 && (
                    <button
                      onClick={() => {}}
                      className="font-label text-label-caps text-accent hover:text-accent transition-colors focus-visible:focus-ring"
                    >
                      {/* ponytail: show all/show less — add real toggle when >20 exercises in any category */}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-4 lg:gap-6">
                  {items.map((ex) => {
                    const muscles = ex.primaryMuscles ?? ex.muscleGroups ?? []
                    const maxMuscles = 2
                    const overflow = muscles.length > maxMuscles ? muscles.length - maxMuscles : 0
                    return (
                      <div
                        key={ex.id}
                        onClick={() => router.push(`/exercises/${ex.id}`)}
                        className="bg-surface rounded-xl border border-border-soft overflow-hidden hover:shadow-card-hover transition-all duration-300 group flex flex-col cursor-pointer"
                      >
                        {/* ponytail: 2:1 image — background-image for static display (no GIF animation) */}
                        <div className="relative aspect-[2/1] bg-surface overflow-hidden flex items-center justify-center"
                          style={
                            (ex.images?.[0] ?? idbImageMap[ex.id])
                              ? { backgroundImage: `url(${ex.images?.[0] ?? idbImageMap[ex.id]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                              : undefined
                          }
                        >
                          {!(ex.images?.[0] ?? idbImageMap[ex.id]) && (
                            <svg className="w-10 h-10 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          )}
                          {/* Star toggle top-left */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id) }}
                            className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-surface/80 backdrop-blur text-lg shadow-sm hover:bg-surface transition-colors focus-visible:focus-ring"
                            aria-label={isFavorite(ex.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {isFavorite(ex.id) ? '★' : '☆'}
                          </button>
                          {/* Quick assign bottom-right */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setAssigningExercise(ex) }}
                            className="absolute bottom-2 right-2 w-10 h-10 flex items-center justify-center rounded-full bg-surface/90 backdrop-blur shadow-md hover:bg-accent hover:text-accent-on hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer focus-visible:focus-ring z-10"
                            aria-label="Assign to workout"
                          >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                          {/* Category badge top-right */}
                          <span className="absolute top-2 right-2 bg-surface/80 backdrop-blur px-2 py-0.5 rounded font-label-caps text-label-caps text-[10px] text-muted font-semibold shadow-sm uppercase tracking-wider">
                            {ex.category}
                          </span>
                          {/* Force/mechanic badges on hover — overlay bottom-center of image */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {ex.force && (
                              <span className="px-2 py-0.5 rounded bg-surface/90 backdrop-blur text-fg-2 font-label-caps text-[10px] shadow-sm">
                                {ex.force}
                              </span>
                            )}
                            {ex.mechanic && (
                              <span className="px-2 py-0.5 rounded bg-surface/90 backdrop-blur text-fg-2 font-label-caps text-[10px] shadow-sm">
                                {ex.mechanic}
                              </span>
                            )}
                          </div>
                          {/* Difficulty badge bottom-left of image */}
                          {ex.difficulty && (
                            <span className="absolute bottom-2 left-2 bg-accent/80 backdrop-blur px-2 py-0.5 rounded font-label-caps text-label-caps text-[10px] text-accent-on font-semibold shadow-sm">
                              {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                            </span>
                          )}
                        </div>
                        {/* Compact content area — p-12 */}
                        <div className="p-12 flex flex-col gap-2">
                          <h3 className="font-body text-body-md font-bold text-accent line-clamp-1">{ex.name}</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {muscles.slice(0, maxMuscles).map((mg) => (
                              <span key={mg} className="bg-surface px-1.5 py-0.5 rounded font-label-caps text-label-caps text-[10px] text-muted tracking-wider">
                                {mg.toUpperCase()}
                              </span>
                            ))}
                            {overflow > 0 && (
                              <span className="bg-surface px-1.5 py-0.5 rounded font-label-caps text-label-caps text-[10px] text-muted font-semibold">
                                +{overflow}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
        onSave={handleSave}
        dialogRef={dialogRef}
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
    </div>
  )
}
