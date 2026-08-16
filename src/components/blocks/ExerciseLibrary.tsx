'use client'

import { useMemo, useState } from 'react'
import type { Exercise, ExerciseCategory } from '@/types/workout'
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
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
  onCreate: () => void
  onOpenExercise: (id: string) => void
  onAssignToWorkout: (exercise: Exercise) => void
  /** IDB fallback images (page wires these; stories omit them) */
  externalImages?: Record<string, string>
}

export function ExerciseLibrary({
  exercises,
  favoriteIds,
  onToggleFavorite,
  onCreate,
  onOpenExercise,
  onAssignToWorkout,
  externalImages = {},
}: ExerciseLibraryProps) {
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null)
  const [forceFilter, setForceFilter] = useState<string | null>(null)
  const [mechanicFilter, setMechanicFilter] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [favoritesFilter, setFavoritesFilter] = useState(false)
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
      if (favoritesFilter && !favoriteIds.includes(ex.id)) return false
      return true
    })
  }, [exercises, search, muscleFilter, equipmentFilter, forceFilter, mechanicFilter, difficultyFilter, categoryFilter, favoritesFilter, favoriteIds])

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
    <div className="max-w-[1440px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col gap-16 md:gap-24 pb-32">
      {/* Editorial header — not sticky, gives the page breathing room */}
      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-label text-label-caps text-muted">Library</p>
          <h1 className="font-headline text-headline-lg text-fg">
            Exercises <span className="text-accent">({filtered.length})</span>
          </h1>
        </div>
        <Button size="md" onClick={onCreate} className="self-start md:self-auto">
          + New Exercise
        </Button>
      </header>

      {/* Sticky toolbar: search + category chips + filters toggle */}
      <div className="sticky top-0 z-30 -mx-margin-mobile md:-mx-margin-desktop px-margin-mobile md:px-margin-desktop py-8 bg-bg/95 backdrop-blur flex flex-col gap-8 border-b border-border-soft">
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
      </div>

      {/* Empty states */}
      {hasNoExercises && (
        <EmptyState
          title="No exercises yet"
          body="Create your first one!"
          action={<Button onClick={onCreate}>Create Exercise</Button>}
        />
      )}

      {hasNoResults && !hasNoExercises && (
        <EmptyState
          title={isFavoritesEmpty ? 'No favorites yet — star exercises to add them' : 'No exercises match your filters.'}
        />
      )}

      {/* Results — readable list rows instead of dense image grid */}
      {!hasNoExercises && !hasNoResults && (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 list-none p-0 m-0">
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
                <Card interactive onClick={() => onOpenExercise(ex.id)} className="flex flex-col md:flex-row md:items-center gap-8 md:gap-16 overflow-hidden group">
                  {/* Mobile: hero image (16:9) on top — the GIF/image leads the card.
                      Desktop: compact 80px thumbnail back in the row layout. */}
                  <div
                    className="w-full aspect-[16/9] md:w-20 md:h-20 md:aspect-auto bg-surface shrink-0 overflow-hidden bg-cover bg-center"
                    style={image ? { backgroundImage: `url(${image})` } : undefined}
                    role="img"
                    aria-label={image ? undefined : `${ex.name} has no image`}
                  >
                    {!image && (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 md:w-6 md:h-6 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name + one meta line — scannable at a glance */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2 px-16 md:px-0 pb-4 md:pb-0">
                    <div className="flex items-center gap-8 flex-wrap">
                      <h3 className="font-body text-body-md font-bold text-fg line-clamp-1">{ex.name}</h3>
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
                  </div>

                  {/* Actions — always visible, no hover-only affordances.
                      Mobile: quick-action bar pinned to the bottom edge of the card. */}
                  <div className="flex items-center gap-2 shrink-0 px-16 md:px-0 pb-8 md:pb-0 pt-2 md:pt-0 border-t border-border-soft md:border-t-0">
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
