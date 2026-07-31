import type { Exercise } from '@/types/workout'

/**
 * Return the display name for a work interval:
 * - If the title was already customized (not 'Work') → use it as-is
 * - If exercise can be looked up → exercise name
 * - Fallback → `Work N` (1-based count)
 * - Non-work intervals → original title
 */
export function getIntervalName(
  interval: { title: string; type: string; exerciseId?: string },
  workCount: number,
  exercise?: Exercise,
): string {
  if (interval.type !== 'work') return interval.title
  // Custom title already set (auto-named on assign or user-edited)
  if (interval.title && interval.title !== 'Work') return interval.title
  if (exercise) return exercise.name
  return `Work ${workCount}`
}
