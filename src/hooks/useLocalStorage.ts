'use client'

import { useState, useCallback } from 'react'

// ponytail: single-key localStorage hook, upgrade to IndexedDB when quota/query needs grow
// SSR-safe: lazy initializer reads localStorage synchronously, no flash of default
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      // corrupt data or SSR — keep initialValue
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
            // ponytail: quota exceeded — state still updated, storage silently fails
            console.warn('Storage quota exceeded for key:', key)
          }
        }
        return next
      })
    },
    [key],
  )

  return [storedValue, setValue]
}
