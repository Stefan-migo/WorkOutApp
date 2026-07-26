'use client'

// ponytail: simple localStorage fallback for when Supabase is unreachable
// Upgrade to a proper sync layer if offline usage becomes critical

const FALLBACK_PREFIX = 'workoutapp.fallback.'

export function getFallback<T>(table: string): T[] {
  try {
    const raw = localStorage.getItem(`${FALLBACK_PREFIX}${table}`)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function setFallback<T>(table: string, data: T[]): void {
  try {
    localStorage.setItem(`${FALLBACK_PREFIX}${table}`, JSON.stringify(data))
  } catch {
    // quota exceeded — skip
  }
}
