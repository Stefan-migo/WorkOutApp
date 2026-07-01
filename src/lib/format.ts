/**
 * Format seconds as m:SS (minutes not zero-padded).
 * Example: 65 → "1:05", 5 → "0:05", 3600 → "60:00"
 */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Format seconds as MM:SS (both minutes and seconds zero-padded).
 * Example: 65 → "01:05", 5 → "00:05", 303 → "05:03"
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
