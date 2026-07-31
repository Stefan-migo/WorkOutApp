import type { Session } from '@/types/workout'

export interface PRRecord {
  /** Display name — original interval title (not the normalized grouping key). */
  exercise: string
  /** Heaviest weight lifted (kg). */
  bestWeight?: number
  /** Most reps in a single completed set. */
  bestReps?: number
  /** Estimated 1-rep max via Epley: weight * (1 + reps / 30). */
  bestE1RM?: number
  /** Longest completed cardio effort (seconds). */
  bestCardioSeconds?: number
}

// Same heuristic as history/[id]/page.tsx deriveTypeChips
const CARDIO_RE = /run|treadmill|bike|row/i

interface Group {
  display: string
  bestWeight: number
  bestReps: number
  bestE1RM: number
  bestCardioSeconds: number
}

export function hasStrength(rec: PRRecord): boolean {
  return rec.bestWeight != null || rec.bestReps != null || rec.bestE1RM != null
}

/**
 * Compute personal records across all sessions.
 * Groups by exerciseId when present, otherwise by normalized title.
 * Only counts work intervals that were actually completed.
 */
export function computePRs(sessions: Session[]): PRRecord[] {
  const groups = new Map<string, Group>()

  for (const s of sessions) {
    for (const i of s.intervals) {
      if (i.type !== 'work' || !i.completed) continue
      const key = (i.exerciseId ?? i.title ?? '').toLowerCase().trim()
      if (!key) continue

      let g = groups.get(key)
      if (!g) {
        g = { display: i.title, bestWeight: 0, bestReps: 0, bestE1RM: 0, bestCardioSeconds: 0 }
        groups.set(key, g)
      }

      if (i.weight != null && i.weight > 0) g.bestWeight = Math.max(g.bestWeight, i.weight)
      if (i.actualReps != null && i.actualReps > 0) g.bestReps = Math.max(g.bestReps, i.actualReps)
      if (i.weight != null && i.weight > 0 && i.actualReps != null && i.actualReps > 0) {
        g.bestE1RM = Math.max(g.bestE1RM, i.weight * (1 + i.actualReps / 30))
      }
      if (i.actualDuration > 0 && CARDIO_RE.test(i.title ?? '')) {
        g.bestCardioSeconds = Math.max(g.bestCardioSeconds, i.actualDuration)
      }
    }
  }

  const records: PRRecord[] = []
  for (const g of groups.values()) {
    if (g.bestWeight <= 0 && g.bestReps <= 0 && g.bestE1RM <= 0 && g.bestCardioSeconds <= 0) continue
    const rec: PRRecord = { exercise: g.display }
    if (g.bestWeight > 0) rec.bestWeight = g.bestWeight
    if (g.bestReps > 0) rec.bestReps = g.bestReps
    if (g.bestE1RM > 0) rec.bestE1RM = g.bestE1RM
    if (g.bestCardioSeconds > 0) rec.bestCardioSeconds = g.bestCardioSeconds
    records.push(rec)
  }

  // Strength records first, then cardio; alphabetical within each group
  return records.sort((a, b) => {
    const aStrength = hasStrength(a) ? 0 : 1
    const bStrength = hasStrength(b) ? 0 : 1
    return aStrength - bStrength || a.exercise.localeCompare(b.exercise)
  })
}
