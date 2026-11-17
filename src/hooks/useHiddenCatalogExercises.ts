import { useEffect, useState } from 'react'

const KEY = 'workoutapp-hidden-catalog-exercises'

function readHiddenIds(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function useHiddenCatalogExercises() {
  const [hiddenIds, setHiddenIds] = useState<string[]>([])

  useEffect(() => {
    const refresh = () => setHiddenIds(readHiddenIds())
    refresh()
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  function write(ids: string[]) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(ids))
      setHiddenIds(ids)
      return true
    } catch {
      return false
    }
  }

  return {
    hiddenIds,
    hide: (ids: string[]) => write([...new Set([...readHiddenIds(), ...ids])]),
    restore: (id: string) => write(readHiddenIds().filter((hidden) => hidden !== id)),
    restoreAll: () => write([]),
  }
}
