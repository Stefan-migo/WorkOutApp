'use client'

import { useState, useEffect, useCallback } from 'react'

// ponytail: single-key localStorage hook, upgrade to IndexedDB when quota/query needs grow
// SSR-safe: returns initialValue on server + first client render, then reads localStorage after hydration
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // ponytail: post-hydration read, no cross-tab sync until needed
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) setStoredValue(JSON.parse(item) as T)
    } catch {
      // corrupt data or quota error — keep initialValue
    }
  }, [key])

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
