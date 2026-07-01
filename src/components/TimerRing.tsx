'use client'

interface TimerRingProps {
  timeLeft: number
  duration: number
  intervalType: 'prepare' | 'work' | 'rest' | 'cooldown'
  label: string
  nextLabel?: string
}

const RING_COLORS: Record<TimerRingProps['intervalType'], string> = {
  prepare: '#F59E0B',
  work: '#84cc16',
  rest: '#fb7185',
  cooldown: '#818cf8',
}

const CIRCUMFERENCE = 283

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ponytail: hardcoded ring colors per type, extract to CSS vars if TimelineStrip needs to share them
export function TimerRing({ timeLeft, duration, intervalType, label, nextLabel }: TimerRingProps) {
  const ringColor = RING_COLORS[intervalType]
  const progress = duration > 0 ? timeLeft / duration : 0
  const offset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full drop-shadow-2xl" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r="45" fill="transparent" stroke="#1E293B" strokeWidth="4" />
        {/* Progress */}
        <circle
          className="progress-ring__circle"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke={ringColor}
          strokeDasharray="283"
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <div className="z-10 flex flex-col items-center text-center">
        <span className="font-label-caps text-label-caps tracking-widest uppercase mb-sm" style={{ color: ringColor }}>
          {label}
        </span>
        <span className="font-display-timer-mobile text-display-timer-mobile md:font-display-timer md:text-display-timer text-white tabular-nums">
          {formatTime(timeLeft)}
        </span>
        {nextLabel && (
          <span className="font-data-sm text-data-sm text-gray-400 mt-xs">{nextLabel}</span>
        )}
      </div>
    </div>
  )
}
