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
}

export function ExerciseSearchHeader({
  search, onSearchChange,
  muscleFilter, onMuscleFilter, allMuscleGroups,
  equipmentFilter, onEquipmentFilter, allEquipment,
  onCreate,
}: ExerciseSearchHeaderProps) {
  return (
    <section className="bg-surface rounded-xl p-24 border border-outline-variant/30 flex flex-col gap-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
      <div className="flex flex-col gap-xs z-10">
        <h1 className="font-headline text-headline-lg font-bold text-primary">Exercise Library</h1>
        <p className="font-body text-body-md text-on-surface-variant">
          Master your movements. Search, filter, and build your ultimate protocol.
        </p>
      </div>
      <div className="flex flex-col gap-16 z-10">
        {/* Search */}
        {/* ponytail: flat search, no debounce — add when >200 exercises */}
        <div className="relative w-full max-w-2xl">
          <span className="material-symbols-outlined absolute left-0 bottom-3 text-[48px] text-on-surface-variant">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-0 border-b-2 border-outline-variant/50 pl-10 py-3 font-data text-data-lg text-primary placeholder:text-on-surface-variant focus:ring-0 focus:border-secondary transition-colors outline-none"
            placeholder="Search by name, muscle, or equipment..."
          />
        </div>
        {/* Filter chips */}
        <div className="flex flex-wrap gap-x-24 gap-y-16 mt-8">
          <div className="flex flex-col gap-8">
            <span className="font-label text-label-caps text-on-surface-variant uppercase tracking-widest">Muscle Group</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onMuscleFilter(null)}
                className={`px-3 py-1.5 rounded-full font-label text-label-caps transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                  muscleFilter === null
                    ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20'
                    : 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                All
              </button>
              {allMuscleGroups.map((mg) => (
                <button
                  key={mg}
                  onClick={() => onMuscleFilter(mg === muscleFilter ? null : mg)}
                  className={`px-3 py-1.5 rounded-full font-label text-label-caps transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                    muscleFilter === mg
                      ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20'
                      : 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <span className="font-label text-label-caps text-on-surface-variant uppercase tracking-widest">Equipment</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onEquipmentFilter(null)}
                className={`px-3 py-1.5 rounded-full font-label text-label-caps transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                  equipmentFilter === null
                    ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20'
                    : 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                All
              </button>
              {allEquipment.map((eq) => (
                <button
                  key={eq}
                  onClick={() => onEquipmentFilter(eq === equipmentFilter ? null : eq)}
                  className={`px-3 py-1.5 rounded-full font-label text-label-caps transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                    equipmentFilter === eq
                      ? 'bg-secondary-container/10 text-secondary border border-secondary-container/20'
                      : 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onCreate}
          className="self-start px-4 py-2 bg-primary text-on-primary font-label text-label-caps rounded-lg hover:bg-primary-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          + New Exercise
        </button>
      </div>
    </section>
  )
}
