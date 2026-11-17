import type { Interval } from '@/types/workout'

export interface DetectedCycle {
  startIdx: number
  endIdx: number
  label: string
  intervals: Interval[]
}

/**
 * Detect cycle groups from flat workout intervals.
 *
 * Priority:
 * 1. `cycleId` — each CycleTemplate has a unique id, expanded intervals inherit it.
 *    Custom cycle titles (cycleTitle) are preserved.
 * 2. `cycleIndex` — detect where the index resets to 0 → marks a new cycle block.
 * 3. Heuristic (fallback for old workouts with no metadata) — consecutive work
 *    intervals with same (title, duration).
 */
export function detectCycles(intervals: Interval[]): DetectedCycle[] {
  if (intervals.some((interval) => interval.cycleId)) return groupByCycleId(intervals)

  const byCycleIndex = groupByCycleIndexReset(intervals)
  if (byCycleIndex.length > 0) return byCycleIndex
  return groupByHeuristic(intervals)
}

// ---------------------------------------------------------------------------
// Strategy 1: cycleId — most reliable, preserves custom titles
// ---------------------------------------------------------------------------
function groupByCycleId(intervals: Interval[]): DetectedCycle[] {
  const cycles: DetectedCycle[] = []
  for (let start = 0; start < intervals.length;) {
    const first = intervals[start]!
    if (!first.cycleId || first.type === 'rest_between_cycles') {
      start++
      continue
    }

    let end = start
    while (end + 1 < intervals.length) {
      const next = intervals[end + 1]!
      if (next.type === 'rest_between_cycles') break
      if (next.cycleId === first.cycleId) {
        end++
      } else if (next.type === 'rest' && !next.cycleId && intervals[end + 2]?.cycleId === first.cycleId
        && intervals[end + 2]?.type !== 'rest_between_cycles') {
        end += 2
      } else {
        break
      }
    }

    const members = intervals.slice(start, end + 1)
    const title = members.find((member) => member.cycleTitle && member.cycleTitle !== 'Cycle')?.cycleTitle
    if (members.some((member) => member.type === 'work')) {
      cycles.push({ startIdx: start, endIdx: end, label: title ?? `Cycle ${cycles.length + 1}`, intervals: members })
    }
    start = end + 1
  }
  return cycles
}

// ---------------------------------------------------------------------------
// Strategy 2: cycleIndex reset detection
// ---------------------------------------------------------------------------
function groupByCycleIndexReset(intervals: Interval[]): DetectedCycle[] {
  const hasCi = intervals.some((i) => i.cycleIndex !== undefined && i.cycleIndex !== null)
  if (!hasCi) return []

  const groups: { startIdx: number; endIdx: number; intervals: Interval[] }[] = []
  let current: { startIdx: number; intervals: Interval[] } | null = null

  for (let i = 0; i < intervals.length; i++) {
    const ci = intervals[i]?.cycleIndex

    if (ci === undefined || ci === null || intervals[i]?.type !== 'work') {
      if (current) {
        groups.push({ startIdx: current.startIdx, endIdx: i - 1, intervals: current.intervals })
        current = null
      }
      continue
    }

    if (current === null) {
      current = { startIdx: i, intervals: [intervals[i]!] }
    } else if (ci === 0) {
      groups.push({ startIdx: current.startIdx, endIdx: i - 1, intervals: current.intervals })
      current = { startIdx: i, intervals: [intervals[i]!] }
    } else {
      current.intervals.push(intervals[i]!)
    }
  }

  if (current) {
    groups.push({ startIdx: current.startIdx, endIdx: intervals.length - 1, intervals: current.intervals })
  }

  let cycleNum = 0
  return groups
    .filter((g) => g.intervals.filter((i) => i.type === 'work').length >= 2)
    .map((g) => {
      cycleNum++
      return { startIdx: g.startIdx, endIdx: g.endIdx, label: `Cycle ${cycleNum}`, intervals: g.intervals }
    })
}

// ---------------------------------------------------------------------------
// Strategy 3: heuristic
// ---------------------------------------------------------------------------
function groupByHeuristic(intervals: Interval[]): DetectedCycle[] {
  const cycles: DetectedCycle[] = []
  let i = 0
  while (i < intervals.length) {
    if (intervals[i]?.type !== 'work') { i++; continue }
    const pattern = intervals[i]!
    const start = i
    let count = 0
    while (
      i < intervals.length &&
      intervals[i]?.type === 'work' &&
      intervals[i]?.title === pattern.title &&
      intervals[i]?.duration === pattern.duration
    ) {
      count++
      i++
    }
    if (count >= 2) {
      cycles.push({
        startIdx: start,
        endIdx: i - 1,
        label: `${pattern.title} ×${count}`,
        intervals: intervals.slice(start, i),
      })
    }
  }
  return cycles
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export function isInCycle(
  index: number,
  cycles: DetectedCycle[],
): DetectedCycle | undefined {
  return cycles.find((c) => index >= c.startIdx && index <= c.endIdx)
}

/** Match the ordinal of a Work block within its cycle, excluding standalone work. */
export function getMatchingWorkIndexes(intervals: Interval[], index: number): number[] {
  const selected = intervals[index]
  if (selected?.type !== 'work') return []

  const groups = new Map<string, number[]>()
  let legacyCycle = 0
  intervals.forEach((interval, i) => {
    if (interval.type !== 'work') return
    if (!interval.cycleId && interval.cycleIndex === 0) legacyCycle++
    const key = interval.cycleId
      ? `id:${interval.cycleId}`
      : interval.cycleIndex != null && legacyCycle > 0 ? `legacy:${legacyCycle}` : undefined
    if (!key) return
    const group = groups.get(key) ?? []
    group.push(i)
    groups.set(key, group)
  })

  const cycles = [...groups.values()]
  const current = cycles.find((group) => group.includes(index))
  if (!current) return []
  const position = current.indexOf(index)
  return cycles.flatMap((group) => group !== current && group[position] != null ? [group[position]!] : [])
}
