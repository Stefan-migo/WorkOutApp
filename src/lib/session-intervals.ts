import type { CompletedInterval } from '@/types/workout'

/**
 * Parse an MM:SS string into seconds. Returns null when the input
 * is not a valid MM:SS pair (e.g. empty, "3", "1:2:3", "abc", "12:ab").
 * Follows the same parse shape used in IntervalRow (minutes may be unpadded).
 */
export function parseDurationInput(value: string): number | null {
  const parts = value.split(':')
  if (parts.length !== 2) return null
  const m = parseInt(parts[0]!, 10)
  const s = parseInt(parts[1]!, 10)
  if (Number.isNaN(m) || Number.isNaN(s)) return null
  return m * 60 + s
}

/**
 * Return a new intervals array with only the interval at `index`
 * replaced by `{ ...original, ...patch }`. The input array is never
 * mutated; all other entries keep their object identity.
 * Out-of-range indexes return the array unchanged.
 */
export function updateCompletedInterval(
  intervals: CompletedInterval[],
  index: number,
  patch: Partial<CompletedInterval>,
): CompletedInterval[] {
  if (index < 0 || index >= intervals.length) return intervals
  return intervals.map((intv, i) => (i === index ? { ...intv, ...patch } : intv))
}
