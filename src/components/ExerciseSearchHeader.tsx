'use client'

interface ExerciseSearchHeaderProps {
  search: string
  onSearchChange: (v: string) => void
  muscleFilter: string | null
  onMuscleFilter: (v: string | null) => void
  allMuscleGroups: string[]
  equipmentFilter: string | null
  onEquipmentFilter: (v: string | null) => void
  allEquipment: string[]
  onCreate: () => void
  forceFilter?: string | null
  onForceFilter?: (v: string | null) => void
  mechanicFilter?: string | null
  onMechanicFilter?: (v: string | null) => void
  difficultyFilter?: string | null
  onDifficultyFilter?: (v: string | null) => void
  categoryFilter?: string | null
  onCategoryFilter?: (v: string | null) => void
  favoritesFilter?: boolean
  onFavoritesFilterChange?: (v: boolean) => void
}

const FORCE_OPTIONS = ['push', 'pull', 'static'] as const
const MECHANIC_OPTIONS = ['compound', 'isolation'] as const
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const
const CATEGORY_OPTIONS = ['strength', 'cardio', 'stretching', 'plyometrics', 'strongman', 'powerlifting', 'mobility', 'other'] as const

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

export function ExerciseSearchHeader({
  search, onSearchChange,
  muscleFilter, onMuscleFilter, allMuscleGroups,
  equipmentFilter, onEquipmentFilter, allEquipment,
  onCreate,
  forceFilter, onForceFilter,
  mechanicFilter, onMechanicFilter,
  difficultyFilter, onDifficultyFilter,
  categoryFilter, onCategoryFilter,
  favoritesFilter, onFavoritesFilterChange,
}: ExerciseSearchHeaderProps) {
  return (
    <section className="sticky top-0 z-30 bg-surface rounded-xl p-9 border border-border-soft flex flex-col gap-12 relative overflow-hidden shadow-sm">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent" />
      <div className="flex flex-col gap-4 z-10">
        <h1 className="font-headline text-headline-lg font-bold text-accent">Exercise Library</h1>
        <p className="font-body text-body-md text-muted">What exercises are you looking for?</p>
      </div>

      {/* Search + Favorites row */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 z-10">
        <div className="relative w-full sm:flex-1">
          <span className="material-symbols-outlined absolute left-0 bottom-3 text-[48px] text-muted">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-0 border-b-2 border-border/50 pl-10 py-3 font-data text-data-lg text-accent placeholder:text-muted focus:ring-0 focus:border-accent transition-colors outline-none"
            placeholder="Search by name, muscle, or equipment..."
          />
        </div>
        {onFavoritesFilterChange !== undefined && (
          <div className="flex gap-2 items-center shrink-0 pb-1">
            <button
              onClick={() => onFavoritesFilterChange(false)}
              className={`px-3 py-1.5 rounded-lg font-label text-label-caps transition-colors focus-visible:focus-ring ${
                !favoritesFilter ? 'bg-accent text-accent-on' : 'bg-surface text-fg-2 hover:bg-surface-warm'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onFavoritesFilterChange(true)}
              className={`px-3 py-1.5 rounded-lg font-label text-label-caps transition-colors focus-visible:focus-ring ${
                favoritesFilter ? 'bg-accent text-accent-on' : 'bg-surface text-fg-2 hover:bg-surface-warm'
              }`}
            >
              {favoritesFilter ? '★' : '☆'} Favorites
            </button>
          </div>
        )}
      </div>

      {/* Filter dropdowns row */}
      <div className="flex flex-wrap gap-3 z-10">
        <FilterSelect label="Muscle" options={allMuscleGroups} value={muscleFilter} onChange={onMuscleFilter} allLabel="All Muscles" />
        <FilterSelect label="Equipment" options={allEquipment} value={equipmentFilter} onChange={onEquipmentFilter} allLabel="All Equipment" />
        {onForceFilter && (
          <FilterSelect label="Force" options={FORCE_OPTIONS} value={forceFilter ?? null} onChange={onForceFilter} />
        )}
        {onMechanicFilter && (
          <FilterSelect label="Mechanic" options={MECHANIC_OPTIONS} value={mechanicFilter ?? null} onChange={onMechanicFilter} />
        )}
        {onDifficultyFilter && (
          <FilterSelect label="Level" options={DIFFICULTY_OPTIONS} value={difficultyFilter ?? null} onChange={onDifficultyFilter} />
        )}
        {onCategoryFilter && (
          <FilterSelect label="Category" options={CATEGORY_OPTIONS} value={categoryFilter ?? null} onChange={onCategoryFilter} />
        )}
      </div>

      {/* Create button */}
      <div className="z-10">
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-accent text-accent-on font-label text-label-caps rounded-lg hover:bg-accent-hover transition-colors focus-visible:focus-ring"
        >
          + New Exercise
        </button>
      </div>
    </section>
  )
}
