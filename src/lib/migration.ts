import type { Interval, IntervalType, Workout } from '@/types/workout'

let _idCounter = 0
function uid(): string {
  return `_syn_${++_idCounter}`
}

function stripDeprecated(i: Record<string, unknown>): Interval {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children, cycleCount, setCount, restBetweenCycles, collapseTrailingRest, isGenerated, ...clean } = i
  return clean as unknown as Interval
}

function isOldFormat(intervals: Record<string, unknown>[]): boolean {
  return intervals.some((i) => i.children != null)
}

export function migrateWorkout(old: unknown): Workout | null {
  try {
    if (!old || typeof old !== 'object' || old === null) return null

    const raw = old as Record<string, unknown>
    if (!Array.isArray(raw.intervals)) return null

    const intervals = raw.intervals as Record<string, unknown>[]

    if (!isOldFormat(intervals)) {
      // Passthrough — just strip deprecated fields
      return {
        ...raw,
        intervals: intervals.map(stripDeprecated),
      } as unknown as Workout
    }

    const result: Interval[] = []

    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i]!
      const children = interval.children

      if (children && Array.isArray(children) && children.length > 0) {
        const cycleCount = (interval.cycleCount as number) ?? 1
        const setCount = (interval.setCount as number) ?? 1
        const restBetween = (interval.restBetweenCycles as number) ?? 0
        const collapseTrailing = interval.collapseTrailingRest === true

        const childIntervals = children.map((c: Record<string, unknown>) => stripDeprecated(c))
        const nextRoot = i + 1 < intervals.length ? intervals[i + 1]! : null
        const nextRootType = nextRoot?.type as string | undefined

        const expanded: Interval[] = []

        for (let s = 0; s < setCount; s++) {
          for (let c = 0; c < cycleCount; c++) {
            for (const child of childIntervals) {
              expanded.push({ ...child })
            }
            // restBetweenCycles goes between cycles, not after last
            if (c < cycleCount - 1 && restBetween > 0) {
              expanded.push({
                id: uid(),
                type: 'rest_between_cycles' as IntervalType,
                title: 'Rest',
                duration: restBetween,
              })
            }
          }
        }

        // collapseTrailingRest: if last child is rest AND next root is rest/cooldown, omit last expanded item
        if (collapseTrailing && expanded.length > 0) {
          const lastChild = childIntervals[childIntervals.length - 1]
          if (lastChild?.type === 'rest' && nextRootType && (nextRootType === 'rest' || nextRootType === 'cooldown')) {
            expanded.pop()
          }
        }

        result.push(...expanded)
      } else {
        // Flat interval — just strip deprecated fields
        result.push(stripDeprecated(interval))
      }
    }

    return {
      ...raw,
      intervals: result,
    } as unknown as Workout
  } catch {
    return null
  }
}
