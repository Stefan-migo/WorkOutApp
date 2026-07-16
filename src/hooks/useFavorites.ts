'use client'

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'workoutapp.favorites'

function readFavorites(): string[] {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY)
    return item !== null ? (JSON.parse(item) as string[]) : []
  } catch {
    return []
  }
}

function writeFavorites(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    console.warn('Storage quota exceeded for key:', STORAGE_KEY)
  }
}

export interface UseFavoritesReturn {
  favoriteIds: string[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  clearOrphans: (validIds: string[]) => void
}

export function useFavorites(): UseFavoritesReturn {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavorites)

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds],
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavoriteIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((fid) => fid !== id)
          : [...prev, id]
        writeFavorites(next)
        return next
      })
    },
    [],
  )

  const clearOrphans = useCallback(
    (validIds: string[]) => {
      setFavoriteIds((prev) => {
        const next = prev.filter((id) => validIds.includes(id))
        if (next.length !== prev.length) {
          writeFavorites(next)
        }
        return next
      })
    },
    [],
  )

  return { favoriteIds, isFavorite, toggleFavorite, clearOrphans }
}
