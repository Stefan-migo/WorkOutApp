'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import type { Exercise } from '@/types/workout'
import { useFavorites } from '@/hooks/useFavorites'

interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
  exercises: Exercise[]
  selectedId?: string
}

const FORCE_OPTIONS = ['push', 'pull', 'static'] as const
const MECHANIC_OPTIONS = ['compound', 'isolation'] as const
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const
const CATEGORY_OPTIONS: readonly string[] = [
  'strength', 'cardio', 'stretching', 'plyometrics',
  'strongman', 'powerlifting', 'mobility', 'other',
] as const

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
      className="bg-surface text-fg-2 rounded-lg px-2 py-1.5 text-xs border border-outline-variant/30 outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
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

export function ExercisePicker({ open, onClose, onSelect, exercises, selectedId }: ExercisePickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const { isFavorite, toggleFavorite } = useFavorites()

  const [search, setSearch] = useState('')
  const [forceFilter, setForceFilter] = useState<string | null>(null)
  const [mechanicFilter, setMechanicFilter] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  // Open/close dialog
  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal()
      // ponytail: setTimeout to focus after dialog animation
      setTimeout(() => searchRef.current?.focus(), 50)
    } else {
      dialogRef.current?.close()
    }
  }, [open])

  // Reset filters when dialog opens
  useEffect(() => {
    if (open) {
      setSearch('')
      setForceFilter(null)
      setMechanicFilter(null)
      setDifficultyFilter(null)
      setCategoryFilter(null)
      setFavoritesOnly(false)
    }
  }, [open])

  // Filter exercises — AND logic across all active filters
  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!ex.name.toLowerCase().includes(q)) return false
      }
      if (favoritesOnly && !isFavorite(ex.id)) return false
      if (forceFilter && ex.force !== forceFilter) return false
      if (mechanicFilter && ex.mechanic !== mechanicFilter) return false
      if (difficultyFilter && ex.difficulty !== difficultyFilter) return false
      if (categoryFilter && ex.category !== categoryFilter) return false
      return true
    })
  }, [exercises, search, favoritesOnly, forceFilter, mechanicFilter, difficultyFilter, categoryFilter, isFavorite])

  // Selected exercise object for mini preview
  const selectedExercise = useMemo(
    () => (selectedId ? exercises.find((ex) => ex.id === selectedId) : undefined),
    [selectedId, exercises],
  )

  function handleSelect(exercise: Exercise) {
    onSelect(exercise)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent, exercise: Exercise) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(exercise)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto w-full max-w-lg rounded-xl border border-outline-variant/30 bg-surface shadow-xl max-h-[90vh] overflow-y-auto"
      style={{ padding: 0 }}
    >
      <div className="p-9 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md font-semibold text-primary text-lg">Select Exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-fg-2 p-1 rounded focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search */}
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-surface text-fg-2 rounded-lg px-3 py-2.5 text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-secondary"
        />

        {/* Mini preview card for selected exercise */}
        {selectedExercise && (
          <div className="bg-surface rounded-lg p-3 flex items-center gap-3 border border-secondary/30">
            <div className="w-10 h-10 rounded bg-surface flex items-center justify-center shrink-0 overflow-hidden">
              {selectedExercise.images?.[0] ? (
                <img
                  src={selectedExercise.images[0]}
                  alt={selectedExercise.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-5 h-5 text-outline-variant/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-fg-2 truncate">{selectedExercise.name}</span>
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-surface text-[10px] text-muted font-medium uppercase tracking-wider">
                  {selectedExercise.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(selectedExercise.primaryMuscles ?? selectedExercise.muscleGroups ?? []).slice(0, 2).map((m) => (
                  <span key={m} className="bg-surface px-1 py-0.5 rounded text-[10px] text-muted">{m}</span>
                ))}
                {selectedExercise.difficulty && (
                  <span className="bg-primary/10 text-primary px-1 py-0.5 rounded text-[10px] font-medium">
                    {selectedExercise.difficulty.charAt(0).toUpperCase() + selectedExercise.difficulty.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/exercises/${selectedExercise.id}`}
              className="shrink-0 text-xs text-secondary hover:text-primary transition-colors font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              View Full Details →
            </Link>
          </div>
        )}

        {/* Filter dropdowns + favorites toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Category" options={CATEGORY_OPTIONS} value={categoryFilter} onChange={setCategoryFilter} />
          <FilterSelect label="Force" options={FORCE_OPTIONS} value={forceFilter} onChange={setForceFilter} />
          <FilterSelect label="Mechanic" options={MECHANIC_OPTIONS} value={mechanicFilter} onChange={setMechanicFilter} />
          <FilterSelect label="Level" options={DIFFICULTY_OPTIONS} value={difficultyFilter} onChange={setDifficultyFilter} />
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
              favoritesOnly
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-muted border border-outline-variant/30 hover:bg-surface-warm-high'
            }`}
          >
            {favoritesOnly ? '★' : '☆'} Favorites
          </button>
        </div>

        {/* Exercise list */}
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto border-t border-outline-variant/20 pt-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No exercises match your filters</p>
          ) : (
            filtered.map((ex) => {
              const muscles = ex.primaryMuscles ?? ex.muscleGroups ?? []
              const maxMuscles = 2
              const overflow = muscles.length > maxMuscles ? muscles.length - maxMuscles : 0
              const isSelected = ex.id === selectedId

              return (
                <div
                  key={ex.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(ex)}
                  onKeyDown={(e) => handleKeyDown(e, ex)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
                    isSelected
                      ? 'bg-secondary/10 border border-secondary/30'
                      : 'hover:bg-surface-warm-low border border-transparent'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                    {ex.images?.[0] ? (
                      <img src={ex.images[0]} alt={ex.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-5 h-5 text-outline-variant/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-fg-2 truncate">{ex.name}</span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-surface text-[10px] text-muted font-medium uppercase tracking-wider">
                        {ex.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {muscles.slice(0, maxMuscles).map((m) => (
                        <span key={m} className="bg-surface px-1 py-0.5 rounded text-[10px] text-muted">{m}</span>
                      ))}
                      {overflow > 0 && (
                        <span className="bg-surface px-1 py-0.5 rounded text-[10px] text-muted font-semibold">+{overflow}</span>
                      )}
                      {ex.difficulty && (
                        <span className="bg-primary/10 text-primary px-1 py-0.5 rounded text-[10px] font-medium">
                          {ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View Full Details link */}
                  <Link
                    href={`/exercises/${ex.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-xs text-secondary hover:text-primary transition-colors font-medium"
                  >
                    Details →
                  </Link>

                  {/* Favorite star */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id) }}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-surface-warm transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                    aria-label={isFavorite(ex.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorite(ex.id) ? '★' : '☆'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </dialog>
  )
}
