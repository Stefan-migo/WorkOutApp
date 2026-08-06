'use client'

interface ProgressBarProps {
  progress: number
  label?: string
  dark?: boolean
}

// ponytail: pure CSS bar, upgrade to canvas/SVG if gradient segments per interval type are needed
export function ProgressBar({ progress, label, dark }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)))

  return (
    <div className="w-full">
      {label && <span className={`text-sm mb-1 block ${dark ? 'text-timer-muted' : 'text-muted'}`}>{label}</span>}
      <div
        className={`w-full rounded-full overflow-hidden ${dark ? 'bg-timer-track h-2' : 'bg-surface min-h-[44px] flex items-center'}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={`rounded-full transition-all duration-500 ease-out ${dark ? 'h-2 bg-timer-on' : 'h-3 bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
