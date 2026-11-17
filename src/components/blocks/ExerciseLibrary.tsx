'use client'

import { useMemo, useState } from 'react'
import type { Exercise, ExerciseCategory } from '@/types/workout'
import { canManageExercise, isSharedExercise } from '@/lib/exercise-ownership'
import { Dialog } from '@/components/ui/Dialog'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { SearchInput } from '@/components/ui/SearchInput'

// ponytail: flat list CRUD, no pagination, no drag-reorder — add when >50 exercises exist
const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'stretching', 'mobility', 'other']

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

const DIFFICULTY_DOT: Record<string, string> = {
  beginner: 'bg-success',
  intermediate: 'bg-warn',
  advanced: 'bg-danger',
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
  allLabel = 'All',
}: {
  label: string
  options: readonly string[]
  value: string | null
  onChange: (v: string | null) => void
  allLabel?: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="bg-surface text-fg-2 rounded-lg px-3 py-2 font-label text-label-caps border border-border-soft outline-none focus:ring-2 focus:ring-accent min-w-[100px] cursor-pointer"
      aria-label={label}
    >
      <option value="">{allLabel}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </option>
      ))}
    </select>
  )
}

export interface ExerciseLibraryProps {
  exercises: Exercise[]
  isLoading?: boolean
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
  onCreate: () => void
  onOpenExercise: (id: string) => void
  onAssignToWorkout: (exercise: Exercise) => void
  /** IDB fallback images (page wires these; stories omit them) */
  externalImages?: Record<string, string>
  emptyLabel?: string
  onHideExercises?: (ids: string[]) => boolean
  onDeleteExercises?: (ids: string[]) => Promise<{ deletedIds: string[]; error: string | null }>
}

export function ExerciseLibrary({
  exercises,
  isLoading,
  favoriteIds,
  onToggleFavorite,
  onCreate,
  onOpenExercise,
  onAssignToWorkout,
  externalImages = {},
  onDeleteExercises,
  onHideExercises,
  emptyLabel,
}: ExerciseLibraryProps) {
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null)
  const [forceFilter, setForceFilter] = useState<string | null>(null)
  const [mechanicFilter, setMechanicFilter] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [favoritesFilter, setFavoritesFilter] = useState(false)
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteStatus, setDeleteStatus] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  // Category chips are derived from real data so empty categories never render
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    exercises.forEach((ex) => map.set(ex.category, (map.get(ex.category) ?? 0) + 1))
    return map
  }, [exercises])

  const activeFilterCount =
    (muscleFilter ? 1 : 0) +
    (equipmentFilter ? 1 : 0) +
    (forceFilter ? 1 : 0) +
    (mechanicFilter ? 1 : 0) +
    (difficultyFilter ? 1 : 0)

  const matching = useMemo(() => {
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
      if (favoritesFilter && !favoriteIds.includes(ex.id)) return false
      return true
    })
  }, [exercises, search, muscleFilter, equipmentFilter, forceFilter, mechanicFilter, difficultyFilter, categoryFilter, favoritesFilter, favoriteIds])

  const filtered = selected ? matching.filter(canSelect) : matching
  const chosen = exercises.filter((exercise) => selected?.has(exercise.id))
  const personalIds = chosen.filter(canManageExercise).map((exercise) => exercise.id)
  const catalogIds = chosen.filter(isSharedExercise).map((exercise) => exercise.id)

  function canSelect(exercise: Exercise) {
    return isSharedExercise(exercise) ? Boolean(onHideExercises) : canManageExercise(exercise) && Boolean(onDeleteExercises)
  }

  function removeFromSelection(ids: string[]) {
    const removed = new Set(ids)
    const remaining = chosen.filter((exercise) => !removed.has(exercise.id)).map((exercise) => exercise.id)
    setSelected(remaining.length ? new Set(remaining) : null)
  }

  function hideSelection() {
    setDeleteError(null)
    if (!onHideExercises?.(catalogIds)) {
      setDeleteError('Could not hide the selected exercises in this browser.')
      return
    }
    setDeleteStatus(`Hidden ${catalogIds.length} catalog exercise${catalogIds.length === 1 ? '' : 's'}.`)
    removeFromSelection(catalogIds)
  }

  function toggleSelection(id: string) {
    setSelected((current) => {
      if (!current) return null
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDeleteSelection() {
    if (!onDeleteExercises || !personalIds.length || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const result = await onDeleteExercises(personalIds)
      const removed = new Set(result.deletedIds)
      if (removed.size) setDeleteStatus(`Deleted ${removed.size} exercise${removed.size === 1 ? '' : 's'}.`)
      removeFromSelection(result.deletedIds)
      setDeleteError(result.error)
      setConfirmDelete(false)
    } catch {
      setDeleteError('Could not delete the selected exercises.')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const hasNoExercises = exercises.length === 0
  const hasNoResults = !hasNoExercises && filtered.length === 0
  const isFavoritesEmpty = favoritesFilter && favoriteIds.length === 0

  function clearFilters() {
    setMuscleFilter(null)
    setEquipmentFilter(null)
    setForceFilter(null)
    setMechanicFilter(null)
    setDifficultyFilter(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 md:gap-24">
      {/* Editorial header — not sticky, gives the page breathing room */}
      <header className="flex flex-wrap items-end justify-between gap-16 border-b border-border-soft pb-16">
        <div className="flex flex-col gap-2">
          <h1 className="font-headline text-headline-lg text-fg">
            Exercises <span className="text-accent">({filtered.length})</span>
          </h1>
        </div>
        {!hasNoExercises && (
          <div className="flex flex-wrap gap-2">
            {exercises.some(canSelect) && (
              <Button variant="outline" onClick={() => { setDeleteError(null); setDeleteStatus(''); setSelected(selected ? null : new Set()) }}>
                {selected ? 'Done selecting' : 'Select exercises'}
              </Button>
            )}
            <Button onClick={onCreate}>New exercise</Button>
          </div>
        )}
      </header>

      {/* Sticky toolbar: search + category chips + filters toggle */}
      {!hasNoExercises && <div className="sticky top-0 z-30 flex flex-col gap-8 border-b border-border-soft bg-bg/95 py-8 backdrop-blur">
        <div className="flex items-center gap-8">
          <div className="flex-1 min-w-0">
            <SearchInput
              label="Search exercises"
              value={search}
              onChange={setSearch}
              placeholder="Name, muscle, or equipment..."
            />
          </div>
          <Button
            variant={activeFilterCount > 0 || filtersOpen ? 'primary' : 'outline'}
            size="sm"
            pill
            className="mt-5 shrink-0"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </Button>
        </div>

        {/* Collapsible filter panel — hidden until asked for */}
        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label="Muscle" options={allMuscleGroups} value={muscleFilter} onChange={setMuscleFilter} allLabel="All Muscles" />
            <FilterSelect label="Equipment" options={allEquipment} value={equipmentFilter} onChange={setEquipmentFilter} allLabel="All Equipment" />
            <FilterSelect label="Force" options={['push', 'pull', 'static']} value={forceFilter} onChange={setForceFilter} />
            <FilterSelect label="Mechanic" options={['compound', 'isolation']} value={mechanicFilter} onChange={setMechanicFilter} />
            <FilterSelect label="Level" options={['beginner', 'intermediate', 'advanced']} value={difficultyFilter} onChange={setDifficultyFilter} />
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" pill onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        )}

        {/* Category chip rail — replaces section grouping + category select */}
        <div
          role="tablist"
          aria-label="Exercise categories"
          className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            role="tab"
            aria-selected={!categoryFilter && !favoritesFilter}
            onClick={() => { setCategoryFilter(null); setFavoritesFilter(false) }}
            className={`shrink-0 h-9 px-4 rounded-full font-label text-label-caps transition-colors focus-visible:focus-ring border ${
              !categoryFilter && !favoritesFilter
                ? 'bg-accent text-accent-on border-transparent'
                : 'border-border-soft text-fg-2 hover:bg-surface-warm'
            }`}
          >
            All {categoryCounts.size > 0 && <span className="opacity-70">{exercises.length}</span>}
          </button>
          <button
            role="tab"
            aria-selected={favoritesFilter}
            onClick={() => setFavoritesFilter((v) => !v)}
            className={`shrink-0 h-9 px-4 rounded-full font-label text-label-caps transition-colors focus-visible:focus-ring border ${
              favoritesFilter
                ? 'bg-accent text-accent-on border-transparent'
                : 'border-border-soft text-fg-2 hover:bg-surface-warm'
            }`}
          >
            {favoritesFilter ? '★' : '☆'} Favorites {favoriteIds.length > 0 && <span className="opacity-70">{favoriteIds.length}</span>}
          </button>
          {CATEGORIES.filter((cat) => categoryCounts.has(cat)).map((cat) => {
            const selected = categoryFilter === cat && !favoritesFilter
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={selected}
                onClick={() => setCategoryFilter(selected ? null : cat)}
                className={`shrink-0 h-9 px-4 rounded-full font-label text-label-caps transition-colors focus-visible:focus-ring border ${
                  selected
                    ? 'bg-accent text-accent-on border-transparent'
                    : 'border-border-soft text-fg-2 hover:bg-surface-warm'
                }`}
              >
                {CATEGORY_LABELS[cat]} <span className="opacity-70">{categoryCounts.get(cat)}</span>
              </button>
            )
          })}
        </div>
      </div>}

      {selected && (
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface-warm p-3">
          <span className="mr-auto text-sm font-semibold" aria-live="polite">{chosen.length} selected</span>
          <Button size="sm" variant="ghost" disabled={!filtered.length} onClick={() => setSelected(new Set([...selected, ...filtered.map((exercise) => exercise.id)]))}>Select visible</Button>
          {catalogIds.length > 0 && <Button size="sm" variant="outline" onClick={hideSelection}>Hide selected ({catalogIds.length})</Button>}
          {personalIds.length > 0 && <Button size="sm" variant="outline" disabled={deleting} onClick={() => setConfirmDelete(true)}>Delete selected</Button>}
        </div>
      )}
      {deleteStatus && <p role="status" className="text-sm text-muted">{deleteStatus}</p>}
      {deleteError && <p role="alert" className="text-sm text-danger">{deleteError}</p>}
      {confirmDelete && (
        <Dialog open onOpenChange={(open) => { if (!open && !deleting) setConfirmDelete(false) }} title={`Delete ${personalIds.length} selected exercise${personalIds.length === 1 ? '' : 's'}?`}>
          <p className="my-4 text-sm text-muted">These exercises will be removed from your library. Existing workout intervals will stay in place.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={deleting} onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button disabled={deleting} onClick={handleDeleteSelection}>{deleting ? 'Deleting…' : 'Delete exercises'}</Button>
          </div>
        </Dialog>
      )}

      {/* Empty states */}
      {hasNoExercises && (isLoading ? <p role="status" className="text-muted">Loading exercises…</p> : (
        <EmptyState
          title={emptyLabel ?? "No exercises yet"}
          action={<Button onClick={onCreate}>Create Exercise</Button>}
        />
      ))}

      {hasNoResults && !hasNoExercises && (
        <EmptyState
          title={isFavoritesEmpty ? 'No favorites yet — star exercises to add them' : 'No exercises match your filters.'}
          action={<Button variant="outline" onClick={() => {
            clearFilters()
            setSearch('')
            setCategoryFilter(null)
            setFavoritesFilter(false)
          }}>Show all exercises</Button>}
        />
      )}

      {!hasNoExercises && !hasNoResults && (
        <ul className="m-0 grid list-none grid-cols-1 items-start gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ex) => {
            const muscles = ex.primaryMuscles ?? ex.muscleGroups ?? []
            const image = ex.images?.[0] ?? externalImages[ex.id]
            const isFavorite = favoriteIds.includes(ex.id)
            const meta = [
              muscles.slice(0, 2).join(', '),
              ex.equipment?.slice(0, 2).join(', '),
            ].filter(Boolean).join(' · ')
            return (
              <li key={ex.id}>
                <Card
                  interactive={!selected}
                  onClick={selected ? undefined : () => onOpenExercise(ex.id)}
                  className="group overflow-hidden"
                >
                  {image && (
                    <div className="aspect-[16/10] w-full border-b border-border-soft bg-surface-warm">
                      <img
                        src={image}
                        alt={`Demonstration of ${ex.name}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 px-3 py-3">
                    {!image && (
                      <div role="img" aria-label={`${ex.name} has no image`} className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-warm text-muted">
                        <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4zM4 16l4-4 4 4 3-3 5 5" />
                        </svg>
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <h3 className="wrap-anywhere font-body text-body-md font-bold text-fg line-clamp-2">{ex.name}</h3>
                        {ex.difficulty && (
                          <span className="inline-flex items-center gap-1.5 font-label text-label-caps text-muted">
                            <span className={`w-2 h-2 rounded-full ${DIFFICULTY_DOT[ex.difficulty] ?? 'bg-muted'}`} aria-hidden="true" />
                            {ex.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-data-sm text-muted line-clamp-1">
                        {meta || CATEGORY_LABELS[ex.category]}
                        {muscles.length > 2 && ` +${muscles.length - 2}`}
                      </p>
                      {ex.visibility === 'community' && ex.authorName && <p className="truncate text-xs text-muted">By {ex.authorName}</p>}
                    </div>

                    {selected ? (
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 px-4 text-sm text-fg-2">
                        <input type="checkbox" className="size-4 accent-accent" checked={selected.has(ex.id)} onChange={() => toggleSelection(ex.id)} aria-label={`Select ${ex.name}`} />
                        Select
                      </label>
                    ) : <div className="ml-auto flex shrink-0 items-center gap-1">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(ex.id) }}
                        className={isFavorite ? 'text-accent' : ''}
                      >
                        {isFavorite ? '★' : '☆'}
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        aria-label="Assign to workout"
                        onClick={(e) => { e.stopPropagation(); onAssignToWorkout(ex) }}
                        className="opacity-60 md:opacity-100 group-hover:opacity-100 hover:bg-accent hover:text-accent-on transition"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </IconButton>
                    </div>}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
