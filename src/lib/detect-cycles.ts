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
  const byCycleId = groupByCycleId(intervals)
  if (byCycleId.length > 0) return byCycleId

  const byCycleIndex = groupByCycleIndexReset(intervals)
  if (byCycleIndex.length > 0) return byCycleIndex

  return groupByHeuristic(intervals)
}

// ---------------------------------------------------------------------------
// Strategy 1: cycleId — most reliable, preserves custom titles
// ---------------------------------------------------------------------------
function groupByCycleId(intervals: Interval[]): DetectedCycle[] {
  const blocks = new Map<string, { startIdx: number; endIdx: number; intervals: Interval[]; title?: string }>()
  for (let i = 0; i < intervals.length; i++) {
    const cid = intervals[i]?.cycleId
    if (!cid) continue
    if (!blocks.has(cid)) {
      blocks.set(cid, { startIdx: i, endIdx: i, intervals: [], title: intervals[i]?.cycleTitle })
    }
    const block = blocks.get(cid)!
    block.endIdx = i
    block.intervals.push(intervals[i]!)
    // Capture title from any interval in the block (they all share it)
    if (!block.title && intervals[i]?.cycleTitle) block.title = intervals[i]!.cycleTitle
  }
  if (blocks.size === 0) return []

  const entries = Array.from(blocks.entries())
  const withCustomTitles = entries.filter(([, b]) => b.intervals.filter((i) => i.type === 'work').length >= 2)

  // Assign sequential labels — use custom title if set and not the default "Cycle"
  let cycleNum = 0
  return withCustomTitles.map(([, b]) => {
    cycleNum++
    const title = b.title && b.title !== 'Cycle' ? b.title : `Cycle ${cycleNum}`
    return { startIdx: b.startIdx, endIdx: b.endIdx, label: title, intervals: b.intervals }
  })
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
