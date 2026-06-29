'use client'

import { useState, useCallback } from 'react'

// ponytail: single-key localStorage hook, upgrade to IndexedDB when quota/query needs grow
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      // ponytail: corrupt data or quota error — reset to initial
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(next))
          } catch {
            // ponytail: quota exceeded — silently fail, state still updated
          }
        }
        return next
      })
    },
    [key],
  )

  return [storedValue, setValue]
}
